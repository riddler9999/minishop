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
real browser/WebView click-through this sandbox could never do itself. Plan gating (Starter vs
Business) is now also verified — automated this time, not owner-verified, see D42.

**⚠️ Fresh-signup email confirmation is currently broken for real sellers, and the fix is bigger
than D43 alone closes** — see D44 (Open Tasks). D43's `otp_expired` diagnosis (email prefetching)
was correct, and its 6-digit-code frontend fix is shipped, but attempting to apply the "Confirm
signup" template edit that fix depends on surfaced a deeper, pre-existing gap: **this project has
never configured a custom SMTP provider**, so Supabase Auth is still on its default/shared mailer
— which locks email template editing entirely (confirmed via an owner screenshot: Supabase's
dashboard literally disables the template body with "Set up custom SMTP to edit templates"), and
which Supabase's own docs say outright is **not for production use** regardless (best-effort, no
SLA, a rate limit of only a few emails/hour). **This blocks the pilot** — no real seller can
reliably receive a signup confirmation email at all — until an owner configures custom SMTP
(D44 recommends Resend). The one test account used to find this (`irouee@gmail.com`) was
confirmed directly via SQL so testing isn't blocked on this in the meantime — see D44.

**Latest (2026-09-19) — `src/` restructured to a feature-first architecture with enforced
layering (D46).** 48 files moved; `backend.ts` (822 LOC, the god module) split into per-feature
data modules; domain types extracted out of the demo layer; ESLint now fails the build on an
import that crosses a layer the wrong way. Behavior-preserving: `npm run check` green and the
production bundle is within 0.02% of the pre-refactor build. Also backfilled: PR #24 (CI + test
suite) and PR #25 (production hardening, migrations 0005-0007 applied live) — see D45.

**Previously:** Task B (storage upload UI for shop logos + product images) is implemented — PNG/WebP
upload only, no manual URL entry, PNG auto-converted to WebP client-side (owner decisions + build,
D34/D35). The fresh-signup email confirmation redirect is fixed to return to `/admin/onboarding`
on whatever origin the app is running on, not a hardcoded localhost (D36) — still needs the owner
to add that URL to Supabase's redirect allow-list (Open Tasks). The orphaned `my-projects-msx4`
Vercel project link is confirmed deleted (D34), closing the last D30 loose end.

**Also shipped, same day, previously undocumented here (backfilled 2026-09-15 — see D37-D41):**
storefront and admin dashboard were retheme'd from the pink/cyan TikTok palette to a near-black +
porcelain + muted-gold "premium boutique" look (D39/D40), which incidentally fixed a real bug —
`PlanGate.tsx`'s Business-upsell badge/card referenced `gold-100/200/300/700/800` Tailwind tokens
that were never defined, so the upsell UI had been rendering with no gold styling at all (D40).
A design-system doc + three theme specs were also added under `design/` (reference only, no code)
(D37), several UI/UX and accessibility skills were vendored into `.claude/skills/` (D37), and the
Supabase migration checklist moved out of always-loaded `CLAUDE.md` into an on-demand skill (D38).

**2026-09-15 — plan-gating live-verify done, automated (D42):** this sandbox unexpectedly had real
network access to both `*.supabase.co` and `*.vercel.app` this session (unlike every prior D28/D30
sandbox), so rather than wait on the owner, a full real-browser click-through (Playwright + the
pre-installed Chromium) drove a genuine signup → onboarding → all 5 gated admin surfaces, flipping
the test shop's `plan` column between `starter`/`business` via SQL between passes. All 6 checks
(the 5 named in Open Tasks below, plus the order last-5 payment-verify section) passed both
directions. Test data (auth user, shop, one throwaway order) was created via the app's own signup
flow — not fabricated `auth.users` rows — and fully deleted afterward; 0 rows left in production.
See D42 for the full method and result table.

