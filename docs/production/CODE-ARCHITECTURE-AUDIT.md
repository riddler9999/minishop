# Code + Architecture Production Readiness Audit

Date: 2026-09-25
Branch: `audit/code-architecture-production-readiness`
Scope: code + architecture final audit/remediation only. No Production Supabase migration or Production data mutation was performed.

## Overall architecture map

`src/domain` is the leaf domain layer for plan, entitlement, order/status, slug, theme, and database error mapping.
`src/core` owns browser Supabase/storage infrastructure.
`src/shared` owns cross-feature UI/helpers.
`src/features/*` owns feature-local UI and data access.
`src/data/liveApi.ts` composes cross-feature live APIs.
`src/data/dataSource.ts` is the storefront live/demo dispatch seam.
`src/app` is the composition/routing layer.
`api/*` is the same-origin Vercel gateway for public buyer flows plus the privileged superadmin endpoint.
`supabase/migrations` contains persistence, RLS, pricing, entitlement and concurrency enforcement.
`tests` contains a mix of behavioral unit/API tests and source/regex contract tests.

## Runtime flow map

Buyer:
`/s/:slug` -> ShopRoute -> shopContext -> /api/storefront -> catalog -> cart -> /api/checkout GET -> checkout -> /api/checkout POST -> `place_order()` -> entitlement/stock/order transaction -> success -> /api/storefront-orders -> `lookup_order()`.

Seller:
Supabase Auth -> RequireAdmin -> resolveSellerGate -> own shop/application -> AdminConsole -> adminApi -> tenant-scoped feature APIs -> RLS-protected Supabase writes/reads.

Platform admin:
Supabase Auth bearer token -> /api/superadmin -> allow-listed SUPERADMIN_EMAILS -> service-role server client -> application/payment/subscription/credit/suspension operations.

## Trust and persistence boundaries

- Buyer input enters at Vercel APIs and is normalized before RPC execution; prices are not accepted from the browser.
- Tenant identity for storefront reads is URL slug + shop resolution.
- Seller writes are scoped by authenticated RLS plus explicit shop_id filters.
- Service-role is confined to the server-side superadmin helper.
- Order concurrency, stock decrement and entitlement consumption are database-owned and must remain atomic.
- Product-cap enforcement is database-owned and serialized by the shop-row lock in the final pricing migration contract.

## Findings

### P0
None confirmed in repository code during this audit. This does not replace the dedicated security or live RLS audit.

### P1-01 — Privileged API leaked raw database errors
Affected: `api/superadmin.ts`
Risk: privileged mutation failures could expose SQL/schema/constraint details into the browser.
Evidence: the endpoint returned `error.message` directly for failed writes/RPCs.
Remediation: map known typed errors through `mapDbError`; unknown failures collapse to `Action failed`.
Status: FIXED.

### P1-02 — Seller data-access paths violated the repository error-boundary contract
Affected: catalog list, order list, shipping list/mutations, billing usage/entitlement, order-pack list, seller application lookup, own-shop lookup, shop-settings read.
Risk: raw Postgres/Supabase details could surface in seller UI; inconsistent error semantics made network/DB/internal errors indistinguishable from domain-safe messages.
Remediation: route DB messages through `mapDbError` with context-specific fallbacks.
Status: PARTIALLY FIXED in the audited high-value paths; storage upload/delete raw provider errors remain accepted debt because storage errors are not DB typed errors and need a separate storage error taxonomy.

### P1-03 — Shop settings plan fallback was fail-open relative to canonical domain truth
Affected: `src/features/shop/api/settings.ts`
Risk: nullable/missing plan values were projected as `starter`, contradicting the canonical fail-closed rule and potentially presenting higher capacity than the least-privileged tier.
Remediation: fallback changed to `free_trial`.
Status: FIXED.

### P1-04 — Test architecture overuses source/regex contracts
Affected: multiple `tests/gateway-*.test.ts`, `tests/audit-hardening.test.ts`, routing/documentation contract tests.
Risk: these tests prove implementation text exists, not runtime behavior.
Remediation: retained existing tests but explicitly classify them as source contracts. New remediation test is behavioral for the pure error mapper. Critical runtime integration gaps are listed below.
Status: OPEN (test-hardening follow-up).

### P1-05 — Superadmin operational surface is high-privilege and lacks dedicated runtime behavior tests
Affected: `api/_superadmin.ts`, `api/superadmin.ts`, SuperAdminDashboard.
Risk: auth allow-list, service-role confinement, action validation and safe failure behavior are production-critical.
Remediation: raw error leak fixed; dedicated injected-dependency API tests are still required.
Status: OPEN.

