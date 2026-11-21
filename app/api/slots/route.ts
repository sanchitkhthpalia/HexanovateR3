import { bookingWindow, openSlots } from "@/lib/booking/slots";
import { verifyBookingToken } from "@/lib/server/booking-token";
import { getBusy } from "@/lib/server/calendar";
import { NotConfigured } from "@/lib/server/lead-record";
import { rateLimit } from "@/lib/server/rate-limit";
import { clientIp, isAllowedOrigin, json, readJson } from "@/lib/server/request";

// POST /api/slots { token } → { ok: true, slots: [ISO start, …] }
// Open 30-minute slots on the team calendar (rules in lib/booking/slots.ts). POST rather than GET so
// the booking token stays out of URLs and logs; only someone who just submitted the form has one.

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) return json(403, { ok: false, error: "forbidden" });
  if (!rateLimit(`slots:${clientIp(request)}`, Date.now(), 30).allowed) return json(429, { ok: false, error: "rate_limited" });

  const body = (await readJson(request, 4_000)) as { token?: unknown } | null;
  if (!verifyBookingToken(body?.token)) return json(401, { ok: false, error: "expired" });

  const now = Date.now();
  try {
    const busy = await getBusy(bookingWindow(now));
    return json(200, { ok: true, slots: openSlots(now, busy).map((s) => new Date(s).toISOString()) });
  } catch (error) {
    if (error instanceof NotConfigured) return json(503, { ok: false, error: "unavailable" });
    console.error(`[slots] calendar failed: ${error instanceof Error ? error.message : "unknown error"}`);
    return json(502, { ok: false, error: "unavailable" });
  }
}
