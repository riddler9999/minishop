# Activity Log — mini-tiktok-shop

Append-only. Newest entries at the bottom. One dated section per day;
add bullets to today's section if it already exists.

## [2026-09-03]
- Replaced the old localStorage passcode demo gate with real Supabase Auth
  (email/password): rewrote `src/lib/adminAuth.tsx` around
  `supabase.auth`'s session + `onAuthStateChange`, exposing
  `signUp`/`signIn`/`signOut`.
- Added `src/lib/sellerShop.ts` (`getOwnShop`, `createOwnShop`) for the
  onboarding-time "does this user have a shop yet?" check, separate from
  `backend.ts`'s throwing `resolveOwnShopId()`.
- Added `src/pages/admin/Onboarding.tsx` (route `/admin/onboarding`): shop
  name → auto-slug, phone, default delivery fee; self-guards on session/shop
  state.
- Rewrote `src/pages/admin/Login.tsx` for email/password with a login/signup
  toggle, including the "check your email to confirm" case.
- Updated `App.tsx`'s `RequireAdmin` to gate on session AND shop existence
  (no session → `/admin/login`; session, no shop → `/admin/onboarding`).
- Updated `AdminLayout.tsx`'s logout to call real `signOut()`.
- Left Dashboard/AdminProducts/AdminOrders on the demo `lib/api.ts` on
  purpose — documented the `store.ts` gate issue that blocks switching them
  in `memory/MEMORY.md` ("Open item") and `tasks/TASKS.md`.
- Verified: `npm run lint` (tsc --noEmit) and `npm run build` clean;
  Playwright against the local dev server confirmed the route guards
  redirect correctly and the login form surfaces the expected
  "Supabase not configured" error (Supabase env unset in this sandbox).
- Fixed `store.ts`'s admin gate: `adminApi` is no longer keyed off the
  storefront's `useLiveBackend` (shop-slug) flag — it's now re-exported
  unconditionally from `backend.ts`, since `RequireAdmin` already proves a
  session + owned shop exist before any admin page renders. Storefront `api`
  export unchanged.
- Switched `Dashboard.tsx`, `AdminProducts.tsx`, `AdminOrders.tsx` to import
  `adminApi` from `lib/store` instead of `lib/api` — no method-shape changes
  needed, `backend.ts` already implements every method these pages call.
- Removed `AdminProducts.tsx`'s demo-only "Demo သို့ ပြန်" reset
  button/handler — `backend.ts`'s `resetProducts()` throws by design (no
  live equivalent), so it would have surfaced as an unhandled rejection
  against the live backend.
- Verified: `npm run lint` and `npm run build` clean; Playwright confirmed
  `/admin`, `/admin/onboarding`, `/admin/products` still redirect to
  `/admin/login` with no session post-switch.
- **Milestone A — storefront routing** (built with ECC agent team: architect
  blueprint → build → react/code reviewers):
  - Added `src/lib/slug.ts` (`isValidSlug`, mirrors DB slug constraint) and
    `src/components/ShopLink.tsx` (`<ShopLink>` + `useShopNavigate()`).
  - `App.tsx`: new `ShopRoute` for `/s/:slug/*` — sets shop slug from the URL
    (in render, so child fetch effects see it), resets on unmount, renders
    `NotFound` for a bad-format slug else `Storefront`. Inner storefront routes
    changed absolute→relative so `Storefront` mounts under both `/*` and
    `/s/:slug/*` (react-router v7 forbids nested absolute paths).
  - `shopContext.ts`: added `shopHref(path)` (prefixes `/s/<slug>` when set).
  - `store.ts`: storefront `api` is now a reactive `Proxy` (per-call backend
    resolution) instead of a frozen const; `useLiveBackend` → `isLiveBackend()`.
  - Swapped absolute `<Link>`/`navigate()` → `<ShopLink>`/`useShopNavigate()`
    in Layout, Home, Cart, Checkout, ProductDetail, OrderSuccess, ProductCard,
    CartDrawer, NotFound (admin/root links left unscoped; `nav(-1)` untouched).
  - Verified: `npm run lint` + `npm run build` clean; Playwright smoke 8/8
    (root demo unprefixed, `/s/testshop` renders + links prefixed, deep-link
    reload of `/s/testshop/products`, bad slug → 404, unknown path → 404,
    client nav keeps the slug, no uncaught page errors).
  - Reviewed by ECC `code-reviewer` (APPROVE) + `react-reviewer`; addressed
    findings in a follow-up:
    - code-reviewer MEDIUM: rewrote stale `store.ts` header comment; removed the
      duplicate `SLUG_RE` in `Onboarding.tsx` (now imports from `lib/slug.ts`).
    - react-reviewer HIGH: `shopHref('/')` no longer emits a trailing slash
      (`/s/<slug>` not `/s/<slug>/`) so the Home `NavLink end` active-state
      matches the canonical shop URL.
    - react-reviewer HIGH: replaced `ShopRoute`'s `useEffect`-cleanup slug reset
      (StrictMode double-invoke would null a just-mounted shop) with a symmetric
      render-phase clear in a new `RootStorefront` wrapper on the `path="*"`
      route.
    - react-reviewer MEDIUM: hardened the `store.ts` Proxy with
      `has`/`ownKeys`/`getOwnPropertyDescriptor` traps so enumeration/spread
      forwards to the active backend instead of the empty target.
    - Re-verified: lint + build clean; Playwright smoke **11/11** (added
      no-trailing-slash, Home-nav-active, and Proxy-enumeration checks).

