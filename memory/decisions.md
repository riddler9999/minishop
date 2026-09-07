# Decisions — Mini TikTok Shop (SaaS)

_Append-only. Newest at top._

## 2026-09-03 — Milestone A: path-based storefront routing + reactive data gate

- **D19. Storefront routing is path-based `/s/:slug/...`, not slug-in-storage.**
  TikTok in-app WebView storage is ephemeral (localStorage/sessionStorage can
  be wiped), so a buyer reloading any page would lose the shop. The shop
  identity therefore lives in the URL path — a reload of `/s/uthuya/checkout`
  still knows the shop. Rejected the alternative (capture slug at `/s/:slug`,
  store it, redirect to root) precisely because it doesn't survive a deep-link
  reload. Root `/` stays the demo storefront (no slug) — least disruption.
- **D20. `store.ts`'s storefront `api` is a reactive `Proxy`**, replacing the
  frozen `const api = isSupabaseConfigured && getShopSlug()!=null ? liveApi :
  demoApi` (evaluated once at module load). The Proxy dispatches per property
  access on the *current* `getShopSlug()`, so (a) `setShopSlug()` from routing
  takes effect without a reload, and (b) SPA navigation between shops resolves
  the right backend each call. `adminApi` stays a plain unconditional
  re-export (D-admin-gate). `useLiveBackend` const → `isLiveBackend()` fn.
  **Hazard recorded**: never put `api.<method>` in a React dependency array —
  the get-trap returns a fresh function each access (would loop effects).
- **D21. Shop-relative navigation via `shopHref()` + `<ShopLink>` /
  `useShopNavigate()`**, NOT react-router relative Links. `ProductCard` renders
  at three route depths (`/`, `/products`, `/products/:id` "related"), so a
  bare relative `to` string would resolve differently per context. `shopHref()`
  is depth-independent (prefixes `/s/<slug>` when set, passthrough otherwise)
  and treats the path as opaque, so query strings pass through untouched. Admin
  and real-root links are intentionally left unscoped.
- **D22. Milestone A slug validation is format-only** (`isValidSlug`, mirrors
  the DB `shops_slug_format` constraint) → bad-format slug renders a bare
  `NotFound`. Real "shop not found" (DB lookup miss) 404 is deferred to
  Milestone B, when pages switch to `store.ts` and `resolveShop()` becomes
  reachable. Inner storefront routes were changed absolute→relative so the
  same `Storefront` mounts under both `/*` (root) and `/s/:slug/*` without
  react-router v7's "Absolute route path nested" error.

## 2026-09-03 — Seller auth: email/password, onboarding is a hard gate

- **D15. Seller auth = Supabase email/password**, not OTP/phone. No SMS
  provider is configured for this project and phone OTP costs money per
  send; email/password is zero-cost and sufficient for the current
  solo-founder / early-pilot stage. Revisit if onboarding friction from
  requiring an email turns out to matter (unlikely for TikTok sellers who
  already run a business account).
- **D16. Shop onboarding is a hard gate in `RequireAdmin`**, not a dismissible
  prompt — a session with no `shops` row is redirected to `/admin/onboarding`
  before it can reach any `/admin/*` page. Chosen because the admin console's
  entire reason to exist (once wired to the live backend) is to manage a real
  shop's data; letting a shop-less session "peek" at the dashboard (still
  showing demo data today) would be misleading rather than helpful. The
  onboarding page itself is exempt from `RequireAdmin` and self-guards
  instead, since `RequireAdmin` would otherwise redirect a shop-less session
  away from the one page that lets it stop being shop-less.
- **D17. Login and signup share one route/page** (`/admin/login`, a mode
  toggle) instead of a separate `/admin/signup` route. Kept the route surface
  small; nothing forces these to be separate pages until there's a reason
  (e.g. distinct marketing copy per route) to split them.
