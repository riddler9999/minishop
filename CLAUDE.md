# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Multi-tenant SaaS storefront for Myanmar TikTok sellers. A seller drops a `/s/<slug>` link in
their TikTok bio; buyers order through a self-serve storefront that must work inside TikTok's
in-app WebView (no native app, no bot/messaging API — this is **not** a sales agent). See
`PROJECT.md` for full product context, decision log (D1–D47), open tasks, and status — read it
before making architectural changes; it is the project's memory, not just a README.

## Session communication preference (standing, until this project is done)

- Reply to the user in Burmese (မြန်မာဘာသာ) throughout the session. This is about the chat
  reply itself, not code — it doesn't change the "UI copy is Burmese; code comments/identifiers
  are English" rule below.
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
  `0005_fix_storage_policy_path.sql`, `0006_optimize_rls_and_fk_index.sql`, and
  `0007_production_hardening.sql` (rate limiting, platform-managed plan/owner/billing triggers,
  stricter `place_order`/`lookup_order` validation). **All seven are applied to the live project.**
- **Security model** (`supabase/README.md`): buyers are anonymous and never write tables directly
  — the only anon write path is `place_order()` (SECURITY DEFINER), which re-prices every line
  server-side from `products` (client-sent prices are ignored) and validates stock/shop state
  atomically. Buyer order lookup (`lookup_order()`) requires `(shop_slug, order_no, phone)`
  together — phone alone would let anyone enumerate a buyer's order history. Payment verification
  is manual for MVP: buyer types the last 5 digits of a KBZPay/WavePay transfer; the seller matches
  amount + last-5 in the admin console. There is no slip upload (`uploadSlip()` is a deliberate
  no-op — in-app WebView file pickers are unreliable).
- **Known gap:** `0007` raises 16 typed exceptions (`rate_limit_exceeded`, `duplicate_order_limit`,
  `business_plan_required`, …) that no frontend code maps to Burmese copy yet — `Checkout.tsx`
  surfaces `e.message` raw. `features/checkout/api.ts` holds the partial mapper that predates them.
- **Schema changes: never apply a migration to production without the owner's explicit
  go-ahead.** For the full procedure, see `.claude/skills/supabase-migration/SKILL.md`.
- The dedicated Supabase project for this app is intentionally separate from any other/shared
  project — see `PROJECT.md` Stack section for the project ref. Only the anon key belongs in
  frontend code; RLS is the actual enforcement boundary, not the frontend.

### Plan gating (Starter vs Business)

- `src/domain/plan.ts` holds the resolution rule (`normalizePlan`, `resolvePlanValue`) and
  **fails closed**: anything unknown, missing or malformed resolves to `starter`. Resolution
  order: `shop.plan` DB column → `VITE_DEFAULT_PLAN` env → `starter`.
- `src/features/billing/plan.tsx` (note: `.tsx`, exports a JSX provider) is the UI gating layer.
  `usePlan()` only works inside `PlanProvider`, which wraps only the admin console
  (`AdminConsole`) — `Login`/`Onboarding` render outside it and must use `@/shared/lib/brand`
  constants instead.
- Gating is **no longer frontend-only**: `0007_production_hardening.sql` enforces the same rules in
  the database (`business_plan_required`, `plan_is_platform_managed`), so the UI layer decides what
  to *render* while the DB decides what is *allowed*. Plan stays read-only in the seller UI — a
  seller must never be able to self-upgrade. Gating hides + upsells (`features/billing/PlanGate.tsx`)
  but never deletes data — a downgraded shop's promo/zone data reappears on upgrade.

### Other conventions

- `src/shared/lib/format.ts`, `src/domain/orderStatus.ts` (single source of truth for order status
  labels shared by storefront + admin), `src/shared/lib/brand.ts` (product-neutral app name/
  branding, used outside `PlanProvider`) are shared utilities — check them before adding parallel
  formatting or status logic elsewhere.
- UI copy is Burmese for all buyer/seller-facing text; code comments and identifiers are English.
- Tailwind v4 (via `@tailwindcss/vite`), not a `tailwind.config.js`-driven v3 setup.
- Path alias `@/*` → `src/*` (see `tsconfig.json` / `vite.config.ts`). Use it for every
  cross-module import; `./` only for siblings inside the same folder.
