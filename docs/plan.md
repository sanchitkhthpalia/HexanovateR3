# Implementation plan

Single marketing page for KlearStack, built from the Figma design, on Next.js + Vercel. Companion docs: `figma-map.md` (where the design lives), `design/SPEC.md` (tokens and measurements), `assumptions.md` (decisions), `roi-logic.md` (calculator).

## Build order (brief §6: P0 → P3, stop where the clock stops)

| # | Step | Priority | Done when |
|---|---|---|---|
| 0 | Extract the design: Figma map, tokens, assets | prep | ✅ `docs/design/` |
| 1 | **ROI engine + tests against the sheet** (pass/fail item, so it goes first) | P0 | ✅ 68 tests, exact match, 1,208 sheet-evaluated cases |
| 2 | Scaffold Next.js/TS/Tailwind/ESLint; tokens in the theme; fonts; assets; page skeleton; first Vercel deploy | P0 | `npm run build` green; live URL |
| 3 | ROI calculator UI: toggle, custom select, two sliders, 3 result cards, live updates, formatting, edge states | P0 | Matches screen; outputs equal the engine |
| 4 | Header: links, dropdowns, mega menu, hover/active/indicator, CTA animation, sticky, keyboard support, mobile drawer + accordions | P0 | Keyboard- and touch-operable at 375/768/1440 |
| 5 | Lead section: left panel, seamless marquee, form UI, full validation (shared zod schema), loading/success/failure states | P0 | All validation cases behave; no layout shift |
| 6 | Integrations banner + footer, newsletter validation | P0 | Matches screens |
| 7 | Responsive pass 360–1920, metadata, alt text; deploy | P0 | No horizontal scroll anywhere |
| 8 | `/api/lead`: method/origin checks, honeypot, timing, rate limit, server validation → **HubSpot + Sheet** | P1 | A test lead appears in both |
| 9 | Email notification + `/api/slots`, `/api/book`, booking step UI | P2 | Email received; event on calendar with invite |
| 10 | Security headers (CSP, HSTS…), animation polish, a11y refinement | P3 | Lighthouse targets |
| 11 | Reports: security (npm audit, header scan, bundle secret scan), performance (Lighthouse mobile/desktop on the live URL), process doc | deliverable | Three docs written |

Commit after each step so the history shows the work. Each integration is verified with a real submission on the **deployed** URL.

## File structure

```
app/
  layout.tsx            fonts (next/font), metadata, <body> skeleton
  page.tsx              <Header/> <main>{banner, ROI, lead}</main> <Footer/>
  globals.css           Tailwind v4 @theme tokens, base styles
  icon.svg              favicon (KlearStack monogram)
  api/
    lead/route.ts       POST: validate → fan out to CRM/Sheet/email
    slots/route.ts      GET: free 30-min slots (Google free/busy)
    book/route.ts       POST: lead token + slot → calendar event
components/
  header/               Header, NavDropdown, MegaMenu, MobileDrawer, nav-data.ts
  lead/                 LeadSection, LogoMarquee, LeadForm, PhoneField, BookingStep
  roi/                  RoiCalculator, RangeSlider, ResultCard
  footer/               Footer, NewsletterForm
  IntegrationsBanner.tsx
  ui/                   Button (brand CTA), Select (Radix listbox styled per design), icons
lib/
  roi/                  calculate.ts (+ tests, fixtures), format.ts (₹, Indian grouping)
  lead/                 schema.ts (zod, shared client+server), free-email-domains.ts
  server/               hubspot.ts, sheets.ts, email.ts, calendar.ts, rate-limit.ts, lead-token.ts, env.ts
public/
  images/               logos (WebP/SVG), ratings badges
  icons/                SVG icons from Figma
scripts/roi/            generate_fixtures.py (sheet → expected values)
docs/                   plan, assumptions, figma-map, roi-logic, design/, reports
```

Secrets are only read in `lib/server/*` via `env.ts`, which imports `server-only` so a client import fails the build.

## Packages