- **D18. Admin pages were NOT switched to the live backend this session.**
  Seller auth + onboarding stand alone as a complete, testable unit; wiring
  Dashboard/AdminProducts/AdminOrders to `adminApi` from `backend.ts` needs
  `store.ts`'s live-backend gate fixed first (it's currently keyed on a
  storefront shop slug that has nothing to do with the admin console's own
  session-based shop resolution) — tracked as its own TASKS.md item, not
  done here to avoid conflating two changes.

## 2026-09-03 — Frontend data layer: two shape deviations from the demo

- **D12. `backend.ts`'s `api`/`adminApi` cannot be a pixel-perfect match of
  `api.ts`'s shapes** — two spots where the already-committed schema (D4/D5)
  forces a difference:
  1. Order lookup by phone alone (`ordersByPhone(phone)`) would let anyone
     who knows/guesses a buyer's phone number see their entire order history
     at a shop. `lookup_order()` was already designed to require
     `(shop_slug, order_no, phone)` specifically to prevent that — so the
     live version takes `orderNo` as a second, practically-required
     argument (optional only to keep the type signature callable in
     `store.ts`'s demo/live union) and throws a clear error without it.
     Consequence: OrderLookup.tsx/OrderSuccess.tsx need an "Order နံပါတ်"
     field added before the storefront can be wired to this — tracked in
     tasks/TASKS.md, not done this session.
  2. `uploadSlip()` is a no-op — D6 already dropped slip upload for MVP; no
     storage table exists for it in `0001_init_saas.sql`.
- **D13. Feature flag (`store.ts`) is gated on shop-slug presence, not just
  `isSupabaseConfigured`.** Env vars alone (already set locally via
  `.env.local`) would otherwise flip every page to a backend that has no
  shop context yet and throws on every call. Pages keep importing `api.ts`
  directly until seller auth + `/s/<slug>` routing exist to supply that
  context — this session only built the switch, not the wiring.
- **D14. Validated `backend.ts` at the SQL/RLS level, not via an end-to-end
  JS client run.** This sandbox's egress proxy blocks arbitrary outbound
  calls to `*.supabase.co` (confirmed: direct `curl`/Node fetch both get a
  403 from the proxy); only the `mcp__Supabase__*` tools reach the project.
  Seeded a throwaway auth user + shop + product via `execute_sql`, then ran
  the same predicates/RPC calls `backend.ts` issues under simulated
  `anon`/`authenticated` roles (`set local role`, `request.jwt.claims`) — 12
  checks covering every method plus a cross-tenant negative test, all
  passed. Cleaned up via cascade delete on the auth user; project confirmed
  empty afterward.

## 2026-09-03 — Dedicated Supabase project + migration applied

- **D9. This app gets its own Supabase project**, not the shared production
  project `kjjexuhhrwzujgocfzd` referenced in `context/infrastructure.md`.
  New project: `Mini Tiktok Shop` (ref `fsxdnmnycizjkgstokze`,
  `ap-southeast-1`). Rationale: isolates blast radius (RLS bug, quota, or
  outage in this early-stage product can't touch other production workloads
  sharing that project) and keeps billing/usage attributable per product —
  consistent with D7's caution about the shared prod project.
- **D10. `0001_init_saas.sql` applied** to `fsxdnmnycizjkgstokze`. Table shapes
  matched the design 1:1 (verified via `generate_typescript_types`).
- **D11. Added `0002_harden_search_path.sql`** to fix the one real
  `get_advisors` finding (mutable `search_path` on `set_updated_at()`) —
  closes a minor function-hijacking vector on the trigger function. The
  anon-`SECURITY DEFINER` advisor findings on `place_order`/`lookup_order`
  are NOT bugs — they're the intended anon RPC surface (D4/D5) — left as-is.

## 2026-09-02 — Foundation architecture

- **D1. Storefront is the wedge, not a sale agent.** TikTok exposes no chat/bot
  API and no MM native checkout; the only lever is a frictionless off-video
  order page. Sale-agent auto-reply (owner's Messenger/Telegram projects) does
  not transfer to TikTok.
- **D2. Evolve the existing `mini-tiktok-shop` demo in place** rather than
  scaffolding a new folder — the React/Vite/Tailwind app + UI + domain model
  (`api.ts`, `orderStatus.ts`) are reused; only the data layer changes.
- **D3. Backend = Supabase** (Postgres + Auth + Storage + RLS). Multi-tenant via
  `shop_id` + RLS. Chosen for owner familiarity + existing infra.
- **D4. Anon buyers never write tables directly.** All order creation goes
  through the `place_order()` SECURITY DEFINER RPC, which re-prices server-side
  (no client-trusted totals) — mirrors the demo's server-side repricing intent.
- **D5. Payment verification is MANUAL for MVP (Path A).** Buyer types the last
  5 transaction digits; seller matches in-dashboard. Explicitly accepts the loss
  of a tech moat; auto-verification is a deferred Phase-2 premium feature.
- **D6. Drop slip upload for MVP.** In-app WebView file pickers are unreliable;
  last-5 text entry replaces it.
- **D7. Do NOT apply migrations to production Supabase without owner go.** Schema
  ships as repo files; applying is a separate confirmed step.
- **D8. Owner accepted the risk of skipping the Phase-0 discovery pilot** and
  proceeding to build. Validation risks (DM-deflection, audience bias) remain
  documented and open.
- **D9. Shop identity lives in the URL path (`/s/:slug/...`), not storage.**
  TikTok in-app WebView storage is ephemeral, so the slug must survive reloads —
  it's the source of truth (Milestone A).
- **D10. Storefront `api` is a reactive Proxy** (`lib/store.ts`), resolving the
  live-vs-demo backend per call on the current shop slug, not frozen at module
  load — so a slug set after load (and cross-shop SPA nav) takes effect without
  a reload (Milestone A/B).
- **D11. Shop-existence is confirmed in `ShopRoute` before mounting the
  storefront** (Milestone B), gated on `isLiveBackend()` so the demo/unconfigured
  path does zero lookups; a well-formed slug for a missing/inactive shop → 404
  instead of every page erroring. Inactive and nonexistent are indistinguishable
  (no extra disclosure).
- **D12. Order lookup requires phone + order number** everywhere (Milestone B),
  converging the demo UX with `lookup_order`'s anti-enumeration requirement;
  phone-only lookup is retired.
- **D13. Route-derived hooks (`useShopSlugParam`) live in `components/ShopLink.tsx`**,
  not `lib/shopContext.ts` — keeping shopContext framework-agnostic for the
  non-React data layer (`backend.ts`).
- **D14. Deferred to owner/live + Phase 2**: real Supabase RPC verification (RPC
  round-trips, cross-shop nav, shop-not-found) can't run in the sandbox (egress
  blocked); rate-limiting on `lookup_order`/`place_order` (order-no is a short
  token — brute-force theoretically possible without app-level throttling) is a
  Phase-2 hardening item, not introduced by Milestone B.
- **D15. (Milestone C) Product images are URL text, not uploads.** No storage
  bucket exists; the create/edit form takes newline-separated `http(s)` URLs.
  A real upload bucket (storage policy + CDN) is a deferred follow-up.
- **D16. (Milestone C) Manual payment confirm is a UI affordance, not new backend
  surface.** `orders.status` already has `checked`/`partial_checked` and RLS
  already lets the owner write status, so the confirm buttons just call the
  existing `updateOrderStatus` — no new RPC/method.
- **D17. (Milestone C) No migration for the seller-admin milestone.** Every column
  (`products.*`, `shipping_zones.*`, `orders.payment_ref_tail`) already existed in
  `0001_init_saas.sql` — verified before writing code.
- **D18. (Milestone C) Storefront shipping-fee consumption deferred to C.1.**
  Keep C scoped to letting the seller MANAGE zones; wiring `Checkout.tsx` to READ
  `shipping_zones` (so shown fee == charged fee) is a fast follow-up, called out
  as an owner-facing risk rather than silently bundled.
