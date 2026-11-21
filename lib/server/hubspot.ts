import "server-only";
import { env } from "./env";
import { fetchWithTimeout, NotConfigured, type LeadRecord } from "./lead-record";

// HubSpot contact upsert by email (CRM v3 batch upsert with idProperty=email): a resubmission
// updates the same contact instead of creating a duplicate. Private-app token, scopes
// crm.objects.contacts.read + crm.objects.contacts.write only.
const UPSERT_URL = "https://api.hubapi.com/crm/v3/objects/contacts/batch/upsert";

/** Form fields → HubSpot's standard contact properties (no custom properties needed). */
export function toHubSpotProperties(lead: LeadRecord, includeLifecycle = true): Record<string, string> {
  return {
    email: lead.email,
    firstname: lead.firstName,
    lastname: lead.lastName,
    phone: lead.phone,
    country: lead.country,
    // Standard "Message" property: everything the person told us, readable in the contact record.
    message: [
      `Solution required: ${lead.solution}`,
      `Documents per month: ${lead.documents}`,
      lead.painPoint ? `Pain point & expectations: ${lead.painPoint}` : null,
      `Source: ${lead.source} (lead ${lead.id})`,
    ]
      .filter(Boolean)
      .join("\n"),
    hs_lead_status: "NEW",
    ...(includeLifecycle ? { lifecyclestage: "lead" } : {}),
  };
}

/** Returns the HubSpot contact id. */
export async function upsertHubSpotContact(lead: LeadRecord): Promise<string> {
  const token = env.hubspot.token;
  if (!token) throw new NotConfigured();

  const send = (includeLifecycle: boolean) =>
    fetchWithTimeout(UPSERT_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        inputs: [{ idProperty: "email", id: lead.email, properties: toHubSpotProperties(lead, includeLifecycle) }],
      }),
    });

  let res = await send(true);
  // HubSpot refuses to move an existing contact's lifecycle stage backwards (e.g. customer → lead).
  // Retry once without it rather than lose the update.
  if (res.status === 400) res = await send(false);
  if (!res.ok) throw new Error(`hubspot_http_${res.status}`);

  const data = (await res.json().catch(() => null)) as { results?: { id?: string }[] } | null;
  const id = data?.results?.[0]?.id;
  if (!id) throw new Error("hubspot_bad_response");
  return id;
}
