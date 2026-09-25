# Database + RLS + Transactional Concurrency Audit

Date: 2026-09-25
Repository: `riddler9999/minishop`
Production Supabase: `fsxdnmnycizjkgstokze` (ap-southeast-1, PostgreSQL 17)
Audit mode: Production read-only inspection + repository remediation. No Production migration or data mutation was performed.

## Executive status

**RUNTIME-PROVEN IN FREE DISPOSABLE LOCAL SUPABASE CI; PRODUCTION DEPLOYMENT STILL NOT APPROVED.**

The audit confirmed one cross-tenant RLS defect in Production and one branding Storage-policy contract drift. It also found that Extra Order pack credits were idempotent per purchase row but did not have a database-enforced identity for the underlying payment, allowing the same real payment to be represented by multiple purchase rows. Repository migration 0023 remediates these defects, but it has **not** been applied to Production.

Production read-only integrity checks found no current negative stock, plan/entitlement mismatch, quota mismatch, duplicate normalized subscription transaction IDs, or duplicate entitlement-ledger sources.

GitHub Actions run `36123942215` successfully created a disposable local Supabase stack using Docker + Supabase CLI v2.117.0, replayed the full migration chain through 0023, and executed the behavioral runtime suite against `http://127.0.0.1:54321` with no Production credentials. The job then destroyed the local stack. Runtime evidence now covers PostgreSQL transaction/concurrency behavior plus Supabase Auth/JWT, PostgREST/RPC, RLS, and Storage behavior. Source/regex tests remain contract checks only and are not used as runtime proof.

## Schema map

| Domain | Production objects | Ownership / boundary |
| --- | --- | --- |
| Identity / tenant | `auth.users`, `public.shops`, `public.shop_applications` | one shop per owner; seller-owned |
| Catalog / inventory | `public.products` | seller-owned; active rows intentionally buyer-readable |
| Orders | `public.orders`, `public.order_items` | seller-private tables; buyer mutation/read via trusted RPCs |
| Shipping | `public.shipping_zones`, `public.ninjavan_rates` | seller custom zones; public active route data |
| Checkout payment accounts | `public.payment_accounts` | seller-owned; active accounts buyer-readable |
| Subscription / billing | `public.payment_proofs`, `public.shop_entitlements`, `public.entitlement_ledger` | seller-private reads; privileged writes |
| Extra Orders | `public.order_pack_purchases` | seller submits pending proof; service-role approval/credit |
| Store media | `storage.objects` policies for `product-images`, `shop-logos`, `payment-proofs` | tenant path scoped |

All 12 public base tables inspected have RLS enabled. `shop_monthly_usage` is a `security_invoker=on` view.

## Repository vs Production drift

### Confirmed object/behavior drift

**P0 — authenticated seller inherits public storefront policies.**
Production public-read policies for `shops`, `products`, `payment_accounts`, and `shipping_zones` were defined for `public` rather than `anon`. PostgreSQL's `public` role applies to authenticated users too, so permissive public + owner policies OR together. Read-only role simulation proved Seller A could see Seller B's active shop row and active product row. The visible shop row also exposes `owner_id` and `plan`. Migration 0023 recreates storefront policies as `to anon`, leaving authenticated sellers with owner-scoped policies only.

**P1 — Store Branding Storage writes still Business-gated.**
Production `tenant_media_owner_insert/update/delete` policies require `s.plan='business'` for `shop-logos`. Repository migration 0020 removed the Business gate from `shops.logo_url` updates but did not reconcile Storage policies. Migration 0023 removes only the plan predicate and preserves owner + first-folder-segment tenant scoping.

**P1 — Extra Order underlying payment was not uniquely identifiable.**
`order_pack_purchases` had only last-5 reference + screenshot and no full transaction ID uniqueness. `admin_credit_order_pack` was retry-idempotent by purchase ID through the entitlement ledger, but two purchase rows representing the same real transfer could each be credited. Migration 0023 adds platform-managed `transaction_id`, normalized uniqueness, an approved-row requirement, and an RPC signature that requires/validates the full transaction ID.

### Migration history drift

Production migration history contains 19 timestamped entries while the repository contains 22 numbered migration files. Historical names do not map one-to-one: production-safe reconciliation migrations supersede some earlier repository migrations. This is **not by itself proof of schema drift**. Live objects were treated as authoritative and compared against the final repository state.

Before any future migration apply, deployment should reconcile migration-history mapping explicitly rather than replaying repo files by filename.

### Type drift

The maintained `database.types.ts` was not a strict 1:1 current generated schema artifact despite its header. Service-only public RPCs are omitted. This PR hand-maintains the new order-pack transaction field/RPC until a post-migration regeneration is possible. After 0023 is applied in a safe environment and later Production, regenerate types from that exact schema and review the diff.

