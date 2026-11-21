import { describe, expect, it } from "vitest";
import { bookingWindow, candidateSlots, groupByDay, isCandidateSlot, openSlots, slotEnd } from "./slots";

// Times written in IST for readability: "+05:30".
const at = (iso: string) => Date.parse(iso);

describe("candidate slots", () => {
  // Monday 23 Nov 2026, 09:00 IST.
  const mondayMorning = at("2026-11-23T09:00:00+05:30");
  const slots = candidateSlots(mondayMorning);

  it("starts 2 hours from now, on the half hour, inside 10:00–18:00 IST", () => {
    expect(slots[0]).toBe(at("2026-11-23T11:00:00+05:30"));
    expect(slots).not.toContain(at("2026-11-23T10:30:00+05:30")); // less than 2h notice
    expect(slots).toContain(at("2026-11-23T17:30:00+05:30")); // last slot of the day
    expect(slots).not.toContain(at("2026-11-23T18:00:00+05:30"));
  });

  it("covers 10 business days and skips weekends", () => {
    const days = groupByDay(slots);
    expect(days).toHaveLength(10);
    expect(days.map((d) => d.label)).not.toContain("Sat, 28 Nov");
    expect(days.at(-1)!.label).toBe("Fri, 4 Dec");
    expect(days[1].slots).toHaveLength(16); // a full day: 10:00 … 17:30
  });

  it("starts on Monday when asked at the weekend", () => {
    const saturday = at("2026-11-28T15:00:00+05:30");
    expect(candidateSlots(saturday)[0]).toBe(at("2026-11-30T10:00:00+05:30"));
  });

  it("after hours, today has no slots", () => {
    const evening = at("2026-11-23T17:00:00+05:30");
    expect(candidateSlots(evening)[0]).toBe(at("2026-11-24T10:00:00+05:30"));
  });

  it("accepts only exact slot starts", () => {
    expect(isCandidateSlot(at("2026-11-24T14:30:00+05:30"), mondayMorning)).toBe(true);
    expect(isCandidateSlot(at("2026-11-24T14:15:00+05:30"), mondayMorning)).toBe(false); // off-grid
    expect(isCandidateSlot(at("2026-11-28T11:00:00+05:30"), mondayMorning)).toBe(false); // Saturday
    expect(isCandidateSlot(at("2026-12-10T11:00:00+05:30"), mondayMorning)).toBe(false); // beyond the window
  });

  it("window spans first slot start to last slot end", () => {
    const w = bookingWindow(mondayMorning);
    expect(w.start).toBe(slots[0]);
    expect(w.end).toBe(slotEnd(slots.at(-1)!));
  });
});

describe("open slots", () => {
  const now = at("2026-11-23T09:00:00+05:30");

  it("removes every slot that overlaps a busy event, and only those", () => {
    // 14:15–15:00 overlaps the 14:00 and 14:30 slots; 15:00 stays free (end is exclusive).
    const busy = [{ start: at("2026-11-24T14:15:00+05:30"), end: at("2026-11-24T15:00:00+05:30") }];
    const open = openSlots(now, busy);
    expect(open).not.toContain(at("2026-11-24T14:00:00+05:30"));
    expect(open).not.toContain(at("2026-11-24T14:30:00+05:30"));
    expect(open).toContain(at("2026-11-24T15:00:00+05:30"));
    expect(open).toContain(at("2026-11-24T13:30:00+05:30"));
    expect(open).toHaveLength(candidateSlots(now).length - 2);
  });

  it("an all-day block clears the day", () => {
    const busy = [{ start: at("2026-11-25T00:00:00+05:30"), end: at("2026-11-26T00:00:00+05:30") }];
    expect(groupByDay(openSlots(now, busy)).map((d) => d.label)).not.toContain("Wed, 25 Nov");
  });
});
