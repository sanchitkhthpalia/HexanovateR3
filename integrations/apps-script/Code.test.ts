import { readFileSync } from "node:fs";
import { join } from "node:path";
import vm from "node:vm";
import { beforeEach, describe, expect, it } from "vitest";

// Runs Code.gs against in-memory fakes of the Apps Script services it uses (Sheet, Calendar, Lock,
// Properties), so the script's logic is tested before it's pasted into the editor.

const SOURCE = readFileSync(join(__dirname, "Code.gs"), "utf8");
const SECRET = "s3cret";

interface FakeEvent {
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  declined?: boolean;
  guests?: string;
}

function makeEnv() {
  const rows: unknown[][] = [];
  const events: FakeEvent[] = [];
  const cell = (r: number, c: number) => (rows[r - 1]?.[c - 1] ?? "") as unknown;
  const set = (r: number, c: number, v: unknown) => {
    while (rows.length < r) rows.push([]);
    rows[r - 1][c - 1] = v;
  };
  const range = (r: number, c: number, nr = 1, nc = 1) => ({
    getValues: () => Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => cell(r + i, c + j))),
    setValues: (v: unknown[][]) => {
      v.forEach((row, i) => row.forEach((x, j) => set(r + i, c + j, x)));
      return range(r, c, nr, nc);
    },
    setFontWeight: () => range(r, c, nr, nc),
    getValue: () => cell(r, c),
    setValue: (v: unknown) => set(r, c, v),
    createTextFinder: (text: string) => ({
      matchEntireCell: () => ({
        findNext: () => {
          for (let i = 0; i < nr; i++) if (String(cell(r + i, c)) === text) return { getRow: () => r + i };
          return null;
        },
      }),
    }),
  });
  const sheet = {
    getLastRow: () => rows.length,
    appendRow: (row: unknown[]) => rows.push([...row]),
    setFrozenRows: () => {},
    getRange: range,
  };
  const calendar = {
    getName: () => "Test calendar",
    getEvents: (from: Date, to: Date) =>
      events
        .filter((e) => e.start < to && from < e.end)
        .map((e) => ({
          isAllDayEvent: () => !!e.allDay,
          getMyStatus: () => (e.declined ? "NO" : "YES"),
          getStartTime: () => e.start,
          getEndTime: () => e.end,
        })),
    createEvent: (title: string, start: Date, end: Date, opts: { guests: string }) => {
      events.push({ title, start, end, guests: opts.guests });
      return { getId: () => `evt-${events.length}@google.com` };
    },
  };
  const context = vm.createContext({
    console: { log: () => {}, error: () => {} },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => `${SECRET}\n` }) }, // trailing newline on purpose
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }) },
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: () => sheet, insertSheet: () => sheet }) },
    CalendarApp: { getDefaultCalendar: () => calendar, GuestStatus: { NO: "NO" } },
    ContentService: {
      createTextOutput: (s: string) => ({ setMimeType: () => JSON.parse(s) }),
      MimeType: { JSON: "json" },
    },
    Utilities: {
      formatDate: (d: Date) => new Date(d.getTime() + 330 * 60_000).toISOString().slice(0, 16).replace("T", " "),
    },
  });
  vm.runInContext(SOURCE, context);
  const post = (body: Record<string, unknown>) =>
    (context.doPost as (e: unknown) => Record<string, unknown>)({ postData: { contents: JSON.stringify({ secret: SECRET, ...body }) } });
  return { post, rows, events, context };
}

const lead = (id: string) => ({ id, name: "Priya Sharma", email: "priya@acme-logistics.in", phone: "+919876543210" });
const t = (iso: string) => new Date(iso);

let env: ReturnType<typeof makeEnv>;
beforeEach(() => {
  env = makeEnv();
});

