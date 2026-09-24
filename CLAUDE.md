# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Multi-tenant SaaS storefront for Myanmar TikTok sellers. A seller drops a `/s/<slug>` link in
their TikTok bio; buyers order through a self-serve storefront that must work inside TikTok's
in-app WebView (no native app, no bot/messaging API — this is **not** a sales agent). See
`PROJECT.md` for full product context, decision log (D1–D51), open tasks, and status — read it
before making architectural changes; it is the project's memory, not just a README.

## Agent skills

### Issue tracker

Engineering work is tracked in GitHub Issues for `riddler9999/minishop`. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the default `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix` vocabulary. See `docs/agents/triage-labels.md`.

### Domain docs

This repo uses a single-context domain model: read root `CONTEXT.md` and relevant ADRs under `docs/adr/` before architectural changes. See `docs/agents/domain.md`.

## Session communication preference (standing, until this project is done)

- Reply to the user in Burmese (မြန်မာဘာသာ) throughout the session. This is about the chat
  reply itself, not code — it does not change the UI-language rules below.
- End every reply with one explicit line: if there is a next action the user themselves needs to
  take, state it plainly in Burmese, give the exact prompt text to use verbatim, and say whether
  it should be pasted into a **new session** or the **current chat**. If nothing is needed from
  the user, say so instead of just omitting the line.
- Applies to every session working on this repo until the project owner says the project is done.

## Commands

- `npm run dev` — Vite dev server
- `npm run build` — production build (`vite build`)
- `npm run preview` — preview the production build
- `npm run lint` — `tsc --noEmit` then ESLint (`eslint.config.js`, flat config): `@typescript-eslint`
  recommended (non-type-checked; `no-explicit-any` downgraded to a warning — see the rule
  comment), `eslint-plugin-react-hooks` restricted to just `rules-of-hooks` (error) +
  `exhaustive-deps` (warn) — **not** the plugin's `configs.flat.recommended`, which also pulls in
  ~12 React Compiler rules (`immutability`, `purity`, `refs`, `use-memo`, etc.) this repo hasn't
  opted into — and `eslint-plugin-jsx-a11y` (recommended). `npm run lint:fix` applies auto-fixes.
- `npm test` — `node --test tests/*.test.ts` (native runner, no framework). `npm run check` runs
  lint + test + build, the same gates CI (`.github/workflows/ci.yml`) enforces on every PR.

Deploys via Vercel (`vercel.json`: SPA rewrite to `index.html`, `dist` output). Root Directory
must be the repo root (this is a standalone repo, not a monorepo subfolder).

## Environment

Copy `.env.example` to `.env.local`. Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
(public anon key — **never** the `service_role` key) plus `VITE_DEFAULT_PLAN` (`starter` |
`business`). Plan resolution **fails closed**: an unset, unknown or malformed value resolves to
`starter`, so a missing env var can never hand out paid features (`src/domain/plan.ts`).
Without Supabase env vars configured, the **root** storefront falls back to the zero-backend
localStorage demo (`src/data/demo/`) — intentional, so local/preview builds never break for lack
of secrets. A **tenant** route (`/s/<slug>`) does not fall back: it fails closed to a service-
unavailable screen rather than serving demo data under a real seller's slug. The **admin console does
not** have an offline fallback: it requires real Supabase auth (`adminAuth.tsx`), and
`/admin/login` explicitly reports that login/signup cannot work when Supabase isn't configured.

## Architecture

The codebase is **feature-first with enforced layering**. Import direction runs one way only:

```
domain/  <-  core/ , shared/  <-  features/*  <-  data/  <-  app/
```

`eslint.config.js` encodes this with `no-restricted-imports` groups, so a violation fails
`npm run lint` — the layering is a build gate, not a convention. Everything imports through the
`@/*` alias (→ `src/*`), never deep relative paths.

| Layer | Holds | May import |
|---|---|---|
| `src/domain/` | Pure types + rules: `product`, `order`, `shop`, `plan`, `slug`, `orderStatus` | other `domain/` modules only (leaf — no React, no I/O, no other layer) |
| `src/core/` | Infrastructure: `supabase/client`, `supabase/database.types`, `storage/` | `domain` |
| `src/shared/` | Cross-feature UI/util: `ui/Layout`, `ui/NotFound`, `hooks/`, `lib/format`, `lib/brand` | `domain`, `core` |
| `src/features/*/` | One bounded context each: its own `api/`, `components/`, `pages/` | `domain`, `core`, `shared`, another feature's **components** (never its `api/`) |
| `src/data/` | The backend switch + composition | everything below |
| `src/app/` | Composition root: `App.tsx` + `routes/` | everything below |

