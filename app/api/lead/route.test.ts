import { beforeEach, describe, expect, it, vi } from "vitest";

// Providers are mocked; everything else (guards, validation, orchestration) is the real code.
const appendLeadRow = vi.fn();
const updateLeadStatuses = vi.fn();
const upsertHubSpotContact = vi.fn();
const sendLeadEmail = vi.fn();
vi.mock("@/lib/server/sheets", () => ({ appendLeadRow, updateLeadStatuses }));
vi.mock("@/lib/server/hubspot", () => ({ upsertHubSpotContact }));
vi.mock("@/lib/server/email", () => ({ sendLeadEmail }));

const { POST } = await import("./route");
const { resetRateLimit } = await import("@/lib/server/rate-limit");
const { NotConfigured } = await import("@/lib/server/lead-record");

const ORIGIN = "https://klearstack.example";
const valid = () => ({
  name: "Priya Sharma",
  phone: { country: "IN", number: "98765 43210" },
  email: "priya@acme-logistics.in",
  solution: "Accounts Payable",
  documents: "1,000 – 10,000 / month",
  painPoint: "Invoices from 40 vendors <b>in</b> 6 formats",
  website: "",
  renderedAt: Date.now() - 10_000,
});

function post(body: unknown, { origin = ORIGIN, ip = "203.0.113.7" }: { origin?: string | null; ip?: string } = {}) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    host: "klearstack.example",
    "x-forwarded-proto": "https",
    "x-forwarded-for": `${ip}, 10.0.0.1`,
    "user-agent": "vitest",
  };
  if (origin) headers.origin = origin;
  return POST(new Request(`${ORIGIN}/api/lead`, { method: "POST", headers, body: typeof body === "string" ? body : JSON.stringify(body) }));
}

beforeEach(() => {
  resetRateLimit();
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  appendLeadRow.mockResolvedValue(undefined);
  updateLeadStatuses.mockResolvedValue(undefined);
  upsertHubSpotContact.mockResolvedValue("hs-123");
  sendLeadEmail.mockResolvedValue(undefined);
});

describe("POST /api/lead — happy path", () => {
  it("stores in the Sheet, then CRM + email in parallel, then writes statuses back", async () => {
    const res = await post(valid());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });

    const lead = appendLeadRow.mock.calls[0][0];
    expect(lead).toMatchObject({
      name: "Priya Sharma",
      firstName: "Priya",
      lastName: "Sharma",
      email: "priya@acme-logistics.in",
      phone: "+919876543210", // E.164
      country: "India",
      solution: "Accounts Payable",
    });
    expect(upsertHubSpotContact).toHaveBeenCalledWith(lead);
    expect(sendLeadEmail).toHaveBeenCalledWith(lead);
    expect(updateLeadStatuses).toHaveBeenCalledWith(lead.id, { crmStatus: "ok", emailStatus: "ok", crmContactId: "hs-123" });
  });

  it("appends to the Sheet before calling CRM and email", async () => {
    const order: string[] = [];
    appendLeadRow.mockImplementation(async () => void order.push("sheet"));
    upsertHubSpotContact.mockImplementation(async () => (order.push("crm"), "hs-1"));
    sendLeadEmail.mockImplementation(async () => void order.push("email"));
    await post(valid());
    expect(order[0]).toBe("sheet");
  });
});

describe("partial failure", () => {
  it("CRM down: still success, Sheet row marked crm failed", async () => {
    upsertHubSpotContact.mockRejectedValue(new Error("hubspot_http_500 secret-detail"));
    const res = await post(valid());
    expect(res.status).toBe(200);
    expect(updateLeadStatuses).toHaveBeenCalledWith(expect.any(String), { crmStatus: "failed", emailStatus: "ok", crmContactId: undefined });
  });

  it("not configured is recorded as such", async () => {
    sendLeadEmail.mockRejectedValue(new NotConfigured());
    await post(valid());
    expect(updateLeadStatuses).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ emailStatus: "not_configured" }));
  });

  it("Sheet down but CRM ok: success, no status update attempted", async () => {
    appendLeadRow.mockRejectedValue(new Error("sheets_http_500"));
    const res = await post(valid());
    expect(res.status).toBe(200);
    expect(updateLeadStatuses).not.toHaveBeenCalled();
  });

  it("only the email got through: still counts as stored", async () => {
    appendLeadRow.mockRejectedValue(new Error("x"));
    upsertHubSpotContact.mockRejectedValue(new Error("x"));
    expect((await post(valid())).status).toBe(200);
  });

  it("everything down: 502, retryable, and no provider details in the response", async () => {
    appendLeadRow.mockRejectedValue(new Error("sheets_unauthorized https://script.google.com/macros/s/SECRET"));
    upsertHubSpotContact.mockRejectedValue(new Error("hubspot_http_401 pat-na1-xxxx"));
    sendLeadEmail.mockRejectedValue(new Error("Invalid login: 535-5.7.8 Username and Password not accepted"));
    const res = await post(valid());
    expect(res.status).toBe(502);
    const text = await res.text();
    expect(JSON.parse(text)).toEqual({ ok: false, error: "unavailable" });
    expect(text).not.toMatch(/hubspot|sheets|535|pat-|script\.google/i);
  });

  it("a failing status update doesn't fail the request", async () => {
    updateLeadStatuses.mockRejectedValue(new Error("not_found"));
    expect((await post(valid())).status).toBe(200);
  });
});

describe("guards", () => {
  it("rejects a foreign Origin", async () => {
    const res = await post(valid(), { origin: "https://evil.example" });
    expect(res.status).toBe(403);
    expect(appendLeadRow).not.toHaveBeenCalled();
  });

  it("rejects a missing Origin", async () => {
    expect((await post(valid(), { origin: null })).status).toBe(403);
  });

  it("honeypot: bland success, nothing stored or sent", async () => {
    const res = await post({ ...valid(), website: "http://spam.example" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(appendLeadRow).not.toHaveBeenCalled();
    expect(upsertHubSpotContact).not.toHaveBeenCalled();
    expect(sendLeadEmail).not.toHaveBeenCalled();
  });

  it("rejects submissions under 3 seconds after render", async () => {
    const res = await post({ ...valid(), renderedAt: Date.now() - 1500 });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ ok: false, error: "too_fast" });
    expect(appendLeadRow).not.toHaveBeenCalled();
  });

  it("rejects a render time in the future", async () => {
    expect((await post({ ...valid(), renderedAt: Date.now() + 60_000 })).status).toBe(400);
  });

  it("rate-limits per IP: 5 per window, then 429 with Retry-After", async () => {
    for (let i = 0; i < 5; i++) expect((await post(valid(), { ip: "198.51.100.1" })).status).toBe(200);
    const blocked = await post(valid(), { ip: "198.51.100.1" });
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get("retry-after"))).toBeGreaterThan(0);
    // another IP is unaffected
    expect((await post(valid(), { ip: "198.51.100.2" })).status).toBe(200);
  });

  it("re-validates with the shared schema and returns field messages", async () => {
    const res = await post({ ...valid(), email: "priya@gmail.com", phone: { country: "IN", number: "123" } });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.fields.email).toBe("Please use your work email address");
    expect(body.fields["phone.number"]).toMatch(/valid India phone number/);
    expect(appendLeadRow).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON and oversized bodies", async () => {
    expect((await post("{not json")).status).toBe(400);
    expect((await post({ ...valid(), painPoint: "x".repeat(20_000) })).status).toBe(413);
  });
});
