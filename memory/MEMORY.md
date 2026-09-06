# MEMORY — Mini TikTok Shop (SaaS)

_Working memory. Read this first on every session before exploring._

## What this is

A **multi-tenant SaaS storefront for Myanmar TikTok sellers**, being built by
evolving the existing `mini-tiktok-shop` demo (a client-side, localStorage-only
prototype re-themed from the Uthuya store) into a real product with a Supabase
backend.

- **Wedge:** the storefront/mini-shop link a seller drops in their TikTok bio.
  On TikTok you cannot run in-app chat automation and (in Myanmar) there is no
  native checkout, so the seller's only lever is to move the buyer to a
  frictionless self-serve order page. The bio link opens **inside TikTok's
  in-app WebView** — the buyer does not leave the app.
- **NOT a sale agent.** TikTok gives no bot/messaging API (unlike Messenger/
  Telegram/Viber). Chat automation is out of scope for the TikTok surface.

## Validated / assumed signal

- Owner posted a demo video → **6 inbound inquiries** (3 day-1, 3 day-2).
  ⚠️ Inquirer profile (real sellers vs. N8N Masterclass students/followers)
  NOT yet disaggregated — **audience-bias risk is still open.**
- Owner chose to **take the risk and build** rather than run the Phase-0
  customer-discovery pilot first.

## Key product decisions

- **Payment verify = MANUAL (Path A).** Buyer enters the **last 5 digits** of
  the KBZPay/WavePay transaction (WebView-friendly — no slip file upload, which
  is unreliable in in-app browsers). Seller matches amount + last-5 in their
  dashboard. Slip upload is dropped for MVP.
  - Consequence: **no tech moat.** Auto-verification (notification ingestion)
    is deferred to Phase 2 as the premium/moat feature.
- Realistic payment path = **COD + manual transfer**. Payment-app deep-linking
  from the WebView is unreliable (⚠️ needs real-device validation).
- Moat is therefore **execution + localization + distribution + Burmese trust/
  support**, not defensible tech.

## Environment reality (WebView constraints — design around these)

| Constraint | Design response | Status |
|---|---|---|
| KBZPay/WavePay app deep-link often fails in WebView | manual transfer + last-5 entry | ⚠️ real-device test |
| localStorage/session ephemeral in WebView | server-side order lookup (RPC), not localStorage | ✅ designed |
| camera/gallery file picker flaky | no slip upload; text field only | ✅ designed |
| "open in external browser" needs manual taps | everything must work inside the WebView | known |

## Backend — LIVE on its own dedicated Supabase project

- **Supabase project:** `Mini Tiktok Shop`, ref `fsxdnmnycizjkgstokze`,
  region `ap-southeast-1`, org `riddler9999's Org`. Created 2026-09-03,
  dedicated to this app — **not** the shared production project
  `kjjexuhhrwzujgocfzd` (that one is untouched by this work).
  - URL: `https://fsxdnmnycizjkgstokze.supabase.co`
  - Anon/publishable key: safe for client bundle (RLS enforces access) —
    stored in local `.env.local` (gitignored) and Vercel env, never in git.
- `supabase/migrations/0001_init_saas.sql`: tenants (`shops`) + `products`,
  `orders`, `order_items`, `payment_accounts`, `shipping_zones`; RLS on all;
  `place_order()` (anon write, server-side repricing) + `lookup_order()` (anon
  buyer lookup) RPCs. **Applied.**
- `supabase/migrations/0002_harden_search_path.sql`: pins `search_path` on
  `set_updated_at()` — closes the mutable-search_path advisory warning.
  **Applied.**
- `get_advisors(security)` post-migration: clean except the anon/authenticated
  `SECURITY DEFINER` findings on `place_order`/`lookup_order`, which are
  intentional (D4/D5) — those two RPCs are the only anon write/read paths by
  design. (`rls_auto_enable` finding is a Supabase platform function, not ours
  — ignore.)
- `src/lib/database.types.ts`: generated from the live schema
  (`generate_typescript_types`). Regenerate after every future migration.
- `src/lib/supabase.ts`: env-driven browser client, now typed as
  `SupabaseClient<Database>` (public anon key only).