| Package | Why | Considered instead |
|---|---|---|
| `next`, `react`, `react-dom` | Brief prefers Next.js. App Router gives server components (less JS), route handlers for secrets, `next/font`, `next/image`. | — |
| `typescript` | Typed ROI engine and form schema; catches mistakes in the shared code. | — |
| `tailwindcss` v4 + `@tailwindcss/postcss` | Fast to map Figma tokens into an `@theme`; purged CSS keeps weight low. | CSS modules (slower to write) |
| `eslint`, `eslint-config-next` | Brief asks for ESLint; Next's rules catch a11y/image/perf issues. | — |
| `zod` | **One** schema validates the form in the browser and again in `/api/lead`, so client and server rules can't drift. | Hand-written validators (would be duplicated) |
| `react-hook-form` + `@hookform/resolvers` | On-blur + on-submit validation with few re-renders; plugs straight into zod. ~10 kB. | Hand-rolled state (more code, more bugs in a time box) |
| `libphonenumber-js` (`/min` metadata) | Correct per-country phone validation and E.164 formatting. Writing this by hand isn't realistic. | Regex (wrong for most countries) |
| `@radix-ui/react-select` | Accessible custom listbox (keyboard, type-ahead, ARIA, portal) that we style to the design; the brief asks for custom dropdowns, not native selects. | Headless UI (similar), hand-rolled (risky a11y) |
| `nodemailer` | Send via Gmail SMTP. Resend can't deliver to ai-labs@ without a verified domain. | Resend (blocked), Apps Script MailApp (couples email to the Sheet) |
| `server-only` | Build-time guard that server modules (secrets) never reach the client bundle. | — |
| `@upstash/ratelimit` + `@upstash/redis` *(P3, optional)* | Real rate limiting across serverless instances (free tier via the Vercel marketplace). Without it we fall back to in-memory. | In-memory only (resets per instance) |
| `vitest` (dev) | Fast TS test runner for the ROI engine and form schema. ✅ installed | Jest (more config) |

**Not used, on purpose:**
- **Framer Motion / GSAP:** CSS handles menus, marquee and buttons. Saves 30–60 kB of JS.
- **`googleapis` SDK:** Calendar and token refresh are two `fetch` calls, and the SDK is huge.
- **`@hubspot/api-client`:** one REST call.
- **Database:** the Sheet acts as the durable record.
- **Icon library:** we use the exact SVGs from Figma.

## Integration data flow

```
Browser (LeadForm) ── POST /api/lead {fields, honeypot, signed render-time token}
  └ route (Node runtime): method=POST, Origin check, honeypot, min fill time, rate limit, zod parse
       ├─ Promise.allSettled ──┬─ HubSpot: upsert contact by email
       │                       ├─ Apps Script: append row (+ crm/email status)
       │                       └─ Gmail SMTP: notification to ai-labs@hexanovate.com
       └─ 200 {ok, leadToken} if Sheet || CRM ok · 502 {ok:false, retryable} otherwise (no provider details)
Browser (BookingStep) ── GET /api/slots → Google free/busy → open slots
                      ── POST /api/book {leadToken, slot} → re-check free/busy → events.insert (attendee, sendUpdates=all)
```

All secrets live in Vercel env vars, read only in `lib/server`. Nothing is prefixed `NEXT_PUBLIC_` except non-secret config.

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Live Google Sheet differs from the xlsx (e.g. no broken reference, different numbers) | ROI pass/fail | Check 3 combinations in the live sheet early; the fixture generator can be pointed at a re-exported xlsx |
| ROI calculator is a raster in Figma | Fidelity score | Measure carefully from the 1008-wide render; disclose |
| No mobile/tablet designs | Fidelity judged on our choices | Use the design system's own 360px frames as reference; document breakpoints |
| Figma MCP quota (Starter plan) | Can't re-query the design | Everything is already extracted to `docs/design/` |
| Gmail SMTP mail lands in spam or is rate-limited | Notification "not received" | Plain, well-formed messages; test delivery to ai-labs@ early; the Sheet still records the lead |
| Google OAuth "Testing" refresh token expires after 7 days | Calendar breaks after review | Generate the token close to submission; document it |
| Apps Script / HubSpot latency (1–3 s cold) | Slow submit | Calls run in parallel; loading state; 8 s per-call timeout |
| Rate limiting is per-instance without Redis | Weak spam protection | Honeypot + timing token still apply; add Upstash if time allows; disclose |
| Strict CSP vs Next.js inline scripts | Headers score or a broken page | Start with a CSP that allows Next's needs, test on the deployed URL, tighten with nonces only if time allows; document |
| Lighthouse mobile ≥ 85 with backdrop-blur, gradients and images | Perf score | Server components by default, `next/image` (WebP, sizes, lazy below the fold), 2 font families subset via `next/font`, no animation library |
| Calendar double-booking race | Two people get one slot | Re-check free/busy right before insert; the narrow window remaining is acceptable and disclosed |
| Committing third-party docs or secrets to a public repo | Disqualifier | `.gitignore` covers `.env*` and the Hexanovate PDF/xlsx; scan history with gitleaks before submitting |
| Two-hour time box | Unfinished P2/P3 | Strict P0→P3 order; every gap listed in the process doc |
