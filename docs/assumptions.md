# Assumptions and decisions

The brief says: *"Everything not specified in this document or the Figma file is your call… assumptions recorded in writing are treated as correct."* Each row lists the gap and the decision we propose. ✅ = already decided and implemented.

## Source material

| # | Ambiguity | Decision |
|---|---|---|
| S1 | The brief names `CLAUDE.md`, `docs/brief.txt` and `docs/roi-sheet.xlsx`, but none exist. The real inputs are `docs/Hexanovate_Round2 Assignment…pdf` and `docs/ROI Calculator_MarTech Technical_Round 2.xlsx`. | Use the real files. |
| S2 | In the xlsx, every formula points at `'Logic & Pricing'`, but the tab is called `Logic and Pricing`. Cached results show Annual Cost ₹0. | ✅ Implement the formulas' intent (lookups resolve). Expected values come from evaluating the formulas with the tab renamed in a temporary copy. Confirm against the live Google Sheet. See `roi-logic.md`. |
| S3 | Which sheet is authoritative if the xlsx and the live Google Sheet differ? | The live Google Sheet, since reviewers will test against it. Re-check three combinations there before submitting. |
| S4 | The Figma file is view-only, and the MCP needs edit access. | ✅ Work from a duplicate. Node IDs are unchanged. |
| S5 | The brief and sheet are Hexanovate's documents. | Keep them out of the public repo (`.gitignore`). Commit only our own docs and the generated fixtures. |
| S6 | Is the "2 hours" limit for the build only, or the reports too? | The build only. Reports are written within the 24h window. Say so in the process doc. |

## Layout and responsiveness

| # | Ambiguity | Decision |
|---|---|---|
| R1 | The design is 1200px wide with a 1008px content column. The brief tests at 1440. | Content max-width 1008px, centred. The footer and background are full-bleed at any width. |
| R2 | No tablet or mobile frames. | Breakpoints: **< 768** mobile, **768–1023** tablet, **≥ 1024** desktop. Below 1024 the nav collapses to a hamburger and drawer. Lead form: two columns ≥ 1024, stacked below (left panel first). ROI: sliders side by side ≥ 768; result cards 3-up ≥ 768, stacked on mobile. Footer: link columns 5 → 3 → 2 → stacked. |
| R3 | The header pill is 1134px wide, wider than the 1008 column. | Keep the overhang at ≥ 1200px viewport. Between 1024 and 1199, clamp to the viewport minus 32px. |
| R4 | Sticky header? It isn't stated. The translucent blurred pill suggests floating over content. | Sticky, floating 16–24px from the top, with the same blur. Add a subtle shadow once scrolled. |
| R5 | No horizontal overflow from 360 to 1920. | The 200px footer watermark is clipped (`overflow: hidden`) and scales with `clamp()`. The marquee is clipped inside its own container. |

## Header and navigation

| # | Ambiguity | Decision |
|---|---|---|
| H1 | Only the Solutions mega menu is designed. | Solutions = mega menu exactly as designed. Product = mega menu reusing the same component, with Capabilities/Tools columns. Industries, Resources and Company = simple dropdowns, using footer link groups. Pricing = plain link. This covers all three required patterns. |
| H2 | Which item is active? | Solutions, as in the design. The bar indicator sits under the active item. |
| H3 | Hover vs click to open. | Desktop with a fine pointer: open on hover (120ms intent delay), close 200ms after leaving. Click/Enter/Space toggles and pins the menu open. Touch devices: click only. Close on outside click, Escape (focus returns to the trigger) and scroll (beyond 8px). |
| H4 | Mega menu left column interaction. | Hover or focus on a left item swaps the right column's content (the design shows the Capabilities children). |
| H5 | No logo (white placeholder pills in the header and footer). | Use the KlearStack monogram + wordmark from the lead form frame. |
| H6 | Mobile menu pattern. | Slide-in drawer from the right using native `<dialog>` (focus trap, inert background, Escape). Each dropdown becomes an accordion. CTAs pinned at the bottom of the drawer. |
| H7 | Where links go. | The brief says no routing. Header/footer links use `href="#"` and keep normal link semantics and states. **Get Free Demo**, **Try it for Free**, **Get A Free Demo** and **Automate your workflows** scroll smoothly to the lead form and focus the first field. Pricing scrolls to the ROI calculator. |
| H8 | CTA button animation is unspecified. | Gradient shifts on hover, the arrow nudges 4px right, 1px lift with shadow, 0.98 scale on press. Honour `prefers-reduced-motion`. |