## RLS matrix

Legend: **PROVEN** = behavioral read-only Production evidence; **PARTIAL** = policy/object inspection plus some behavior; **BLOCKED** = mutation test requires isolated DB.

| Surface | anon SELECT | Seller own SELECT | Seller cross-tenant SELECT | Seller cross-tenant writes | Status |
| --- | --- | --- | --- | --- | --- |
| shops | active rows intentionally visible | yes | **FAILED pre-fix** due public-policy overlap | not mutated in Production | PARTIAL / P0 fix proposed |
| products | active rows intentionally visible | yes | **FAILED pre-fix** for active rows | not mutated in Production | PARTIAL / P0 fix proposed |
| orders | 0 rows visible in Production role test | owner policy | no cross-tenant rows observed | not mutated in Production | PARTIAL |
| order_items | 0 rows visible anon | parent-order owner policy | Production has no orders | not mutated | BLOCKED for full A/B fixture |
| payment_proofs | 0 anon | owner-only | no B rows visible | not mutated | PARTIAL |
| shop_entitlements | 0 anon | owner-only | 0 B rows visible | no seller write policy | PROVEN read / BLOCKED write |
| entitlement_ledger | 0 anon | owner-only | 0 B rows visible | no seller write policy | PROVEN read / BLOCKED write |
| order_pack_purchases | 0 anon | owner-only | no B rows visible | insert owner check; runtime mutation blocked | PARTIAL |
| shipping_zones | intended public config | owner policy | no Production fixture rows | runtime mutation blocked | PARTIAL |
| payment_accounts | intended public active config | owner policy | no Production fixture rows | runtime mutation blocked | PARTIAL |
| shop_applications | no anon policy | own owner_id | policy inspected | runtime mutation blocked | PARTIAL |
| storage objects | public media read; proof private | owner folder policies | policy inspected | runtime mutation blocked | PARTIAL |

### Production behavioral read evidence

A read-only transaction used `SET LOCAL ROLE` and JWT-sub simulation without exposing real owner IDs:
- anonymous role saw **0** orders, order_items, payment proofs, entitlements, ledgers, and order-pack rows.
- anonymous role could read active shop rows and the base-table columns `owner_id` and `plan`.
- authenticated Seller A saw Seller B active shop and active product rows before migration 0023.
- current Production has products across 3 distinct shops, making the cross-tenant product read test meaningful.

No Production write was attempted.

## Buyer security boundary

Buyer storefront server APIs use the public anon key and select explicit public columns. Checkout POST calls `place_order`; it does not insert `orders` or `order_items` directly. Browser seller code contains only the publishable/anon key; service_role is confined to the protected server-side superadmin helper.

Production anon role tests confirmed direct SELECT of seller-private order/billing tables returned zero rows. Direct write behavior was not tested in Production.

The current public `shops` base-table policy exposes more columns than the server storefront API returns. Migration 0023 removes this exposure from authenticated sellers, but anonymous callers can still query the active `shops` table directly and see all columns allowed by table grants. This remains a **P1 hardening decision**: for strict least privilege, a future migration should expose buyer-safe views/RPCs and revoke anon base-table SELECT. It is not included in this PR because the current server storefront uses anon table reads and changing that surface requires a separately tested API migration.

## place_order() transaction audit

Production `place_order` is `SECURITY DEFINER`, has explicit `search_path=pg_catalog,public,private`, and is intentionally executable by anon/authenticated. Supabase Advisor warns about these public SECURITY DEFINER RPCs; in this architecture they are intentional buyer entry points, not automatically vulnerabilities.

Observed implementation:
- validates payment method, cart shape/size, customer fields, payment reference.
- resolves an active shop by slug.
- checks idempotency by `(shop_id,idempotency_key)`.
- locks the shop entitlement row `FOR UPDATE`.
- fails inactive/expired/exhausted entitlement.
- calculates shipping in database.
- inserts order, then locks every selected product `FOR UPDATE`.
- verifies product belongs to resolved shop and is active.
- uses authoritative database price/promo price; client totals are not inputs.
- checks/decrements stock and inserts name/unit_price/qty snapshots.
- updates totals.
- consumes exactly one monthly/purchased entitlement and writes ledger.
- catches concurrent unique idempotency conflict and reconciles to the original order.
- any uncaught exception aborts the PostgreSQL function transaction.

**Static transaction model: strong. Behavioral concurrency proof: BLOCKED in this session.**

## Concurrency model / required behavioral cases

