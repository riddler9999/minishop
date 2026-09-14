# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Multi-tenant SaaS storefront for Myanmar TikTok sellers. A seller drops a `/s/<slug>` link in
their TikTok bio; buyers order through a self-serve storefront that must work inside TikTok's
in-app WebView (no native app, no bot/messaging API — this is **not** a sales agent). See
`PROJECT.md` for full product context, decision log (D1–D26), open tasks, and status — read it
before making architectural changes; it is the project's memory, not just a README.

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
- No test suite exists in this repo.

Deploys via Vercel (`vercel.json`: SPA rewrite to `index.html`, `dist` output). Root Directory
must be the repo root (this is a standalone repo, not a monorepo subfolder).

## Environment

Copy `.env.example` to `.env.local`. Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
(public anon key — **never** the `service_role` key) plus `VITE_DEFAULT_PLAN` (`starter` |
`business`, default `business`). Without Supabase env vars configured, the root/storefront
experience falls back entirely to the zero-backend localStorage demo (`src/lib/api.ts`) — this is
intentional so local/preview builds never break for lack of secrets. The **admin console does
not** have an offline fallback: it requires real Supabase auth (`adminAuth.tsx`), and
`/admin/login` explicitly reports that login/signup cannot work when Supabase isn't configured.

## Architecture

### Data-layer switch (the core indirection)

Three layers, and callers must know which to import from:

- `src/lib/api.ts` — demo backend, `localStorage`-backed, no network. This is what the app runs
  on when Supabase isn't configured or no shop slug is set.
- `src/lib/backend.ts` — the real Supabase-backed multi-tenant backend (`api` for storefront,
  `adminApi` for the seller console). Shaped to match `api.ts`'s method names/types so most pages
  can switch with a minimal import change.
- `src/lib/store.ts` — **the switch storefront pages must import from** (`import {api} from
  '../lib/store'`), never `api.ts` or `backend.ts` directly. Its exported `api` is a reactive
  `Proxy` whose `get` trap re-evaluates `isLiveBackend()` (Supabase configured AND a shop slug is
  currently set) on every **property access** (e.g. `api.products`) and returns a closure bound to
  whichever backend was active at that access — not at module load, so `setShopSlug()` from
  `/s/<slug>` routing takes effect on the next access without a reload. `adminApi` is re-exported
  unconditionally from `backend.ts` — the admin console never uses the demo layer, since
  `RequireAdmin` already proves a real session + shop exist before any admin page renders.
  - **Hazard:** never put `api.<method>` in a React dependency array, and never save/destructure a
    method off `api` for later use (e.g. `const fn = api.products`) — dispatch happens at the
    property-access moment, not at call time, so a cached reference keeps calling whichever
    backend was active when it was read, even after the shop slug changes. Access `api.<method>`
    fresh at each call site instead.

### Shop slug = the multi-tenancy key

- `src/lib/shopContext.ts` holds the current shop slug as a module-level variable (not React
  state, not storage) with `setShopSlug()` / `getShopSlug()`. It is deliberately **not** derived
  from any persistent storage: TikTok's in-app WebView storage is ephemeral, so the slug must live
  in the URL (`/s/<slug>/...`) and be set on every storefront entry, not cached client-side.
- `src/App.tsx`: `ShopRoute` (mounted at `/s/:slug/*`) validates the slug format
  (`src/lib/slug.ts`), calls `setShopSlug()` **during render** (not in an effect — see the comment
  block above `ShopChecking` in `App.tsx` for why: descendant data-fetch effects must see the slug
  already set, and StrictMode's double-effect-invocation would otherwise clear a valid slug right
  after mount), then — **only when the live Supabase backend is active** (`isLiveBackend()`) —
  confirms the shop actually exists via `resolveShop()` before mounting `Storefront` (showing a
  checking state, then a 404 if missing). Without Supabase configured, this existence check is
  skipped entirely and the demo storefront mounts unconditionally for any well-formed slug.
  `RootStorefront` (catch-all route) clears the slug for the root/demo storefront.
- Storefront route components under `Storefront` in `App.tsx` are mounted at **relative** paths
  because the same component tree is reused at both `/*` (demo) and `/s/:slug/*` (real tenant);
  absolute paths would throw under nested mounting in react-router v7.