- Any future schema change → add a new `supabase/migrations/NNNN_*.sql` file
  AND apply it via `mcp__Supabase__apply_migration` against
  `fsxdnmnycizjkgstokze` AND regenerate `database.types.ts` — keep all three
  in sync.

## Domain model carried over from the demo (keep the shapes)

- Product fields: see `src/lib/api.ts` `Product` interface.
- Order statuses: `src/lib/orderStatus.ts` (`cod_pending`, `pending_payment`,
  `partial_checked`, `checked`, `shipped`, `completed`, `cancelled`).
- Payment methods: `cod` | `kpay` | `wave`.

## Frontend data layer (built this session)

- `src/lib/shopContext.ts`: module-level `setShopSlug()`/`getShopSlug()` —
  which shop `backend.ts`'s storefront functions query. Unset by default
  (returns `null`) until `/s/<slug>` routing exists to set it per request.
- `src/lib/backend.ts`: the Supabase-backed `api`/`adminApi`, shaped to match
  `src/lib/api.ts` (the demo) so pages can switch with a minimal import
  change. Reuses `api.ts`'s type interfaces directly (`import type {...}`) —
  do not duplicate them.
  - Storefront (`api`): resolves the shop via slug (cached in-memory per
    slug), then scopes every products/categories/payment_accounts query by
    `shop_id`. `createOrder` calls the `place_order` RPC; new optional
    `paymentRefTail` field on the order body maps to `p_payment_ref_tail`
    (not yet surfaced in Checkout.tsx — TASKS.md).
  - Admin (`adminApi`): resolves the seller's own shop via
    `auth.getUser()` → `shops.owner_id = auth.uid()` (RLS-enforced), cached
    per browser session. Every method throws a clear error until seller auth
    exists (expected — not a bug).
  - **Two shapes deliberately diverge from the demo** (both forced by the
    already-committed schema, not new decisions — see D12):
    1. `ordersByPhone(phone, orderNo)` takes a second, effectively-required
       arg — `lookup_order()` needs `(shop_slug, order_no, phone)` to avoid
       enumerating a buyer's full order history from the phone number alone.
       Omitting `orderNo` throws a clear message instead of guessing.
    2. `uploadSlip()` is a no-op (D6 already dropped slip upload for the
       last-5-digit flow; no storage table exists for it).
    3. `resetProducts()` throws — demo-only affordance, no live equivalent.
- `src/lib/store.ts`: the feature-flag switcher
  (`isSupabaseConfigured && getShopSlug() != null ? backend.ts : api.ts`).
  Deliberately gated on shop-slug presence too, not just env config — so
  setting `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` alone (already true
  locally via `.env.local`) can't switch a deploy to a backend that has no
  shop context yet and would just throw on every call.
  **Pages have NOT been switched to import from `store.ts` yet** — still on
  `api.ts` directly. That switch is bundled into the "seller side"/"buyer
  storefront" TASKS.md items (auth + `/s/<slug>` routing land first, since
  they're what actually supplies working shop/session context).
- **Validated** (network egress to `*.supabase.co` is blocked from this
  sandbox for ad-hoc scripts — the `mcp__Supabase__execute_sql` tool is the
  only channel that reaches it) by seeding a throwaway auth user + shop +
  product directly via SQL, then running the exact same queries/RPCs
  `backend.ts` issues under `set local role anon` / `authenticated` +
  `request.jwt.claims` to simulate real RLS context: all storefront reads,
  `place_order`, `lookup_order` (success + anti-enumeration rejection),
  owner CRUD, and a negative cross-tenant-isolation check (a different
  `auth.uid()` sees/modifies nothing) — 12/12 passed. Cleaned up via cascade
  delete on the throwaway `auth.users` row; project confirmed empty after.

## Seller auth (built this session)

