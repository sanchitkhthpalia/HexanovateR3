// Demo-call slots: 30 minutes, Mon–Fri, 10:00–18:00 IST, over the next 10 business days, at least
// 2 hours from now. Pure functions shared by /api/slots, /api/book (to check a requested time is a
// real slot) and the booking UI (labels). India has no daylight saving, so IST is a fixed +05:30.

export const SLOT_MINUTES = 30;
export const DAY_START_HOUR = 10;
export const DAY_END_HOUR = 18; // last slot starts at 17:30
export const BUSINESS_DAYS = 10;
export const MIN_NOTICE_MINUTES = 120;
export const TIME_ZONE = "Asia/Kolkata";

const IST_OFFSET_MS = 330 * 60_000;
const SLOT_MS = SLOT_MINUTES * 60_000;
const DAY_MS = 24 * 60 * 60_000;

export interface Interval {
  start: number; // epoch ms
  end: number;
}

/** UTC epoch ms for a wall-clock time in IST. */
function istToUtc(year: number, month: number, day: number, hour: number, minute: number) {
  return Date.UTC(year, month, day, hour, minute) - IST_OFFSET_MS;
}

/** All slot start times (epoch ms) in the booking window, ignoring the calendar. */
export function candidateSlots(now: number): number[] {
  const earliest = now + MIN_NOTICE_MINUTES * 60_000;
  const slots: number[] = [];
  // Walk IST calendar days starting today, counting Mon–Fri only.
  const today = new Date(now + IST_OFFSET_MS);
  let businessDays = 0;
  for (let offset = 0; businessDays < BUSINESS_DAYS && offset < BUSINESS_DAYS * 2 + 7; offset++) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) + offset * DAY_MS);
    const weekday = d.getUTCDay();
    if (weekday === 0 || weekday === 6) continue;
    businessDays++;
    for (let minutes = DAY_START_HOUR * 60; minutes < DAY_END_HOUR * 60; minutes += SLOT_MINUTES) {
      const start = istToUtc(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), Math.floor(minutes / 60), minutes % 60);
      if (start >= earliest) slots.push(start);
    }
  }
  return slots;
}

/** Open slots: candidates that don't overlap any busy interval. */
export function openSlots(now: number, busy: Interval[]): number[] {
  return candidateSlots(now).filter((start) => !busy.some((b) => start < b.end && b.start < start + SLOT_MS));
}

/** Whether `start` is a bookable slot time right now (calendar not considered). */
export function isCandidateSlot(start: number, now: number): boolean {
  return candidateSlots(now).includes(start);
}

export function slotEnd(start: number) {
  return start + SLOT_MS;
}

/** The booking window to ask the calendar about. */
export function bookingWindow(now: number): Interval {
  const slots = candidateSlots(now);
  return { start: slots[0] ?? now, end: slots.length ? slotEnd(slots[slots.length - 1]) : now };
}

// Labels for the UI, always in IST (the team's calendar), e.g. "Tue, 24 Nov" and "11:30 am".
const dayLabel = new Intl.DateTimeFormat("en-IN", { timeZone: TIME_ZONE, weekday: "short", day: "numeric", month: "short" });
const timeLabel = new Intl.DateTimeFormat("en-IN", { timeZone: TIME_ZONE, hour: "numeric", minute: "2-digit", hour12: true });
const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });

export const formatDay = (ms: number) => dayLabel.format(ms);
export const formatTime = (ms: number) => timeLabel.format(ms);

/** Groups slot times by IST date, in order. */
export function groupByDay(slots: number[]): { key: string; label: string; slots: number[] }[] {
  const days = new Map<string, { key: string; label: string; slots: number[] }>();
  for (const s of slots) {
    const key = dayKey.format(s);
    if (!days.has(key)) days.set(key, { key, label: formatDay(s), slots: [] });
    days.get(key)!.slots.push(s);
  }
  return [...days.values()];
}
