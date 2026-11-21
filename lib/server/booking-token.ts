import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "./env";

// Booking token: proves the caller just submitted the lead form, so only real leads can see the
// calendar's free slots and book one. Issued by /api/lead, valid for 2 hours, HMAC-SHA256 signed.
// The key is derived from SHEETS_WEBHOOK_SECRET with a fixed label (booking goes through the same
// Apps Script, so it can't work without that secret anyway), which avoids one more env variable.
// Set BOOKING_TOKEN_SECRET to use a separate key.

const TTL_MS = 2 * 60 * 60 * 1000;

export interface BookingClaims {
  leadId: string;
  name: string;
  email: string;
  exp: number; // epoch ms
}

function key(): Buffer | null {
  if (env.booking.secret) return Buffer.from(env.booking.secret);
  if (!env.sheets.secret) return null;
  return createHmac("sha256", env.sheets.secret).update("klearstack-booking-token-v1").digest();
}

const sign = (payload: string, k: Buffer) => createHmac("sha256", k).update(payload).digest("base64url");

/** A token for this lead, or null when booking isn't configured. */
export function issueBookingToken(lead: { id: string; name: string; email: string }, now = Date.now()): string | null {
  const k = key();
  if (!k) return null;
  const claims: BookingClaims = { leadId: lead.id, name: lead.name, email: lead.email, exp: now + TTL_MS };
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  return `${payload}.${sign(payload, k)}`;
}

/** The token's claims if it's genuine and unexpired, otherwise null. */
export function verifyBookingToken(token: unknown, now = Date.now()): BookingClaims | null {
  const k = key();
  if (!k || typeof token !== "string" || token.length > 2000) return null;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra !== undefined) return null;
  const expected = Buffer.from(sign(payload, k));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString()) as BookingClaims;
    if (typeof claims.exp !== "number" || claims.exp < now) return null;
    if (typeof claims.leadId !== "string" || typeof claims.email !== "string" || typeof claims.name !== "string") return null;
    return claims;
  } catch {
    return null;
  }
}
