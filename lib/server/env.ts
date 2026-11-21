import "server-only";

// Server-side configuration. `server-only` makes the build fail if any client component imports
// this (or anything that imports it), so secrets can't end up in the browser bundle.
// Every integration is optional at runtime: a missing value marks that integration
// "not_configured" for the lead instead of crashing the route.

function read(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export const env = {
  sheets: { url: read("SHEETS_WEBHOOK_URL"), secret: read("SHEETS_WEBHOOK_SECRET") },
  hubspot: { token: read("HUBSPOT_TOKEN") },
  /** Optional; by default the booking-token key is derived from SHEETS_WEBHOOK_SECRET. */
  booking: { secret: read("BOOKING_TOKEN_SECRET") },
  email: {
    user: read("GMAIL_USER"),
    appPassword: read("GMAIL_APP_PASSWORD"),
    to: read("LEAD_NOTIFY_TO") ?? "ai-labs@hexanovate.com",
  },
  /** Extra origins allowed to POST (comma-separated). The site's own origin is always allowed. */
  allowedOrigins: (read("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter(Boolean),
};
