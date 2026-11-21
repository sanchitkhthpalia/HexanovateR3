# KlearStack landing page

A single marketing page built from the KlearStack Figma design for the Hexanovate Round 2 assignment. It has a header with a mega menu, a lead form connected to HubSpot, a Google Sheet, email and calendar booking, an ROI calculator that matches the provided sheet, and a footer.

**Live:** https://hexanovate-chi.vercel.app/

## Reports
- [Process & methodology](docs/reports/process-and-methodology.md)
- [Security report](docs/reports/security-report.md)
- [Performance report](docs/reports/performance-report.md)

## What happens when someone submits the form
1. The browser validates the form with the same zod schema the server uses (`lib/validation/lead.ts`).
2. `POST /api/lead` checks the origin, rate limit, honeypot and fill time, then validates again.
3. The lead is appended to the **Google Sheet** first (via an Apps Script web app), then **HubSpot** and the **email notification** run in parallel. Each result is written back to the Sheet row.
4. If the lead reached any system, the form shows success and a **booking step**. `/api/slots` lists open 30-minute times from Google Calendar, and `/api/book` creates the event and invites the lead.

Every third-party call runs server-side. Secrets live in Vercel environment variables only.

## Stack
Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Radix UI primitives · react-hook-form + zod · libphonenumber-js · nodemailer · Vitest. There's no database and no animation library (CSS only).

## Run it locally
```bash
npm install
cp .env.example .env.local   # fill in the values you have; missing integrations are skipped
npm run dev                  # http://localhost:3000
```

| Command | What it does |
|---|---|
| `npm test` | Unit and route tests (ROI against 1,208 sheet-evaluated cases, validation, API routes, Apps Script logic) |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm run build` | Production build |
| `npm run roi:fixtures` | Regenerate the ROI test cases from the xlsx (needs Python with `openpyxl` and `formulas`; the xlsx isn't in the repo) |

## Environment variables
Names only are in [`.env.example`](.env.example). For each integration, step-by-step instructions are in [`docs/integrations-setup.md`](docs/integrations-setup.md).

| Variable | Used for |
|---|---|
| `SHEETS_WEBHOOK_URL`, `SHEETS_WEBHOOK_SECRET` | Google Sheet and Calendar, both through the Apps Script web app in `integrations/apps-script/Code.gs` |
| `HUBSPOT_TOKEN` | HubSpot service key (contacts read/write only) |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD` | Sending the notification email |
| `LEAD_NOTIFY_TO` | Notification recipient (defaults to ai-labs@hexanovate.com) |
| `BOOKING_TOKEN_SECRET`, `ALLOWED_ORIGINS` | Optional |

## Project layout
```
app/                    page, layout, API routes (lead, slots, book)
components/             header, lead section + form + booking step, ROI calculator, footer
lib/roi/                ROI engine (a line-by-line port of the sheet) and number formatting
lib/validation/         form schema shared by browser and server
lib/booking/            slot rules shared by the API and the UI
lib/server/             integrations (Sheet, HubSpot, email, calendar), env, guards
integrations/apps-script/  the Google Apps Script for the Sheet and Calendar
docs/                   reports, assumptions, ROI logic, setup guide, design spec
```

## Notes
- The assignment brief and the ROI workbook belong to Hexanovate and aren't in the repo. Neither are the raw Figma exports; the optimised assets the page uses are in `public/`.
- I built this with AI assistance (Claude Code). How it was used, what it got wrong and how that was caught are in the process document.
