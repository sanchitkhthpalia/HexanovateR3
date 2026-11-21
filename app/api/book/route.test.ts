import { beforeEach, describe, expect, it, vi } from "vitest";

// Calendar calls are mocked; tokens, slot rules and guards are the real code.
const getBusy = vi.fn();
const bookMeeting = vi.fn();
vi.mock("@/lib/server/calendar", () => ({ getBusy, bookMeeting }));

const { POST: book } = await import("./route");
const { POST: slots } = await import("../slots/route");
const { env } = await import("@/lib/server/env");
const { issueBookingToken, verifyBookingToken } = await import("@/lib/server/booking-token");
const { resetRateLimit } = await import("@/lib/server/rate-limit");
const { ScriptError } = await import("@/lib/server/sheets");
const { NotConfigured } = await import("@/lib/server/lead-record");
const { candidateSlots } = await import("@/lib/booking/slots");

const ORIGIN = "https://klearstack.example";
const lead = { id: "lead-1", name: "Priya Sharma", email: "priya@acme-logistics.in" };

function call(handler: (r: Request) => Promise<Response>, body: unknown, origin: string | null = ORIGIN) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    host: "klearstack.example",
    "x-forwarded-proto": "https",
    "x-forwarded-for": "203.0.113.9",
  };
  if (origin) headers.origin = origin;
  return handler(new Request(`${ORIGIN}/api/x`, { method: "POST", headers, body: JSON.stringify(body) }));
}

beforeEach(() => {
  env.sheets.secret = "test-shared-secret";
  env.booking.secret = undefined;
  resetRateLimit();
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  getBusy.mockResolvedValue([]);
  bookMeeting.mockResolvedValue(undefined);
});

describe("booking token", () => {
  it("round-trips and expires after 2 hours", () => {
    const t = issueBookingToken(lead, 1_000)!;
    expect(verifyBookingToken(t, 1_000 + 60_000)).toMatchObject({ leadId: "lead-1", email: lead.email });
    expect(verifyBookingToken(t, 1_000 + 2 * 60 * 60 * 1000 + 1)).toBeNull();
  });

  it("rejects tampered or foreign tokens", () => {
    const t = issueBookingToken(lead)!;
    const [payload, sig] = t.split(".");
    const forged = Buffer.from(JSON.stringify({ ...lead, leadId: "other", exp: Date.now() + 1e6 })).toString("base64url");
    expect(verifyBookingToken(`${forged}.${sig}`)).toBeNull();
    expect(verifyBookingToken(`${payload}.${sig.slice(0, -2)}xx`)).toBeNull();
    env.sheets.secret = "a-different-secret";
    expect(verifyBookingToken(t)).toBeNull();
  });

  it("isn't issued when the Sheet/Calendar script isn't configured", () => {
    env.sheets.secret = undefined;
    expect(issueBookingToken(lead)).toBeNull();
  });
});

describe("POST /api/slots", () => {
  it("returns open slots, minus busy times", async () => {
    const all = candidateSlots(Date.now());
    getBusy.mockResolvedValue([{ start: all[0], end: all[0] + 30 * 60_000 }]);
    const res = await call(slots, { token: issueBookingToken(lead) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.slots).toHaveLength(all.length - 1);
    expect(body.slots[0]).toBe(new Date(all[1]).toISOString());
  });

  it("needs a valid token and a same-origin request", async () => {
    expect((await call(slots, { token: "nope" })).status).toBe(401);
    expect((await call(slots, { token: issueBookingToken(lead) }, "https://evil.example")).status).toBe(403);
    expect(getBusy).not.toHaveBeenCalled();
  });

  it("calendar down: 502 without provider details", async () => {
    getBusy.mockRejectedValue(new Error("sheets_http_500 https://script.google.com/macros/s/SECRET"));
    const res = await call(slots, { token: issueBookingToken(lead) });
    expect(res.status).toBe(502);
    expect(await res.text()).not.toMatch(/script\.google|sheets_/);
  });
});

describe("POST /api/book", () => {
  const firstSlot = () => new Date(candidateSlots(Date.now())[3]).toISOString();

  it("books the slot for the lead in the token (not the request body)", async () => {
    const start = firstSlot();
    const res = await call(book, { token: issueBookingToken(lead), start, email: "attacker@evil.example" });
    expect(res.status).toBe(200);
    expect(bookMeeting).toHaveBeenCalledWith({
      leadId: "lead-1",
      name: "Priya Sharma",
      email: "priya@acme-logistics.in",
      start: Date.parse(start),
      end: Date.parse(start) + 30 * 60_000,
    });
  });

  it("rejects times that aren't slots", async () => {
    const token = issueBookingToken(lead);
    const offGrid = new Date(candidateSlots(Date.now())[3] + 10 * 60_000).toISOString();
    expect((await call(book, { token, start: offGrid })).status).toBe(400);
    expect((await call(book, { token, start: "2020-01-01T05:00:00Z" })).status).toBe(400);
    expect((await call(book, { token, start: "soon" })).status).toBe(400);
    expect(bookMeeting).not.toHaveBeenCalled();
  });

  it("slot taken or already booked → 409 with that code", async () => {
    bookMeeting.mockRejectedValueOnce(new ScriptError("slot_taken"));
    const r1 = await call(book, { token: issueBookingToken(lead), start: firstSlot() });
    expect(r1.status).toBe(409);
    expect(await r1.json()).toEqual({ ok: false, error: "slot_taken" });

    bookMeeting.mockRejectedValueOnce(new ScriptError("already_booked"));
    expect(await (await call(book, { token: issueBookingToken(lead), start: firstSlot() })).json()).toEqual({
      ok: false,
      error: "already_booked",
    });
  });

  it("expired token → 401; not configured → 503; other failures → 502", async () => {
    const expired = issueBookingToken(lead, Date.now() - 3 * 60 * 60 * 1000);
    expect((await call(book, { token: expired, start: firstSlot() })).status).toBe(401);

    bookMeeting.mockRejectedValueOnce(new NotConfigured());
    expect((await call(book, { token: issueBookingToken(lead), start: firstSlot() })).status).toBe(503);

    bookMeeting.mockRejectedValueOnce(new ScriptError("server_error"));
    const res = await call(book, { token: issueBookingToken(lead), start: firstSlot() });
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ ok: false, error: "unavailable" });
  });
});
