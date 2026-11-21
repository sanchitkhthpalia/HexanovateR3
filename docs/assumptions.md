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
| R2 | No tablet or mobile frames. | Breakpoints: **< 768** mobile, **768–1023** tablet, **≥ 1024** desktop. ✅ The header switches to the hamburger and drawer below **1200px**: the designed nav needs the full 1134px pill, and squeezing it into 1024–1199 would break the design's spacing. Lead form: two columns ≥ 1024, stacked below (left panel first). ROI: sliders side by side ≥ 768; result cards 3-up ≥ 768, stacked on mobile. Footer: link columns 5 → 3 → 2 → stacked. |
| R3 | The header pill is 1134px wide, wider than the 1008 column. | ✅ `width: min(100% − 32px, 1134px)`, centred, so the overhang shows at ≥ 1200px. |
| R4 | Sticky header? It isn't stated. The translucent blurred pill suggests floating over content. | ✅ Sticky, 24px from the top on desktop (its position in Figma) and 16px on smaller screens. After 8px of scroll the pill gets a more opaque tint (same hue) and a soft shadow, so it stays legible over content. |
| R6 | Space between header and banner. Figma puts the banner 318px below the header, but only because the Solutions mega menu is drawn open in that space. | ✅ 120px, the design's own spacing between sections (64px on mobile). Matching the 398px position literally would leave an empty band under a closed menu. |
| R7 | Sections the brief doesn't list but the design contains (the integrations banner). | ✅ Built as designed, since the brief says to build the page as designed. |
| R5 | No horizontal overflow from 360 to 1920. | The 200px footer watermark is clipped (`overflow: hidden`) and scales with `clamp()`. The marquee is clipped inside its own container. |

## Header and navigation

