import "server-only";
import { env } from "./env";

// Request guards shared by the API routes.

export const json = (status: number, body: Record<string, unknown>, headers?: HeadersInit) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });

/** Same-origin only: browsers always send Origin on a cross-site or fetch POST. */
export function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  const self = host ? `${proto}://${host}` : null;
  return origin === self || env.allowedOrigins.includes(origin);
}

export function clientIp(request: Request): string {
  // Vercel sets x-forwarded-for (client first) and x-real-ip.
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip") || "unknown";
}

/** Reads a small JSON body; null if it's too big or not JSON. */
export async function readJson(request: Request, maxBytes: number): Promise<unknown | null> {
  const raw = await request.text();
  if (raw.length > maxBytes) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
