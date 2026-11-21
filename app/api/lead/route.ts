import { appendLeadRow, updateLeadStatuses } from "@/lib/server/sheets";
import { upsertHubSpotContact } from "@/lib/server/hubspot";
import { sendLeadEmail } from "@/lib/server/email";
import { issueBookingToken } from "@/lib/server/booking-token";
import { NotConfigured, toLeadRecord, type IntegrationStatus } from "@/lib/server/lead-record";
import { rateLimit } from "@/lib/server/rate-limit";
import { clientIp, isAllowedOrigin, json } from "@/lib/server/request";
import { leadSubmissionSchema } from "@/lib/validation/lead";

// POST /api/lead
//  1. guards: POST only (other methods → 405, as only POST is exported), same-origin, body size,
//     per-IP rate limit, honeypot, minimum 3s between render and submit
//  2. re-validate with the shared zod schema (same rules as the browser)
//  3. append to the Google Sheet first — the record of every lead
//  4. HubSpot upsert + email notification in parallel (Promise.allSettled)
//  5. write crm/email status back to the Sheet row
//  6. success if the lead landed anywhere (Sheet, CRM or inbox); otherwise a retryable error.
//     A success carries a short-lived booking token for the calendar step (/api/slots, /api/book).
// Provider errors are logged server-side (no PII) and never returned to the browser.

// Runs on the Node.js runtime (the default for route handlers), which nodemailer needs.
// (An explicit `export const runtime` isn't allowed alongside `cacheComponents`.)

const MIN_FILL_MS = 3000;
const MAX_BODY_BYTES = 10_000;

type ErrorCode = "forbidden" | "bad_request" | "too_large" | "rate_limited" | "too_fast" | "validation" | "unavailable";

const fail = (status: number, error: ErrorCode, extra: Record<string, unknown> = {}, headers?: HeadersInit) =>
  json(status, { ok: false, error, ...extra }, headers);

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) return fail(403, "forbidden");

  const ip = clientIp(request);
  const limit = rateLimit(ip);
  if (!limit.allowed) return fail(429, "rate_limited", {}, { "Retry-After": String(limit.retryAfter) });

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return fail(413, "too_large");
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return fail(400, "bad_request");
  }

  const parsed = leadSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) fields[issue.path.join(".")] ??= issue.message;
    return fail(400, "validation", { fields });
  }
  const data = parsed.data;

  // Honeypot filled → a bot. Answer like a success so it learns nothing; store nothing.
  if (data.website) return json(200, { ok: true });

  // Submitted faster than a person can fill the form (or a forged/odd timestamp). Real people who
  // hit this (e.g. instant autofill) just retry a moment later, so it's a visible, retryable error.
  const elapsed = Date.now() - data.renderedAt;
  if (elapsed < MIN_FILL_MS || elapsed > 24 * 60 * 60 * 1000) return fail(400, "too_fast");

  const lead = toLeadRecord(data, {
    userAgent: request.headers.get("user-agent") ?? "",
    source: "Website – lead form",
  });

  // 3. Sheet first, so the lead is recorded even if everything after this fails.
  const sheet = await settle("sheets", appendLeadRow(lead));

  // 4. CRM and email in parallel.
  const [crm, email] = await Promise.all([settle("hubspot", upsertHubSpotContact(lead)), settle("email", sendLeadEmail(lead))]);

  // 5. Status columns on the Sheet row (best effort: the row already exists).
  if (sheet.status === "ok") {
    await settle(
      "sheets_update",
      updateLeadStatuses(lead.id, {
        crmStatus: crm.status,
        emailStatus: email.status,
        crmContactId: crm.status === "ok" ? crm.value : undefined,
      }),
    );
  }

  // 6. Stored anywhere → success. The browser never sees which provider failed or why.
  const stored = [sheet, crm, email].some((r) => r.status === "ok");
  if (!stored) return fail(502, "unavailable");
  return json(200, { ok: true, bookingToken: issueBookingToken(lead) });
}

/** Runs one integration, logging failures without personal data. */
async function settle<T>(name: string, task: Promise<T>): Promise<{ status: IntegrationStatus; value?: T }> {
  try {
    return { status: "ok", value: await task };
  } catch (error) {
    if (error instanceof NotConfigured) {
      console.warn(`[lead] ${name}: not configured`);
      return { status: "not_configured" };
    }
    console.error(`[lead] ${name} failed: ${error instanceof Error ? error.message : "unknown error"}`);
    return { status: "failed" };
  }
}