## 2026-09-04 — Milestone B: buyer storefront on the live Supabase backend

- PR #139 (Milestone A) merged to `main`; branch restarted from `main` for B.
- Built with the ECC agent team: `code-architect` (blueprint) → implementation →
  `react-reviewer` + `code-reviewer` + `security-reviewer` (parallel gate).
- Buyer pages (Home/Products/ProductDetail/Checkout/OrderLookup/OrderSuccess/
  ProductCard) switched `lib/api` → `lib/store` (reactive Proxy → live backend
  when a shop slug is set). `useShopSlugParam()` added to fetch-effect deps for
  cross-shop re-fetch; `Products.fetchPage` got a stale-response `reqId` guard;
  Checkout/Products/Home effects use `alive` cleanup.
- `ShopRoute` (App.tsx): async shop-existence check (checking/ok/missing), gated
  on `isLiveBackend()`, with `isShopCached()` skipping the loader flicker on
  revisit; missing shop → chromed 404.
- Checkout: slip upload removed → required last-5-digit input (online methods) →
  `createOrder.paymentRefTail`. OrderLookup: phone + Order-no both required
  (aria-labelled; one-param link shows a hint). OrderSuccess: tracking link
  prefills `?phone=&orderNo=`. Layout footer copy updated.
- Reviews: security **clean**; code-reviewer **APPROVE**; react-reviewer 2 HIGH
  (a11y labels, effect cleanup) + 4 MEDIUM — ALL addressed. Plus escapeOrFilter
  backslash hardening (security LOW).
- Verified: `npm run lint` + `npm run build` clean; Playwright smoke **15/15**.
  Live Supabase path (RPCs, cross-shop nav, shop-not-found) owner-verified only —
  sandbox egress to `*.supabase.co` blocked.
- Brain updated: MEMORY (Milestone B section), decisions (D9–D14), STATUS, TASKS.

## 2026-09-04 — Milestone C: seller admin console

- PR #145 (Milestone B) merged; branch restarted from `main` for C.
- Built with the ECC agent team: `code-architect` (blueprint) → implementation →
  `database-reviewer` + `code-reviewer` + `react-reviewer` (parallel gate).
- Product CRUD: `adminApi.createProduct` + extended `updateProduct`; AdminProducts
  `EditModal`→`ProductModal(mode)` (create+edit, ~12 fields, images = URL textarea).
- Shipping zones: new `/admin/shipping` page + `list/create/update/delete
  ShippingZone` in backend.ts; AdminLayout nav + App route.
- Manual payment confirm: AdminOrders drawer surfaces `paymentRefTail` + amount
  with confirm buttons (pending→checked/partial, partial→checked) via existing
  `updateOrderStatus`; list-row last-5 chip; stale slip indicator removed.
- No migration (all columns already existed).
- Reviews: database-reviewer **clean**; code-reviewer 1 HIGH (arrival-date
  backdate on edit — fixed: create-only default); react-reviewer 2 HIGH
  (payment-confirm error handling + shipping a11y labels — fixed) + MEDIUMs
  (Yangon-local date, image-drop hint, shipping fetch alive-guard — fixed;
  modal dialog semantics + ESLint plugins — ticketed in TASKS).
- Verified: lint + build clean; Playwright smoke 7/7. Live admin CRUD
  owner-verified only (sandbox egress blocked).
- ⚠️ Surfaced C.1: Checkout shows static-table fee while place_order charges from
  shipping_zones — flagged to owner, ticketed.
- Brain updated: MEMORY (Milestone C), decisions (D15–D18), STATUS, TASKS.

## 2026-09-04 — C.1: Checkout reads shop shipping zones (fee parity)

- PR #150 (Milestone C) merged; branch restarted from `main` for C.1.
- `backend.ts`: storefront `api.shippingConfig()` → shop's `shipping_zones` +
  `default_delivery_fee` (anon read via `ship_public_read` RLS — verified allows
  active-shop select). Demo `api.ts` stub for type-compat.
- `Checkout.tsx`: live mode now computes the shown fee from the shop's zones
  (zone by region+township else defaultFee) — matches `place_order()` exactly,
  fixing the shown≠charged divergence C activated. Demo mode unchanged (static
  table). shippingConfig load error → visible error + retry (no silent default).
- Reviewed by ECC `code-reviewer`: fee-parity CLEAN (matches server logic); 1
  MEDIUM (swallowed load error → dead-end checkout) — fixed; 1 LOW (drift-safe
  state type via `Awaited<ReturnType>`) — applied.
- Verified: lint + build clean; Playwright smoke 15/15. Live fee path
  owner-verified only (sandbox egress blocked).