### P2-01 — Module-global storefront tenant context is intentionally mutable
Affected: `src/features/tenancy/shopContext.ts`.
Risk: correctness depends on each route render synchronously setting/clearing the slug. Current SPA design is single-browser-context and route entry does this, but the pattern is brittle for future SSR/concurrent rendering or any non-route caller.
Status: ACCEPTED DEBT. Replace with explicit request/context parameterization before SSR or concurrent server rendering.

### P2-02 — DataSource Proxy has non-standard method identity semantics
Affected: `src/data/dataSource.ts`.
Risk: each property access may create a new function; developers must not retain methods or put them in dependency arrays.
Status: ACCEPTED DEBT. Current docs call this out; future refactor should use explicit stable facade functions.

### P2-03 — Superadmin list endpoint is bounded but monolithic
Affected: `api/superadmin.ts`.
Risk: 500 shops + multiple 200-row collections + per-proof signed URL calls can become latency-heavy and N+1-like as usage grows.
Status: ACCEPTED DEBT for current pre-production scale. Add pagination and lazy proof URL generation before material scale.

### P2-04 — `any` remains common at external API/UI seams
Affected: Vercel handler req/res, SuperAdminDashboard payloads, some row mapping.
Risk: schema drift can bypass TypeScript assumptions.
Status: ACCEPTED DEBT. Prioritize runtime schemas for privileged and public API payloads.

## Architecture violations found

- No confirmed domain -> React/Supabase import violation.
- No confirmed browser service-role import.
- No confirmed production storefront -> demo fallback on tenant routes.
- No confirmed seller Admin -> demo backend fallback.
- Canonical fail-closed plan rule was violated in shop-settings projection and is fixed in this branch.
- Error-boundary rule was violated by several data-access paths and is remediated for the inspected high-value DB paths.

## Critical flows and coverage quality

Behavioral coverage present:
- plan normalization and fail-closed behavior
- entitlement math
- checkout input normalization
- checkout handler POST behavior with injected RPC
- selected pure domain helpers

Source/regex-only coverage exists for many gateway and architecture invariants; this is not runtime proof.

Missing/high-priority runtime coverage:
1. Superadmin authentication/authorization/action behavior.
2. Seller RLS tenant-isolation integration against a disposable Supabase/staging database.
3. Real database transaction tests for place_order concurrency/idempotency/stock/entitlement together.
4. Product-cap concurrent create integration test against Postgres.
5. Browser E2E for tenant A -> tenant B route transitions and cart/tenant isolation.
6. Buyer order lookup anti-enumeration behavior against real RPC.
7. Network failure vs empty-state UI behavior across seller dashboard/admin lists.
8. Subscription activation/renewal/upgrade/downgrade/order-pack credit integration.

## API classification

- `/api/storefront`: public read + media proxy.
- `/api/checkout`: public read (config) + public write (server-authoritative order RPC).
- `/api/storefront-orders`: public lookup read with anti-enumeration RPC.
- `/api/storefront-config`: public read.
- `/api/health`: health/internal read.
- `/api/superadmin`: privileged superadmin read/write.
- Media proxy is embedded in `/api/storefront`.

## Data architecture observations

Production tenant routes fail closed when a slug is present without Supabase configuration.
Root/demo routes intentionally use the demo/localStorage backend.
Admin API is exported directly from liveApi and does not use demo fallback.
Buyer catalog/checkout/order lookup use same-origin Vercel APIs rather than direct browser Supabase data writes.
Seller authenticated feature modules intentionally talk to Supabase directly under RLS.

## Concurrency observations

Repository migration contracts indicate:
- order creation idempotency is DB-owned via shop + idempotency key.
- place_order owns pricing, entitlement consumption and inventory mutation.
- final product cap locks the shop row before counting products.
These repository tests include SQL/source-contract assertions. A disposable Postgres/Supabase concurrency integration suite is still required before calling these runtime-proven.

## CI / quality gates

Canonical scripts:
- `npm ci`
- `npm run lint`
- `npm test`
- `npm run build`
- `npm run check`

GitHub Actions runs install, lint/type-check, tests and build on PR/main.

## Database impact

None in this PR. No Production Supabase migration or Production data change was performed.

## Schema migration required later?

No new schema change was discovered by these code fixes. Existing migration/runtime reconciliation must still be verified in the dedicated Database/RLS audit.

## Recommended next audit domain

DATABASE + RLS + TRANSACTIONAL CONCURRENCY, using a disposable/staging database and behavioral integration tests rather than source-text migration tests.
