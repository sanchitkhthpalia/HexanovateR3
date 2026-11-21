# Design spec — extracted from Figma

Source: duplicate of the Hexanovate file, `figma.com/design/2aNmc6dGcco0dIXbhVX4te` (original `erQwodkBIEBdqAdyiq4Bpw`), page frame `3008:9178`.
Extracted 2026-11-21 via Figma MCP. Screens in `screens/`, assets in `assets/`, layer tree in `structure.xml`.

Design canvas is **desktop only, 1200px wide, 1008px content column** (96px side gutters). No tablet/mobile frames exist.

## Section node IDs

| Section | Node | Screen |
|---|---|---|
| Header (nav pill) | `3008:9194` | `screens/header.png` |
| Solutions mega menu (open state) | `3008:9974` | `screens/mega-menu.png` |
| Integrations banner | `3008:9632` | `screens/integrations-banner.png` |
| ROI calculator | `3008:9582` | `screens/roi-calculator.png` |
| Lead generation form | `3009:10045` | `screens/lead-form.png` |
| Footer | `3008:9718` | `screens/footer.png` |

Vertical order on page: header → banner (y 374) → ROI (y 786) → lead form (y 1505) → footer (y 2281, full-bleed 1200). Section gap ≈ 120px.

## Tokens

### Colour
| Token | Value | Use |
|---|---|---|
| blue-500 (Foundation) | `#1873DE` | primary, borders on CTAs, links, active indicator |
| blue-300 (Foundation) | `#64A1E9` | legal separators |
| blue-700 | `#11529E` | secondary CTA text, gradient end, India phone circle |
| nublue-800 | `#0053B5` | mega menu active text, wordmark gradient start |
| nublue-200 | `#DFEEFF` | mega menu active item bg |
| wordmark gradient | `#0053B5 → #3994FF` (to right) | "KlearStack" text |
| yellow-500 (Foundation) | `#D99723` | active nav text, banner highlight, footer bars/dividers |
| brand-300 | `#FABF5A` | footer office separator |
| slate-00 | `#FFFFFF` | |
| slate-50 | `#F8FAFC` | mega menu left panel |
| slate-200 | `#E1E8EF` | mega menu borders |
| slate-900 | `#132333` | mega menu labels |
| text-body | `#374151` | subtitles, placeholders |
| text-strong | `#252525` | trust item emphasis |
| text-muted | `#626262` | footer links, address |
| text-menu | `#48586A` | mega menu secondary items |
| input-border | `#95BFF0` | form fields |
| form-panel-bg | `#F4F9FF` | lead form right panel |
| form-panel-border | `#CDE3FF` | lead form right panel |
| G2 red | `#FE492C` | rating badge |

Gradients:
- **CTA (Button-40-Brand):** `linear-gradient(~262deg, #1873DE 0.2%, #11529E 99.8%)` + `1px solid #1873DE`, radius 40.
- **Lead form card:** `linear-gradient(-45.2deg, #DFEDFF 0.3%, #CCE3FF 99.7%)`.
- **Banner:** `to right, #CCE3FF → #A2CDFF`. **Footer:** `to bottom, #CCE3FF → #A2CDFF`.
- **Footer watermark text:** `to bottom, #D9EBFF 4% → #A2CDFF 90.4%`, background-clip text.
- **Marquee fade (right edge):** `to right, rgba(217,234,255,0) → #D9EAFF`, 65px wide.
- **Header pill:** `rgba(24,115,222,0.1)` + `backdrop-filter: blur(25px)`.

Shadow/overlay (mega menu): `0 0 0 1px #0B151F1A, 0 2px 4px #0B151F0A, 0 5px 8px #0B151F0A, 0 10px 18px #0B151F08, 0 24px 48px #0B151F08`.

### Typography
Fonts: **Inter** (300, 300 italic, 400, 500, 600, 700) and **Be Vietnam Pro** (400, 500, 600). Ratings text uses Roboto 14/20 in Figma → substitute Inter (avoid a third font; note in report).

| Role | Font | Size/LH | Other |
|---|---|---|---|
| Banner H2 | Be Vietnam Pro 600 | 44/60 | centred, capitalize |
| Lead H1/H2 | Be Vietnam Pro 600 | 39/54 | tracking -0.39px |
| Lead tagline | Be Vietnam Pro 500 | 17/25 | right-aligned, tracking -0.17px |
| Newsletter title | Be Vietnam Pro 400 | 22/36 | tracking -0.242px |
| Footer column title | Be Vietnam Pro 600 | 15/20 | right-aligned |
| Body / lead subtitle | Inter 400 | 16/1.608 | #374151 |
| Trust item | Inter 15/1.618 | bold part 600 #252525, rest 400 #374151 |
| Nav item | Inter 400 | 13/20 | active: 600 #D99723 |
| CTA label | Inter 600 | 16/24 | tracking -0.176px (header secondary: 15/24, -0.165px) |
| Input text | Inter 400 | 14/24 | tracking -0.154px; dropdowns 15/24 |
| Footer link | Inter 400 | 15/23 | #626262 |
| Footer quick link | Inter 500 | 15/20 | black |
| Legal | Inter 400 | 14/20 | #1873DE |
| Data note | Inter 300 italic | 13/1.488 | right-aligned |
| Wordmark | Inter 700 "Klear" + 400 "Stack" | 26/28 | gradient text |
| Watermark | Inter 700 | 200/200 | gradient text, "Lorem Ipsu" (clipped by footer) |