Features: `tenancy` (shop slug + resolution), `catalog`, `cart`, `checkout`, `orders`, `shipping`,
`billing` (plan gating), `shop` (seller settings/payments/storage), `auth`, `admin` (console shell).

### Data-layer switch (the core indirection)

- `src/data/dataSource.ts` — **the only module storefront pages may import the backend from**
  (`import {api} from '@/data/dataSource'`). Its exported `api` is a reactive `Proxy` whose `get`
  trap re-evaluates which backend is active on every **property access**, so `setShopSlug()` from
  `/s/<slug>` routing takes effect on the next access without a reload. `adminApi` is re-exported
  unconditionally from the live backend — the admin console never uses the demo layer, since
  `RequireAdmin` already proves a real session + shop exist before any admin page renders.
- `src/data/liveApi.ts` — composes the storefront `api` and seller `adminApi` from each feature's
  own data module. **The only file allowed to import across every feature boundary** (lint-enforced).
- `src/data/demo/` — the zero-backend `localStorage` demo (`demoApi.ts` + `fixtures.ts`), which
  serves the slug-less root route when Supabase isn't configured.
- Each feature owns its queries: `features/catalog/api/{storefront,admin,mappers}.ts`,
  `features/checkout/api.ts`, `features/orders/api/{storefront,admin}.ts`,
  `features/shipping/api.ts`, `features/shop/api/{settings,paymentAccounts,storage}.ts`,
  `features/billing/api.ts`. A feature never imports another feature's `api/`.
  - **Hazard (unchanged):** never put `api.<method>` in a React dependency array, and never
    destructure a method off `api` for later use (e.g. `const fn = api.products`) — dispatch
    happens at the property-access moment, not at call time, so a cached reference keeps calling
    whichever backend was active when it was read. Access `api.<method>` fresh at each call site.

### Shop slug = the multi-tenancy key

- `src/features/tenancy/shopContext.ts` holds the current shop slug as a module-level variable
  (not React state, not storage) with `setShopSlug()` / `getShopSlug()`. It is deliberately **not**
  derived from persistent storage: TikTok's in-app WebView storage is ephemeral, so the slug must
  live in the URL (`/s/<slug>/...`) and be set on every storefront entry.
- `src/features/tenancy/shopResolver.ts` resolves that slug to the tenant's public branding and
  caches it per session (`resolveShop`, `isShopCached`, `getCachedShopInfo`).
  `src/features/tenancy/ownShop.ts` is its admin-side counterpart: it resolves the seller's own
  shop by `owner_id` (RLS-enforced), and every admin write scopes to it.
- `src/app/routes/ShopRoute.tsx` (mounted at `/s/:slug/*`) validates the slug format, calls
  `setShopSlug()` **during render** (not in an effect — see the comment block in that file for
  why: descendant data-fetch effects must see the slug already set, and StrictMode's
  double-effect-invocation would otherwise clear a valid slug right after mount), then — only when
  Supabase is configured — confirms the shop exists via `resolveShop()` before mounting
  `Storefront`. With Supabase unconfigured, a tenant route **fails closed** to `ShopUnavailable`;
  it never falls back to demo data. `RootStorefront` clears the slug for the root/demo storefront.
- Routes under `src/app/routes/Storefront.tsx` are mounted at **relative** paths because the same
  component tree is reused at both `/*` (demo) and `/s/:slug/*` (real tenant); absolute paths
  would throw under nested mounting in react-router v7.
- In-app navigation must go through `shopHref()` / `<ShopLink>` / `useShopNavigate()`
  (`features/tenancy/`), not bare react-router relative links — `ProductCard` renders at multiple
  route depths, so a relative `to` would resolve inconsistently.

### Supabase backend

- `src/core/supabase/client.ts` builds the browser client lazily from `VITE_SUPABASE_URL` /
  `VITE_SUPABASE_ANON_KEY`; `getSupabase()` returns `null` when unconfigured, `requireSupabase()`
  throws (used by code paths that legitimately need the backend).
