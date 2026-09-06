# STATUS — Mini TikTok Shop (SaaS)

**Phase:** Phase 1 — Foundation. **Milestones A (routing) + B (buyer storefront
on live backend) + C (seller admin) + C.1 (checkout fee parity) all built.**
Remaining before pilot: **live owner verification** (env vars + real browser).
**Branch:** `claude/mini-tiktok-shop-plan-cvcdrn` (restarted from `main` after
PR #150 merged — Milestones A + B + C are now in `main`; C.1 is PR #152)
**Last updated:** 2026-09-04

## Done
- **Milestone C — seller admin console** — see memory/MEMORY.md "Milestone C" +
  decisions.md D15–D18. Product CRUD (create/edit/hide) via `adminApi.createProduct`
  + extended `updateProduct` + `ProductModal(mode)` (~12 fields, images = URL
  textarea — no bucket yet); shipping-zone management (new `/admin/shipping` +
  4 `backend.ts` zone methods); order dashboard **manual payment confirm**
  (AdminOrders surfaces `paymentRefTail` + amount, confirm buttons via
  `updateOrderStatus`, list-row last-5 chip). No migration (all columns existed).
  Verified: lint + build clean, Playwright smoke 7/7 (admin routes incl
  `/admin/shipping` guarded; storefront regression intact). Reviewed by ECC
  `database-reviewer` (clean) + `code-reviewer` (1 HIGH: arrival-date backdate —
  fixed) + `react-reviewer` (2 HIGH: payment-confirm error handling + shipping
  a11y labels — fixed; MEDIUMs actioned or ticketed). Live admin CRUD is
  owner-verified only (sandbox egress blocked).
- **C.1 — checkout fee parity (PR #152)** — `backend.ts api.shippingConfig()`
  (anon read via `ship_public_read`) + `Checkout.tsx` computes the live fee from
  the shop's `shipping_zones` (zone by region+township else default), matching
  `place_order()` exactly — shown fee == charged fee. Stale-config cleared on
  cross-shop nav; load failure → error + retry (no silent default). Demo mode
  unchanged. Reviewed by ECC `code-reviewer` (fee-parity clean; MEDIUM/LOW fixed)
  + Codex bot (P1 stale-fee-on-slug-change fixed). Verified lint/build + smoke
  15/15; live path owner-verified only.
- **Milestone B — buyer storefront on the live Supabase backend** — see
  memory/MEMORY.md "Milestone B". Buyer pages (Home/Products/ProductDetail/
  Checkout/OrderLookup/OrderSuccess/ProductCard) switched from demo `lib/api` to
  the reactive `lib/store` Proxy; `useShopSlugParam()` added to fetch-effect deps
  for cross-shop re-fetch. `ShopRoute` gained an async shop-existence check
  (`resolveShop()`, gated on `isLiveBackend()`) → loader / chromed-404 / mount.
  Checkout: slip upload removed, replaced by a required last-5-digit input (online
  methods) → `createOrder`'s `paymentRefTail`. OrderLookup: order-number field
  added (phone + order-no both required → `lookup_order`); OrderSuccess tracking
  link prefills `?phone=&orderNo=`. Layout footer copy updated. Verified: lint +
  build clean, Playwright smoke 13/13. Live RPC round-trips are owner-verified
  only (sandbox egress to `*.supabase.co` blocked). Reviewed by ECC
  `react-reviewer` + `code-reviewer` + `security-reviewer`.
- **Milestone A — storefront routing (`/s/:slug/...`)** — see memory/MEMORY.md
  "Milestone A" + decisions.md D19–D22. Path-based multi-tenant routing (URL is
  the shop source of truth — WebView storage is ephemeral); `ShopRoute` +
  `shopHref()` + `<ShopLink>`/`useShopNavigate()`; `store.ts` storefront `api`
  is now a reactive Proxy (per-call backend resolution, no longer frozen at
  module load). 9 pages/components switched to shop-scoped nav; root `/` = demo
  unchanged. `npm run lint`/`build` clean; Playwright smoke 8/8 (deep-link
  reload, bad/unknown slug → 404, client nav keeps slug, no page errors). Built
  with the vendored ECC agent team (architect → build → react/code reviewers).
  Pages don't import from `store.ts` yet — that's Milestone B.
- **`store.ts` admin gate fixed + admin console wired to the live backend** —
  see memory/MEMORY.md "`store.ts`'s admin gate" section. Summary:
  - `src/lib/store.ts`: `adminApi` no longer gated behind the storefront's
    `useLiveBackend` (shop-slug) flag — it's re-exported unconditionally from
    `backend.ts`, since `RequireAdmin` already proves session+shop exist
    before any admin page renders. Storefront `api` export unchanged.
  - `Dashboard.tsx` / `AdminProducts.tsx` / `AdminOrders.tsx` now import
    `adminApi` from `lib/store` instead of `lib/api` — real Supabase data,
    no method-shape changes needed.
  - Removed `AdminProducts.tsx`'s demo-only "Demo သို့ ပြန်" reset button
    (would throw against the live backend by design — no live equivalent).
  - `npm run lint` / `npm run build` clean. Playwright confirmed the
    `/admin*` → `/admin/login` guard still works post-switch (same sandbox
    egress restriction as before — real CRUD against the live project needs
    a real browser + `.env.local`).
- **Seller auth (real Supabase Auth) + shop onboarding** — see memory/MEMORY.md
  "Seller auth" section for full detail. Summary:
  - `src/lib/adminAuth.tsx` rewritten from the old localStorage passcode demo
    gate to real Supabase email/password auth (`signUp`/`signIn`/`signOut`,
    session mirrored via `onAuthStateChange`).
  - `src/lib/sellerShop.ts` (new): `getOwnShop()` / `createOwnShop()` — the
    onboarding-time shop lookup/creation, kept separate from `backend.ts`'s
    `resolveOwnShopId()` (which intentionally throws when no shop exists yet;
    onboarding needs the non-throwing "does one exist?" check instead).
  - `src/pages/admin/Login.tsx` rewritten: email/password with a login/signup
    toggle, handles the email-confirmation-required case.
  - `src/pages/admin/Onboarding.tsx` (new, route `/admin/onboarding`): shop
    creation form (name → auto-slug, phone, default delivery fee), self-guards
    (redirects to login if no session, to dashboard if a shop already exists).
  - `App.tsx`'s `RequireAdmin` now checks session AND shop existence: no
    session → `/admin/login`; session but no shop → `/admin/onboarding`;
    both → renders the console.
  - `AdminLayout.tsx`'s logout now calls real `signOut()`.
  - Verified via Playwright against the local dev server (Supabase env
    unconfigured in this sandbox, same egress restriction as D14): `/admin`
    and `/admin/onboarding` correctly redirect to `/admin/login` with no
    session; submitting the login form surfaces the "Supabase not configured"
    error correctly (proves the signIn call path — real auth against the live
    project needs a real browser + `.env.local`, not testable from this
    sandbox). `npm run lint` (tsc) and `npm run build` both clean.
  - **Admin pages (Dashboard/AdminProducts/AdminOrders) still import
    `adminApi` from `lib/api.ts` (the demo/localStorage store), not
    `lib/store.ts`.** This is deliberate and unchanged from before this
    session — that switch is still its own TASKS.md item (needs `store.ts`'s
    live-backend gate reworked first — see MEMORY.md "Open item").
- **Frontend data layer**: `src/lib/shopContext.ts`, `src/lib/backend.ts`
  (Supabase-backed `api`/`adminApi`, shaped to match the demo `api.ts` with
  2 documented deviations — see memory/decisions.md D12), and
  `src/lib/store.ts` (feature-flag switcher). Validated against the live
  project at the SQL/RLS level (12/12 checks; see memory/MEMORY.md) — direct
  network access to `*.supabase.co` is blocked from this sandbox, so an
  end-to-end JS-client run wasn't possible here.
  **Pages still import `api.ts` directly** — not yet switched to `store.ts`;
  that lands with seller auth + `/s/<slug>` routing (next).
- Product direction validated interactively (storefront wedge; manual payment).
- Multi-tenant schema + RLS + `place_order`/`lookup_order` RPCs written
  (`supabase/migrations/0001_init_saas.sql`).
- Env-driven Supabase browser client (`src/lib/supabase.ts`) + `.env.example`.
- Project brain established (memory/decisions/status/tasks).
- **Dedicated Supabase project created for this app** (`Mini Tiktok Shop`,
  ref `fsxdnmnycizjkgstokze`, region `ap-southeast-1`) — separate from the
  shared production project `kjjexuhhrwzujgocfzd`. No shared-prod risk.
- `0001_init_saas.sql` applied to that project; `get_advisors` (security) run
  clean afterward except intentional anon-`SECURITY DEFINER` findings on
  `place_order`/`lookup_order` (by design — see D4/decisions.md).
- `0002_harden_search_path.sql` applied — pins `search_path` on
  `set_updated_at()` (closes the one real advisor finding: mutable
  search_path on a trigger function).
- `src/lib/database.types.ts` generated from the live schema; `supabase.ts`
  client is now typed (`SupabaseClient<Database>`).
- `.env.local` written locally (gitignored, not committed) with the real
  project URL + anon key for local dev.
- `npm run lint` (tsc --noEmit) clean.

## Not done / blockers
- **Live owner verification (blocker for pilot):** real order→lookup round-trip,
  cross-shop SPA nav, and shop-not-found 404 against `fsxdnmnycizjkgstokze` are
  NOT testable from this sandbox (egress to `*.supabase.co` blocked). Needs a
  real browser + `.env.local` + Vercel env vars.
- Vercel env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) + Root
  Directory not yet set — owner action before the live storefront works.

## Next action
1. **Owner live-verify A + B + C + C.1** on the deployed preview with env vars set:
   `/s/<real-slug>` renders live products; place a KBZPay/Wave order with last-5;
   track via phone + order-no; bogus slug → 404; **seller admin**: create/edit/
   hide a product, add a shipping zone, confirm an online order's payment via the
   last-5 match; **fee parity**: the fee shown at checkout matches the seller's
   zone fee (and what the order records).
2. Storage bucket + policy for shop logos + product images.
3. Real-device WebView test matrix (TikTok in-app browser).