### Radii
Cards 20 · footer top 40 · ROI card 25 · inputs 8 · pills/buttons 40 · header pill 33 · mega menu 16 · mega items 16 (active 12) · icon boxes 8.

## Header (`3008:9194`)
- Floating pill: 1134×56 (overhangs the 1008 column by 63px each side), padding 4, gap 62, radius 33, blurred translucent blue.
- Logo slot: **white 142×48 r26 placeholder — no logo in file.** Use KlearStack monogram + wordmark (`assets/lead-form/klearstack-monogram.svg`).
- Nav: Product▾, **Solutions▾ (active)**, Industries▾, Pricing, Resources▾, Company▾. Gap 16; caret 14px, gap 4. Active caret rotated 180° and yellow.
- Active indicator: `#1873DE` bar 76×6, top radii 28, sitting at the bottom edge of the pill under the active item.
- CTAs (gap 12): **Try it for Free →** (white, 1px #1873DE, text #11529E 15px, arrow 20, px24 py12) and **Get Free Demo →** (brand gradient, white 16px, arrow 16, px24 py12).

## Mega menu — Solutions (`3008:9974`)
- Pointer triangle 24px above panel, aligned under the active nav item.
- Two columns. Left "Sub nav list": slate-50 bg, slate-200 border, p24, gap 12, left radii 16. Items 200w, `pl4 pr16 py4`, gap 12, r16; white 36px icon box r8 with SealCheck 20px (24 when active); label Inter 500 15/24 slate-900.
  Active item: bg `#DFEEFF`, r12, label 600 `#0053B5`.
  Items: **Capabilities (active)**, Features, Integration, Document Types.
- Right "Third child list": white, `pl24 pr48 py24`, gap 16, right radii 16. Items py6, Inter 14/22 `#48586A`. Active: 600 `#0053B5` + ArrowRight 16.
  Items: **Data Processing (active)**, Data Extraction, Data Interpretation, Straight Through Processing (STP).
- Only this menu's contents are designed. Other dropdown contents are our call (see decisions).

## Integrations banner (`3008:9632`)
1008×292, r20, 1px #1873DE border, px48 py44, banner gradient plus a decorative diagonal overlay. Title: "Already Using SAP, Tally or QuickBooks? " + yellow "We Integrates with All!" (copy as designed). Gap 40 to CTA **Get A Free Demo →** (h44, px32).

## ROI calculator (`3008:9582`) — RASTER IN FIGMA
The calculator is two **screenshots** (`assets/roi/*.png`, 1366×768 each), not layers, so there are no tokens; rebuild by measuring `screens/roi-calculator.png` (rendered at 1008 wide).
- Outer card ~1008×598, r25, near-white (#F8FAFC-ish) with light border.
- Title "Calculate Your Savings" (~26px bold, dark navy); subtitle "See how much time and money you can save with KlearStack AI." (~13px slate).
- Segmented toggle top-right: **Single-Shot Model** (active: blue fill, white text) / Multi-Shot Model.
- Inner white card r16: label "DOCUMENT TYPE" (uppercase ~11px, slate-400, semibold, tracked) → full-width select "Select Document Type" (light fill, caret).
- Two sliders side by side: "DOCUMENT VOLUME (PAGES) ⓘ" with bubble "36,000 pages"; "AVERAGE MONTHLY SALARY PER RESOURCE" with bubble "₹73,000". Blue filled track, white thumb with blue ring, bubble tooltip with a pointer.
- Three result cards: **NET MONTHLY SAVINGS** (label + value blue) "₹0" / "COMPARED TO MANUAL LABOR"; **ANNUAL SAVINGS** "₹0" / "TOTAL SAVED PER YEAR"; **EQUIVALENT RESOURCES** "0" / "PEOPLE REPLACED BY KLEARSTACK". Value ~24px bold; caption ~10px uppercase slate.
- Footnote "* 15% lesser price in the Annual Plan"; CTA **Automate your workflows with us →** (371×48).

## Lead form (`3009:10045`)
- Card 1008×656, r20, lead gradient. Left 598w: `pt52 pr86 pb44 pl52`, space-between column. Right: flex-1, `#F4F9FF`, border #CDE3FF (top/right/bottom), right radii 20, `px31 py28`, gap 28, items aligned end.
- Left: wordmark (monogram 28px + 26px text, gap 6) → gap 28 → H (39/54) → gap 12 → subtitle → gap 24 → trust list (pl12, gap 8; check badge 20, gap 12):
  "**99%\*** World Class Accuracy", "**Proprietary AI** for Ultimate Security", "**Pilot Ready** in Less than 7 Hours\*".
- Logo strip: "Used by Many, Loved by All!" (15px, 106w) then logos, gap 40, h28 (Network International ~17px tall, Konica Minolta 46px): Landmark Group, Network International, Elevation 10K (×2), Konica Minolta. Right-edge fade. Becomes the infinite marquee.
- Right: tagline "Bring your messiest documents. / We'll process them live." → form 412w:
  fields gap 8 — **Name\***, **Contact no.\***, **Email ID\***, row (gap 8) **Solution Required\*▾** (flex) + **No. of Documents\*▾**, **Pain Point and Expectations (optional)** textarea h106 (py14).
  Inputs: white, 1px #95BFF0, r8, px20 py12.
  Decorative "fold" tabs (`field-tab-vector.svg`, 33×21) peek out at the left edge of fields 2–5 (y 44.5/100.5/156.5/212.5/326.5).
- Gap 16 → **Free Live Demo →** (209w, px32 py12, right-aligned).
- Gap 24 → ratings row (gap 32, right-aligned): G2 badge 36 + "4.9/5 G2" + stars 82×15; Trustpilot 36 + "4.7/5 Trustpilot" + stars.
- Divider → "All your data is safe and secure with us!" (13px light italic, right).

## Footer (`3008:9718`)
- Full-bleed 1200, top radii 40, footer gradient, `px96 py80`, glow ellipse top-right (`ellipse-glow.svg`).
- Row 1 (space-between): left 464w — **logo placeholder white 259×48 r26 (no logo in file)**, gap 24, description (Inter 14/26 #626262), gap 14, socials (28px circles, gap 10: Instagram on #1873DE = hover/active state, Mail and WhatsApp on white). Right (gap 46): quick links (212w, right-aligned, gap 20, Inter 500 15 + 2×16 #D99723 bar): How it works?, Check All Document Types, Pricing, Integrations; then **Solutions** column.
- Row 2 (space-between), columns right-aligned with title + 24×1 #D99723 divider (gap 16) + items gap 20:
  Industries (**BFSI active pill**: #1873DE, white 600, px16 py4 r20), Healthcare, Telecom, Manufacturing · Resources: Blog, Guides, Newsroom, API Documentation, Product Documentation · Tools: Compress PDF, Merge PDF, PDF to Image · Capabilities: Document Processing, Document Interpretation, Document Extraction, Straight Through Protocol (STP) · Company: About, Contact, Careers.
  Solutions: Accounts Payable, Supply Chain, Consumer Loans, ID Card.
- Gap 80 → newsletter row (gap 58): title, then input pill (white, 1px #1873DE, r40, h44, centred placeholder "Enter your E-mail address" Inter 300 14) + **Subscribe →** (gap 10).
- Gap 48 → divider → offices (gap 60, each 467w): "**India** | Lorem ipsum" / "City Tower, Sixth Floor, 17, Boat Club Road, Pune, India"; phone circle 36 (#11529E = hover state; others white) "+91 94220 84589" (#1873DE 500) and mail "sales@loremispu.com". "**USA** | Lorem ipsum" / "Lorem ipsum, Inc. 371 Hoes Lane, Suite 200, Piscataway, NJ 08854, USA", "+1 (973) 791-8875", "sales@loremispu.com".
- Legal row: Privacy Policy | Terms & Conditions | Cookie Policy | DPA (left), © KlearStack 2026 (right).
- Watermark "Lorem Ipsu" 200px, gradient text, bottom of footer, clipped.

## Gaps in the design → decisions to record
1. **No logo** (white placeholders in header + footer) → use KlearStack monogram + wordmark from the lead form.
2. **ROI calculator is raster** → rebuilt by measurement; fonts/colours approximate. Disclose.
3. **Salary default:** design bubble shows ₹73,000, sheet default is ₹30,000 → use the sheet's (logic source of truth).
4. **Outputs:** design shows 3 cards; sheet computes 8 → show the 3 designed cards; others available for testing.
5. **No tablet/mobile frames** → our own breakpoints (375 / 768 / 1440).
6. **No country-code control** on Contact no. → add a compact country-code picker inside the field.
7. **No consent/privacy note** → add one small line under the button (PII requirement).
8. **Dropdown options unspecified** → Solution Required = footer Solutions list + Other; No. of Documents = monthly ranges.
9. **Only the Solutions mega menu is designed** → Industries/Resources/Company as simple dropdowns from footer columns; Product as a dropdown of Capabilities/Tools.
10. **Copy quirks kept as designed:** "We Integrates with All!", "Straight Through Protocol (STP)" (footer) vs "Processing" (menu), "Lorem ipsum" office names, "Lorem Ipsu" watermark, sales@loremispu.com.
11. States shown statically (Solutions active, BFSI active, Instagram/India phone filled) → treat as active/hover styles.
