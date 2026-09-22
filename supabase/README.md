# Supabase backend — Mini TikTok Shop SaaS

Multi-tenant backend for the storefront SaaS. Schema, RLS and RPCs live in
`migrations/`.

## Migrations

`0001`–`0007`, `0009` and `0010` are applied to the live project; `0008` and `0011`–`0013`
are **pending — not yet applied** (need owner go-ahead). Never apply a migration to
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
| `0008_shop_owner_unique.sql` | `unique(owner_id)` on `shops` (`shops_owner_unique`), dropping the now-redundant `shops_owner_idx` — enforces one shop per owner (the admin flow assumes it; see `PROJECT.md` D49). **Pending — not yet applied** (run the migration's duplicate-detection query before applying) |
| `0009_shop_theme.sql` | `shops.theme jsonb` — seller-editable Store Design (D52). Applied |
| `0010_shop_application_gate.sql` | `shop_applications` + private `payment-proofs` bucket — paid onboarding gate (D55). Applied |
| `0011_payment_proof_auto_plan.sql` | Parallel payment-proof OCR/auto-verification path: `payment_proofs` table + `activate_plan_from_verified_payment()` RPC. Hardcodes 50000/80000 prices and sets `shops.plan` WITHOUT touching `shop_entitlements` — does not integrate with the pricing-V1 entitlements in 0013 yet (see `PROJECT.md` D57). **Pending — confirm apply status with owner** |
| `0012_shop_application_transaction_id.sql` | `shop_applications.transaction_id` + unique index (for the auto-verification dedup). **Pending — confirm apply status with owner** |
| `0016_entitlements_and_pricing.sql` | Pricing V1 (D56): `free_trial` tier; `shop_entitlements` (quota + permanent purchased balance + cycle), append-only `entitlement_ledger`, `order_pack_purchases`; `orders.idempotency_key`; `place_order()` now consumes ONE entitlement per order (monthly-first, then purchased) atomically + idempotently, locking the entitlement row; free-trial 10-product limit; township shipping un-gated to core; owner-only `admin_*` entitlement RPCs (service_role). Raises `order_quota_exhausted`, `subscription_inactive`, `product_limit_reached`, `extra_orders_not_available`, `duplicate_payment`. **Pending — not yet applied** (needs owner go-ahead) |

## Security model (read before touching)

- **Storefront is anonymous.** Buyers are not logged in. `shops`, `products`,
  `payment_accounts`, `shipping_zones` are readable by `anon` **only for active
  shops** (and products only when `status='active'`). Sellers additionally see
  their own hidden rows via an owner policy.
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
