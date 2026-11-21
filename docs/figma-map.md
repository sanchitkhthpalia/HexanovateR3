# Figma map

- **Working file (our editable duplicate):** https://www.figma.com/design/2aNmc6dGcco0dIXbhVX4te/KlearStack-Website---Hexanovate--Copy-
- **Original (view-only, from the brief):** https://www.figma.com/design/erQwodkBIEBdqAdyiq4Bpw/KlearStack-Website---Hexanovate?node-id=3008-9178

Node IDs are identical in both files. Figma's MCP server refuses files the account can't edit, so we read the duplicate.

The file is KlearStack's whole website redesign: 2 pages, ~1,250 top-level layers. The brief's prototype link opens on **one frame, `3008:9178`**, and that frame is the assignment. Everything else is unrelated website work, except the reference frames listed at the end.

## Assignment frames

All are desktop, drawn at **1200px canvas / 1008px content column**. Links open the working file at that node.

| Section | Frame / layer name | Node ID | Size | Breakpoint | Link |
|---|---|---|---|---|---|
| Whole page | `Frame` | `3008:9178` | 1200×3542 | Desktop 1200 | [open](https://www.figma.com/design/2aNmc6dGcco0dIXbhVX4te/KlearStack-Website---Hexanovate--Copy-?node-id=3008-9178) |
| Header (nav pill + CTAs) | `Frame 1618876865` | `3008:9194` | 1008×56 (pill 1134 wide) | Desktop | [open](https://www.figma.com/design/2aNmc6dGcco0dIXbhVX4te/KlearStack-Website---Hexanovate--Copy-?node-id=3008-9194) |
| Header: Solutions mega menu (open state) | `Group 1321315026` → `Platform` | `3008:9974` (panel `3008:9976`) | 562×275 | Desktop | [open](https://www.figma.com/design/2aNmc6dGcco0dIXbhVX4te/KlearStack-Website---Hexanovate--Copy-?node-id=3008-9974) |
| Header: active-item indicator bar | `Rectangle 18530` | `3008:9197` | 76×6 | Desktop | (inside header) |
| Integrations banner (not named in brief, but in design) | `Frame 1618875911` | `3008:9632` | 1008×292 | Desktop | [open](https://www.figma.com/design/2aNmc6dGcco0dIXbhVX4te/KlearStack-Website---Hexanovate--Copy-?node-id=3008-9632) |
| ROI calculator (**raster images**, not layers) | `Group 1321315192` (`image 164`, `image 165`, CTA button) | `3008:9582` | 1008×599 | Desktop | [open](https://www.figma.com/design/2aNmc6dGcco0dIXbhVX4te/KlearStack-Website---Hexanovate--Copy-?node-id=3008-9582) |
| Lead generation form | `Group 1321315202` → `Lead Generation Form 2 folds` | `3009:10045` (`3009:10046`) | 1008×656 | Desktop | [open](https://www.figma.com/design/2aNmc6dGcco0dIXbhVX4te/KlearStack-Website---Hexanovate--Copy-?node-id=3009-10045) |
| Lead form: left panel (title, trust, logo strip) | `Frame` | `3009:10048` | 598×656 | Desktop | (inside lead form) |
| Lead form: right panel (form) | `Frame` | `3009:10092` | 410×656 | Desktop | (inside lead form) |
| Footer | `Group 1321315078` | `3008:9718` | 1200×1238 | Desktop (full-bleed) | [open](https://www.figma.com/design/2aNmc6dGcco0dIXbhVX4te/KlearStack-Website---Hexanovate--Copy-?node-id=3008-9718) |
| Page background glow | `Group 1321315050` | `3008:9179` | 1200×7506 | Desktop | (decorative) |
| Hidden "Pill" tagline | `Pill` (hidden) | `3008:9185` | 409×24 | — | not built (hidden in design) |

Order on the page: header → banner → ROI calculator → lead form → footer.

## States found

| State | Where | Notes |
|---|---|---|
| Header **menu open** | `3008:9974` overlaid on `3008:9194` | Solutions menu open; "Capabilities" and "Data Processing" active |
| Header **default (closed)** | — | **No separate frame.** Inferred: the same header without the panel |
| Active nav item | Solutions in `3008:9194` | SemiBold, `#D99723`, caret flipped, blue 76×6 bar beneath |
| Active footer item | BFSI pill `3008:9789` | Blue pill, white text |
| Filled icon circles | Instagram `3008:9739`, India phone `3008:9897` | Read as hover/active styling |

## Mobile / tablet

**None exist for this page.** The page design has no 360/375/768 frames and no mobile menu. Responsive behaviour is our decision (see `assumptions.md`).

## Reference-only frames (other pages, not in scope)

These may inform patterns the brief leaves to us. We use them for style cues only.

| Frame | Node ID | Page | Size | Possible use |
|---|---|---|---|---|
| `Homepage 16` | `2141:11431` | Redesign KS | 360×11473 | Mobile header/footer treatment from the same design system |
| `Pricing page- Final` | `2190:2435` | Redesign KS | 360×11473 | Same |
| `Calender` | `1:2568` | Demo Form - Pulkit | 1128×746 | Style cue for our booking step (the brief says no calendar UI is supplied) |
| `Thank you page` / `Thank you page updated` | `1:2136` / `1:2186` | Demo Form - Pulkit | 859×893 / 803×783 | Success-state style cue |
| `iPhone 16 - 1` | `1:2573` | Demo Form - Pulkit | 393×852 | Possibly a mobile demo form |

We haven't fetched these to save MCP quota. One `get_screenshot` each if we decide to use them.

## Extracted artefacts

- `docs/design/SPEC.md`: tokens and per-section measurements
- `docs/design/screens/*.png`: reference render of each section
- `docs/design/assets/**`: raw assets downloaded from Figma
- `docs/design/structure.xml`: layer tree of `3008:9178`
- `docs/design/full-page.png`: whole frame at 1:1