describe("Code.gs: sheet", () => {
  it("rejects a wrong secret, accepts the right one despite whitespace", () => {
    expect(env.post({ secret: "nope", action: "append", lead: lead("a") })).toEqual({ ok: false, error: "unauthorized" });
    expect(env.post({ secret: ` ${SECRET} `, action: "append", lead: lead("a") })).toEqual({ ok: true });
  });

  it("writes headers once, appends rows, guards formulas and updates statuses by id", () => {
    env.post({ action: "append", lead: { ...lead("a"), name: "=HYPERLINK(1)" } });
    env.post({ action: "append", lead: lead("b") });
    expect(env.rows[0]).toContain("Calendar event ID");
    expect(env.rows).toHaveLength(3);
    expect(env.rows[1][2]).toBe("'=HYPERLINK(1)");
    expect(env.rows[1][4]).toBe("'+919876543210");
    expect(env.post({ action: "update", id: "b", crmStatus: "ok", emailStatus: "failed", crmContactId: "123" })).toEqual({ ok: true });
    expect(env.rows[2].slice(9, 12)).toEqual(["ok", "failed", "123"]);
    expect(env.post({ action: "update", id: "zzz", crmStatus: "ok", emailStatus: "ok" })).toEqual({ ok: false, error: "not_found" });
  });

  it("adds the new header columns to a sheet created by the earlier version", () => {
    env.rows.push(["Timestamp (IST)", "Lead ID"]); // old, shorter header row
    env.post({ action: "append", lead: lead("a") });
    expect(env.rows[0].at(-1)).toBe("Calendar event ID");
  });
});

describe("Code.gs: calendar", () => {
  it("busy returns timed, accepted events only", () => {
    env.events.push(
      { title: "Standup", start: t("2026-11-24T04:30:00Z"), end: t("2026-11-24T05:00:00Z") },
      { title: "Holiday", start: t("2026-11-25T00:00:00Z"), end: t("2026-11-26T00:00:00Z"), allDay: true },
      { title: "Declined", start: t("2026-11-24T06:00:00Z"), end: t("2026-11-24T07:00:00Z"), declined: true },
    );
    const res = env.post({ action: "busy", from: "2026-11-23T00:00:00Z", to: "2026-12-05T00:00:00Z" });
    expect(res).toEqual({ ok: true, busy: [{ start: "2026-11-24T04:30:00.000Z", end: "2026-11-24T05:00:00.000Z" }] });
    expect(env.post({ action: "busy", from: "2026-11-23", to: "2027-06-01" })).toEqual({ ok: false, error: "bad_range" });
  });

  it("books once: creates the event with the lead invited and records it on the row", () => {
    env.post({ action: "append", lead: lead("a") });
    const slot = { action: "book", id: "a", name: "Priya Sharma", email: "priya@acme-logistics.in", start: "2026-11-24T05:30:00Z", end: "2026-11-24T06:00:00Z" };
    expect(env.post(slot)).toEqual({ ok: true });
    expect(env.events[0]).toMatchObject({ title: "KlearStack demo – Priya Sharma", guests: "priya@acme-logistics.in" });
    expect(env.rows[1].slice(15, 17)).toEqual(["2026-11-24 11:00", "evt-1@google.com"]);
    expect(env.post({ ...slot, start: "2026-11-25T05:30:00Z", end: "2026-11-25T06:00:00Z" })).toEqual({ ok: false, error: "already_booked" });
  });

  it("refuses a slot that's already taken, and bad requests", () => {
    env.events.push({ title: "Busy", start: t("2026-11-24T05:00:00Z"), end: t("2026-11-24T06:00:00Z") });
    const base = { action: "book", id: "x", name: "A", email: "a@b.co" };
    expect(env.post({ ...base, start: "2026-11-24T05:30:00Z", end: "2026-11-24T06:00:00Z" })).toEqual({ ok: false, error: "slot_taken" });
    expect(env.post({ ...base, start: "2026-11-24T08:00:00Z", end: "2026-11-24T11:00:00Z" })).toEqual({ ok: false, error: "bad_request" });
    expect(env.post({ ...base, email: "nope", start: "2026-11-24T08:00:00Z", end: "2026-11-24T08:30:00Z" })).toEqual({ ok: false, error: "bad_request" });
  });

  it("still books when the lead's row is missing (Sheet append had failed)", () => {
    expect(env.post({ action: "book", id: "ghost", name: "A", email: "a@b.co", start: "2026-11-24T08:00:00Z", end: "2026-11-24T08:30:00Z" })).toEqual({ ok: true });
    expect(env.events).toHaveLength(1);
  });
});