- **Real Supabase Auth replaces the old localStorage passcode demo gate.**
  `src/lib/adminAuth.tsx`: `AdminAuthProvider` mirrors `supabase.auth`'s
  session into React state (`getSession()` on mount +
  `onAuthStateChange` subscription); exposes `signUp`/`signIn`/`signOut`.
  Email/password only for now (no OTP/magic-link — simplest reliable option,
  no SMS provider to configure).
  - `signUp` reports `needsEmailConfirmation: !data.session` so the login
    page can tell the seller to check their inbox when the Supabase project
    has "Confirm email" enabled (default) — untested against the live
    project's actual setting from this sandbox; verify on first real signup.
  - Auth errors are mapped to Burmese in `mapAuthError()` (invalid
    credentials, already-registered, short password, bad email format, rate
    limit); anything unmapped falls through as the raw Supabase message.
- **`src/lib/sellerShop.ts` (new)**: `getOwnShop(userId)` (returns the shop
  row or `null` — not an error) and `createOwnShop(userId, input)` (inserts
  into `shops`, `owner_id = userId`; maps the `23505` unique-violation on
  `slug` and the `shops_slug_format` check-constraint violation to Burmese
  errors). Deliberately separate from `backend.ts`'s `resolveOwnShopId()`,
  which throws when no shop exists — right for admin pages that assume a
  shop, wrong for the onboarding-time "does one exist yet?" check.
- **`src/pages/admin/Onboarding.tsx` (new, route `/admin/onboarding`)**: shop
  name → auto-slug (editable once touched), phone (optional), default
  delivery fee. Client-side slug validation mirrors the DB check constraint
  (`^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$`) so a bad slug fails fast instead of
  round-tripping to Postgres. Self-guards: redirects to `/admin/login` with no
  session, to `/admin` if a shop already exists (checked via `getOwnShop` on
  mount) — reachable directly at the URL, not only via the route guard below.
- **`App.tsx`'s `RequireAdmin`** now gates on session AND shop existence, not
  just a boolean flag: no session → `/admin/login` (preserves `state:{from}`
  for post-login redirect, unchanged from the old gate); session but
  `getOwnShop()` returns null → `/admin/onboarding`; both present → renders
  `<AdminLayout />`. Shop existence is re-checked on every `user` change
  (covers login → the guard runs fresh, not just once at app boot).
- **`src/pages/admin/Login.tsx`** rewritten: email + password fields, a
  login/signup mode toggle (no separate route — keeps the guard surface
  small), shows a "Supabase not configured" notice when
  `isSupabaseConfigured` is false instead of failing silently.
- **`AdminLayout.tsx`**: logout button now calls the real `signOut()`
  (fire-and-forget — `RequireAdmin` reacts to the session going null via the
  `onAuthStateChange` subscription and redirects on its own; no manual
  `navigate()` needed).
