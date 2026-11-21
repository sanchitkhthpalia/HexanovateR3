import "server-only";
import { env } from "./env";
import { fetchWithTimeout, NotConfigured, type IntegrationStatus, type LeadRecord } from "./lead-record";

// Google Sheet via an Apps Script web app (integrations/apps-script/Code.gs). The script checks a
// shared secret, appends one row per lead and can later fill in the status columns by lead id.
// Apps Script answers 302 → script.googleusercontent.com; fetch follows it and returns the JSON.

interface ScriptResponse {
  ok: boolean;
  error?: string;
}

/** The script answered with { ok: false, error: code }. */
export class ScriptError extends Error {
  constructor(readonly code: string) {
    super(`sheets_${code}`);
  }
}

/** Calls the Apps Script web app (also used for calendar actions, see calendar.ts). */
export async function callScript<T extends ScriptResponse = ScriptResponse>(payload: Record<string, unknown>): Promise<T> {
  const { url, secret } = env.sheets;
  if (!url || !secret) throw new NotConfigured();
  const res = await fetchWithTimeout(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" }, // Apps Script reads e.postData.contents
    body: JSON.stringify({ ...payload, secret }),
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`sheets_http_${res.status}`);
  const data = (await res.json().catch(() => null)) as T | null;
  if (!data?.ok) throw new ScriptError(data?.error ?? "bad_response");
  return data;
}

export async function appendLeadRow(lead: LeadRecord): Promise<void> {
  await callScript({
    action: "append",
    lead: {
      id: lead.id,
      submittedAt: lead.submittedAt,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      country: lead.country,
      solution: lead.solution,
      documents: lead.documents,
      painPoint: lead.painPoint,
      source: lead.source,
      userAgent: lead.userAgent,
      crmStatus: "pending",
      emailStatus: "pending",
    },
  });
}

export async function updateLeadStatuses(
  leadId: string,
  statuses: { crmStatus: IntegrationStatus; emailStatus: IntegrationStatus; crmContactId?: string },
): Promise<void> {
  await callScript({ action: "update", id: leadId, ...statuses });
}