- Schema in `supabase/migrations/`: `0001_init_saas.sql` (`shops`, `products`, `orders`,
  `order_items`, `payment_accounts`, `shipping_zones`; RLS on every table; `place_order()` and
  `lookup_order()` RPCs), `0002_harden_search_path.sql`, `0003_platform_plan_and_usage.sql`
  (`shops.plan`, billable-usage view/RPC, storage buckets — see `PROJECT.md` D25),
  `0004_product_promo_price_check.sql` (`CHECK`: `promo_price < price` when `is_promotion`),
  `0005_fix_storage_policy_path.sql`, `0006_optimize_rls_and_fk_index.sql`,
  `0007_production_hardening.sql` (rate limiting, platform-managed plan/owner/billing triggers,
  stricter `place_order`/`lookup_order` validation), `0008_shop_owner_unique.sql`
  (`unique(owner_id)` on `shops`, dropping the now-redundant `shops_owner_idx` — makes the
  one-shop-per-owner invariant the admin flow already assumes real; see `PROJECT.md` D49), and
  `0009_shop_theme.sql` (`shops.theme jsonb` — seller-editable Store Design customization,
  cosmetic only, owner-scoped by existing RLS; see `PROJECT.md` D52, and
  `0010_shop_application_gate.sql` (`shop_applications` + private payment-proof storage),
  `0011_payment_proof_auto_plan.sql` and `0012_shop_application_transaction_id.sql` (historical
  payment-proof automation foundation), `0013`–`0015` (delivery pricing), `0016_entitlements_and_pricing.sql`
  (Pricing V1: Free Trial, subscription cycles, order entitlements, Extra Orders, idempotent order
  consumption), and `0017_reconcile_payment_activation.sql` (historical 30,000/60,000 reconciliation), and `0021_final_pricing_packaging_reconciliation.sql` (FINAL 29,000/79,000 pricing, Business 200-order quota, paid product caps, created-order usage semantics, and core promotions).
  Historical migrations may contain superseded rules; current runtime truth is the latest migration
  plus `CONTEXT.md`. Never infer live migration application state from this file — check the live
  Supabase migration history before applying anything.
- **Security model** (`supabase/README.md`): buyers are anonymous and never write tables directly
  — the only anon write path is `place_order()` (SECURITY DEFINER), which re-prices every line
  server-side from `products` (client-sent prices are ignored) and validates stock/shop state
  atomically. Buyer order lookup (`lookup_order()`) requires `(shop_slug, order_no, phone)`
  together — phone alone would let anyone enumerate a buyer's order history. Payment verification
  is manual for MVP: buyer types the last 5 digits of a KBZPay/WavePay transfer; the seller matches
  amount + last-5 in the admin console. There is no slip upload (`uploadSlip()` is a deliberate
  no-op — in-app WebView file pickers are unreliable).
- **DB error copy:** the typed exceptions `0007`/`0010`/`0011`/`0016`/`0017` raise (`rate_limit_exceeded`, `duplicate_order_limit`,
  `business_plan_required`, `plan_is_platform_managed`, `application_status_is_platform_managed`,
  `order_quota_exhausted`, `subscription_inactive`, `product_limit_reached`, `extra_orders_not_available`, …) map to Burmese UI copy in
  `src/domain/dbError.ts` — the single source of truth (`DB_ERROR_MESSAGES` + `mapDbError()`),
  mirroring the `orderStatus.ts` pattern. Feature `api/` modules call `mapDbError(error.message,
  fallback)` at their boundary (checkout `place_order`, orders `lookup_order`, shop settings,
  product create/update, paid-onboarding application submit) instead of surfacing `e.message` raw.
  `tests/dbError.test.ts` scans every migration for raised codes, so add any new DB error code to
  that catalog when a migration introduces one.
- **Schema changes: never apply a migration to production without the owner's explicit
  go-ahead.** For the full procedure, see `.claude/skills/supabase-migration/SKILL.md`.
- The dedicated Supabase project for this app is intentionally separate from any other/shared
  project — see `PROJECT.md` Stack section for the project ref. Only the anon key belongs in
  frontend code; RLS is the actual enforcement boundary, not the frontend.

### Plan packaging + order entitlements (Free Trial / Starter / Business — FINAL D60 / ADR 0002)

- **Three tiers.** `src/domain/plan.ts` (`Plan = 'free_trial' | 'starter' | 'business'`) holds the
  resolution rule (`normalizePlan`, `resolvePlanValue`) and **fails closed to `free_trial`** (the
  least-privileged tier — smallest quota, no paid features/add-ons). Resolution order: `shop.plan`
  DB column → `VITE_DEFAULT_PLAN` env → `free_trial`. New shops default to `free_trial`; the actual
  plan is derived in the `shops` insert trigger (0016) from the seller's platform-approved
  application, so a seller still can never pick a higher tier directly.
- **Feature gating** (`src/features/billing/plan.tsx`, `.tsx` JSX provider; `usePlan()` only inside
  `PlanProvider`, which wraps only `AdminConsole`). Basic promotions are CORE; integrations remain Business productivity capabilities. **Township shipping, payment verification, Store Branding,
  Store Design, basic Promotions, and basic Analytics are CORE** (the old `advancedShipping`/Business gates were removed — D56). Gating hides
  + upsells (`features/billing/PlanGate.tsx`) but never deletes data.
- **Order entitlements are the real pricing mechanic** (`src/domain/entitlement.ts` — the single
  source of truth, mirrored verbatim by `place_order()` in 0016). FOUR concepts kept separate,
  never collapsed into one number: subscription state/cycle, quota (Free 20 lifetime /
  Starter 60 / Business 200), total-product caps (10 / 100 / 500), permanent purchased Extra Orders balance (500 Ks/order, never
  expires), and the payments + append-only ledger. A valid order consumes ONE entitlement
  immediately (**monthly quota first, then purchased**), atomically + idempotently
  (`orders.idempotency_key`), the entitlement row locked `FOR UPDATE` for concurrency. Seller status changes never affect billing; Reject/Cancel/RTO/no-show/refund never restore consumed quota. Free trial: 10-product cap
  (server-enforced), cannot buy/consume Extra Orders.
- **Anonymous abuse limiting is database-distributed.** `private.api_rate_limits` + `private.enforce_rate_limit()` (0007) are the source of truth for `place_order()` and `lookup_order()`; Vercel handlers must not add process-local `Map` counters.
- **Payment-proof storage seam.** `src/features/billing/paymentProofStorage.ts` owns proof validation and the upload → DB persist → rollback/old-object cleanup invariant for both plan applications and Extra Orders.
- **Manual prepaid billing.** Activation, renewal, upgrade, downgrade and Extra-Orders credit are
  owner-only `admin_*` SECURITY DEFINER RPCs (granted to `service_role`), run from the Supabase
  dashboard after the owner verifies a transfer screenshot — matching the D4–D6/D55 manual-payment
  philosophy (no in-app super-admin). Sellers submit Extra-Orders purchase requests
  (`order_pack_purchases`) via the admin Billing page. Plan stays read-only in the seller UI —
  enforced by the DB (`plan_is_platform_managed`), so a seller can never self-upgrade.
- **Mid-cycle upgrade (Starter→Business) rule** (`admin_upgrade_plan`): the cycle cap is raised to
  200 but the orders already consumed this cycle are PRESERVED (`monthly_used` unchanged) — no fresh
  200 — so nobody can burn 60 Starter orders then pay the difference for a full new allotment. The
  seller pays the price difference for the remaining cycle. See `PROJECT.md` D56.
- **Downgrade** (`admin_schedule_downgrade`) takes effect at the NEXT renewal (`pending_plan`),
  never deletes Business data — only lowers the cap once applied.

### Other conventions

- `src/shared/lib/format.ts`, `src/domain/orderStatus.ts` (single source of truth for order status
  labels shared by storefront + admin), `src/shared/lib/brand.ts` (product-neutral app name/
  branding, used outside `PlanProvider`) are shared utilities — check them before adding parallel
  formatting or status logic elsewhere.
- UI copy defaults to Burmese for buyer-facing text and seller-facing screens unless a screen-specific product decision records an English exception. D50 makes the Admin analytics dashboard English-only. Code comments and identifiers are English.
- Tailwind v4 (via `@tailwindcss/vite`), not a `tailwind.config.js`-driven v3 setup.
- Keep personal Claude plugin settings out of the repository, and don't vendor further third-party skills without the owner's explicit go-ahead (see `PROJECT.md` D51/D53). Committed under `.claude/skills/`: the project-specific `supabase-migration/SKILL.md`, plus the vendored `ui-ux-pro-max` skill bundle (`ui-ux-pro-max/`, `banner-design/`, `brand/`, `design/`, `design-system/`, `slides/`, `ui-styling/` — MIT-licensed, from `nextlevelbuilder/ui-ux-pro-max-skill`, D53).
- Path alias `@/*` → `src/*` (see `tsconfig.json` / `vite.config.ts`). Use it for every
  cross-module import; `./` only for siblings inside the same folder.


## Storefront aesthetic theme architecture

Storefront theme presets are design-aesthetic families rather than product-niche templates. The canonical registry is `src/domain/theme.ts`; layout metadata is read through `getThemeVisual()`. Buyer-facing Home, catalog, product detail and shell must respect `theme.presetId`, and the Store Design preview must show the same layout family.

Do not add a new preset that merely recolors the same layout. A distinct preset must materially change composition/density/card language. Keep compatibility for persisted legacy IDs in `normalizeTheme()`. See `design/themes/aesthetic-themes.md`.
