# Supabase backend — Mini TikTok Shop SaaS

Multi-tenant backend for the storefront SaaS. Schema, RLS and RPCs live in
`migrations/`.

## Migrations

`0001`–`0007`, `0009`–`0012`, `0016` and `0017` were previously recorded as applied to the live project. `0008` and
`0013`–`0015` are **pending — not yet applied** (need owner go-ahead). Never apply a migration to
production without the owner's explicit go-ahead — see
`.claude/skills/supabase-migration/SKILL.md`.

| File | What it creates |
|---|---|
| `0001_init_saas.sql` | `shops`, `payment_accounts`, `shipping_zones`, `products`, `orders`, `order_items`; RLS on all tables; `place_order()` + `lookup_order()` RPCs |
| `0002_harden_search_path.sql` | Pins `search_path` on `set_updated_at()` |
| `0003_platform_plan_and_usage.sql` | `shops.plan` (NOT NULL DEFAULT `'starter'`), monthly billable-usage view + RPC, Storage buckets (`shop-logos`, `product-images`) with tenant-safe path policies |
| `0004_product_promo_price_check.sql` | `CHECK`: `promo_price < price` whenever `is_promotion` |
| `0005_fix_storage_policy_path.sql` | Corrects the Storage policy's shop-id path segment |
| `0006_optimize_rls_and_fk_index.sql` | RLS predicate optimization + missing FK indexes |
| `0007_production_hardening.sql` | Rate limiting on the anon RPCs; platform-managed `plan`/`owner_id`/billing triggers; stricter `place_order()` / `lookup_order()` validation. Raises typed exceptions (`rate_limit_exceeded`, `duplicate_order_limit`, `business_plan_required`, …) — the frontend maps these to Burmese copy via `src/domain/dbError.ts` (`mapDbError`, see D48) |
| `0008_shop_owner_unique.sql` | `unique(owner_id)` on `shops` (`shops_owner_unique`), dropping the redundant `shops_owner_idx`. **Applied to production 2026-09-25 after duplicate-owner preflight returned zero rows.** |
| `0009_shop_theme.sql` | `shops.theme jsonb` — seller-editable Store Design (D52). Applied |
| `0010_shop_application_gate.sql` | `shop_applications` + private `payment-proofs` bucket — paid onboarding gate (D55). Applied |
| `0011_payment_proof_auto_plan.sql` | Historical payment-proof OCR/auto-verification foundation: creates `payment_proofs` + the first `activate_plan_from_verified_payment()` implementation. Its 50,000/80,000 amounts and direct `shops.plan` update are superseded by `0017`. Applied. |
| `0012_shop_application_transaction_id.sql` | `shop_applications.transaction_id` + unique index for full transaction-ID deduplication. Applied. |
| `0013_delivery_services.sql` | Adds delivery-service/origin fields used by the delivery-pricing layer. **Pending — not yet applied**. |
| `0014_ninjavan_production_pricing.sql` | Adds server-side Ninja Van production pricing and composes it into checkout/order placement. **Pending — not yet applied**. |
| `0015_ninjavan_verified_seed.sql` | Seeds verified Ninja Van production rate data. **Pending — not yet applied**. |
| `0016_entitlements_and_pricing.sql` | Pricing V1 (D56): `free_trial` tier; `shop_entitlements`, append-only `entitlement_ledger`, `order_pack_purchases`; `orders.idempotency_key`; atomic/idempotent entitlement consumption; free-trial 10-product limit; township shipping core; owner-only `admin_*` entitlement RPCs. Applied. |
| `0017_reconcile_payment_activation.sql` | Historical reconciliation for 30,000/60,000 pricing. Superseded by 0021. |
| `0018_production_safe_delivery_reconciliation.sql` | Production-safe delivery/runtime reconciliation preserving atomic entitlement consumption. **Applied to production.** |
| `0019_production_safe_ninjavan_verified_seed.sql` | Production-safe approved 11-route Yangon Ninja Van rate matrix. **Applied to production 2026-09-25.** |
| `0020_branding_core_all_plans.sql` | Removes the historical Business-only branding guard. **Applied to production 2026-09-25.** |
| `0021_final_pricing_packaging_reconciliation.sql` | **FINAL D60/ADR 0002:** 29,000/79,000 prices; 60/200 order quotas; 10/100/500 total-product caps; created-order usage; basic promotions core. **Applied to production 2026-09-25 and post-verified.** |

## Security model (read before touching)

