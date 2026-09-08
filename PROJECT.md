# Mini TikTok Shop (SaaS)

## Overview

A multi-tenant SaaS storefront for Myanmar TikTok sellers, evolved from a localStorage demo
into a real product on Supabase. The wedge is the mini-shop link a seller drops in their TikTok
bio: TikTok has no in-app chat automation and no native Myanmar checkout, so the seller's only
lever is moving the buyer to a frictionless self-serve order page that opens **inside TikTok's
in-app WebView**. **Not a sale agent** — TikTok exposes no bot/messaging API.

## Status

Blocked (owner live-verify) | Moe Htet | 2026-09-08

Milestones A (routing), B (buyer storefront on the live backend), C (seller admin) and C.1
(checkout fee parity) are all built. Pilot is blocked on live owner verification.

**Commercialization — merged (PR #190 code, #192 index sync):** TikTok-specific wording
generalized to channel-neutral "Mini Shop"; storefront now shows the tenant's own name/logo.
Added a frontend plan-gating layer (Starter vs Business), a seller Settings/branding page
(`/admin/settings`), and onboarding UX polish. typecheck + build green. NOT yet live-verified
(Supabase egress blocked from sandbox) — see Open Tasks.

## Stack

- React + Vite + TypeScript + Tailwind v4; Vercel (Root Directory must be `projects/personal/mini-tiktok-shop`)
- **Dedicated Supabase project** `Mini Tiktok Shop`, ref `fsxdnmnycizjkgstokze`, `ap-southeast-1` — deliberately NOT the shared production project `kjjexuhhrwzujgocfzd`
- Schema `supabase/migrations/0001_init_saas.sql`: `shops`, `products`, `orders`, `order_items`, `payment_accounts`, `shipping_zones`; RLS on all; `place_order()` (anon write, server-side repricing, atomic) and `lookup_order()` (anon buyer lookup) RPCs. `0002_harden_search_path.sql` pins `search_path` on `set_updated_at()`.
- Data layer: `src/lib/shopContext.ts` (module-level slug) · `src/lib/backend.ts` (Supabase `api`/`adminApi`; `resolveShop` also caches `name`/`logo_url` → `getCachedShopInfo()`) · `src/lib/store.ts` (the switcher — storefront `api` is a reactive Proxy, `adminApi` is an unconditional re-export, re-exports `getCachedShopInfo`) · `src/lib/api.ts` (demo/localStorage) · `src/lib/database.types.ts` (generated)
- Commercial layer: `src/lib/brand.ts` (product-neutral `APP_NAME`/initial) · `src/lib/plan.tsx` (`Plan`, `PlanFeatures`, `PlanProvider`/`usePlan`, `resolvePlan`) · `src/components/PlanGate.tsx` (badge + upsell UI) · `src/pages/admin/Settings.tsx` (`/admin/settings`) · `src/lib/sellerShop.ts` (`getOwnShop`/`updateOwnShop`, extended shop shape)
- Auth: real Supabase email/password (`src/lib/adminAuth.tsx`), onboarding at `/admin/onboarding`, `RequireAdmin` gates on session AND shop existence; admin console wrapped in `PlanProvider` (`AdminConsole` in `App.tsx`)
- Order statuses in `src/lib/orderStatus.ts`: `cod_pending`, `pending_payment`, `partial_checked`, `checked`, `shipped`, `completed`, `cancelled`. Payment methods: `cod` | `kpay` | `wave`.
- Env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (anon key only — RLS enforces access), `VITE_DEFAULT_PLAN` (`starter`|`business`, default `business` — deploy-wide plan default until `shops.plan` exists)

## Open Tasks

- [ ] **Owner live-verify A + B + C + C.1** on a deployed preview with env vars set: `/s/<real-slug>` renders live products; place a KBZPay/Wave order with the last-5; track via phone + order number; a bogus slug 404s; seller admin can create/edit/hide a product, add a shipping zone, and confirm an online order's payment by last-5 match; the fee shown at checkout matches the seller's zone fee and what the order records.
- [ ] **Owner** — set the Vercel env vars and Root Directory.
- [ ] **Owner live-verify plan gating** on a preview: deploy once with `VITE_DEFAULT_PLAN=starter`
  and once with `=business`. Starter must HIDE (Business must SHOW): shipping-zone nav, product
  Promotion controls, order last-5 payment-verify section, dashboard analytics panel, Settings
  logo field. Both plans keep name/phone/default-fee in Settings and a working storefront.
- [ ] Storage bucket + policy for shop logos and product images (images are URL text today).
- [ ] Real-device WebView test matrix in the TikTok in-app browser: checkout, last-5 entry, order lookup, payment-app deep-link behaviour.
- [ ] Pilot with 1 real seller (tests the DM-deflection assumption).
- [ ] `payment_accounts` self-serve admin so a seller sets their own KBZPay/Wave numbers.
- [ ] Admin modal/drawer a11y — `role="dialog"`, `aria-modal`, focus trap, Escape-to-close on `ProductModal`/`OrderDetail`.
- [ ] Add ESLint (`eslint-plugin-react-hooks` + `jsx-a11y`). `lint` is `tsc --noEmit` only, so hook and a11y regressions are not caught automatically.
- [ ] DB CHECK for `promo_price < price` when `is_promotion` — guarded client-side only today.
- [ ] **Backend** — add a `shops.plan` column (`text`, default `'starter'`, CHECK in
  (`starter`,`business`)), then append `plan` to `OWN_SHOP_COLUMNS` + `mapOwnShop()` in
  `src/lib/sellerShop.ts` and regenerate `database.types.ts`. This flips plan gating from the
  deploy-wide `VITE_DEFAULT_PLAN` default to per-tenant (see D23).
- [ ] **Backend** (later) — plan changes are an owner/billing action; no seller-facing plan
  toggle. A minimal admin/owner path to set a shop's plan is out of frontend scope.

**Explicitly NOT in v1:** auto payment verification (Phase 2 moat), AI/chatbot features, custom domains, staff accounts, deep analytics, a native app, multi-courier APIs.

**Phase 2, once paying sellers exist:** auto payment verify (KBZPay/Wave notification forwarder → webhook → match), analytics, staff seats, custom domains, pricing from real willingness-to-pay data.

## Decisions

- D23 (2026-09-08) — **Plan gating is a FRONTEND layer** (`src/lib/plan.tsx`), not a DB/RLS
  change. Plan source is forward-compatible: `shop.plan` (once a `shops.plan` column exists) →
  `VITE_DEFAULT_PLAN` env → hard default `'business'`. The `business` default means the
  existing single-seller deploy keeps every feature (no regression); a real commercial rollout
  sets per-shop plan (Backend). Plan is deliberately **read-only in the seller UI** — a seller
  must not self-unlock Business. Gating never deletes a capability; it shows an upsell
  (`components/PlanGate.tsx`). Business-only surfaces: promotions, per-township shipping zones,
  last-5 payment verification, dashboard analytics, logo/branding, integration hooks.
- D24 (2026-09-08) — Storefront chrome (`Layout`, `Home` hero) renders the **tenant's own
  name/logo** from `getCachedShopInfo()` (resolveShop now also selects `name, logo_url`); the
  root/demo shop falls back to the product brand (`src/lib/brand.ts`). Shop `slug` stays
  **read-only** in Settings — changing it would break every shared `/s/:slug` link.
- D19 (2026-09-03) — Storefront routing is **path-based `/s/:slug/...`, not slug-in-storage**. TikTok's WebView storage is ephemeral, so a buyer reloading any page would lose the shop. A reload of `/s/uthuya/checkout` still knows the shop. Root `/` stays the demo storefront.
- D20 — `store.ts`'s storefront `api` is a reactive **Proxy**, replacing a `const` evaluated once at module load. The get-trap dispatches on the *current* slug, so `setShopSlug()` takes effect without a reload and SPA navigation between shops resolves correctly. **Hazard: never put `api.<method>` in a React dependency array** — the trap returns a fresh function each access and the effect would loop.
- D21 — Shop-relative navigation via `shopHref()` + `<ShopLink>` / `useShopNavigate()`, not react-router relative links. `ProductCard` renders at three route depths, so a bare relative `to` would resolve differently per context; `shopHref()` is depth-independent and treats the path as opaque so query strings pass through.
- D22 — Milestone A slug validation is format-only (`isValidSlug`, mirroring the DB `shops_slug_format` constraint). Inner storefront routes were changed absolute→relative so the same `Storefront` mounts under both `/*` and `/s/:slug/*` without react-router v7's "Absolute route path nested" error.
- D15 — Seller auth = Supabase **email/password**, not phone OTP. No SMS provider is configured and OTP costs money per send; email/password is zero-cost and sufficient at solo-founder/pilot stage.
- D16 — Shop onboarding is a **hard gate** in `RequireAdmin`, not a dismissible prompt: a session with no `shops` row is redirected to `/admin/onboarding`. The onboarding page self-guards instead, since `RequireAdmin` would otherwise redirect a shop-less session away from the one page that fixes it.
- D12 — `backend.ts` deliberately diverges from the demo API in three places, all forced by the committed schema: `ordersByPhone(phone, orderNo)` takes an effectively-required second argument because `lookup_order()` needs `(shop_slug, order_no, phone)` to prevent enumerating a buyer's whole order history from a phone number; `uploadSlip()` is a no-op; `resetProducts()` throws (demo-only).
- D13 — The feature flag is gated on **shop-slug presence, not just env config**, so setting the Supabase env vars alone cannot switch a deploy to a backend with no shop context that would throw on every call.
- D9 — This app gets its **own** Supabase project. No shared-prod risk.
- D4/D5/D6 — Anon buyers never write tables directly (all order creation goes through `place_order`). Payment verification is **manual for MVP**: the buyer types the last 5 digits of the KBZPay/WavePay transaction and the seller matches amount + last-5. Slip upload is dropped — in-app WebView file pickers are unreliable. **Consequence, accepted: no tech moat.** Auto-verification is the Phase 2 premium feature; the moat today is execution, localisation, distribution and Burmese trust/support.
- D8 — The owner accepted the risk of skipping the Phase-0 customer-discovery pilot and building instead.
- D7 — Never apply migrations to a production Supabase without the owner's go-ahead.

## Notes

- **Plan gating gotchas.** `plan.tsx` (not `.ts`) — it exports a JSX provider. `usePlan()` only
  works inside `PlanProvider`, which wraps ONLY the admin console (`AdminConsole` in `App.tsx`);
  Login/Onboarding are outside it, so they use `brand.ts` constants, not `usePlan`. Gating hides +
  upsells, never deletes — downgrading a shop keeps its promo/zone data intact (reappears on
  upgrade). Default `VITE_DEFAULT_PLAN=business` is chosen so the existing seller loses nothing.
- **Storefront branding is render-order dependent.** `getCachedShopInfo()` is synchronous and reads
  the `resolveShop()` cache; it works because `ShopRoute` awaits `resolveShop()` before mounting
  `Storefront`→`Layout`. It is NOT reactive — a mid-session shop rename won't repaint the header
  until navigation. Fine for the current flow.
- **WebView constraints drive the whole design.** KBZPay/WavePay deep-links often fail in WebView → manual transfer + last-5 entry (⚠️ still needs a real-device test). localStorage/session is ephemeral → server-side order lookup via RPC. Camera/gallery pickers are flaky → text field only, no slip upload. "Open in external browser" needs manual taps → everything must work inside the WebView.
- **Any schema change needs three things in sync:** a new `supabase/migrations/NNNN_*.sql`, applied via `mcp__Supabase__apply_migration` against `fsxdnmnycizjkgstokze`, and a regenerated `database.types.ts`.
- `get_advisors(security)` is clean apart from the intentional anon `SECURITY DEFINER` findings on `place_order`/`lookup_order` — those two are the only anon write/read paths by design. The `rls_auto_enable` finding is a Supabase platform function, not ours.
- **Network egress to `*.supabase.co` is blocked from this sandbox** — `mcp__Supabase__execute_sql` is the only channel that reaches it. `backend.ts` was validated at the SQL/RLS level instead: a throwaway auth user + shop + product were seeded, then the exact queries and RPCs were run under `set local role anon`/`authenticated` with `request.jwt.claims` to simulate real RLS. 12/12 passed, including `place_order`, `lookup_order` (success and anti-enumeration rejection), owner CRUD and a negative cross-tenant isolation check. Cleaned up by cascade delete.
- **Audience-bias risk is still open:** the demo video drew 6 inbound inquiries (3 day-1, 3 day-2), but real sellers versus N8N Masterclass students have not been disaggregated.
- Review coverage on the milestones: ECC `database-reviewer` (clean), `code-reviewer` (1 HIGH — arrival-date backdate, fixed), `react-reviewer` (2 HIGH — payment-confirm error handling and shipping a11y labels, fixed), and a Codex P1 (stale fee on slug change, fixed).
