# Performance Report: KlearStack landing page

**Measured URL:** https://hexanovate-chi.vercel.app/ · **Tool:** Lighthouse 13.6 CLI in headless Chrome, default simulated throttling · **Date:** 21 Nov 2026
Mobile = Lighthouse default (Moto G Power emulation, slow 4G, 4× CPU slowdown). Desktop = `--preset=desktop`. Each mode was run 3 times against the live URL, and the **median run** is reported. The screenshots are of that run.

## Results (deployed URL)

| Metric | Target | Mobile (median) | Desktop (median) | Met? |
|---|---|---|---|---|
| Lighthouse Performance | 85+ (mobile) | **98** | **100** | ✅ |
| Accessibility / Best Practices / SEO | 90+ each | **100 / 100 / 100** | **100 / 100 / 100** | ✅ |
| Largest Contentful Paint | < 2.5 s | **1.01 s** | **0.29 s** | ✅ |
| Cumulative Layout Shift | < 0.1 | **0** | **0** | ✅ |
| Total Blocking Time | < 200 ms | **162 ms** | **0 ms** | ✅ (see note) |
| First Contentful Paint | < 1.8 s | **1.01 s** | **0.29 s** | ✅ |
| Time to First Byte (root document) | < 800 ms | **25 ms** | **27 ms** | ✅ |
| Total page weight (transferred) | state & justify | **569 KiB** | **571 KiB** | — |
| JS transferred | state & justify | **269 KiB** (6 files) | **269 KiB** | — |

All six runs:

| Run | Perf | A11y | BP | SEO | LCP | CLS | TBT | FCP | TTFB |
|---|---|---|---|---|---|---|---|---|---|
| Mobile 1 | 93 | 100 | 100 | 100 | 0.94 s | 0 | **313 ms** | 0.94 s | 25 ms |
| Mobile 2 | 98 | 100 | 100 | 100 | 1.01 s | 0 | 155 ms | 1.01 s | 24 ms |
| Mobile 3 (median) | 98 | 100 | 100 | 100 | 1.01 s | 0 | 162 ms | 1.01 s | 25 ms |
| Desktop 1 | 100 | 100 | 100 | 100 | 0.28 s | 0 | 0 ms | 0.28 s | 28 ms |
| Desktop 2 (median) | 100 | 100 | 100 | 100 | 0.29 s | 0 | 0 ms | 0.29 s | 27 ms |
| Desktop 3 | 100 | 100 | 100 | 100 | 0.28 s | 0 | 0 ms | 0.28 s | 26 ms |

**Note on TBT.**
- **Mobile TBT is the one metric close to its limit.** The median is 162 ms against a 200 ms target, and the first run measured 313 ms, which **misses the target**.
- **The cause is JavaScript start-up under the 4× CPU slowdown:** hydrating the interactive sections (header menus, form with zod and libphonenumber, calculator).
- **The fix** is to defer the form and drawer code (see "What I'd optimise next").
- **TTFB** is low because the page is statically prerendered and served from Vercel's CDN cache (`x-vercel-cache: HIT`).
- **Caveat:** the numbers are from my own machine and network. Field data will vary.

### Lighthouse: mobile (median run)
![Lighthouse mobile](lighthouse-mobile.png)

### Lighthouse: desktop (median run)
![Lighthouse desktop](lighthouse-desktop.png)

## Page weight and JS: what's in it and why
Transfer sizes from the median mobile run on the live URL:

| Resource | Requests | Transferred | Notes |
|---|---|---|---|
| JavaScript | 6 | 269 KiB | React 19 and the Next.js runtime, Radix (menu, dialog, accordion, select), react-hook-form + zod, and libphonenumber-js (the *min* metadata build). |
| Fonts | 7 | 229 KiB | Inter (variable, normal + italic) and Be Vietnam Pro 400/500/600, Latin subset only, self-hosted by `next/font`. |
| Images | 19 | 41 KiB | All WebP at 2× display size, or SVG. |
| HTML + CSS | 2 | 30 KiB | Static prerendered HTML; one Tailwind CSS file. |
| **Total** | 35 | **569 KiB** | No third-party requests at all. |

**Why this JS is justified:**
- Every library maps to a brief requirement:
  - accessible menus, drawer and custom dropdowns → Radix
  - validation shared by browser and server → zod
  - country-aware phone validation → libphonenumber
- The page itself is static. Only the interactive parts (header, form, calculator, newsletter field) ship client code. The footer and banner are server components.
- No animation library and no analytics or tag scripts.

## Strategies

**Images.**
- Every Figma raster was converted to **WebP at 2× its rendered size** by `scripts/assets/build-public-assets.mjs` (sharp). Icons and logos stay as SVG, copied byte for byte.
- Every `<img>` has explicit `width`/`height`, so CLS is 0 by construction.
- Everything below the fold uses `loading="lazy"`.
- The above-the-fold header logo uses `priority`.
- The LCP element is the banner **heading text**, not an image, so no hero image needs preloading.

**Fonts.**
- `next/font/google` self-hosts both families at build time: no request to Google, and no layout shift thanks to size-adjusted fallbacks.
- `display: swap`, **Latin subset only**, and only the three Be Vietnam Pro weights actually used.
- Inter is the variable font, so all its weights come from one file.

**Marquee animation.**
- Pure CSS: one `@keyframes` translating the track by exactly one copy's width, using `translate` only, so it runs on the compositor thread with no JavaScript per frame and no layout or paint per frame.
- Two identical copies make the loop seamless.
- The strip has a fixed height (no CLS).
- It pauses on hover.
- With `prefers-reduced-motion` it stops and the duplicate copy is hidden.
- Measured cost: CLS 0 at 375/768/1440, and no long tasks attributable to it in the trace.

**Other animation.** CSS transitions and keyframes only (menus, drawer, accordion, button hover). There's no animation library, so the JS cost is 0 KiB.

**Rendering.** The page is statically prerendered (`○ /` in the build output) and served from Vercel's CDN, which is what keeps TTFB low. Only `POST /api/lead` runs as a function.

## Notes on measurement
- **Localhost baseline** (production build, same Lighthouse settings; *not* the reported figures):
  - Mobile: Performance 99–100, A11y 100, Best Practices 96 → 100 after the CSP fix below, SEO 100. LCP 0.9 s, CLS 0, TBT 90 ms, FCP 0.9 s.
  - Desktop: 100 across the board.
- **One outlier (localhost).** The very first local mobile run after a server restart scored 69, with a single 3.1 s "unattributable" task. The raw trace showed only ~320 ms of real main-thread work, and the next runs scored 99–100. That's why I report the median of three runs, not a single run.
- **Best Practices fix.** The first run flagged a console CSP violation: zod's `new Function` probe. I turned it off with `z.config({ jitless: true })`.

## What I'd optimise next
1. **Fonts (largest asset group).** Drop the Inter italic file unless it's actually used, and preload only the weights used above the fold. That saves an estimated 80–100 KiB.
2. **Unused JS (~108 KiB flagged by Lighthouse).** Load the Radix Select and libphonenumber code only when the form scrolls into view (`next/dynamic` + an IntersectionObserver), and the mobile drawer only below 1200px.
3. **Legacy JS polyfills (~14 KiB flagged).** Set a modern `browserslist` target.
4. **Real-user monitoring.** Add Vercel Speed Insights to track field Core Web Vitals, not just lab runs.
