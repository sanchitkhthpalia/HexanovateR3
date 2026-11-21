import { describe, expect, it } from "vitest";
import { buildLeadEmail } from "./email";
import { toHubSpotProperties } from "./hubspot";
import type { LeadRecord } from "./lead-record";

const lead: LeadRecord = {
  id: "0b6f0c3e-0000-4000-8000-000000000001",
  submittedAt: "2026-11-21T09:30:00.000Z",
  name: "Priya Sharma",
  firstName: "Priya",
  lastName: "Sharma",
  email: "priya@acme-logistics.in",
  phone: "+919876543210",
  countryCode: "IN",
  country: "India",
  solution: "Accounts Payable",
  documents: "1,000 – 10,000 / month",
  painPoint: '<script>alert("x")</script> & 40 vendors',
  source: "Website – lead form",
  userAgent: "test",
};

describe("HubSpot mapping", () => {
  it("maps to standard contact properties", () => {
    const p = toHubSpotProperties(lead);
    expect(p).toMatchObject({
      email: "priya@acme-logistics.in",
      firstname: "Priya",
      lastname: "Sharma",
      phone: "+919876543210",
      country: "India",
      hs_lead_status: "NEW",
      lifecyclestage: "lead",
    });
    expect(p.message).toContain("Solution required: Accounts Payable");
    expect(p.message).toContain("Documents per month: 1,000 – 10,000 / month");
  });
  it("can omit lifecycle stage (retry path)", () => {
    expect(toHubSpotProperties(lead, false)).not.toHaveProperty("lifecyclestage");
  });
});

describe("notification email", () => {
  const { subject, html, text } = buildLeadEmail(lead);
  it("escapes user input in the HTML", () => {
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; 40 vendors");
  });
  it("has a readable subject, IST time and a plain-text part", () => {
    expect(subject).toBe("New demo request: Priya Sharma (acme-logistics.in)");
    expect(html).toContain("21 Nov 2026, 3:00 pm IST");
    expect(text).toContain("Work email: priya@acme-logistics.in");
  });
});