| # | Ambiguity | Decision |
|---|---|---|
| H1 | Only the Solutions mega menu is designed. | ✅ Solutions = mega menu as designed. Its other groups (Features, Integration, Document Types) get plausible links, reusing the footer's Solutions list where possible. Product (footer quick links), Industries, Resources and Company = simple dropdowns styled like the mega menu's right column. Pricing = plain link. This covers all three required patterns with 6 items. |
| H2 | Which item is active? | Solutions, as in the design. The bar indicator sits under the active item. |
| H3 | Hover vs click to open. | ✅ Radix Navigation Menu. Hover opens for mouse pointers only, after a 120ms intent delay. It closes 150ms after the pointer leaves (Radix's fixed value). Click/Enter/Space toggles. Touch is click-only. It closes on outside pointer-down, on Escape (focus returns to the trigger) and once the page scrolls more than 8px. Each panel has a 27px hoverable gap above it, so crossing from the trigger doesn't close it. |
| H4 | Mega menu left column interaction. | Hover or focus on a left item swaps the right column's content (the design shows the Capabilities children). |
| H5 | No logo (white placeholder pills in the header and footer). | Use the KlearStack monogram + wordmark from the lead form frame. |
| H6 | Mobile menu pattern. | ✅ Slide-in drawer from the right using Radix Dialog (focus trap, body scroll lock, Escape, focus returns to the menu button). Radix Accordion with one section open at a time; the active section (Solutions) starts open. CTAs are pinned at the bottom. Touch targets are ≥ 44px. The drawer closes automatically if the viewport grows to desktop. |
| H7 | Where links go. | The brief says no routing. Header/footer links use `href="#"` and keep normal link semantics and states. **Get Free Demo**, **Try it for Free**, **Get A Free Demo** and **Automate your workflows** scroll smoothly to the lead form and focus the first field. Pricing scrolls to the ROI calculator. |
| H8 | Hover states and CTA animation aren't shown in Figma (only the active state is). | ✅ Nav items: text goes brand blue, and a 1px underline grows from the centre. The active item keeps its yellow and the 76×6 blue bar. Open menus flip the caret. Dropdown links go semibold `#0053B5` with an arrow sliding in (width reserved, so nothing shifts). CTAs: 1px lift, brighter gradient and blue shadow, the arrow nudges 4px, 0.98 scale on press. All motion is disabled under `prefers-reduced-motion`. |

## Lead form

| # | Ambiguity | Decision |
|---|---|---|
| L1 | Options for "Solution Required". | ✅ Accounts Payable, Supply Chain, Consumer Loans, ID Card (the footer's Solutions list), plus Document Processing and Other. |
| L2 | Options for "No. of Documents". | ✅ Monthly ranges: < 1,000; 1,000–10,000; 10,000–50,000; 50,000–1,00,000; > 1,00,000. The list shows full labels; the closed control shows a short form ("50K – 1L / month") so it fits the designed width. |
| L3 | Dropdown control. | ✅ Radix Select styled like the design (blue caret, panel styled like the menus). Keyboard: Enter/Space/arrows open, typeahead, Escape. Its required-field error appears when the list closes without a choice, not when it opens. |
| L4 | No country-code control on "Contact no.". | ✅ Country-code picker inside the field's left edge, default **+91**. India, US, UK, UAE, Singapore and Australia are listed first, then all countries A–Z, with typeahead by name. The number is validated for the chosen country with libphonenumber-js (default "min" metadata: checks length and leading digits per country, kept small for the client bundle). A number typed with `+` is validated as international. Conversion to E.164 happens server-side with the CRM integration. |
| L5 | Name rules. | Required. 2–80 characters. Letters, spaces, `.`, `'` and `-` only. Trimmed. |
| L6 | Business email rule. | Valid syntax, plus rejection of a free/public domain list: gmail, googlemail, yahoo.*, ymail, outlook, hotmail, live, msn, icloud, me, mac, aol, proton(mail), pm.me, gmx, mail.com, yandex, zoho mail, rediffmail, qq, 163, tutanota, fastmail and similar. Error: *"Please use your work email — personal addresses like gmail.com aren't accepted."* The same list runs on the server. |
| L7 | Pain point field. | Optional, maximum 1,000 characters, with a live counter after 800. |
| L8 | When validation shows. | ✅ react-hook-form `onTouched`: each field is validated when it first loses focus, then live as it's edited, so errors clear the moment they're fixed. Submit re-validates everything and focuses the first problem. The button is **`aria-disabled`** (dimmed, announced as unavailable) until the form is valid. It's not natively disabled, so clicking or pressing it still reveals every missing field instead of doing nothing. During submission it is truly disabled with a spinner, and the fields are locked. |
| L9 | No consent or privacy note in the design. | ✅ One small line under the data note: *"By submitting, you agree to our Privacy Policy."* Required for PII handling. |
| L10 | Spam protection. | A hidden honeypot field, plus a minimum fill time (3s, from a timestamp signed by the server), plus per-IP rate limiting (5 per 10 minutes). Rate limiting uses Upstash if configured, otherwise an in-memory fallback, documented as best-effort on serverless. |
| L11 | Success and failure states. | ✅ Success: the form is replaced by a confirmation that takes focus and is announced (calendar step comes with P2). Failure (network error, timeout after 15s, or non-2xx): an inline `role=alert` message, all input kept, and the button becomes "Try again". A 400 from the server's own validation is shown against the relevant fields. No mailto fallback, since the design only has placeholder addresses. |
| L12 | Logo marquee content. | ✅ The design's own 7-logo sequence (Landmark, Network International, Elevation 10K ×2 each, Konica Minolta), so one copy (968px) is wider than the strip at every breakpoint. Pure CSS, rendered twice, the track slides −50%. Pauses on hover. Under reduced motion: no animation, the duplicate is hidden, and the strip scrolls horizontally instead. Below 640px the label sits above the logos. |
| L13 | Ratings badges (G2 4.9, Trustpilot 4.7). | ✅ Static content, not linked. Each is announced as one image ("Rated 4.9 out of 5 on G2"). |
| L14 | The form is wider (412px) than its panel (348px content) in Figma. | ✅ Reproduced on desktop: it overhangs the left panel by ~33px, and the gradient "folds" under each field fill the overhang. When stacked, the form is full-width and the folds are hidden. |
| L15 | Input text is 14–15px in the design. | ✅ Kept from 640px up. Below that, 16px, to stop iOS Safari zooming on focus. |
| L16 | Honeypot and timing. | ✅ Hidden `website` field (off-screen, `tabindex=-1`, `aria-hidden`, autocomplete off) plus the render time (set after hydration, since the page is prerendered). Both are sent with every submission. The stub API already answers honeypot hits with a bland success. Rejecting fast submissions and rate limiting arrive with the real `/api/lead`. |

## Integrations

| # | Ambiguity | Decision |
|---|---|---|
| I1 | Build vs integrate. | Our own Next.js API routes. Four systems is manageable, it keeps secrets in one place, and partial failure can be controlled per system. An automation platform would add a fifth service and hide failures. |
| I2 | CRM. | HubSpot free tier, via a private-app token scoped to contacts read/write. Upsert by email (no duplicates on resubmit). Name splits into firstname/lastname; phone and email map directly; solution, documents and pain point go to custom properties; `lifecyclestage=lead`. |
| I3 | Sheet. | Apps Script web app with a shared secret, appending: timestamp (IST), name, email, phone, solution, documents, pain point, CRM status, email status, source, user agent. |
| I4 | Email (no domain, so Resend can't send to ai-labs@). | Nodemailer over Gmail SMTP, using an app password from a test account. Plain-text and HTML versions; all user values HTML-escaped. |
| I5 | Calendar. | Google Calendar API with an OAuth refresh token from a test account. 30-minute slots, Mon–Fri, 10:00–18:00 IST, over the next 10 business days, minus free/busy. Times shown in the visitor's time zone. Booking re-checks free/busy, creates the event with the visitor as attendee, and sends invites. |
| I6 | Who may book? | Only someone who just submitted. `/api/lead` returns a short-lived HMAC-signed lead token, which `/api/book` requires. |
| I9 | Minimum fill time. | ✅ 3s from render (sent by the form) to submit, and no render time in the future or older than 24h. Too-fast attempts get a visible, retryable message rather than a silent drop, since a real person with instant autofill could hit it. |
| I10 | Origin check. | ✅ The request's `Origin` must equal the site's own origin (from Host / X-Forwarded-Host) or be listed in `ALLOWED_ORIGINS`. A missing Origin is rejected (browsers always send one on `fetch` POSTs). |
| I11 | Spreadsheet formula injection. | ✅ The Apps Script stores any value starting with `= + - @` as text (leading apostrophe), so a name like `=HYPERLINK(...)` can't execute. |
| I7 | Partial failure. | ✅ The Sheet append runs first, then CRM and email in parallel; results are recorded individually and written back to the row. The user sees success if the lead landed **anywhere** (Sheet, CRM or the notification inbox). A CRM failure is recorded in the Sheet row and flagged in the email. The user sees an error (with Retry) only if both fail. Email failure never blocks the user. Provider error text is never sent to the browser. |
| I8 | Google OAuth app in "Testing" mode. | Refresh tokens expire after 7 days, which is enough for the review window. Note it in the security report. |

## ROI calculator

| # | Ambiguity | Decision |
|---|---|---|
| C1 | The calculator is a raster image in Figma. | Rebuild by measuring the image, reusing the page's tokens. Disclose as a fidelity risk. |
| C2 | Model toggle labels. | ✅ "Single-Shot Model" = sheet `Single`, "Multi-Shot Model" = `Multi`. Default: Single. Built as a radio group (one tab stop, arrow keys). |
| C13 | Calculator colours/sizes (raster in Figma). | ✅ Sampled from the render: Tailwind's slate scale (`#0F172A` / `#64748B` / `#94A3B8` / `#E2E8F0` / `#F1F5F9` / `#F8FAFC`) plus `#3E93FC`. Geometry is measured: inner card 948 wide, cards 305×114, 15px gaps, 18px thumb. Fonts approximated with the page's fonts. |
| C14 | Live results for screen readers. | ✅ The visible numbers update instantly. A polite live region announces a one-sentence summary 0.7s after the last change, so dragging a slider doesn't flood announcements. |
| C3 | Default state on first load. | ✅ **The sheet's own defaults** (Bank Cheques, Single, 36,000 pages, ₹30,000), as instructed, so first load shows real results (₹33,916.67 / ₹4,07,000 / 2) that match the sheet. The design's empty "Select Document Type" / ₹0 state is the sheet's "Complete all inputs" state; it's still handled (₹0 / 0 plus a message) but can't occur in the UI, since every input always has a value. |
| C4 | Salary default: the design shows ₹73,000, the sheet ₹30,000. | ✅ ₹30,000, because the sheet defines the logic. |
| C5 | Volume control. | ✅ A native range input over the sheet's 13 allowed steps (evenly spaced positions), with the design's value bubble ("36,000 pages", Indian grouping, so 1,000,000 shows as "10,00,000 pages"). |
| C6 | Salary control. | ✅ A native range input from ₹5,000 to ₹2,00,000 in ₹1,000 steps. Arrow keys, Page Up/Down, Home and End all work natively. The sheet accepts any decimal salary, but the slider offers whole thousands; the engine handles any value. |
| C7 | Tier 3 + Multi. | ✅ Multi stays selectable. The results show ₹0 / 0 (the sheet blanks them), with a status message that includes the sheet's wording: "Multi-Shot isn't available for Contract (Tier 3 supports Single only)…". |
| C8 | Number format. | ✅ `lib/roi/format.ts` (tested). ₹ with **Indian grouping** (₹4,07,000). Whole rupees show no decimals (as in the design's "₹0"); amounts with paise show exactly 2 (₹33,916.67). Rounding matches how the sheet displays `₹#,##0.00` (15 significant digits, half away from zero), verified against all 1,208 fixtures. **No L/Cr abbreviations and no percentages:** neither appears in the design or in the sheet's output formats, and full figures can be compared with the sheet digit for digit. |
| C9 | Negative savings. | ✅ Shown as-is ("-₹1,583.33") in the danger colour, with a one-line explanation. Not clamped, since the sheet doesn't clamp. |
| C10 | The design shows 3 outputs; the sheet computes 8. | ✅ The 3 designed cards, plus a collapsed "View calculation details" (`<details>`) listing all 8 sheet outputs, so any combination can be checked against the sheet. It adds ~30px to the card's height. |
| C11 | The "15% lesser price in the Annual Plan" footnote. | Keep it as display copy. The discount is not applied, as the sheet notes. |
| C12 | The ⓘ next to Document Volume. | ✅ A focusable button with a tooltip on hover and keyboard focus: "Total pages your team processes per year." |

## Footer

| # | Ambiguity | Decision |
|---|---|---|
| F1 | Newsletter. | ✅ Validates email syntax on blur (once something is typed) and on submit, with aria-invalid and an error message. A valid submit swaps the form for "Thanks! You're subscribed to our newsletter." Not wired to a system (optional per the brief). Any valid address is accepted: the work-email rule is for demo requests. |
| F2 | Social links. | ✅ Instagram, Email and WhatsApp as in the design, with aria-labels ("KlearStack on Instagram", …). The Figma glyphs are white rasters, so each is used as a CSS mask and coloured per state: light blue (sampled) on white circles, white on blue. The filled look shown on Instagram and the India phone becomes the hover state for all, plus a 2px lift and a press scale. |
| F5 | Footer on smaller screens (no frames). | ✅ Desktop is as designed (right-aligned columns). Below 1024px: the brand block stacks above quick links and Solutions; the five columns become a 3-column (tablet) or 2-column (mobile) left-aligned grid, with underlines growing from the left instead of the right; newsletter, offices and legal rows stack. The watermark scales with the viewport. |
| F6 | Footer hover/click animations aren't specified. | ✅ Links: colour to brand blue, and an underline grows from the right (the text edge) on desktop. Quick-link yellow bars stretch. Social and contact circles fill blue. Everything nudges on press. |
| F7 | Logo slot in the footer is an empty white pill in Figma. | ✅ Same pill, containing the KlearStack logo (as in the header). |
| F3 | Placeholder copy ("Lorem ipsum" office names, "Lorem Ipsu" watermark, sales@loremispu.com). | Keep as designed. Note in the process doc. |
| F4 | Copy inconsistencies: "We Integrates with All!", and "Straight Through **Protocol**" (footer) vs "**Processing**" (menu). | Keep as designed. Note them. |

## Quality and tooling

| # | Ambiguity | Decision |
|---|---|---|
| Q1 | Fonts not available as designed. | Ratings text: Roboto → Inter, to avoid a third font family. ✅ Display font: Figma uses the retired **Be Vietnam**, and Google Fonts only serves **Be Vietnam Pro**, which is slightly wider. Where that changes line breaks (lead headline), the text box borrows a little padding to keep the designed breaks. |
| Q2 | Animation library. | None. CSS transitions/keyframes only, for bundle size and Lighthouse. |
| Q3 | Database. | None. The Sheet acts as the durable record of every lead. |
| Q4 | Favicon. | ✅ The KlearStack monogram as SVG (`app/icon.svg`). |
| Q7 | Design colours that fail WCAG AA contrast (found by the audit: axe-core plus a manual check of text on gradients). | ✅ Each changed to the **lightest shade that passes**, keeping its hue. ROI labels, captions and footnote: `#94A3B8` (2.6:1) → `#64748B`. White on `#3E93FC` (3.1:1: toggle, slider bubble) → on brand `#1873DE`. Small blue ROI label → `#1873DE` (the 26px value keeps `#3E93FC`, since large text needs only 3:1). Inactive toggle text → `#5B6B80`. Footer greys on the gradient: `#626262` (4.1:1) → `#525252`. Footer/legal/phone blue `#1873DE` (2.9:1 there) → `#11529E`. Nav hover → `#11529E`. **Accent yellow as text** (`#D99723`, 1.5–2:1): active nav item → `#895F16`, banner highlight → `#996A19`. Decorative yellow (bars, dividers) is unchanged. All of this lives in two tokens (`--color-accent-text`, `--color-accent-large`), so the exact design yellow can be restored in one line. |
| Q8 | Form field borders `#95BFF0` are 1.9:1 against white (WCAG 1.4.11 suggests 3:1 for input boundaries). | **Accepted, as designed.** The fields are also told apart by their white fill against the panel, by placeholders, and by labels for AT. Darkening the borders would visibly change the form. Listed as a known issue in the security/quality report. |
| Q9 | Heading order: the banner and ROI `h2`s come before the `h1` (the design has no hero; the h1 is the lead headline, assumptions Q5). | Kept. There is exactly one `h1` and no skipped levels going down, and axe/Lighthouse don't flag it. |
| Q10 | LCP element. | ✅ Measured: the banner heading (text), not an image, so there's no hero image to prioritise. The only meaningful above-the-fold image, the header logo, is preloaded (`priority`), and the header CTA arrows load eagerly. Everything below the fold is `loading="lazy"` with width/height set. |
| Q11 | Focus visibility. | ✅ Every one of the 27 Tab stops shows a visible indicator (global `:focus-visible` outline, focus rings on fields, and a solid white + `#11529E` ring on slider thumbs, strengthened after the audit). |
| Q5 | Which heading is the `<h1>`? The page has no hero; the banner comes first visually. | ✅ The lead section's product headline ("The Only Document AI…") is the `h1`, since it's the page's main claim. Banner, ROI and footer use `h2`. |
| Q6 | Assets from Figma. | ✅ SVGs are copied byte-for-byte. Rasters are converted to WebP at 2× their rendered size by `scripts/assets/build-public-assets.mjs`. The G2/Trustpilot sprites are cropped to the region the design shows. The ROI rasters aren't shipped, since the calculator is rebuilt in HTML. |