**Previously (D32):** the promo-price DB CHECK constraint is written, validated, merged (PR #10), and
**applied to the live Supabase project** with owner go-ahead. PR #11 is the docs-only follow-up
that records that apply in this file — if `git log main` doesn't show it yet, merge it first, then
re-verify `main` per the standing D29 hazard before trusting the rest of this file as current. See
**Next Session** at the bottom of Open Tasks for what to pick up after that.

**Commercialization — merged (PR #190 code, #192 index sync):** TikTok-specific wording
generalized to channel-neutral "Mini Shop"; storefront now shows the tenant's own name/logo.
Added a frontend plan-gating layer (Starter vs Business), a seller Settings/branding page
(`/admin/settings`), and onboarding UX polish. typecheck + build green. D31 owner-verified the
core storefront/admin flow (A/B/C/C.1) live. **Not** covered by D31: the plan-gating layer's own
Starter-vs-Business behavior, and whether the account used for that verification actually came
from a fresh signup (signup tab on `/admin/login`, then `/admin/onboarding` to create the shop)
rather than a pre-existing account — both stay open below.

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
- [ ] **Owner** — confirm the account used to verify C (seller admin) came from a fresh signup (signup tab on `/admin/login` creates the GoTrue account — `Onboarding.tsx` only creates the shop for an already-authenticated session, it can't sign up), not a pre-existing/hand-seeded one (D28's real-onboarding gap isn't provably closed by D31 alone — see D31's own caveat). If it wasn't, do that signup for real to actually close it.
- [x] **Owner** — disconnect/delete the orphaned `my-projects-msx4` Vercel project's link to this repo (D30) so pushes don't trigger duplicate deployments. Owner confirmed the link is deleted. See D34.
- [x] **Live-verify plan gating** — done automated, not owner-verified (D42, 2026-09-15). All 5
  named surfaces (shipping-zone nav, product Promotion controls, order last-5 payment-verify
  section, dashboard analytics panel, Settings logo field) confirmed HIDE under starter / SHOW
  under business via real Playwright browser click-through against the live Supabase project, with
  screenshots. Both plans confirmed to keep name/phone/default-fee in Settings and a working
  dashboard. **Note (D40):** this also confirms the Business-upsell UI's gold styling (previously
  silently broken — missing Tailwind tokens, fixed 2026-09-14) renders correctly now.
- [x] **Task B — Storage upload UI** for shop logos and product images. Implemented using ONLY
  the existing `adminApi.uploadShopLogo`/`uploadProductImage`/`deleteShopLogo`/`deleteProductImage`
  (`src/lib/backend.ts`) — no new storage layer, no `database.types.ts` change. Manual image-URL
  entry is removed entirely (owner decision, D34); PNG/WebP are the only accepted formats (JPG/JPEG
  rejected client-side), and PNG is converted to WebP client-side before upload (owner decision,
  D34). Full design (the upload-before-write / complete-list-into-write / delete-new-on-failure /
  never-delete-old-before-write-succeeds invariant, and the two call sites' wiring) is in D35; the
  owner decisions that unblocked it are in D34.
- [ ] **Owner decision — agent tooling hygiene** (found in D47, none of it blocking):
  (1) No `.mcp.json`, so the Supabase/Vercel/GitHub MCP servers this project actually
  depends on must be configured per-session instead of being declared project-scoped.
  (2) `.claude/settings.json` commits `enabledPlugins` for `superpowers@superpowers-dev`
  and `ecc@ecc` — personal plugin choices imposed on every contributor and every CI-side
  agent session; consider moving them to a local settings file. It also has no
  `permissions` block, so every session re-prompts for routine `npm`/`git` commands.
  (3) `.claude/skills/` is 4.5 MB / 193 files, of which only `supabase-migration` is
  written for this repo; the other 13 are vendored third-party UI/a11y skills whose
  `allowed-tools` reference MCP servers (`chrome-devtools`, `accesslint`) this project
  does not run, and they are listed to the model on every single session.
  (4) No PR template, `CONTRIBUTING.md`, or `LICENSE`. (5) No formatter config
  (`.prettierrc` / `.editorconfig`), so agent-written code has no canonical format to
  converge on and `npm run lint` cannot catch drift.

- [ ] **Frontend — map the 16 DB error codes from `0007` to Burmese copy.** `place_order()` and
  the plan/billing triggers raise `rate_limit_exceeded`, `duplicate_order_limit`, `invalid_cart`,
  `business_plan_required`, `plan_is_platform_managed` and 11 more; nothing in `src/` catches them,
  and `Checkout.tsx` renders `e.message` directly — so a buyer in TikTok's WebView can be shown a
  raw English Postgres error. `features/checkout/api.ts` already holds a partial mapper (5 older
  codes) to extend. Found during the D46 restructure; deliberately left out of it (behavior change).

- [ ] Real-device WebView test matrix in the TikTok in-app browser: checkout, last-5 entry, order lookup, payment-app deep-link behaviour.
- [ ] Pilot with 1 real seller (tests the DM-deflection assumption).
- [x] Admin modal/drawer a11y — `role="dialog"`, `aria-modal`, focus trap, Escape-to-close on `ProductModal`/`OrderDetail`/mobile nav drawer. Shared `src/lib/useModalA11y.ts` hook. PRs #3 (initial + 2 Codex-found focus-trap fixes), #4 (one of those fixes had been dropped by a merge race on #3 — reapplied against `main`).
- [x] Add ESLint (`eslint-plugin-react-hooks` + `jsx-a11y`) — see D27.
- [x] DB CHECK for `promo_price < price` when `is_promotion` — `0004_product_promo_price_check.sql`,
  written, validated, and **applied to the live project** (`fsxdnmnycizjkgstokze`) with owner
  go-ahead. See D32.
- [ ] **Backend** (later) — plan changes are an owner/billing action; no seller-facing plan
  toggle. A minimal admin/owner path to set a shop's plan is out of frontend scope.
- [ ] **Owner** — add the production origin's `/admin/onboarding` URL (e.g.
  `https://minishop-xi-brown.vercel.app/admin/onboarding`, plus any future custom domain) to
  Supabase **Auth → URL Configuration → Redirect URLs** allow-list. The code fix in D36
  (`emailRedirectTo: window.location.origin + '/admin/onboarding'`) only takes effect if GoTrue's
  allow-list contains that URL — otherwise the confirmation link is rejected or silently falls
  back, same failure the fix was meant to close. Dashboard-only; no migration/code artifact needed.
  **Lower priority now that D43 ships an OTP-code confirmation path that doesn't depend on the
  link at all** — still worth doing for the small share of sellers who click the link successfully.
- [ ] **Owner — dashboard-only, unblocks D43, superseded in scope by D44** — edit the **Confirm
  signup** email template (Supabase Dashboard → Authentication → Email Templates) to include
  `{{ .Token }}` (the 6-digit code the app's new confirm screen expects). The frontend side of
  this is shipped (D43) but is useless until the email actually contains a code to type. **Cannot
  be done until D44 (below) is done first** — Supabase disables template editing entirely without
  custom SMTP configured. See D43 for the exact template text.
- [ ] **Owner — blocks the pilot, no code/migration artifact — configure custom SMTP** (D44).
  This project has never had one configured; Supabase Auth is still on the default/shared mailer,
  which (a) disables email template editing outright (blocking the task above) and (b) per
  Supabase's own docs is not for production use regardless — best-effort only, no SLA, a rate
  limit of only a few emails/hour. **No real seller can reliably receive any auth email
  (confirmation, password reset) until this is done.** Recommended: Resend (free tier, no card
  required, simplest Supabase integration) — sign up at resend.com, create an API key, then in
  Supabase Dashboard → Authentication → Emails → SMTP Settings enter host `smtp.resend.com`, port
  `465`, username `resend`, password = the API key, sender email `onboarding@resend.dev` (Resend's
  shared test domain — fine to start with; a verified custom domain improves deliverability
  later). See D44 for the full reasoning and alternatives (Brevo, SendGrid, Postmark, AWS SES).

**Next Session — start here:**
1. Confirm the owner has configured custom SMTP (D44, Open Tasks above) — this unblocks
   everything else in this list; without it, no auth email works reliably for any real seller.
2. Confirm the owner has then edited the "Confirm signup" email template to include `{{ .Token }}`
   (D43, Open Tasks above) — only possible once (1) is done.
3. Confirm the owner has added the production redirect URL to Supabase's allow-list (open task
   above, D36) — secondary now that D43 doesn't depend on it, but still worth closing.
4. Everything else in this list is owner-blocked (live-verify, pilot) — not something a Claude
   Code session can push forward alone; confirm with the owner before spending time on those
   instead.

**Explicitly NOT in v1:** auto payment verification (Phase 2 moat), AI/chatbot features, custom domains, staff accounts, deep analytics, a native app, multi-courier APIs.

**Phase 2, once paying sellers exist:** auto payment verify (KBZPay/Wave notification forwarder → webhook → match), analytics, staff seats, custom domains, pricing from real willingness-to-pay data.

## Decisions

- D47 (2026-09-19) — **Repo audited for agent-readiness and documentation truth; both
  had real defects.** Two classes of finding:
  **(a) Stale paths the D46 restructure itself introduced.** 24 references across 12 source
  files still named the pre-restructure layout (`src/lib/backend.ts`, `src/lib/store.ts`,
  `src/lib/api.ts`, `src/pages/admin/Onboarding.tsx`, `src/data/products.ts`) inside
  comments. Files moved; the comments describing them did not. In a repo navigated by
  coding agents this is not cosmetic — comments are the map, so a wrong path actively
  misroutes. All 24 repointed. One was stale from long before D46:
  `shopContext.ts` still claimed "there is no routing yet to supply that", years after
  `/s/<slug>` shipped.
  **(b) Documentation that contradicted the code.**
  `.env.example` said `VITE_DEFAULT_PLAN` "defaults to `business`" and that per-shop plans
  did not exist yet ("a `shops.plan` column, a Backend task") — both false since 0003 and
  the fail-closed change in PR #25; a reader following it would have configured the
  opposite of the real behavior. `README.md` repeated the same wrong default.
  `supabase/README.md` listed **only `0001`** in its migrations table (six versions and two
  years of schema missing), pointed at `context/infrastructure.md` which does not exist in
  this repo, and listed two already-shipped items (Storage buckets, anon rate limiting) as
  open Phase 2 work. `CLAUDE.md` said the decision log ran "D1–D33". All corrected.
  **Agent tooling:** the repo had **no `AGENTS.md`**, so Codex and every other non-Claude
  agent started with zero project instructions — CLAUDE.md is Claude-specific and is not
  read by them. Added one that *points to* `CLAUDE.md` rather than copying it, so the two
  cannot drift (the exact failure mode this audit found everywhere else). Node 22 was
  claimed in `README.md` and pinned in CI but enforced nowhere locally — added `.nvmrc`
  and `engines`.
  **Left for the owner to decide** (see Open Tasks): no `.mcp.json`; `.claude/settings.json`
  commits two personal plugin choices to the repo; 13 of the 15 vendored skills are
  third-party UI/a11y skills (4.5 MB, 193 files) whose `allowed-tools` name MCP servers
  this project does not run.

- D46 (2026-09-19) — **`src/` restructured: feature-first, with the layering enforced by lint.**
  The old layout had `src/lib/` as a 19-file dumping ground (infrastructure, domain types, React
  providers and utilities side by side), an 822-LOC `backend.ts` holding every query for both
  audiences, and — the actual defect — a **dependency inversion**: the production Supabase layer
  imported its domain types (`Product`, `AdminOrder`, `ProductPatch`, …) from `lib/api.ts`, the
  *localStorage demo backend*. The demo was the type authority for production, which is also why
  it could never be dropped from the production bundle.
  **New shape:** `domain/` (pure types + rules, leaf of the import graph) ← `core/` (Supabase
  client, storage) and `shared/` (cross-feature UI/util) ← `features/*` (tenancy, catalog, cart,
  checkout, orders, shipping, billing, shop, auth, admin — each owning its own `api/`,
  `components/`, `pages/`) ← `data/` (the demo-vs-live switch + the one module that composes
  across features) ← `app/` (composition root: `App.tsx` + `routes/`).
  **Enforcement, not convention:** `eslint.config.js` encodes the arrows with
  `no-restricted-imports`, so `domain/` importing React, a feature importing another feature's
  `api/`, or a page importing `liveApi` directly all fail `npm run lint`. The CLAUDE.md hazard
  "never import `backend.ts` directly" is now structurally impossible rather than a written rule.
  `@/*` was repointed from the repo root (it was unused) to `src/*` and is now the canonical
  import prefix — no deep relative paths.
  **Scope discipline:** behavior-preserving by construction — no runtime logic was rewritten, only
  moved and re-wired. Verification: `tsc --noEmit` clean, ESLint 0 errors (13 pre-existing `any`
  warnings unchanged), 7/7 tests pass, and the production bundle went 706,305 -> 706,439 bytes
  (+0.019%, the cost of the composition spreads). `git` recorded the moves as renames, so
  `git log --follow` still works on every file.
  **Deliberately NOT included** (owner chose "structure only"): mapping the 16 DB error codes from
  `0007` to Burmese copy, dropping the demo layer from the production bundle, and test/CI
  hardening. All three remain open below.

- D45 (2026-09-19, backfilled) — **PR #24 and #25 recorded.** PR #24 added the repo's first CI
  workflow (`.github/workflows/ci.yml`: lint -> test -> build on every PR and on `main`), the first
  test suite (`tests/`, native `node --test`, no framework) and `npm run check`. PR #25 ("production
  hardening") added migrations `0005_fix_storage_policy_path`, `0006_optimize_rls_and_fk_index` and
  `0007_production_hardening` — **all applied to the live project on 2026-09-16** — plus
  fail-closed plan resolution (`planRules.ts`: unknown/missing plan now resolves to `starter`, not
  `business`), fail-closed tenant routing (a `/s/<slug>` route with Supabase unconfigured now shows
  "service unavailable" instead of silently serving demo data), and CSP/HSTS/frame-ancestors
  response headers in `vercel.json`. Consequence worth flagging: `0007` moved plan gating from
  frontend-only to **DB-enforced**, and raises 16 typed exceptions that no frontend code maps to
  Burmese copy yet — a buyer who trips the rate limit currently sees the raw string
  `rate_limit_exceeded`. Tracked as an open task below.

- D44 (2026-09-15) — **Found, mid-D43-rollout, that this project has never configured custom
  SMTP** — a deeper, pre-existing gap than D43's `otp_expired` fix addresses. Trying to apply
  D43's own recommended email-template edit ("Confirm signup" → add `{{ .Token }}`), the owner
  hit a locked template editor; a screenshot of the Supabase dashboard confirmed why: a banner
  reading "Set up custom SMTP to edit templates — Emails will be sent using the default templates"
  with the Subject/Body fields disabled. Checked Supabase's own docs
  (`mcp__Supabase__search_docs`) for what the default/built-in mailer actually is: **explicitly
  not for production** — "best-effort... intended for exploring and getting started, testing with
  the project's own team, toy projects or demos, not mission-critical" — no SLA on delivery or
  uptime, and a rate limit of only a few emails/hour (`auth.rate_limits.email.inbuilt_smtp_per_hour`,
  a handful by default). **Consequence: this was never just a template-content bug — no real
  seller could have reliably completed signup via email at all**, on any confirmation flow
  (link-based, the original design, or D43's code-based fix), because the mailer sending it was
  never suitable for real users to begin with. D43's diagnosis (email prefetching) and fix (a
  6-digit code) are still correct and necessary — they just aren't *sufficient* on their own,
  since GoTrue can't send the email carrying that code reliably without a real SMTP provider
  behind it.
  **Recommended fix, given to the owner, not yet actioned:** configure Resend as custom SMTP
  (`smtp.resend.com:465`, username `resend`, password = a Resend API key, sender
  `onboarding@resend.dev` to start) — chosen over Brevo/SendGrid/Postmark/AWS SES for the
  simplest Supabase-specific setup path and a free tier (3,000/month, 100/day, no card) that
  comfortably covers pilot-stage volume. Once SMTP is live, Supabase unlocks template editing and
  D43's owner task (add `{{ .Token }}` to "Confirm signup") becomes doable.
  **Unblocked the one test account this was found on, not the underlying gap:** `irouee@gmail.com`
  (the same account from D43) was confirmed directly via `email_confirmed_at = now()` over SQL, so
  manual testing of the admin console isn't blocked while SMTP setup is pending — this does
  **not** substitute for the real fix, since it bypasses email delivery entirely rather than
  fixing it; no future real seller gets this treatment, only this one diagnostic account.
  **Correction to D43's own scope claim:** D43 said its frontend change would let sellers confirm
  "once the owner edits the template." That was incomplete — the template edit itself was already
  blocked by this gap, so D43 alone could never have closed the loop no matter how quickly the
  template got edited. Recorded here rather than editing D43's entry, per this file's own
  convention (D33) of layering corrections forward instead of rewriting history.
- D43 (2026-09-15) — **Replaced the clickable email-confirmation link with an in-app 6-digit
  code as the primary signup-confirmation path — a real production failure, not a hypothetical
  one.** The owner hit `otp_expired` ("Email link is invalid or has expired") clicking the
  confirmation link for a genuine fresh signup (`irouee@gmail.com`), on the very first click,
  within minutes of the email being sent. Checked the row directly
  (`auth.users.confirmation_sent_at` unchanged across both reported failures — only one email was
  ever sent, so this wasn't the user re-signing-up and clicking a stale link) and confirmed via
  Supabase's own troubleshooting docs
  (`mcp__Supabase__search_docs`, "OTP Verification Failures: 'token has expired' or 'otp_expired'
  errors") that the standard cause is **email prefetching**: email clients and corporate/consumer
  security scanners routinely auto-visit links in incoming mail to scan them for phishing, which
  silently consumes a GoTrue confirmation token (single-use by design) before the real recipient
  ever clicks — surfacing to the user as an instantly "expired" link even though nothing about
  timing or their own action was wrong. This is Supabase's own documented failure mode for this
  exact error, with their own documented fix: include `{{ .Token }}` (a 6-digit OTP) in the email
  template instead of relying solely on `{{ .ConfirmationURL }}`, and verify it client-side via
  `supabase.auth.verifyOtp({email, token, type: 'signup'})` — a typed code isn't a URL, so nothing
  can prefetch it.
  **Frontend changes (shipped this PR):**
  - `src/lib/adminAuth.tsx` — added `verifyEmailOtp(email, token)` (calls `verifyOtp({..., type:
    'signup'})`) and `resendSignupCode(email)` (calls `auth.resend({type: 'signup', email})`) to
    `AdminAuthValue`. `mapAuthError()` extended with Burmese messages for `otp_expired`/invalid-code
    responses. `signUp()` keeps passing `emailRedirectTo` (D36) — the link isn't removed from the
    flow, only demoted from being the *only* path, so a seller who clicks a link that happens to
    survive prefetching still lands correctly.
  - `src/pages/admin/Login.tsx` — added a third `mode: 'confirm'` alongside `login`/`signup`. After
    `signUp()` reports `needsEmailConfirmation`, the form switches to a code-entry screen (6-digit
    input, `inputMode="numeric"`, `autoComplete="one-time-code"` for mobile keyboard/autofill
    support) instead of bouncing back to the login tab with a "check your email" notice. Submitting
    calls `verifyEmailOtp` and navigates to `/admin` (→ onboarding) on success, exactly like a normal
    login. A "ကုဒ်အသစ် ပို့ရန်" (resend code) button calls `resendSignupCode`. The login/signup tab
    bar is hidden during this step (it isn't one of the two tabs).
  - `tsc --noEmit`, `eslint .` (0 errors, only the pre-existing `no-explicit-any` warnings scoped
    out by D27), and `vite build` all pass.
  **Owner action still required, dashboard-only, blocking (see Open Tasks) — this PR alone does
  NOT fix the reported bug yet:** the default "Confirm signup" email template
  (`mailer_templates_confirmation_content`, confirmed via `search_docs`) contains only
  `{{ .ConfirmationURL }}` — no project has `{{ .Token }}` in it until an owner adds it. Go to
  **Supabase Dashboard → Authentication → Email Templates → Confirm signup** and add the code
  somewhere visible, e.g.:
  ```html
  <h2>Confirm your email address</h2>
  <p>Enter this code in the app to finish signing up:</p>
  <p style="font-size:28px;font-weight:bold;letter-spacing:4px">{{ .Token }}</p>
  <p>Or follow this link: <a href="{{ .ConfirmationURL }}">Confirm email address</a></p>
  ```
  Keeping the link as a fallback is fine (harmless for sellers whose email doesn't prefetch) —
  the app now accepts either path to a confirmed session, whichever survives.
  **Not done this round:** the actual "irouee@gmail.com" test account's confirmation was **not**
  bypassed via SQL — the user chose the code-flow fix over an immediate SQL-confirm unblock, so
  that account stays genuinely unconfirmed until the owner edits the template and it (or a fresh
  signup) goes through the new code path for real.
- D42 (2026-09-15) — **Plan-gating live-verify, done by this session — automated, not by the
  owner.** Every prior sandbox this project used (D28, D30) could not reach `*.supabase.co` or
  `*.vercel.app` at all (`curl` → 403 at the egress proxy), which is why this specific Open Task
  was scoped to the owner from the start. This session's sandbox could reach both
  (`curl https://fsxdnmnycizjkgstokze.supabase.co/rest/v1/` → 401, i.e. reachable; a live Vercel
  URL → 200) — a session-environment difference, not a repo or code change — so rather than wait
  on the owner, the verification was done directly.
  **Method:** a local `vite` dev server was pointed at the real `fsxdnmnycizjkgstokze` project
  (`.env.local`, gitignored, anon key only). Playwright (the pre-installed Chromium; Chromium
  itself needed explicit `--proxy-server`/`--proxy-bypass-list` args to reach the sandbox's egress
  proxy — it does not read the shell's `HTTPS_PROXY` env var the way `curl`/Node do) drove a real
  signup through the app's own `/admin/login` signup tab (not a fabricated `auth.users` row — D28
  explicitly warned against that shortcut). Email confirmation has no inbox to click in this
  sandbox, so `auth.users.email_confirmed_at` was set directly via `mcp__Supabase__execute_sql` for
  that one already-real signup — confirming a real signup, not fabricating one. Onboarding then
  created a real shop (`plan` defaulted to `starter` per the 0003 migration, confirmed — the
  `VITE_DEFAULT_PLAN` env var this session also set to `business` had **no effect**, correctly:
  `resolvePlan()`'s `shop.plan` DB column wins once it's non-null, which it always is post-0003;
  the env var only ever matters for a shop with `plan is null`, which no shop is anymore). Each of
  the 6 gated surfaces (5 named in Open Tasks + the order last-5 payment-verify section, tested via
  one throwaway `orders` row inserted directly since it's a rendering check, not a `place_order()`
  business-logic check already covered by D28) was checked via in-app SPA navigation (not repeated
  `page.goto` reloads — those were tried first and produced flaky/racy redirects, because a hard
  reload re-bootstraps the whole Supabase-session + `PlanProvider` shop-fetch from scratch every
  time; clicking the sidebar nav links instead reuses the already-resolved session/shop state and
  was reliable). The shop's `plan` column was flipped `starter → business → starter` via SQL
  between passes (not two separate `VITE_DEFAULT_PLAN` deploys, since the DB column already
  determines the outcome regardless of the env var — see above).
  **Result — all 6 checks passed both directions** (HIDE under starter, SHOW under business):
  shipping-zone nav link, dashboard "Stock analytics" panel, Settings "Logo နှင့် branding" card,
  product-modal "Promotion" section, the shipping-zone page itself (direct nav), and the order
  detail's "ငွေပေးချေမှု စစ်ဆေးရန်" (last-5) section — the last of these is gated by conditional
  omission (`{condition && <section>}`), not an `UpgradeCard`/`UpgradeInline`, unlike the other
  five. Settings/dashboard also visually confirmed via screenshot that non-gated fields
  (name/phone/default-fee, the revenue/order-count KPI row) remain present and usable on starter.
  **Cleanup:** the test auth user and shop were deleted via SQL immediately after (shop deletion
  cascades to the one test order); a post-delete `count(*)` query confirmed 0 rows left in any of
  the three tables. The local dev server was stopped; `.env.local` (gitignored, anon key only, no
  service_role) was left in place for any future session that needs to repeat this.
  **Not established by this D42 pass:** the real TikTok in-app WebView environment (still its own
  separate Open Task) — this used desktop Chromium against a local dev server, not the WebView
  or a deployed Vercel preview. **User (project owner) explicitly authorized** this
  data-creation-and-deletion approach against the production Supabase project before it ran.
- D41 (backfilled 2026-09-15, commit dated 2026-09-14 20:08) — **Recorded the standing session
  communication preference in `CLAUDE.md`.** Every session working this repo replies to the user
  in Burmese and ends its reply with an explicit next-action line (verbatim prompt text + whether
  it's a new session or the current chat) until the project owner says the project is done. This
  entry itself exists because that preference had been added to `CLAUDE.md` without a matching
  `PROJECT.md` record — the five entries below (D37-D40) were found the same way: `git log
  09999f5..cd702c3` (the range since D33/PR #11 merged) turned up five substantive commits with no
  corresponding decision-log entry. **Process note:** this file's own D29 hazard ("verify actual
  repo state, don't trust what should be true") applies to *itself*, not just to PR-merge state —
  a future session should diff `git log` against this file's own narrative before trusting either.
- D40 (backfilled 2026-09-15, commit dated 2026-09-14 19:33) — **Restyled the admin dashboard to
  match the storefront's D39 retheme, and fixed a real styling bug in the process.** The seller
  Overview page's revenue KPI card got a dark ink+gold "hero" treatment, other stat chips moved off
  default Tailwind hues onto the brand/gold tokens, and list rows gained hover feedback. While doing
  this, `src/index.css`'s gold color scale was found incomplete — `PlanGate.tsx`'s Business-upsell
  badge, upgrade card, and inline-lock components reference `bg-gold-100`/`border-gold-300`/
  `text-gold-700`, but only `gold-400/500/600` were ever defined as theme tokens. Those classes had
  been silently no-ops, so **the Business-plan upsell UI had been rendering with no gold styling at
  all** — undetected because nothing in the build/lint pipeline catches an undefined Tailwind
  utility class. Filled out `50/100/200/300/700/800` to close the gap. **Relevant to the still-open
  "Owner live-verify plan gating" task (Open Tasks):** that verification should be re-run against
  current `main`, not against pre-D40 styling, since the visual symptom it would have caught is now
  fixed independently of the gating logic itself (which was never wrong — only its CSS was).
- D39 (backfilled 2026-09-15, commit dated 2026-09-14 18:40) — **Retheme'd the storefront to a
  "premium minimalist boutique" look**, replacing the pink/cyan TikTok-derived palette with a
  near-black CTA + warm porcelain + muted-gold system (`src/index.css` brand/gold/cream/ink tokens).
  `Layout.tsx` gained a mobile bottom tab bar, replacing the header hamburger (now redundant at that
  width); `Home.tsx` gained a circular category quick-link strip; `ProductCard.tsx` gained a
  floating quick-add button paired with a single full-width buy-now action, replacing the old
  stacked add/buy pair. Purely visual/UI — no data-layer, routing, or plan-gating logic touched.
- D38 (backfilled 2026-09-15, commit dated 2026-09-14 18:27) — **Moved the Supabase migration
  procedure out of always-loaded `CLAUDE.md` into an on-demand skill**
  (`.claude/skills/supabase-migration/SKILL.md`) — the three-step migration checklist (file, apply,
  regenerate types) only matters mid schema-change, so it no longer costs context on every session.
  The safety-critical rule itself ("never apply to production without the owner's go-ahead", D7)
  stays in `CLAUDE.md` since that constraint applies regardless of whether a migration is in
  progress. `CLAUDE.md`'s own "Schema changes" bullet (Supabase backend section, above) already
  points here.
- D37 (backfilled 2026-09-15, commits dated 2026-09-14 17:20-17:23) — **Added design-system
  groundwork, reference-only, no app code touched.** `design/design.md` documents the
  storefront/admin visual language as it stood at the time (grounded in `src/index.css` and the
  real screen inventory), and `design/themes/{minimal,bold,classic-shop}.md` record three proposed
  store themes from a reference mockup as specs to build against later — D39/D40 above are the
  "minimal" direction actually implemented next, same day. Separately, several UI/UX and
  accessibility skills (design-audit, accessibility-scan/audit/fix/diff/inspect, ui-typography,
  ui-ux-pro-max, vercel-composition-patterns, vercel-react-best-practices/view-transitions,
  bencium-controlled-ux-designer) were vendored into `.claude/skills/` — see
  `.claude/skills/THIRD-PARTY-SKILLS.md` for provenance; these are editor/session tooling, not
  application code, and ship no runtime behavior of their own.
- D36 (2026-09-14) — **Fixed the fresh-signup email confirmation redirect.** `adminAuth.tsx`'s
  `signUp()` called `sb.auth.signUp({email, password})` with no `options.emailRedirectTo`, so
  Supabase fell back to the project's dashboard-configured Site URL for the confirmation link —
  `localhost` in a project whose Site URL had never been updated for production, matching the
  reported symptom (production signup confirmations returning to localhost instead of the live
  app). Fixed by passing `options: {emailRedirectTo: `${window.location.origin}/admin/onboarding`}`,
  so the link always points at whatever origin the app is actually running on (the production
  domain in prod, `localhost` in local dev) and lands a freshly-confirmed seller straight on
  `/admin/onboarding` to create their shop. **Owner follow-up still required, dashboard-only:**
  Supabase's GoTrue only honors an `emailRedirectTo` that is already present in the project's
  **Auth → URL Configuration → Redirect URLs** allow-list — add the production origin's
  `/admin/onboarding` URL (and any future custom domain) there, or the confirmation link is
  rejected/falls back regardless of this code fix. Tracked in Open Tasks; not something this
  session can do itself (no dashboard access, and changing Auth config is an owner action per the
  same caution D7 applies to schema changes).
- D35 (2026-09-14) — **Implemented Task B (storage upload UI)**, using ONLY the existing
  `adminApi.uploadShopLogo`/`uploadProductImage`/`deleteShopLogo`/`deleteProductImage`
  (`src/lib/backend.ts`) — no new storage layer, no `database.types.ts` change — following the
  ordering invariant D33 consolidated (Storage and the `products`/`shops` row are two systems with
  no shared transaction: upload before the write, pass the complete final URL list into the write,
  delete newly-uploaded objects on any failure, never delete an old/removed object until after the
  write that stops referencing it succeeds).
  - New `src/lib/imageUpload.ts` — pure browser-side helpers, no Supabase calls of its own (so this
    is not a second storage layer): `validateImageFile` (PNG/WebP only, JPG/JPEG rejected, ~5MB
    cap, Burmese error text), `prepareImageForUpload` (canvas-based PNG→WebP conversion; WebP
    passes through unconverted), and `deriveStoragePath(url, bucket)` (recovers a previously
    uploaded object's Storage path from its persisted public URL — `products.images` and
    `shops.logo_url` store only the URL, confirmed still no path column in `0001_init_saas.sql`).
  - `src/lib/backend.ts`'s `SHOP_LOGOS_BUCKET`/`PRODUCT_IMAGES_BUCKET` (previously private) are now
    exported and re-exported from `src/lib/store.ts`, so `deriveStoragePath` callers never hardcode
    a bucket name a second time.
  - `src/pages/admin/Settings.tsx` — the logo URL text input is replaced with a file picker +
    preview. Upload happens on file select (`adminApi.uploadShopLogo`), held as `{url, path}` in
    state without calling `updateOwnShop` yet. Save writes the new URL first; only once that
    succeeds does it delete the previous logo object (path via `deriveStoragePath`). A failed save,
    or unmounting (navigating away) before saving, deletes the just-uploaded object instead — an
    unmount cleanup effect (ref-backed, runs once) covers the navigate-away case. Picking a second
    file before saving deletes the first pick's now-orphaned upload immediately (it was never saved
    anywhere, so it's safe to drop right away). A small remove (✕) control replaces what clearing
    the old text field used to do.
  - `src/pages/admin/AdminProducts.tsx`'s `ProductModal` — the URL-per-line textarea is replaced
    with a thumbnail grid (existing kept images + newly-picked local files, previewed via
    `URL.createObjectURL`, revoked on unmount/removal) plus an add-file control. Uploads happen
    only inside `save()`, immediately before the create/update call: every staged file is uploaded
    and tracked in a local list; if any file in the batch fails, everything uploaded so far in that
    attempt is deleted and the save aborts before the row write. The row write receives the
    complete final `images[]` (kept URLs + newly uploaded URLs) as its payload. Only after that
    write succeeds are seller-removed images deleted from Storage (path derived the same way); if
    the write itself fails, only this attempt's new uploads are rolled back — removed-image objects
    are left alone since the row was never rewritten.
  - Validated by hand-tracing every branch of the invariant (upload-before-write,
    complete-list-into-write, delete-new-on-any-failure, never-delete-old-before-write-succeeds)
    against both call sites, given D33's record of three prior review rounds each catching a
    different variant of exactly this ordering mistake. `tsc --noEmit`, `eslint .`, and `vite
    build` all pass.
- D34 (2026-09-14) — **Owner decisions closing Task B's two open questions (D33/Open Tasks) and
  confirming Vercel cleanup (D30's open item).**
  1. Manual image URL entry is removed entirely — no fallback text input; upload is the only path
     for both the shop logo (Settings) and product images (`ProductModal`).
  2. Accepted image formats are restricted to PNG and WebP; JPG/JPEG is rejected client-side before
     any upload attempt. PNG is converted to WebP client-side (canvas) before calling the existing
     `adminApi.uploadShopLogo`/`uploadProductImage`; WebP is uploaded unchanged — reduces payload
     size for sellers uploading over TikTok in-app WebView connections and keeps stored objects in
     one uniform format.
  3. The orphaned `my-projects-msx4` Vercel project's link to this repo has been deleted by the
     owner directly in the Vercel dashboard — closes the D30 duplicate-deployment concern. This
     session made no Vercel API/MCP call to verify it independently; the owner's report is taken as
     authoritative for their own dashboard action, consistent with D28/D30's finding that this
     sandbox has no reliable way to inspect Vercel project-linking state itself.
  **Not specified by the owner:** the exact upload size cap. D35's implementation defaults to 5MB
  pre-conversion, inside the 2–5MB range this doc had already flagged for WebView bandwidth —
  revisit if the owner wants a different number.
- D33 (2026-09-14) — **Three Codex review rounds across PR #11/#12 caught eight doc defects in
  the Task B (storage upload UI) handoff plan before anything was built — all fixed, no app code
  touched (this is a docs-only PR; the defects were in the *plan*, not in shipped code).**
  1. **The draft plan proposed a new `src/lib/storage.ts` duplicating existing code.**
     `adminApi.uploadShopLogo`/`uploadProductImage`/`deleteShopLogo`/`deleteProductImage`
     already exist in `src/lib/backend.ts:774-818` — tenant-scoped path construction, upload,
     and public-URL return are already correct and already wired to the D25/0003 storage
     policy. They have zero callers today (grepped: only defined, never referenced from any
     page), so the actual gap is UI wiring only, not a backend. Writing a second implementation
     would have duplicated security-sensitive path logic and created two competing upload APIs.
     Open Tasks' Task B entry is corrected to call the existing methods.
  2. **The handoff recorded PR #11's live GitHub state ("open, clean, unmerged") as if durable.**
     That statement is true only until #11 merges, at which point committing it to `main` makes
     it self-invalidating — a future reader would see "unmerged" in a file that only reaches them
     because the PR merged. Reworded to a durable, checkable instruction instead ("if `git log
     main` doesn't show it, merge it") rather than a point-in-time claim.
  3. **The plan's "upload on file select" step would orphan Storage objects.**
     `ProductModal` (`AdminProducts.tsx`) only persists `images` inside `save()`; Cancel
     (`onClose`) closes with no cleanup, and a rejected `createProduct`/`updateProduct` call
     leaves whatever was already uploaded. Corrected to: stage picked files as in-memory `File` +
     local preview URLs, upload only inside `save()` immediately before the create/update call,
     and on that call failing, compensate by calling `deleteProductImage` on everything just
     uploaded in that attempt before surfacing the error.
  4. **The plan's "call `deleteProductImage(path)`/`deleteShopLogo(path)` to remove an image"
     step has no `path` to call it with**, for any image that survived a prior save: `products`
     and `shops` persist only the public URL (`images text[]` / `logo_url`, no path column), so a
     freshly-reopened modal has URLs, not paths. Corrected to derive `path` from the deterministic
     Supabase Storage public-URL shape (`{SUPABASE_URL}/storage/v1/object/public/<bucket>/<path>`)
     rather than adding a path column.
  5. **A third round then found four more variants of the same underlying ordering mistake** in
     points 3-4's fix, one per remaining edge case: (a) the Settings logo path had the identical
     orphan-on-failure issue as point 3, just not yet corrected there — uploading on select and
     only deferring the *DB write* isn't enough if the seller navigates away or another field's
     validation fails first; (b) a multi-file batch's rollback only covered the DB call throwing,
     not an earlier upload in the same batch succeeding while a later one in the batch failed;
     (c) the plan said to append new URLs to `images[]` *after* the DB write succeeded, which is
     backwards — the write itself has to receive the complete final list as its payload, or it
     persists the stale one; (d) removing a previously-saved image by calling `deleteProductImage`
     immediately (right after point 4's fix made that call possible) still deletes the object
     before the row write that stops referencing it is confirmed to succeed, so a cancel or a
     failed save leaves the row pointing at a now-deleted object. **Rather than patch a fifth
     variant individually, the whole plan was rewritten around one explicit invariant** (Open
     Tasks, above): upload before the write, pass the complete final list into the write, delete
     newly-uploaded objects on any failure, and never delete an old/removed object until *after*
     the write that stops referencing it succeeds. All four (a)-(d) are instances of that one rule.
  **Lesson for future handoffs:** before drafting a plan for the next session, (a) grep the
  codebase for what already exists (`adminApi`, `backend.ts`) rather than reasoning from the DB
  schema (D25/0003) alone — the schema being in place says nothing about whether the client
  methods on top of it were already written; (b) don't trace a UI plan's failure paths one
  symptom at a time (three rounds, one fix each, is what happens when you do) — state the general
  ordering/consistency invariant a two-system write implies (here: Storage + a DB row, no shared
  transaction) *once*, up front, and derive every step from it; a docs-only PR is not lower-risk
  to review carelessly — a wrong plan costs the next session exactly as much as wrong code would.
- D32 (2026-09-14) — **Wrote, validated, and — with owner go-ahead — applied
  `0004_product_promo_price_check.sql` to the live project.** Adds `constraint
  products_promo_price_lt_price check (not is_promotion or (promo_price is not null and
  promo_price < price))` — closes the "guarded client-side only" gap noted in Open Tasks
  (`AdminProducts.tsx`'s `save()` already enforces the same rule, so this only rejects writes that
  bypass the admin form: buggy client code, manual SQL, a future admin tool).
  **Pre-apply data check (run twice — once before the PR, once immediately before applying):**
  live `products` table on `fsxdnmnycizjkgstokze` had **0 rows** both times (pre-pilot), so there
  was nothing to violate the new constraint. **Pre-apply validation** (rolled back
  `BEGIN…ROLLBACK` on the live project, nothing persisted — same pattern as D25/D28): added the
  constraint, then confirmed inside one throwaway shop (+ throwaway `auth.users` row for the
  `owner_id` FK) that (1) `promo_price = price` with `is_promotion=true` is rejected, (2)
  `promo_price null` with `is_promotion=true` is rejected, (3) a valid promo row (`promo_price <
  price`) inserts fine, (4) a non-promotion row with `promo_price >= price` is unaffected (the
  constraint only binds when `is_promotion`). `tsc --noEmit`, `eslint .`, and `vite build` all pass
  on the branch (lint: 0 errors, only the pre-existing `no-explicit-any` warnings D27 already
  scoped out; build: same pre-existing >500kB chunk-size warning, unrelated to this change).
  Merged as PR #10, then **applied for real** via `mcp__Supabase__apply_migration`
  (`product_promo_price_check`, version `20260914155515`) after explicit owner go-ahead.
  **Post-apply verification:** `pg_constraint` shows `products_promo_price_lt_price` live with the
  expected definition; `products` still has 0 total / 0 violating rows (existing data
  untouched — there was none to touch); `mcp__Supabase__list_migrations` lists
  `product_promo_price_check` as applied; `main` re-fetched and confirmed to contain the migration
  file at the expected path. **Not done this round:** regenerating `database.types.ts` — skipped
  deliberately, since a `CHECK` constraint adds no column and changes no TypeScript-visible shape.
  - **Side-finding, out of this task's scope:** `mcp__Supabase__list_migrations` shows two applied
    migrations on the live project with no matching local file —
    `fix_storage_policy_path` (20260913231045) and `optimize_rls_and_fk_index` (20260913231442),
    both applied same-day as D25's `0003`. Repo `supabase/migrations/` only has 0001–0003 (now
    0004). This is repo/remote drift pre-dating this session — flagged here per the D29 hazard
    ("verify actual state, don't trust what should be true") rather than fixed, since it's outside
    the promo-price-check task.
- D31 (2026-09-14) — **Owner completed the real browser/WebView live-verify on the deployed
  preview** (`https://minishop-xi-brown.vercel.app`), closing the second D28 blocker that this
  sandbox structurally cannot close itself (no network path to `*.vercel.app`/`*.supabase.co`).
  Owner reported the click-through as working ("I checked. It is OK.") after D30 got the
  deployment live with the real Supabase env vars. This completes Milestones A/B/C/C.1 end to
  end: routing, buyer storefront on the live backend, seller admin, and checkout fee parity.
  **Scope, precisely — two things this does NOT establish:** (1) it does not cover the
  commercialization plan-gating layer's own Starter-vs-Business feature-hiding behavior, which
  needs its own two-build verification (`VITE_DEFAULT_PLAN=starter` vs `=business`); (2) exercising
  C (seller admin) only requires *some* logged-in account with a shop — it does not by itself prove
  the account came from a fresh signup (the signup tab on `/admin/login`, which is where GoTrue
  account creation actually happens — `/admin/onboarding` only creates the shop for an
  already-authenticated session) rather than a pre-existing one, so D28's specific "real
  onboarding, not hand-seeded" gap is not provably closed by this alone (Codex caught this twice:
  first that an earlier draft overclaimed it was closed, then that the fix still pointed at the
  wrong route for where signup happens). Both points stay open
  in Open Tasks, alongside the real-seller pilot.
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
  - **Recurred verbatim on PR #11 (same day, D33):** a second Codex review round's fix (`a9632cf`)
    was pushed and its threads replied-to + resolved, but PR #11 had already been merged at the
    prior commit (`b642f25`) moments earlier — the push landed on the branch after the merge, so
    it never reached `main` despite the same "everything looks addressed" signals D29 warns about.
    Caught by following this exact entry's own advice (`git fetch origin main` + diff against the
    last local commit) immediately after re-checking PR state. Fixed the same way as #4: cherry-picked
    the missed commit onto a fresh branch restarted from `main`, new PR (#12), never a force-push
    over the merged history. **This is now a pattern, not a one-off — treat every merge on this
    repo as "verify before trusting," permanently, not just when something feels off.**
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
- **Codex reviewer hit its usage limit** on #191 (`chatgpt-codex-connector[bot]` posted a limit notice, no findings) → no review round opened, no ledger needed. Deploy-preview bots (Vercel/Netlify) are pure noise on this repo. **Hit the limit again on #12** (2026-09-14), this time after three real review rounds (D33) — so a future session shouldn't expect a fourth round to arrive on that PR, and shouldn't read the silence as "nothing left to find."
- **Audience-bias risk is still open:** the demo video drew 6 inbound inquiries (3 day-1, 3 day-2), but real sellers versus N8N Masterclass students have not been disaggregated.
- Review coverage on the milestones: ECC `database-reviewer` (clean), `code-reviewer` (1 HIGH — arrival-date backdate, fixed), `react-reviewer` (2 HIGH — payment-confirm error handling and shipping a11y labels, fixed), and a Codex P1 (stale fee on slug change, fixed).