- **Validation done this session**: `npm run lint` (tsc --noEmit) and
  `npm run build` both clean. Playwright against the local dev server
  (Supabase unconfigured here — same sandbox egress block as D14) confirmed:
  `/admin` and `/admin/onboarding` redirect to `/admin/login` with no
  session; submitting the login form calls `signIn` and correctly surfaces
  the "Supabase is not configured" error. **Not verified**: an actual
  signup/login/onboarding round-trip against the live `fsxdnmnycizjkgstokze`
  project (needs a real browser with `.env.local` set — outside this
  sandbox's reach).

### `store.ts`'s admin gate — fixed, admin pages now wired to the live backend

`src/lib/store.ts` previously picked `adminApi` off the same
`useLiveBackend = isSupabaseConfigured && getShopSlug() != null` flag as the
storefront `api`. Wrong for admin: an authenticated seller with a shop has no
"current storefront slug" set (`adminApi` resolves the shop via `auth.uid()`,
not a slug), so a real seller session would have silently fallen back to the
localStorage demo admin API instead of their live shop data the moment they
opened the console without ever having visited a `/s/<slug>` page first.

**Fix**: `adminApi` is no longer gated at all — `store.ts` now re-exports it
straight from `backend.ts`, unconditionally. This is safe because
`App.tsx`'s `RequireAdmin` already proves, before any admin page renders,
that a real Supabase session AND an owned shop both exist (see
`adminAuth.tsx` / `sellerShop.ts`) — those preconditions make
`isSupabaseConfigured` true and the demo fallback unreachable anyway. There
is nothing left to gate. The storefront `api` export is untouched (still
correctly gated on the shop slug, since `/s/<slug>` routing doesn't exist
yet).

**Admin pages switched**: `Dashboard.tsx`, `AdminProducts.tsx`,
`AdminOrders.tsx` now `import {adminApi, ...} from '../../lib/store'`
instead of `'../../lib/api'` (types re-exported unchanged). No method-shape
changes needed — `backend.ts`'s `adminApi` already implements every method
these pages call (`listProducts`, `updateProduct`, `listOrders`,
`updateOrderStatus`, `deleteOrder`) with identical signatures to the demo.

**Also removed**: `AdminProducts.tsx`'s "Demo သို့ ပြန်" (reset to demo)
button/handler. It called `adminApi.resetProducts()`, which `backend.ts`
deliberately implements as a throw (D-noted in `backend.ts`'s header — no
live equivalent to "reset to demo state" for a real seller's shop). With the
live backend now wired in, clicking it would throw an unhandled rejection
with no user-facing message. The affordance only ever made sense against the
localStorage demo, so it's gone rather than wrapped in a try/catch — nothing
of equivalent meaning exists to show the seller.

**Verified**: `npm run lint` (tsc) and `npm run build` clean. Playwright
against the local dev server (Supabase still unconfigured in this sandbox —
same egress restriction as D14/D15) confirmed `/admin`, `/admin/onboarding`,
and `/admin/products` all still redirect to `/admin/login` with no session —
the import swap didn't disturb `RequireAdmin`'s guard or break the bundle.
Real live-backend CRUD (list/update products & orders against
`fsxdnmnycizjkgstokze`) still needs a real browser with `.env.local` set —
not reachable from this sandbox.

**Known follow-on, not fixed here**: `useLiveBackend` (the storefront flag)
is a module-level `const` evaluated once at first import, from
`getShopSlug()`'s value at that moment. Fine today since nothing calls
`setShopSlug()` yet. Once `/s/<slug>` routing lands, a client-side
navigation from one shop's storefront to another's (no full page reload,
since this is an SPA) would NOT re-evaluate this constant — the storefront
`api` binding would stay stuck on whichever shop's slug was set first.
Whoever builds that routing needs to make the storefront gate reactive
(e.g. read `getShopSlug()` inside each call site / a small wrapper, not once
at module load) rather than a frozen top-level constant.

## Milestone A — storefront routing (built this session)

- **Path-based `/s/:slug/...` routing is live** (D19). Shop identity lives in
  the URL (WebView storage is ephemeral), so deep-link reloads keep the shop.
  Root `/` = demo storefront (no slug), unchanged.
- **New files:** `src/lib/slug.ts` (`SLUG_RE` + `isValidSlug`, mirrors the DB
  `shops_slug_format` constraint) and `src/components/ShopLink.tsx`
  (`<ShopLink>` Link-wrapper + `useShopNavigate()` hook, both via `shopHref`).
- **`App.tsx`**: `ShopRoute` handles `/s/:slug/*` — `setShopSlug(slug)` is
  called *in render* (not an effect) so descendant pages' first data-fetch
  effects see the slug (effects fire child→parent; a parent effect would run
  too late). Bad-format slug → bare `NotFound`. The slug is **cleared
  symmetrically in render by `RootStorefront`** (the `path="*"` root demo
  branch), NOT via an effect cleanup — a `useEffect` cleanup reset gets
  double-invoked by StrictMode on mount and would null a just-mounted shop's
  slug (react-reviewer HIGH). Each storefront entry setting its own value in
  render is StrictMode-safe (idempotent) and clears stale slugs on any
  shop→root transition.
  `Storefront`'s inner `<Routes>` child paths are now RELATIVE (`index`,
  `products`, …) so the same component mounts under both `/*` and `/s/:slug/*`
  (react-router v7 throws on nested absolute paths).
- **`shopContext.ts`**: `shopHref(path)` prefixes `/s/<slug>` when a slug is
  set, passthrough otherwise; path is opaque so query strings survive.
- **`store.ts`**: storefront `api` is a **reactive `Proxy`** (D20) — resolves
  live-vs-demo per call on the current `getShopSlug()`, not frozen at module
  load. `adminApi` still unconditional. `useLiveBackend` const →
  `isLiveBackend()` fn. ⚠️ **Never put `api.<method>` in a React dep array**
  (get-trap returns a fresh fn each access → effect loop).
- **Shop-relative nav (D21)**: absolute `<Link>`/`navigate()` in Layout, Home,
  Cart, Checkout, ProductDetail, OrderSuccess, ProductCard, CartDrawer,
  NotFound swapped to `<ShopLink>`/`useShopNavigate()`. Admin/root links left
  unscoped; ProductDetail's `nav(-1)` (history back) left on plain
  `useNavigate`.
- **Verified**: `npm run lint` (tsc) + `npm run build` clean; Playwright smoke
  8/8 against the local dev server (root unprefixed, `/s/testshop` renders +
  links prefixed, deep-link reload of `/s/testshop/products`, bad slug → 404,
  unknown path → 404, client nav keeps the slug, no uncaught page errors).
  Supabase unconfigured in this sandbox, so the reactive Proxy exercised the
  demo path — the live path still needs a real browser with `.env.local`.
- **Milestone B — DONE** (see the "Milestone B" section below): buyer pages now
  import from `lib/store.ts`; real shop-not-found 404, Checkout last-5 field, and
  OrderLookup order-no field are built.
- **Agents in this remote env:** the ECC plugin can't load in cloud sessions
  (SKIP_PLUGIN_MARKETPLACE), so a curated 27-agent subset from
  github.com/affaan-m/ECC v2.2.1 (MIT) is vendored at `.claude/agents/ecc/`
  (auto-discovered). This Milestone was built via that team
  (`code-architect` → build → `react-reviewer`/`code-reviewer`).

## Milestone B — buyer storefront on the live backend

Built on a branch restarted from `main` after PR #139 (Milestone A) merged.

- **Buyer pages switched `lib/api` → `lib/store`**: Home, Products,
  ProductDetail, Checkout, OrderLookup, OrderSuccess, ProductCard. Only
  `data/products.ts` (the demo catalog source) stays on `lib/api`. So the
  reactive Proxy now actually serves live Supabase data once a shop slug is set.
- **Cross-shop re-fetch**: `useShopSlugParam()` (a route-derived hook — lives in
  `components/ShopLink.tsx` alongside `useShopNavigate`, NOT in the
  framework-agnostic `lib/shopContext.ts`) is added to each page's fetch-effect
  deps so a client-side shop switch re-queries. `Products.fetchPage` also guards
  out-of-order responses with a `reqIdRef`; Checkout/Products/Home effects all
  use the `alive` cleanup pattern.
- **Real shop-not-found 404**: `ShopRoute` (App.tsx) now confirms the shop
  EXISTS via `resolveShop()` before mounting the storefront — a 3-state machine
  (`checking`/`ok`/`missing`) gated on `isLiveBackend()` (zero lookup when
  Supabase unconfigured or on the demo root). `isShopCached(slug)` (new, exported
  from backend.ts) skips the `checking` flip on a revisit to avoid a remount
  flicker. Missing shop → `<Layout><NotFound/></Layout>` (chromed); bad-format
  slug stays bare (Milestone A).
- **Checkout**: slip upload removed entirely; replaced by a required last-5-digit
  numeric input shown only for online methods (digit-sanitized, `maxLength=5`),
  wired to `createOrder`'s `paymentRefTail` → `p_payment_ref_tail`. COD path
  unchanged. Server re-prices — the client never sends totals (security-reviewer
  confirmed).
- **OrderLookup**: now requires BOTH phone + Order နံပါတ် (→ `lookup_order`;
  phone-only retired for anti-enumeration). Inputs have `aria-label`s; a
  one-param-only link shows a hint instead of silently doing nothing.
- **OrderSuccess**: tracking link prefills `?phone=&orderNo=`.
- **Verified**: `npm run lint` + `npm run build` clean; Playwright smoke 15/15
  (routing regression, checkout last-5 UX, slip-gone, order-no gate, aria-labels,
  phone-only hint, no page errors). Reviewed by ECC `react-reviewer` +
  `code-reviewer` + `security-reviewer` — all findings addressed (2 HIGH: a11y
  labels, effect cleanup guards; MEDIUMs: cache-hit flicker, hook location,
  stale-response guard, one-param hint; security: escapeOrFilter backslash
  hardening). **Live path (real Supabase RPCs, cross-shop nav, shop-not-found)
  is owner-verified only — sandbox egress to `*.supabase.co` is blocked.**

## Milestone C — seller admin console

Built on a branch restarted from `main` after PR #145 (Milestone B) merged.

- **Product CRUD**: `adminApi.createProduct(input)` (new) inserts into `products`
  (`shop_id = resolveOwnShopId()`, defaults for stock/status/images/description);
  `updateProduct` extended to patch name/itemCode/category/color/size/images/
  description/arrivalDate (was price/promo/stock/status only). `AdminProducts.tsx`:
  `EditModal` → **`ProductModal({mode})`** covering both create + edit (~12 fields).
- **Images = URL text, no upload**: no storage bucket exists; the form takes a
  newline textarea, filtered to `http(s)://` lines. Bucket + real upload is a
  ticketed follow-up (TASKS.md).
- **Shipping zones**: `list/create/update/delete ShippingZone` on `adminApi`
  (types in `backend.ts`), new page `AdminShipping.tsx` at `/admin/shipping`
  (+ AdminLayout nav). Add-zone prefills the fee suggestion from
  `data/locations.ts` but the seller sets the real value; `unique(shop_id,region,
  township)` 23505 → Burmese error.
- **Manual payment confirm**: `AdminOrders.tsx` order drawer shows a section
  (online orders only) with the buyer's `paymentRefTail` (last-5) + amount, and
  confirm buttons — `pending_payment`→`checked` ("ငွေအပြည့်ရပြီ") / →`partial_checked`
  ("စရံသာ ရပြီ"), `partial_checked`→`checked` ("ကျန်ငွေ ရပြီ") — all via the
  existing `updateOrderStatus` (no new backend method). List-row shows a last-5
  chip for pending/partial orders. `listOrders` now maps `paymentRefTail`.
- **No migration**: every column already existed in `0001_init_saas.sql`.
- **Review fixes applied**: code-reviewer HIGH — the arrival-date default now
  only applies in CREATE mode (edit no longer silently backdates a null-arrival
  product to today). react-reviewer HIGH — `AdminOrders.changeStatus`/`remove`
  now try/catch with rollback + a visible error (the payment-confirm buttons
  depend on it); `AdminShipping` form controls got `aria-label`s. MEDIUM —
  create's date default uses Asia/Yangon local (not UTC), an image-drop hint, and
  an `alive` guard on the shipping fetch. Deferred to TASKS: modal dialog
  semantics/focus-trap, ESLint plugins, `promo_price<price` DB CHECK.
- **⚠️ Checkout fee mismatch (C.1 follow-up)**: `Checkout.tsx` SHOWS the fee from
  static `data/locations.ts`, but `place_order()` CHARGES from `shipping_zones`
  (fallback `shops.default_delivery_fee`). Pre-existing in the schema/RPC, but
  Milestone C *activates* it — once a seller adds a zone row, shown vs charged fee
  can diverge. Wire Checkout to read the shop's zones next (public read allowed by
  `ship_public_read`). Flagged to owner.
- **Verified**: lint + build clean; Playwright smoke 7/7 (admin routes incl
  `/admin/shipping` guarded, storefront regression, no page errors). Live admin
  CRUD is owner-verified only (sandbox egress blocked). Built with the ECC team
  (`code-architect` → build → `database`/`code`/`react` reviewers).

## Open risks (carry forward)

1. **DM-deflection assumption** — will MM TikTok buyers self-serve, or DM anyway
   to negotiate/ask/trust? Whole value prop rests on this. Unvalidated.
2. **Audience bias** — moat is distribution, but the audience may be automation
   students, not sellers.
3. **Thin tech moat** — free Facebook Page is the real competitor to beat.
4. **WebView payment/upload behavior** — needs real-device test matrix.