- In-app navigation must go through `shopHref()` / `<ShopLink>` / `useShopNavigate()`
  (`shopContext.ts` / `components/ShopLink.tsx`), not bare react-router relative links —
  `ProductCard` renders at multiple route depths, so a relative `to` would resolve inconsistently.

### Supabase backend

- `src/lib/supabase.ts` builds the browser client lazily from `VITE_SUPABASE_URL` /
  `VITE_SUPABASE_ANON_KEY`; `getSupabase()` returns `null` when unconfigured, `requireSupabase()`
  throws (used by code paths that legitimately need the backend).
- Schema in `supabase/migrations/`: `0001_init_saas.sql` (`shops`, `products`, `orders`,
  `order_items`, `payment_accounts`, `shipping_zones`; RLS on every table; `place_order()` and
  `lookup_order()` RPCs), `0002_harden_search_path.sql` (pins `search_path`), and
  `0003_platform_plan_and_usage.sql` (adds `shops.plan`, billable-usage view/RPC, storage buckets —
  purely additive, see `PROJECT.md` D25 for the downgrade hazard on apply), and
  `0004_product_promo_price_check.sql` (`CHECK` constraint: `promo_price < price` whenever
  `is_promotion`, previously guarded client-side only — see `PROJECT.md` D32; **not yet applied**
  to the live project, pending owner go-ahead per D7).
- **Security model** (`supabase/README.md`): buyers are anonymous and never write tables directly
  — the only anon write path is `place_order()` (SECURITY DEFINER), which re-prices every line
  server-side from `products` (client-sent prices are ignored) and validates stock/shop state
  atomically. Buyer order lookup (`lookup_order()`) requires `(shop_slug, order_no, phone)`
  together — phone alone would let anyone enumerate a buyer's order history. Payment verification
  is manual for MVP: buyer types the last 5 digits of a KBZPay/WavePay transfer; the seller matches
  amount + last-5 in the admin console. There is no slip upload (`uploadSlip()` is a deliberate
  no-op — in-app WebView file pickers are unreliable).
- **Any schema change needs three things kept in sync:** a new
  `supabase/migrations/NNNN_*.sql` file, applying it (via `mcp__Supabase__apply_migration` against
  the project — **never apply to production without the owner's explicit go-ahead**), and
  regenerating `src/lib/database.types.ts`.
- The dedicated Supabase project for this app is intentionally separate from any other/shared
  project — see `PROJECT.md` Stack section for the project ref. Only the anon key belongs in
  frontend code; RLS is the actual enforcement boundary, not the frontend.

### Plan gating (Starter vs Business)

- `src/lib/plan.tsx` (note: `.tsx`, exports a JSX provider) is a **frontend-only** UI gating layer
  — it decides what to render, not what the database allows; RLS is unchanged. Plan resolution
  order: `shop.plan` DB column → `VITE_DEFAULT_PLAN` env → hard default `'business'`.
- `usePlan()` only works inside `PlanProvider`, which wraps only the admin console (`AdminConsole`
  in `App.tsx`) — `Login`/`Onboarding` render outside it and must use `src/lib/brand.ts` constants
  instead.
- Plan is deliberately **read-only** in the seller UI (`updateShopSettings` refuses to patch
  `plan`) — a seller must never be able to self-upgrade. Gating hides + upsells
  (`components/PlanGate.tsx`) but never deletes data — a downgraded shop's promo/zone data
  reappears on upgrade.

### Other conventions

- `src/lib/format.ts`, `src/lib/orderStatus.ts` (single source of truth for order status labels
  shared by storefront + admin), `src/lib/brand.ts` (product-neutral app name/branding, used
  outside `PlanProvider`) are shared utilities — check them before adding parallel formatting or
  status logic elsewhere.
- UI copy is Burmese for all buyer/seller-facing text; code comments and identifiers are English.
- Tailwind v4 (via `@tailwindcss/vite`), not a `tailwind.config.js`-driven v3 setup.
- Path alias `@/*` → repo root (see `tsconfig.json` / `vite.config.ts`).
