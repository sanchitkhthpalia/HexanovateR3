# Security Report: KlearStack landing page

**Repo:** https://github.com/sanchitkhthpalia/HexanovateR3 · **Commit assessed:** latest on `main` · **Date:** 21 Nov 2026

**How this was produced.** I drafted the report with AI help (Claude Code) and then checked each finding against the code or a command run on the production build (`next build && next start`). The command or test behind each finding is named next to it. Anything not verified is labelled as such.

## Scores

| # | Area | Score | Justification (one line) | Remediation | Status |
|---|---|:-:|---|---|---|
| 1 | Secrets management | **5** | No secrets in the repo, its history or the client bundle. All secrets are Vercel environment variables, read only in `lib/server/env.ts` (which imports `server-only`). | Keep the `.gitignore` rules. Rotate a token immediately if one is ever pasted anywhere. | Verified |
| 2 | Server-side input validation | **5** | `/api/lead` re-validates every field with the same zod schema the browser uses (`lib/validation/lead.ts`), plus a body-size cap and JSON parse guard. | None needed for this scope. | Verified |
| 3 | Injection & XSS | **4** | React escapes all rendered text, the notification email HTML-escapes every field, and the Apps Script neutralises spreadsheet formulas. The CSP still allows inline scripts. | Nonce-based CSP (see 6). | Fixed / accepted |
| 4 | API route protection | **3** | Has POST-only, Origin check, honeypot, minimum fill time and per-IP rate limit. But the rate limit is per serverless instance and the fill-time timestamp comes from the client. | Shared rate limit (Upstash Redis or a Vercel WAF rule) and a server-signed render token. | Accepted (documented) |
| 5 | Third-party integration security | **3** | HubSpot token is limited to contacts read/write. The Gmail app password is a broad credential: a leak gives mailbox access to the (test) account. | Move email to a transactional provider with a domain-verified, send-only API key. | Accepted |
| 6 | Transport & headers | **4** | HTTPS on Vercel; CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy and Permissions-Policy all set. CSP uses `'unsafe-inline'` for scripts. | Nonces via `proxy.ts` (costs static rendering) or experimental SRI. | Fixed / partly accepted |
| 7 | Dependency vulnerabilities | **5** | `npm audit`: **0 vulnerabilities** after upgrading vitest (the findings were dev-only). | Re-run `npm audit` in CI. | Fixed |
| 8 | PII handling | **3** | Collects only what the form needs and shows a consent line. But the "Privacy Policy" link is a placeholder, and there's no retention or deletion process. | A real privacy page; a retention rule on the Sheet; restrict Sheet sharing. | Accepted |
| 9 | Error handling | **5** | The browser only ever gets a short error code. Provider errors are logged server-side by provider name only, with no PII; Next.js production hides stack traces. | None needed. | Verified |
| | **Overall** | **37 / 45** | | | |

## Details and evidence

### 1. Secrets management: 5/5
- **Repo:** only `.env.example` (names, no values) is tracked. `.gitignore` covers `.env*`, `*.pem` and `service-account*.json`. Checked with `git ls-files | grep -iE '\.env|\.pem|service-account'` → only `.env.example`.
- **History:** searched `git log -p --all` for HubSpot token patterns (`pat-na1-…`), AWS keys, private-key blocks, Apps Script deployment URLs and Gmail app-password patterns. **No matches.**
- **Client bundle:** searched `.next/static` for `HUBSPOT`, `SHEETS_WEBHOOK`, `GMAIL_`, `pat-`, `script.google.com`, `nodemailer` and `smtp.gmail`. **No matches.**
- **Structural guard:** `lib/server/env.ts` imports `server-only`, so importing it from client code fails the build. No variable uses the `NEXT_PUBLIC_` prefix.

