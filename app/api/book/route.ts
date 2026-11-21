import { isCandidateSlot, slotEnd } from "@/lib/booking/slots";
import { verifyBookingToken } from "@/lib/server/booking-token";
import { bookMeeting } from "@/lib/server/calendar";
import { NotConfigured } from "@/lib/server/lead-record";
import { rateLimit } from "@/lib/server/rate-limit";
import { clientIp, isAllowedOrigin, json, readJson } from "@/lib/server/request";
import { ScriptError } from "@/lib/server/sheets";

// POST /api/book { token, start: ISO } → { ok: true, start, end }
// Books one demo call on the team calendar and invites the lead. The name and email come from the
// signed token (not the request body), so a booking is always tied to a real submitted lead.
// The Apps Script re-checks the slot under a lock and allows one booking per lead.

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) return json(403, { ok: false, error: "forbidden" });
  if (!rateLimit(`book:${clientIp(request)}`).allowed) return json(429, { ok: false, error: "rate_limited" });

  const body = (await readJson(request, 4_000)) as { token?: unknown; start?: unknown } | null;
  const claims = verifyBookingToken(body?.token);
  if (!claims) return json(401, { ok: false, error: "expired" });

  const start = typeof body?.start === "string" ? Date.parse(body.start) : NaN;
  if (!Number.isFinite(start) || !isCandidateSlot(start, Date.now())) return json(400, { ok: false, error: "invalid_slot" });

  const end = slotEnd(start);
  try {
    await bookMeeting({ leadId: claims.leadId, name: claims.name, email: claims.email, start, end });
    return json(200, { ok: true, start: new Date(start).toISOString(), end: new Date(end).toISOString() });
  } catch (error) {
    if (error instanceof ScriptError && (error.code === "slot_taken" || error.code === "already_booked")) {
      return json(409, { ok: false, error: error.code });
    }
    if (error instanceof NotConfigured) return json(503, { ok: false, error: "unavailable" });
    console.error(`[book] calendar failed: ${error instanceof Error ? error.message : "unknown error"}`);
    return json(502, { ok: false, error: "unavailable" });
  }
}
