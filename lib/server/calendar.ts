import "server-only";
import type { Interval } from "@/lib/booking/slots";
import { callScript } from "./sheets";

// Google Calendar via the same Apps Script web app as the Sheet (integrations/apps-script/Code.gs),
// which runs as the calendar's owner and uses Google's built-in CalendarApp service. So booking
// needs no OAuth client or extra secret: the shared secret already protects the script.

/** Busy intervals on the calendar between two times. */
export async function getBusy(window: Interval): Promise<Interval[]> {
  const data = await callScript<{ ok: boolean; busy?: { start: string; end: string }[] }>({
    action: "busy",
    from: new Date(window.start).toISOString(),
    to: new Date(window.end).toISOString(),
  });
  return (data.busy ?? [])
    .map((b) => ({ start: Date.parse(b.start), end: Date.parse(b.end) }))
    .filter((b) => Number.isFinite(b.start) && Number.isFinite(b.end));
}

/**
 * Creates the event and invites the lead. The script re-checks the slot under its lock, so two
 * people can't book the same time; it throws ScriptError "slot_taken" or "already_booked".
 */
export async function bookMeeting(input: { leadId: string; name: string; email: string; start: number; end: number }) {
  await callScript({
    action: "book",
    id: input.leadId,
    name: input.name,
    email: input.email,
    start: new Date(input.start).toISOString(),
    end: new Date(input.end).toISOString(),
  });
}