The safe runtime harness defines:
1. same idempotency key concurrent retry -> one logical order.
2. concurrent buyers for final stock -> no negative stock, only valid winner.
3. concurrent orders for final entitlement -> quota never exceeded.
4. unknown client result + retry -> original order returned.
5. mid-order failure -> no partial order/item/stock/entitlement mutations.
6. product cap final slot concurrency -> 10/100/500 maximum.
7. same Extra Order payment across different purchase IDs -> one credit only.

None of these mutation/concurrency cases were executed against Production. They remain **BLOCKED** until a disposable/local/staging Supabase environment is available.

## Product-cap audit

Production function `enforce_product_limit` locks the owning `shops` row before count -> check -> insert and counts all product rows for the shop. Limits in the live function are free_trial 10, starter 100, business 500. Runtime contention was not executed. Status: **PARTIAL**.

Permanent delete uses seller-scoped application filters + product owner RLS. Historical `order_items.product_id` uses `ON DELETE SET NULL`, while name/unit_price/qty snapshots remain. Structural contract is correct; cross-tenant delete behavior awaits isolated mutation testing.

## Entitlement accounting

Live quotas match the canonical contract:
- free_trial: 20 lifetime, no cycle expiry.
- starter: 60 per paid cycle.
- business: 200 per paid cycle.

Current Production snapshot:
- no shop/entitlement plan mismatches.
- no missing entitlement rows.
- no quota mismatches.

`place_order` consumes monthly first then purchased balance, one ledger source per order. Seller status updates do not restore counters. Paid renewal resets `monthly_used`; free_trial is not renewable through the paid renewal RPC. Boundary/concurrency runtime tests remain BLOCKED.

## Billing / subscription audit

`activate_plan_from_verified_payment` is service-role only, locks payment proof `FOR UPDATE`, treats approved replay idempotently, enforces 29,000/79,000 prices, rejects duplicate normalized transaction IDs, calls privileged activation, and updates proof in one function transaction.

Admin activation/renewal/upgrade RPCs are service-role only and use entitlement-ledger payment references for idempotency. Renewal/upgrade lock entitlement rows; activation relies on transactional uniqueness of the ledger payment source but does not lock entitlement before the initial duplicate-reference check. Same-ref losers should roll back on unique conflict, but **concurrent runtime proof is BLOCKED**.

Current Production has zero duplicate normalized subscription transaction IDs and zero duplicate entitlement-ledger source tuples.

## Extra Order credit audit

Pre-fix:
- service-role-only `admin_credit_order_pack(p_purchase_id)`.
- purchase row locked `FOR UPDATE`.
- entitlement ledger made retry idempotent for the same purchase ID.
- **defect:** no unique underlying payment identity.

0023 proposal:
- add `transaction_id`.
- unique normalized nonblank transaction index.
- seller trigger prevents seller-controlled transaction IDs.
- approved purchases require transaction ID.
- credit RPC takes `(purchase_id, transaction_id)`, locks row, rejects missing/duplicate transaction, preserves same-purchase retry idempotency.
- superadmin route must supply transaction ID.

Production currently has zero order-pack purchase rows, so there is no dirty-data blocker in the 2026-09-25 snapshot. Re-check immediately before applying 0023.

## SECURITY DEFINER / RPC inventory

Public SECURITY DEFINER RPCs include:
- `place_order` — intentional buyer mutation boundary; anon/auth execute.
- `lookup_order` — intentional buyer scoped lookup; anon/auth execute.
- `resolve_delivery_fee` — service only.
- `activate_plan_from_verified_payment` — service only.
- subscription admin RPCs — service only.
- `admin_credit_order_pack` — service only.
- `init_shop_entitlement` — trigger helper; API roles revoked.
- `rls_auto_enable` — event-trigger helper; service only.

All inspected SECURITY DEFINER functions have explicit search_path settings. No dynamic SQL injection path was observed.

Supabase Security Advisor reports warnings for anon/auth execution of `place_order` and `lookup_order`; these are documented intentional exceptions while validation/rate-limit behavior is maintained. Advisor also reports leaked-password protection disabled (Auth hardening; outside this DB PR).

## Index / constraint findings

No index was added merely because Advisor reports it unused. Production is tiny and unused-index statistics are not evidence that an index is unnecessary.

0023 adds only the evidence-driven normalized transaction uniqueness for order-pack payments.

## Database error contract

New 0023 errors:
`transaction_id_required`, `duplicate_transaction_id`, `purchase_already_approved`, `transaction_id_is_platform_managed`.

The superadmin endpoint returns privileged DB error messages only to an authenticated allow-listed platform owner. Buyer checkout maps DB errors through the domain mapper rather than returning raw SQL metadata.

