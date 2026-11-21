import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { env } from "./env";
import { NotConfigured, type LeadRecord } from "./lead-record";

// New-lead notification to ai-labs@hexanovate.com via Gmail SMTP (app password on a test
// account). Resend isn't used: without a verified domain it can only deliver to the account owner.
// Every user-supplied value is HTML-escaped; the person's email is set as Reply-To.

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function istTime(iso: string) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(
    new Date(iso),
  );
}

export function buildLeadEmail(lead: LeadRecord) {
  const rows: [string, string][] = [
    ["Name", lead.name],
    ["Work email", lead.email],
    ["Phone", lead.phone],
    ["Country", lead.country],
    ["Solution required", lead.solution],
    ["Documents per month", lead.documents],
    ["Pain point & expectations", lead.painPoint || "—"],
    ["Submitted", `${istTime(lead.submittedAt)} IST`],
    ["Lead ID", lead.id],
  ];

  const html = `<!doctype html>
<html><body style="margin:0;background:#edf5ff;font-family:Inter,Segoe UI,Arial,sans-serif;color:#132333">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #cde3ff;border-radius:16px;overflow:hidden">
      <tr><td style="background:#1873de;color:#ffffff;padding:20px 24px;font-size:18px;font-weight:600">New demo request — KlearStack</td></tr>
      <tr><td style="padding:20px 24px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;line-height:20px">
          ${rows
            .map(
              ([label, value]) => `<tr>
            <td style="padding:8px 12px 8px 0;color:#48586a;vertical-align:top;white-space:nowrap;border-bottom:1px solid #eef2f7">${escapeHtml(label)}</td>
            <td style="padding:8px 0;font-weight:500;border-bottom:1px solid #eef2f7;white-space:pre-wrap">${escapeHtml(value)}</td>
          </tr>`,
            )
            .join("")}
        </table>
        <p style="margin:20px 0 0;font-size:13px;color:#48586a">Reply to this email to contact ${escapeHtml(lead.firstName)} directly.</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;

  const text = rows.map(([label, value]) => `${label}: ${value}`).join("\n");
  // Header-safe subject: the name is validated to letters/spaces/.'- , but strip line breaks regardless.
  const subject = `New demo request: ${lead.name} (${lead.email.split("@")[1]})`.replace(/[\r\n]+/g, " ");
  return { subject, html, text };
}

let transporter: Transporter | undefined;

export async function sendLeadEmail(lead: LeadRecord): Promise<void> {
  const { user, appPassword, to } = env.email;
  if (!user || !appPassword) throw new NotConfigured();
  transporter ??= nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass: appPassword },
    connectionTimeout: 8000,
    socketTimeout: 8000,
  });
  const { subject, html, text } = buildLeadEmail(lead);
  await transporter.sendMail({
    from: { name: "KlearStack Leads", address: user },
    to,
    replyTo: { name: lead.name, address: lead.email },
    subject,
    html,
    text,
  });
}
