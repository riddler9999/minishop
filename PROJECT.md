# Mini TikTok Shop (SaaS)

## Overview

A multi-tenant SaaS storefront for Myanmar TikTok sellers, evolved from a localStorage demo
into a real product on Supabase. The wedge is the mini-shop link a seller drops in their TikTok
bio: TikTok has no in-app chat automation and no native Myanmar checkout, so the seller's only
lever is moving the buyer to a frictionless self-serve order page that opens **inside TikTok's
in-app WebView**. **Not a sale agent** — TikTok exposes no bot/messaging API.

## Status

Live & owner-verified — pilot next | Moe Htet | 2026-09-14

Milestones A (routing), B (buyer storefront on the live backend), C (seller admin) and C.1
(checkout fee parity) are all built and **owner-verified on the live deployment** (D31) — the
real browser/WebView click-through this sandbox could never do itself. Next up: the plan-gating
live-verify and the first real-seller pilot.

**Commercialization — merged (PR #190 code, #192 index sync):** TikTok-specific wording
generalized to channel-neutral "Mini Shop"; storefront now shows the tenant's own name/logo.
Added a frontend plan-gating layer (Starter vs Business), a seller Settings/branding page
(`/admin/settings`), and onboarding UX polish. typecheck + build green, and now owner-verified
live (D31).

**Vercel deployment is live** (D30): `minishop` project, production alias
`https://minishop-xi-brown.vercel.app`, building from `riddler9999/minishop` `main` with
`VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` correctly configured — confirmed by grepping the
shipped bundle for the real project ref. This closed the first of the two D28 blockers; the owner
has now closed the second by doing the real click-through themselves (D31).

## Stack

- React + Vite + TypeScript + Tailwind v4; Vercel (Root Directory = repo root — this is now a standalone repo, not a monorepo subfolder)
- **Dedicated Supabase project** `Mini Tiktok Shop`, ref `fsxdnmnycizjkgstokze`, `ap-southeast-1` — deliberately NOT the shared production project `kjjexuhhrwzujgocfzd`
- Schema `supabase/migrations/0001_init_saas.sql`: `shops`, `products`, `orders`, `order_items`, `payment_accounts`, `shipping_zones`; RLS on all; `place_order()` (anon write, server-side repricing, atomic) and `lookup_order()` (anon buyer lookup) RPCs. `0002_harden_search_path.sql` pins `search_path` on `set_updated_at()`.
- Data layer: `src/lib/shopContext.ts` (module-level slug) · `src/lib/backend.ts` (Supabase `api`/`adminApi`; `resolveShop` also caches `name`/`logo_url` → `getCachedShopInfo()`) · `src/lib/store.ts` (the switcher — storefront `api` is a reactive Proxy, `adminApi` is an unconditional re-export, re-exports `getCachedShopInfo`) · `src/lib/api.ts` (demo/localStorage) · `src/lib/database.types.ts` (generated)
- Commercial layer: `src/lib/brand.ts` (product-neutral `APP_NAME`/initial) · `src/lib/plan.tsx` (`Plan`, `PlanFeatures`, `PlanProvider`/`usePlan`, `resolvePlan`) · `src/components/PlanGate.tsx` (badge + upsell UI) · `src/pages/admin/Settings.tsx` (`/admin/settings`) · `src/lib/sellerShop.ts` (`getOwnShop`/`updateOwnShop`, extended shop shape)
- Auth: real Supabase email/password (`src/lib/adminAuth.tsx`), onboarding at `/admin/onboarding`, `RequireAdmin` gates on session AND shop existence; admin console wrapped in `PlanProvider` (`AdminConsole` in `App.tsx`)
- Order statuses in `src/lib/orderStatus.ts`: `cod_pending`, `pending_payment`, `partial_checked`, `checked`, `shipped`, `completed`, `cancelled`. Payment methods: `cod` | `kpay` | `wave`.
- Env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (anon key only — RLS enforces access), `VITE_DEFAULT_PLAN` (`starter`|`business`, default `business` — deploy-wide plan default until `shops.plan` exists)

## Open Tasks

- [x] **Owner live-verify A + B + C + C.1** on the live deployment (`https://minishop-xi-brown.vercel.app`) — owner confirmed the real browser/WebView click-through works. See D31.
- [ ] **Owner** — disconnect/delete the orphaned `my-projects-msx4` Vercel project's link to this repo (D30) so pushes don't trigger duplicate deployments. Not blocking.
- [ ] **Owner live-verify plan gating** on a preview: deploy once with `VITE_DEFAULT_PLAN=starter`
  and once with `=business`. Starter must HIDE (Business must SHOW): shipping-zone nav, product
  Promotion controls, order last-5 payment-verify section, dashboard analytics panel, Settings
  logo field. Both plans keep name/phone/default-fee in Settings and a working storefront.
- [ ] Storage bucket + policy for shop logos and product images (images are URL text today).
- [ ] Real-device WebView test matrix in the TikTok in-app browser: checkout, last-5 entry, order lookup, payment-app deep-link behaviour.
- [ ] Pilot with 1 real seller (tests the DM-deflection assumption).
- [x] Admin modal/drawer a11y — `role="dialog"`, `aria-modal`, focus trap, Escape-to-close on `ProductModal`/`OrderDetail`/mobile nav drawer. Shared `src/lib/useModalA11y.ts` hook. PRs #3 (initial + 2 Codex-found focus-trap fixes), #4 (one of those fixes had been dropped by a merge race on #3 — reapplied against `main`).
- [x] Add ESLint (`eslint-plugin-react-hooks` + `jsx-a11y`) — see D27.
- [ ] DB CHECK for `promo_price < price` when `is_promotion` — guarded client-side only today.
- [ ] **Backend** (later) — plan changes are an owner/billing action; no seller-facing plan
  toggle. A minimal admin/owner path to set a shop's plan is out of frontend scope.

**Explicitly NOT in v1:** auto payment verification (Phase 2 moat), AI/chatbot features, custom domains, staff accounts, deep analytics, a native app, multi-courier APIs.

**Phase 2, once paying sellers exist:** auto payment verify (KBZPay/Wave notification forwarder → webhook → match), analytics, staff seats, custom domains, pricing from real willingness-to-pay data.

## Decisions

- D31 (2026-09-14) — **Owner completed the real browser/WebView live-verify on the deployed
  preview** (`https://minishop-xi-brown.vercel.app`), closing the second D28 blocker that this
  sandbox structurally cannot close itself (no network path to `*.vercel.app`/`*.supabase.co`).
  Owner reported the click-through as working ("I checked. It is OK.") after D30 got the
  deployment live with the real Supabase env vars. This completes Milestones A/B/C/C.1 end to
  end: routing, buyer storefront on the live backend, seller admin, and checkout fee parity — the
  project is no longer blocked on live verification. Plan-gating live-verify (deploy once per
  `VITE_DEFAULT_PLAN` value) and the real-seller pilot remain as the next Open Tasks.
- D30 (2026-09-14) — **Vercel project is live; resolves D28 blocker 1, D28 blocker 2 still stands
  and now covers `*.vercel.app` too.** Owner re-authorized the Vercel↔GitHub App scope and set
  `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`. `mcp__Vercel__create_git_project` on
  `riddler9999/minishop` created a **new** project `minishop` (`prj_IfW2lxtF7XZUEmxEjTOuFhzAZHX2`)
  rather than reusing the pre-existing `my-projects-msx4` project, even though `my-projects-msx4`'s
  own `link.repo` metadata already said `minishop` — **that field reflects Vercel's dashboard repo
  picker, not which project GitHub's App treats as the live deploy target**; `my-projects-msx4`'s
  last build was still from the old `MyProjects` monorepo, so its "link" had never actually fired a
  build against this repo. A second `create_git_project` call with an explicit
  `projectName: "my-projects-msx4"` was **still** silently redirected to `minishop` — the tool
  reuses whatever project the App integration already resolves for the repo, ignoring an explicit
  name once one exists. **Hazard for future sessions:** don't trust a project's `link` field as
  proof it's the active deploy target; if `create_git_project` reports "Created" instead of
  "Reused" for a repo you believed was already linked, that's the signal the old project's link was
  stale, not a bug to route around. Per owner instruction, env vars were set on `minishop` (the
  project the tooling actually resolves to) rather than force-migrating that resolution back to
  `my-projects-msx4`. Verified live: production alias `https://minishop-xi-brown.vercel.app`
  builds successfully from `main` @ `cbc5d65`; the shipped JS bundle contains the real Supabase
  project ref `fsxdnmnycizjkgstokze` (absent from the first, env-var-less build, confirming the
  env vars are actually taking effect at build time) — checked via `mcp__Vercel__web_fetch_vercel_url`
  since this sandbox cannot `curl` `*.vercel.app` directly either (403 at the egress proxy, same
  class of restriction as the existing `*.supabase.co` block). That network restriction means the
  actual client-rendered behavior (login form, `/s/<bogus-slug>` 404, live storefront, order
  placement) still cannot be verified from this sandbox — only static HTML/JS delivery was
  confirmed. `my-projects-msx4` is now an orphaned duplicate still linked to this repo; left alone
  (not blocking) but flagged in Open Tasks since every future push will trigger a build on both
  projects until the owner disconnects it.
- D29 (2026-09-14) — **A PR merge can land one push behind its own review thread — verify `main`
  after, don't trust "resolved" as proof.** Admin modal a11y (#3) got a second Codex-found fix
  (mobile nav drawer's Tab-trap freezing keyboard nav once `lg:hidden` made the panel invisible;
  fix: skip the trap when `panel.offsetParent === null`) pushed and its review thread replied-to +
  resolved — but GitHub's merge landed at the commit *before* that push, so the fix never reached
  `main` despite every visible signal (thread state, PR page) saying it was addressed. Caught only
  incidentally, on a later `git checkout main` + diff against the branch. Reapplied via a fresh
  branch restarted from `main` and a new PR (#4), per the already-merged-branch policy — never
  force-push over a merged branch's history (also: the harness's own auto-mode classifier refused
  that force-push outright, denying the whole Bash call — including a harmless `git commit` chained
  in the same call — before either line ran; keep a safe git action and a destructive one in
  separate Bash calls so a denial on the risky one doesn't cost you the safe one too). **Hazard for
  future sessions:** after any merge on this repo, diff the actual `main` head against what you
  expect before telling a reviewer, or this log, that something is fixed.
- D28 (2026-09-14) — **Attempted the Owner live-verify checklist; landed a backend/RLS-level pass,
  not the real browser/WebView one** — two structural blockers, both owner-only:
  1. **No Vercel deployment exists for this repo.** `mcp__Vercel__create_git_project` for
     `riddler9999/minishop` failed with a 403: `Not authorized... Trying to access resource under
     scope "moehtetofficial1-7270s-projects". You must re-authenticate to this scope`. The
     Vercel↔GitHub App connection needs the owner to re-grant it access to this repo (Vercel
     dashboard → the team → Git integration), or link the project manually there. Supabase project
     URL/anon key for the env vars: `https://fsxdnmnycizjkgstokze.supabase.co` /
     `sb_publishable_d1LmDRttEcgumJ6CNbTyZw_e0H-Vll5` (or the legacy `anon` JWT, same project —
     `get_publishable_keys` returns both).
  2. **This sandbox cannot reach `*.supabase.co` at all** (`curl` → `CONNECT tunnel failed, 403`
     at the proxy) — confirms the constraint already noted below under Notes. So even with a
     Vercel deployment live, a Claude Code session in *this* environment still can't browser-drive
     it: the client-side Supabase calls would fail identically to a direct `curl`. The real
     click-through (ideally in the actual TikTok in-app WebView, per the existing WebView-test Open
     Task) has to happen on a device with real network access — this isn't a today-only gap.

  What **was** validated, live against `fsxdnmnycizjkgstokze`, via `execute_sql` wrapped in a single
  `BEGIN … ROLLBACK` (two throwaway tenants + products + a shipping zone + a payment account,
  confirmed 0 rows left behind after) — 16/16 checks passed:
  storefront reads only `active` products (hidden ones excluded); a bogus slug resolves to 0 shops;
  `place_order()` re-prices server-side and picks the matching `shipping_zones` fee (C.1: zone match
  → zone fee; no match → shop `default_delivery_fee`); a hidden product and a bogus slug are both
  rejected by `place_order()` itself; `lookup_order()` succeeds on the exact `(slug, order_no,
  phone)` and rejects a mismatched phone (anti-enumeration holds); anon has no direct table read on
  `orders` and cannot write `products` directly (RPC is the only anon write path, confirming the
  design note at the top of `0001_init_saas.sql`); an authenticated owner can create/hide a product,
  add a shipping zone, and flip an order to `checked` matching the buyer's typed last-5
  (`payment_ref_tail`); and cross-tenant isolation holds both ways (shop A's owner can neither write
  shop B's product nor confirm shop B's orders).
  **Not covered by this pass, and still needed:** actual pixel/UI rendering, the real
  onboarding→login flow (GoTrue-issued session, not a hand-seeded one — deliberately did **not**
  fabricate a working `auth.users`/`auth.identities` row for a *persistent* pilot account; that
  technique is fine inside a rolled-back transaction for RLS simulation, matching the D25/0003
  precedent, but creating one for real should go through the app's own signup so it's a normal
  GoTrue-managed account), KBZPay/WavePay deep-link behaviour, and anything WebView-specific.
- D27 (2026-09-14) — **Added ESLint** (`eslint.config.js`, flat config) closing the `lint`-gap Open
  Task. `eslint-plugin-react-hooks` is wired to just its two classic rules — `rules-of-hooks`
  (error) + `exhaustive-deps` (warn) — via a manual `plugins`/`rules` block, deliberately **not**
  `configs.flat.recommended`: that preset (v7+) also enables ~12 React Compiler correctness rules
  (`immutability`, `purity`, `refs`, `use-memo`, `set-state-in-effect`, etc.) at `error`, which is a
  much larger, undiscussed lint surface out of scope for a task about the hooks/a11y gap.
  `eslint-plugin-jsx-a11y` uses `flatConfigs.recommended` as-is. `typescript-eslint`
  (`configs.recommended`, non-type-checked — `tsc --noEmit` already covers type-checking) is
  included as the parsing baseline flat config needs for TS/TSX; its `no-explicit-any` is
  downgraded to warn rather than fixed en masse (pre-existing `catch (e: any)` blocks throughout —
  out of this task's scope). Fixed for real: 4 backdrop `<div onClick>` overlays (`AdminLayout`,
  `CartDrawer`, `OrderDetail`/`ProductModal` in `AdminOrders`/`AdminProducts`) converted to
  `<button>` so they're keyboard-operable — `CartDrawer`'s stays mounted while closed, so it also
  gets `aria-hidden`/`tabIndex={-1}` to stay out of the tab order until the drawer opens, unlike
  the other three which are only mounted while their modal is open; `autoFocus` removed from the
  Login/Onboarding first fields (`jsx-a11y/no-autofocus`); 6 `Checkout.tsx` form labels given
  `htmlFor`/`id` pairs (`jsx-a11y/label-has-associated-control`); one genuinely unused import (`ks`
  in `Home.tsx`) removed. `npm run lint` is `tsc --noEmit && eslint .`; `npm run lint:fix` added.
- D26 (2026-09-14) — **Migrated out of the `MyProjects` monorepo into its own repo**
  (`riddler9999/minishop`), via `git subtree split` so full commit/decision history (D1–D25)
  survived the move. The old `projects/personal/mini-tiktok-shop/` folder in `MyProjects` is
  removed; `MyProjects/INDEX.md` now points here instead of carrying a stale duplicate. Nothing
  else changed: same Supabase project (`fsxdnmnycizjkgstokze`), same schema, same code — only the
  git remote. Vercel Root Directory is now the repo root (see Stack), not a monorepo subpath.
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
- D25 (2026-09-08) — **Platform Phase 1.5 backend** in `0003`, all **purely additive** (new columns with `NOT NULL DEFAULT`, new view/function/storage — no drops/renames/type changes), so `place_order()`, `lookup_order()`, existing RLS and `/s/:slug` are byte-for-byte preserved and no storefront API breaks. Delivers the `shops.plan` column D23 was waiting for.
  - **Plan** = `shops.plan text check in ('starter','business') default 'starter'`. `sellerShop.ts` (`OWN_SHOP_COLUMNS` + `mapOwnShop`) now selects it, so D23's `resolvePlan()` becomes **per-tenant** automatically. Platform-set, **read-only for sellers** (`updateShopSettings`/`updateOwnShop` refuse `plan`). No server-side feature-gate yet — gating stays the frontend layer (D23), so no RLS write-lock added (Phase-2 gap, documented).
  - **⚠️ Downgrade hazard on apply:** the column default `'starter'` backfills every EXISTING shop to starter, and once `getOwnShop()` reads it that **overrides D23's `'business'` hard-default** → the existing pilot seller silently loses Business features. **Owner must, with the apply, run** `update public.shops set plan='business' where slug='<pilot-slug>';` for any already-paid/pilot shop. New signups correctly default to starter.
  - **Billable order** = single source of truth generated column `orders.is_billable = (status <> 'cancelled' AND NOT is_test AND NOT is_duplicate)`; `is_test`/`is_duplicate` are admin flags defaulting false. Spec lists exactly three exclusions → a `cod_pending`/`pending_payment` order **counts**. To later mean "confirmed = checked|shipped|completed only", change **one expression**.
  - **Usage** exposed tenant-safely via `shop_monthly_usage` view (`security_invoker = on` → caller RLS filters it; no `shop_id` filter can be forgotten) + `current_shop_usage()` RPC (security invoker, own shop only). Tiers `0-100/101-500/501-1500/1501-3000/3000+` via immutable `usage_tier(int)`.
  - **Storage** = public-read `shop-logos` + `product-images` buckets; writes gated by policy to `(storage.foldername(name))[1] = own shop_id` (path `<shop_id>/…`). Logo/images stay **public-URL text** on the row — read path unchanged.
  - **Validation** (rolled-back txns on live `fsxdnmnycizjkgstokze`, nothing persisted): DDL compiles; tier boundaries exact; billable excludes cancelled/test/duplicate; cross-tenant view isolation holds under authenticated RLS (owner A sees only own, 0 cross-tenant rows); `place_order`/`lookup_order` still run post-columns. `tsc --noEmit` + `vite build` clean.
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
- **0003 validation (2026-09-08):** validated on live `fsxdnmnycizjkgstokze` via `execute_sql` wrapped in `BEGIN … ROLLBACK` (nothing persisted) — full DDL + seed 2 tenants + `set local role authenticated` with `request.jwt.claims` for RLS. Confirmed: tier boundaries, billable excludes cancelled/test/duplicate, cross-tenant view isolation (owner A sees 0 of shop B), `place_order`/`lookup_order` preserved, `storage.foldername(name)[1]` = shop_id. Gotchas: `\gset` is psql-only (rejected by `execute_sql` — inline the value instead); a multi-column `insert ... values` needs every row to match the column-list arity (a short row → "VALUES lists must all be the same length").
- **Codex reviewer hit its usage limit** on #191 (`chatgpt-codex-connector[bot]` posted a limit notice, no findings) → no review round opened, no ledger needed. Deploy-preview bots (Vercel/Netlify) are pure noise on this repo.
- **Audience-bias risk is still open:** the demo video drew 6 inbound inquiries (3 day-1, 3 day-2), but real sellers versus N8N Masterclass students have not been disaggregated.
- Review coverage on the milestones: ECC `database-reviewer` (clean), `code-reviewer` (1 HIGH — arrival-date backdate, fixed), `react-reviewer` (2 HIGH — payment-confirm error handling and shipping a11y labels, fixed), and a Codex P1 (stale fee on slug change, fixed).