### 2. Server-side validation: 5/5
- The same zod schema runs in the browser (react-hook-form) and in `/api/lead`, so the rules can't drift apart.
  - **Name:** 2–80 characters, letters and `.'-` only.
  - **Email:** valid syntax, free-mail domains rejected.
  - **Phone:** validated per country with libphonenumber.
  - **Dropdowns:** must be one of the allowed options.
  - **Pain point:** at most 1,000 characters.
- Bodies over 10,000 characters → 413. Malformed JSON → 400. Validation failure → 400 with a message per field.
- 16 route tests cover these cases (`app/api/lead/route.test.ts`).

### 3. Injection & XSS: 4/5
- **Page:** there's no `dangerouslySetInnerHTML` anywhere (`grep` of `app/`, `components/`, `lib/`). User input is only echoed back as React text (the first name in the success message).
- **Email:** `buildLeadEmail` HTML-escapes every value. A test asserts that `<script>` arrives as `&lt;script&gt;`. The subject line has CR/LF stripped to prevent header injection.
- **Google Sheet:** `safeCell()` in `Code.gs` prefixes values that start with `= + - @` with an apostrophe, so `=HYPERLINK(...)` is stored as text, not run as a formula. Values are capped at 5,000 characters.
- **HubSpot:** values are sent as JSON properties through the official API. There is no string-built query.
- **Why 4, not 5:** the CSP allows `'unsafe-inline'` scripts (see 6), which weakens it as a second line of defence.

### 4. API route protection: 3/5
| Control | Implementation | Verified by |
|---|---|---|
| Method restriction | Only `POST` is exported. | `curl -X GET /api/lead` → **405** |
| Origin check | `Origin` must equal the site's own origin or be in `ALLOWED_ORIGINS`. A missing Origin → 403. | Route tests (foreign and missing Origin → 403) |
| Rate limit | 5 requests per 10 minutes per IP → 429 with `Retry-After`. | Route test |
| Honeypot | A hidden `website` field. If filled: bland `200 {ok:true}`, nothing stored. | Route test |
| Minimum fill time | Under 3s after render (or a timestamp in the future, or older than 24h) → 400 `too_fast`. | Route test |
| Body size | Over 10 KB → 413. | Route test |

**Known weaknesses (accepted):**
- **The rate limit is in memory.** Vercel can run several function instances, each with its own counter, and counters reset on cold start. It slows a single client down but isn't a hard limit. This is documented in `lib/server/rate-limit.ts`.
- **The render timestamp comes from the client.** A script can set it to 10 seconds ago. Together with the honeypot it filters naive bots, not targeted ones.
- **The Origin check stops browsers, not scripts.** It prevents cross-site form posts (CSRF-style abuse), but `curl` can send any Origin header.
- **No CAPTCHA.** I chose not to add friction to a B2B lead form at this stage.

### 5. Third-party integration security: 3/5
| Credential | Scope | If it leaked |
|---|---|---|
| `HUBSPOT_TOKEN` (service key) | `crm.objects.contacts.read` and `.write` only | Contacts in this one test portal could be read and edited. No deals, settings or users. Revoke by rotating in HubSpot. |
| `SHEETS_WEBHOOK_SECRET` + URL | The web app accepts only `append` and `update` (the status columns of an existing lead). It can't read or delete. | Junk rows could be appended and status columns overwritten. Rotate by changing the script property and the Vercel variable. |
| `GMAIL_APP_PASSWORD` | **Broad:** an app password gives SMTP/IMAP access to the whole Gmail account. | Mail could be sent from, and read in, that test account. It's a dedicated test account with nothing else in it. Revoke at myaccount.google.com/apppasswords. |

Resend or SendGrid would give a send-only key, but they need a verified domain to deliver to ai-labs@hexanovate.com, and I don't have one. That's why Gmail SMTP was used.

All accounts are free-tier test accounts under my control.