## Migration safety for 0023

- No DROP TABLE, TRUNCATE, or DELETE.
- Policy recreation changes authorization at commit.
- unique index build on `order_pack_purchases` is small in current Production (0 rows), but apply during a controlled window.
- approved transaction requirement is `NOT VALID` then explicitly validated; dirty approved rows fail closed.
- function signature changes from `admin_credit_order_pack(uuid)` to `admin_credit_order_pack(uuid,text)`; coordinate server + DB deployment.
- prefer forward-fix over destructive rollback after transaction IDs/credits exist.

Preflight immediately before Production apply:
- re-count order-pack rows and approved rows missing transaction ID.
- verify no duplicate candidate transaction IDs.
- re-check current policy definitions.
- confirm backup/PITR posture.
- stage and behaviorally test 0023 first.

## Test quality / coverage matrix

| Area | Behavioral runtime | Source/regex contract | Status |
| --- | --- | --- | --- |
| RLS anon reads | Production read-only role simulation | migration contract test | PROVEN for inspected reads |
| Seller cross-tenant reads | Production read-only role simulation | migration contract test | FAILED pre-fix / fix UNPROVEN until applied in safe DB |
| Seller cross-tenant writes | GitHub Actions local Supabase runtime | policy SQL inspection | PROVEN — GitHub Actions local Supabase |
| place_order atomicity | GitHub Actions local Supabase runtime | existing migration tests inspect locks/idempotency | PROVEN — GitHub Actions local Supabase |
| idempotency concurrency | GitHub Actions local Supabase runtime, 2 concurrent clients | unique index/function source | PROVEN — GitHub Actions local Supabase |
| stock concurrency | GitHub Actions local Supabase runtime, 2 concurrent clients | stock constraint + FOR UPDATE source | PROVEN — GitHub Actions local Supabase |
| entitlement concurrency | GitHub Actions local Supabase runtime, 2 concurrent clients | entitlement FOR UPDATE source | PROVEN — GitHub Actions local Supabase |
| product-cap concurrency | GitHub Actions local Supabase runtime, 2 concurrent clients per plan | lock-before-count source test | PROVEN — GitHub Actions local Supabase |
| billing duplicate payment | GitHub Actions local Supabase runtime | unique indexes/RPC source | PROVEN — GitHub Actions local Supabase |
| order-pack duplicate payment | GitHub Actions local Supabase runtime, 2 concurrent clients | new 0023 test | PROVEN — GitHub Actions local Supabase |
| branding storage all plans | GitHub Actions local Supabase runtime | new 0023 test | PROVEN — GitHub Actions local Supabase |

Existing tests such as `entitlementMigration.test.ts`, `final-pricing-migration.test.ts`, and `production-db-hardening-migration.test.ts` are source/regex contracts. They **do not prove PostgreSQL runtime locking, RLS, authorization, or concurrency behavior**.

## Findings by severity

### P0
1. Authenticated sellers inherited public storefront SELECT policies and could read another tenant's active shop/product rows. Confirmed behavior in Production read-only role simulation. 0023 proposed; Production remains affected until applied.

### P1
1. `shop-logos` Storage writes remain Business-only despite Branding being Core on all plans. 0023 proposed.
2. Extra Order packs lacked unique underlying payment identity; the same real transfer could be represented by multiple purchase rows. 0023 proposed.
3. Anonymous callers can query active `shops` base rows, including `owner_id` and `plan`. A dedicated buyer-safe view/RPC migration is needed before revoking anon base-table SELECT.
4. Runtime suite is proven in disposable local Supabase CI. One domain-rule case remains PARTIAL: rejection/RTO/refund non-restoration cannot be transitioned distinctly because the current schema does not persist separate statuses for all three outcomes.

### P2
1. `database.types.ts` is not strictly current/generated despite its header; regenerate after schema deployment.
2. Supabase Auth leaked-password protection is disabled.
3. Unused-index and multiple-permissive-policy performance advisories should be reassessed after policy reconciliation and meaningful traffic.
4. Non-SECURITY-DEFINER trigger helpers retain broad EXECUTE grants; least-privilege revoke can be considered later.

## Production impact

No Production DB mutation was performed by this audit. Until 0023 is reviewed, staged, behaviorally tested, and explicitly approved for Production, the P0 tenant-read overlap remains present.

## Required next step

Keep the zero-cost `Database Runtime Integration` GitHub Actions gate green, reconcile the remaining PARTIAL rejection/RTO/refund status-model gap if product requirements require distinct persisted transitions, then perform a separate explicit Production migration deployment gate. Do not apply 0023 to Production from this PR.
