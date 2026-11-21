import "server-only";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import type { LeadSubmission } from "@/lib/validation/lead";

// The normalised lead every integration receives (after server-side validation).

export interface LeadRecord {
  id: string;
  submittedAt: string; // ISO 8601, UTC
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  /** E.164, e.g. +919876543210 */
  phone: string;
  countryCode: string;
  country: string;
  solution: string;
  documents: string;
  painPoint: string;
  source: string;
  userAgent: string;
}

export type IntegrationStatus = "ok" | "failed" | "not_configured";

/** Thrown when an integration's environment variables aren't set. */
export class NotConfigured extends Error {
  constructor() {
    super("not_configured");
  }
}

const regionName = new Intl.DisplayNames(["en"], { type: "region" });

export function toLeadRecord(data: LeadSubmission, meta: { userAgent: string; source: string }): LeadRecord {
  const [firstName, ...rest] = data.name.split(/\s+/);
  const parsed = parsePhoneNumberFromString(data.phone.number, data.phone.country);
  const countryCode = parsed?.country ?? data.phone.country;
  return {
    id: crypto.randomUUID(),
    submittedAt: new Date().toISOString(),
    name: data.name,
    firstName,
    lastName: rest.join(" "),
    email: data.email,
    phone: parsed?.number ?? data.phone.number,
    countryCode,
    country: regionName.of(countryCode) ?? countryCode,
    solution: data.solution,
    documents: data.documents,
    painPoint: data.painPoint,
    source: meta.source,
    userAgent: meta.userAgent.slice(0, 300),
  };
}

/** Fetch with a hard timeout so one slow provider can't hold the request open. */
export function fetchWithTimeout(url: string, init: RequestInit, ms = 8000) {
  return fetch(url, { ...init, signal: AbortSignal.timeout(ms), cache: "no-store" });
}