## Lead form

| # | Ambiguity | Decision |
|---|---|---|
| L1 | Options for "Solution Required". | Accounts Payable, Supply Chain, Consumer Loans, ID Card (the footer's Solutions list), plus Document Processing and Other. |
| L2 | Options for "No. of Documents". | Monthly ranges: < 1,000; 1,000–10,000; 10,000–50,000; 50,000–1,00,000; > 1,00,000. |
| L3 | Dropdown control. | Custom listbox styled like the design, not a native `<select>`. Fully keyboard-operable (Radix Select). |
| L4 | No country-code control on "Contact no.". | Compact country-code picker inside the field's left edge, default **+91**. Validate per country with libphonenumber-js and store as E.164. |
| L5 | Name rules. | Required. 2–80 characters. Letters, spaces, `.`, `'` and `-` only. Trimmed. |
| L6 | Business email rule. | Valid syntax, plus rejection of a free/public domain list: gmail, googlemail, yahoo.*, ymail, outlook, hotmail, live, msn, icloud, me, mac, aol, proton(mail), pm.me, gmx, mail.com, yandex, zoho mail, rediffmail, qq, 163, tutanota, fastmail and similar. Error: *"Please use your work email — personal addresses like gmail.com aren't accepted."* The same list runs on the server. |
| L7 | Pain point field. | Optional, maximum 1,000 characters, with a live counter after 800. |
| L8 | When validation shows. | On blur for each field, then on submit for all. The submit button stays enabled but blocks submission and focuses the first invalid field. This is more accessible than a disabled button, and the brief allows "disabled or blocked". |
| L9 | No consent or privacy note in the design. | Add one small line under the button: *"By submitting, you agree to be contacted about KlearStack. See our Privacy Policy."* Required for PII handling. |
| L10 | Spam protection. | A hidden honeypot field, plus a minimum fill time (3s, from a timestamp signed by the server), plus per-IP rate limiting (5 per 10 minutes). Rate limiting uses Upstash if configured, otherwise an in-memory fallback, documented as best-effort on serverless. |
| L11 | Success and failure states. | On success the form panel is replaced by a confirmation, then the calendar step. On failure there's an inline error banner with Retry, the user's input is kept, and a `mailto:` fallback is offered. |
| L12 | Logo marquee content. | Use the 5 logos from the design (Landmark, Network International, Elevation 10K, Konica Minolta; the design repeats some). Duplicate the track for a seamless loop. Pause on hover/focus. Freeze for reduced-motion. |
| L13 | Ratings badges (G2 4.9, Trustpilot 4.7). | Static content, not linked. |

## Integrations

| # | Ambiguity | Decision |
|---|---|---|
| I1 | Build vs integrate. | Our own Next.js API routes. Four systems is manageable, it keeps secrets in one place, and partial failure can be controlled per system. An automation platform would add a fifth service and hide failures. |
| I2 | CRM. | HubSpot free tier, via a private-app token scoped to contacts read/write. Upsert by email (no duplicates on resubmit). Name splits into firstname/lastname; phone and email map directly; solution, documents and pain point go to custom properties; `lifecyclestage=lead`. |
| I3 | Sheet. | Apps Script web app with a shared secret, appending: timestamp (IST), name, email, phone, solution, documents, pain point, CRM status, email status, source, user agent. |
| I4 | Email (no domain, so Resend can't send to ai-labs@). | Nodemailer over Gmail SMTP, using an app password from a test account. Plain-text and HTML versions; all user values HTML-escaped. |
| I5 | Calendar. | Google Calendar API with an OAuth refresh token from a test account. 30-minute slots, Mon–Fri, 10:00–18:00 IST, over the next 10 business days, minus free/busy. Times shown in the visitor's time zone. Booking re-checks free/busy, creates the event with the visitor as attendee, and sends invites. |
| I6 | Who may book? | Only someone who just submitted. `/api/lead` returns a short-lived HMAC-signed lead token, which `/api/book` requires. |
| I7 | Partial failure. | All sinks run in parallel and are recorded individually. The user sees success if **the Sheet or the CRM** succeeded. A CRM failure is recorded in the Sheet row and flagged in the email. The user sees an error (with Retry) only if both fail. Email failure never blocks the user. Provider error text is never sent to the browser. |
| I8 | Google OAuth app in "Testing" mode. | Refresh tokens expire after 7 days, which is enough for the review window. Note it in the security report. |

## ROI calculator

| # | Ambiguity | Decision |
|---|---|---|
| C1 | The calculator is a raster image in Figma. | Rebuild by measuring the image, reusing the page's tokens. Disclose as a fidelity risk. |
| C2 | Model toggle labels. | "Single-Shot Model" = sheet `Single`; "Multi-Shot Model" = `Multi`. Default: Single. |
| C3 | Default state on first load. | As designed: "Select Document Type" with nothing chosen, volume 36,000 and salary at the sheet default. Outputs show ₹0 / 0, because the sheet's outputs are blank until all inputs are complete. |
| C4 | Salary default: the design shows ₹73,000, the sheet ₹30,000. | ₹30,000, because the sheet defines the logic. |
| C5 | Volume control. | A slider that snaps to the sheet's 13 allowed steps (non-linear, evenly spaced positions). The bubble shows "36,000 pages". |
| C6 | Salary control. | A slider from ₹5,000 to ₹2,00,000 in ₹1,000 steps. Arrow keys step ₹1,000; Page Up/Down step ₹10,000. |
| C7 | Tier 3 + Multi. | Multi stays selectable. Show the sheet's message ("Tier 3 supports Single only") in place of the results, with ₹0/0 shown, as the sheet blanks them. |
| C8 | Number format. | ₹ with **Indian grouping** (₹4,07,000). Whole numbers show no decimals (as in the design); values with paise show 2 decimals (₹33,916.67), matching the sheet's `₹#,##0.00`. No L/Cr abbreviation, since the design shows none and full figures are easier to check against the sheet. |
| C9 | Negative savings. | Show the negative value (−₹1,583.33) in a muted warning colour, with a hint that savings start at higher volumes. Don't clamp to zero. |
| C10 | The design shows 3 outputs; the sheet computes 8. | Show the 3 designed cards. Add a collapsed "View calculation details" disclosure listing all 8 sheet outputs, for reviewer verification. |
| C11 | The "15% lesser price in the Annual Plan" footnote. | Keep it as display copy. The discount is not applied, as the sheet notes. |
| C12 | The ⓘ next to Document Volume. | Tooltip: "Total pages processed per year." |

## Footer

| # | Ambiguity | Decision |
|---|---|---|
| F1 | Newsletter. | Validate email syntax on submit and blur. Show inline success ("Thanks — you're subscribed"). Not wired to a system (optional per the brief). |
| F2 | Social links. | Instagram, Email and WhatsApp as in the design, `href="#"`, with accessible labels. |
| F3 | Placeholder copy ("Lorem ipsum" office names, "Lorem Ipsu" watermark, sales@loremispu.com). | Keep as designed. Note in the process doc. |
| F4 | Copy inconsistencies: "We Integrates with All!", and "Straight Through **Protocol**" (footer) vs "**Processing**" (menu). | Keep as designed. Note them. |

## Quality and tooling

| # | Ambiguity | Decision |
|---|---|---|
| Q1 | The ratings text uses Roboto in Figma. | Substitute Inter to avoid loading a third font family. |
| Q2 | Animation library. | None. CSS transitions/keyframes only, for bundle size and Lighthouse. |
| Q3 | Database. | None. The Sheet acts as the durable record of every lead. |
| Q4 | Favicon. | ✅ The KlearStack monogram as SVG (`app/icon.svg`). |
| Q5 | Which heading is the `<h1>`? The page has no hero; the banner comes first visually. | ✅ The lead section's product headline ("The Only Document AI…") is the `h1`, since it's the page's main claim. Banner, ROI and footer use `h2`. |
| Q6 | Assets from Figma. | ✅ SVGs are copied byte-for-byte. Rasters are converted to WebP at 2× their rendered size by `scripts/assets/build-public-assets.mjs`. The G2/Trustpilot sprites are cropped to the region the design shows. The ROI rasters aren't shipped, since the calculator is rebuilt in HTML. |
