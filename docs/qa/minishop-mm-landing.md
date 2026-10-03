# MiniShop MM landing acceptance

Implementation brief: `minishop-mm-landing`. Issue: #185.
Base: `c0ec4a90ec961f66a4e23600788a504241f15906`.
Verification date: 2026-10-04 (Yangon).

## Content boundaries

| Landing content | Current implementation source |
| --- | --- |
| Five themes: Clean & Minimal, Street & Bold, Soft & Elegant, Grid & Catalog, Dark Modern | `src/domain/theme.ts` |
| Draft, preview, publish | `src/domain/storeDesign/`, `src/features/shop/storeBuilder/`, `src/features/shop/pages/LifecycleStoreBuilder.tsx` |
| Pricing, orders and total product limits | `src/domain/subscription.ts`, `src/domain/entitlement.ts`, `CONTEXT.md`, ADR 0002 |
| Signup and plan destinations | `src/features/landing/pricing.ts`, existing auth routes |
| COD, KBZPay, WavePay and manual transfer verification | Checkout, payment-account settings, last-five transaction digit flow |
| Township fees and delivery configuration | Shipping settings and buyer checkout |
| Products, stock, order management | Catalog and Orders seller pages |
| Seller workspace visual language and order status labels | AdminLayout and Orders UI |

Product previews are compact illustrative renditions using the real domain theme
palette/layout families and existing demo merchandise images. The hero order,
product/status cards and seller workspace numbers are sample UI data, not merchant
statistics or platform metrics. The seller preview is an illustration of the
Orders workspace, not a screenshot of an authenticated merchant.

The landing builder is an explicitly unsaved interactive example. Theme, store
name and hero heading update its preview; Products, Delivery and Payments explain
where those real settings are managed. It never writes a Draft or publishes a
shop. The authenticated Store Builder remains unchanged.

No roadmap integrations, automated customer-payment settlement, unsupported plan
benefits, customer counts, reviews or testimonials are advertised. Existing
platform public About/Contact/Privacy/Terms routes are absent, so footer links use
actual product sections, FAQ, Demo, login and signup destinations. Merchant demo
policy routes are not misrepresented as MiniShop platform legal pages.

## Verification

- `npm run check`: PASS — TypeScript, ESLint, API typecheck, 754 tests and production build.
- Existing repository lint warnings: 228; no lint errors or new landing warnings.
- Local production build exercised in Chromium 134 through Playwright.
- 375, 390, 768, 1024 and 1440px: document width equals viewport width; exactly one
  h1; no broken loaded images. Full-page screenshots inspected along with hero
  screenshots on desktop and mobile.
- Mobile navigation opens, closes with Escape and returns focus to its toggle.
- Builder homepage heading edits update the preview; selecting Dark changes the
  preview theme. Changes do not persist.
- FAQ opens through keyboard Enter with correct `aria-expanded` state.
- Theme carousel is focusable for keyboard scrolling.
- Reduced-motion emulation: floating card computed animation is `none`.
- axe WCAG 2 A/AA and 2.1 AA scan: zero violations on the exercised landing state.
- Landing console: zero page/console errors; no external font requests.
- Create Store reaches the signup route with its subscription return destination.
- Demo route loads after code splitting. An unconfigured tenant route remains
  fail closed; no production tenant data was used.
- `git diff --check`: PASS.

## Performance and limits

- Ten responsive 240/480px WebP asset derivatives total approximately 184 KB;
  original demo images were 1–2 MB each and remain untouched.
- Hero images are eager; repeated below-fold imagery is lazy with fixed
  dimensions, bounded image containers and responsive `srcSet` selection.
- CSS provides motion; no new animation library is loaded by the landing.
- The main production JavaScript asset decreased from 1,161.94 KB / 294.89 KB gzip
  in the initial implementation build to 560.62 KB / 164.19 KB gzip after route
  splitting. These are local build asset sizes, not network-speed or Web Vitals
  guarantees. Vite still reports a >500 KB main-chunk warning.
- Product fonts retain the existing Google stylesheet but are requested only
  after entering a non-landing route. This environment blocks Google Fonts with
  `ERR_EMPTY_RESPONSE`; signup/demo route smoke still passes with system fallbacks.
- Signup smoke verifies routing/rendering, not a real account registration or
  paid-plan activation. No production DB migration or production deploy occurred.
- Mobile Safari and real Myanmar devices/network conditions were not exercised.

## Screenshots

[Desktop, 1440px](assets/minishop-mm-desktop.webp)

[Mobile, 390px](assets/minishop-mm-mobile.webp)
