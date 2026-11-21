# Process log

A running record for the process & methodology document: what was built when, and every place where something (AI output, tooling or the source material) was wrong, how it was caught and how it was fixed.

## Problems caught

| # | What was wrong | How it was caught | Fix |
|---|---|---|---|
| 1 | **ROI workbook:** the formulas reference `'Logic & Pricing'` but the tab is `Logic and Pricing`. Cached results show a ₹0 annual cost. | Read the formulas, not just the values (openpyxl), and compared them with the sheet names. | Implemented the intended lookup. Test values come from evaluating the formulas with the tab renamed in a temporary copy. See `roi-logic.md`. |
| 2 | The first formula engine tried (pycel) crashes on Python 3.14 (`ast.Str` was removed). | Ran it. | Switched to the `formulas` package. Its default-input results matched a hand calculation. |
| 3 | The Figma MCP refused the brief's file ("no edit access"). | Tool error. | Worked from a duplicate in our own drafts. Node IDs are unchanged. |
| 4 | **Stale build:** after editing `globals.css`, the production build still served old CSS. The `desk:` breakpoint and new animations were missing, so the desktop header rendered as mobile at 1440px. | Headless Chrome test: "Solutions button not found". A screenshot showed the hamburger at 1440. Grepping the built CSS showed no `desk` rules. | Clean rebuild (`rm -rf .next`). All verification builds now start clean. |
| 5 | AI-written button transition listed `transform`, but Tailwind v4 moves elements with the separate `translate`/`scale` properties, so hover lift and press snapped with no animation. | The automated "CTA lifts on hover" check read `transform: none`. Inspecting computed styles showed the change was on `translate`. | Transition `translate, scale, …` explicitly. |
| 6 | `hidden sm:inline-flex` on a ButtonLink didn't hide it on mobile: the component's own `inline-flex` class won the cascade. At 360px the header overflowed by 28px and squashed the menu button. | Overflow sweep (360–1920px) flagged `scrollWidth 388` at 360. An element scan found the culprit. | Wrapped the button in an element that carries the responsive visibility. |
| 7 | `mix-blend-multiply` on each marquee logo left their white backgrounds visible. The animated track creates its own stacking context, so the logos multiplied against transparency. | Visual comparison with the Figma render. | Moved the blend mode onto the track. |
| 8 | The lead headline wrapped to 4 lines instead of the design's 3. Figma uses the retired "Be Vietnam"; Be Vietnam Pro is wider. | Visual comparison. Measured the line at 474px in a 460px box. | The heading borrows 20px of the panel's 86px right padding. |
| 9 | Marquee strip was 44.5px, not 46px, on mobile: `flex-1` in a column layout let it shrink. | Automated "fixed 46px height" check at 375px. | `flex-none` on mobile, `flex-1` only when side by side. |
| 10 | My own test script had errors: keyboard checks started with focus left on a button from an earlier test, and the CTA check read `transform` instead of `translate`. | Checks failed, but the behaviour was fine when inspected by hand. | Fixed the tests (fresh page for keyboard tests, read the correct property). Kept in mind that a failing check can be a test bug. |

## Verification approach

- **ROI:** 68 Vitest tests, exact equality, 1,208 sheet-evaluated cases. Mutation-checked: a one-digit rate change fails them.
- **UI behaviour:** Playwright scripts driving headless Chrome against the production build. Header: 34 checks covering hover intent delay, click toggle, outside click, Escape and focus return, scroll close, Tab/Enter/Space, sticky offset, drawer focus trap, scroll lock, touch target size, and no horizontal overflow at 10 widths from 360 to 1920. Lead left panel and marquee: 28 checks covering identical copy widths, copy wider than the viewport, fixed height, lazy images with dimensions, hover pause/resume, reduced motion, and CLS = 0 at 1440/768/375.
- **Fidelity:** screenshots compared side by side with the Figma section renders in `docs/design/screens/`.