### 6. Transport & headers: 4/5
Set in `next.config.ts` for every route. Checked with `curl -I` on the production build:
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), browsing-topics=()
```
- `X-Powered-By` is removed (`poweredByHeader: false`).
- **HTTPS:** Vercel serves HTTPS only and redirects HTTP.
- **Fixed during this review:**
  - None of these headers existed in the first version.
  - Adding the CSP surfaced a violation: zod 4 probes `new Function("")` to decide whether to JIT-compile. I turned that off with `z.config({ jitless: true })`. A browser check now records **0 CSP violations**.
- **Accepted:** `script-src 'unsafe-inline'`. Next.js inlines bootstrapping scripts. Removing `'unsafe-inline'` needs a per-request nonce, which forces dynamic rendering of a page that's currently static and CDN-cached. Next's experimental SRI mode is the other option. Everything else is locked to `'self'`, including `connect-src`, `object-src 'none'` and `frame-ancestors 'none'`.

### 7. Dependency vulnerabilities: 5/5
Before the fix (`npm audit`, 21 Nov 2026):
```
@vitest/mocker  <=4.1.11   Severity: moderate   (GHSA-82fw-gwwq-j7x9, GHSA-qxg6-89mg-rqv8)
tinypool  <=2.1.1          Severity: critical   (GHSA-5gmw-xhrv-c9v3, GHSA-85c8-ppgw-ccpr)
vitest 0.0.95 - 4.1.10     depends on the above
3 vulnerabilities (1 moderate, 2 critical)
```
**Judgement:**
- All three were in the **test runner only** (a dev dependency). None ships to Vercel or the browser: `npm audit --omit=dev` → `found 0 vulnerabilities`.
- They'd only matter on a developer machine or in CI running untrusted test code. I upgraded anyway, since it was cheap: vitest 3.2 → 5.1.1, and all 164 tests still pass.

After the fix:
```
$ npm audit
found 0 vulnerabilities
```

### 8. PII handling: 3/5
- **Collected:**
  - name, work email, phone (with country), solution of interest, document volume, optional free-text pain point
  - server-side: the browser's user agent
- **IP address:** used in memory for rate limiting only, never stored.
- **Where it goes:**
  - Browser → `/api/lead` (Vercel function, HTTPS).
  - From there: Google Sheet (test Google account), HubSpot (test portal), and an email to ai-labs@hexanovate.com (from a test Gmail).
  - Nothing goes to analytics. There are no third-party scripts on the page.
- **Who can read it:** the owner of the test Google and HubSpot accounts, plus the ai-labs mailbox.
- **Logs:** Vercel logs contain only `[lead] <provider> failed: <code>`, with no name, email or phone. Checked in `settle()` in `route.ts`.
- **Consent:**
  - The form says "By submitting, you agree to our Privacy Policy" and explains what the data is used for.
  - Weakness: the **Privacy Policy link goes nowhere** (it's a single-page build). There's also no retention period or deletion process, and the Sheet has no automatic expiry.

### 9. Error handling: 5/5
- The browser only receives `{ ok: false, error: "<code>" }`, with codes `forbidden`, `bad_request`, `too_large`, `rate_limited`, `too_fast`, `validation` and `unavailable`, plus friendly messages per field for validation.
- A test makes all three providers throw errors containing tokens, URLs and SMTP text. It asserts the response is exactly `{ ok:false, error:"unavailable" }` and contains none of that text.
- The Apps Script returns only error codes too, and logs details to its own execution log.
- With no credentials configured, the real route returns 502 `unavailable`, and the logs show only `[lead] sheets: not configured`.

## The three fixes I'd make first
1. **A real, shared rate limit plus a signed render token.** Use Upstash Redis (or a Vercel WAF rate-limit rule) keyed by IP. Have the server issue an HMAC-signed timestamp when the form renders, so the 3-second check can't be forged.
2. **Replace the Gmail app password** with a transactional email provider on a verified domain, using a send-only API key. That removes the broadest credential in the system.
3. **Tighten the CSP and finish PII basics.** Add nonce- or SRI-based script policy to drop `'unsafe-inline'`. Publish a real privacy policy behind the consent link, and set a retention rule for the Sheet and CRM.