- **Storefront is anonymous.** Buyers are not logged in. After migration `0027`, anon does **not** have direct SELECT on `shops`, `products`, `payment_accounts`, or `shipping_zones`. Buyer reads go through `buyer_public_shops`, `buyer_public_products`, `buyer_public_payment_accounts`, and `buyer_public_shipping_zones`, which expose only storefront/checkout fields and active rows. Authenticated sellers keep owner-scoped base-table reads. Before 0027 is applied, the API gateways use the prior active-row base-table path only when PostgREST reports that the projection views do not exist.
- **Buyers never write tables directly.** The only anon write path is the
  `place_order()` RPC (SECURITY DEFINER). It **re-prices every line from the
  `products` table** — client-sent prices are ignored — validates stock/shop
  state, generates a per-shop `order_no`, and inserts order + items atomically.
- **Buyer order lookup** uses `lookup_order(shop_slug, order_no, phone)`
  (SECURITY DEFINER). The phone is the shared secret; a buyer can only fetch the
  single matching order, never enumerate a shop's orders.
- **Only the public anon key goes in the frontend.** The `service_role` key must
  never appear in client code or this repo. RLS is the enforcement boundary.

## Applying (manual — not automated, not committed as run)

> ⚠️ Do **not** apply to a production project without the owner's explicit go.
> This app has its own dedicated Supabase project, deliberately separate from any
> shared one — the project ref is in `PROJECT.md`'s Stack section.

Options:

1. **Supabase SQL editor** — paste `0001_init_saas.sql` and run.
2. **Supabase CLI** — `supabase db push` against a linked project.
3. **MCP** — `apply_migration` with the file contents (owner-confirmed target).

After applying, set the frontend env (`.env.local`, see `../.env.example`) to
the project URL + public anon key.

## Open items (Phase 2)

- Auto payment verification (KBZPay/WavePay notification ingestion) — the moat.

Shipped since this list was written: Storage buckets + tenant-safe policies
(`0003`, path fix in `0005`) and anti-abuse rate limiting on the anon RPCs
(`0007`). Slip upload was dropped for MVP — see `PROJECT.md` D6.

| `0022_production_db_hardening.sql` | Revokes direct API execution of trigger-only `init_shop_entitlement()` and adds the missing `entitlement_ledger(order_id)` covering index. **Applied to production 2026-09-25 and advisor-verified.** |
| `0023_database_rls_concurrency_reconciliation.sql` | Narrows storefront reads to `anon`, keeps shared Ninja Van rates visible to sellers, makes shop-logo writes Core while owner/path scoped, and adds unique full transaction identity to Extra Order crediting. **Applied to Production 2026-09-28 after read-only preflight; post-verified with authenticated overlap = 0, Seller A foreign shop/product reads = 0, and anon storefront visibility preserved.** |
| `0024_store_design_lifecycle.sql` | Adds tenant-scoped Draft/Published Store Design lifecycle RPCs and buyer Published-only read while retaining `shops.theme` compatibility. **Applied to Production 2026-09-28** (confirmed by live migration history). |
| `0026_platform_shop_lifecycle.sql` | Separates seller operational state from platform suspension, keeps `shops.is_active` as the derived buyer-facing effective flag, and removes seller DELETE permission on the shop lifecycle root. **Not applied to Production.** Requires a separate reviewed Production rollout. |
| `0027_anonymous_storefront_projection.sql` | Adds narrow buyer-safe projection views for shops/products/payment accounts/shipping zones, removes seller-only product SKU exposure, and revokes anon SELECT on those base tables. **Not applied to Production.** API gateways retain a missing-view-only compatibility fallback until this migration is explicitly approved and applied. |
| `0039_product_variants_ai_security.sql` | Adds first-class tenant product variants, buyer variant projection, order-line variant identity, repeat-safe legacy backfill, server-only encrypted AI credential rows, and the tenant media registry. **Not applied to Production.** |
| `0040_variant_checkout_inventory.sql` | Reconciles quote/order RPCs with explicit variant identity, authoritative variant pricing, row locking, variant-only decrement, and non-variant compatibility. **Not applied to Production.** |

### Residual advisor decisions (2026-09-25)

- `lookup_order()` and `place_order()` remain intentionally executable by buyer-facing API roles. Both are SECURITY DEFINER RPCs by design; revoking them would break public order lookup/checkout. Keep their internal validation/rate-limit tests as the control.
- The 0023 policy cutover removed the prior authenticated/public storefront overlap for `shops`, `products`, `payment_accounts`, and `shipping_zones`. Reassess any remaining multiple-permissive-policy advisor findings against the post-0023 schema before acting on them.
- Leaked-password protection is an Auth project setting, not a SQL migration. Enable it in Supabase Auth when the project setting is available to the operator/tooling.
