# Supabase backend — Mini TikTok Shop SaaS

Multi-tenant backend for the storefront SaaS. Schema, RLS and RPCs live in
`migrations/`.

## Migrations

All seven are applied to the live project. Never apply a migration to production
without the owner's explicit go-ahead — see `.claude/skills/supabase-migration/SKILL.md`.

| File | What it creates |
|---|---|
| `0001_init_saas.sql` | `shops`, `payment_accounts`, `shipping_zones`, `products`, `orders`, `order_items`; RLS on all tables; `place_order()` + `lookup_order()` RPCs |
| `0002_harden_search_path.sql` | Pins `search_path` on `set_updated_at()` |
| `0003_platform_plan_and_usage.sql` | `shops.plan` (NOT NULL DEFAULT `'starter'`), monthly billable-usage view + RPC, Storage buckets (`shop-logos`, `product-images`) with tenant-safe path policies |
| `0004_product_promo_price_check.sql` | `CHECK`: `promo_price < price` whenever `is_promotion` |
| `0005_fix_storage_policy_path.sql` | Corrects the Storage policy's shop-id path segment |
| `0006_optimize_rls_and_fk_index.sql` | RLS predicate optimization + missing FK indexes |
| `0007_production_hardening.sql` | Rate limiting on the anon RPCs; platform-managed `plan`/`owner_id`/billing triggers; stricter `place_order()` / `lookup_order()` validation. Raises typed exceptions (`rate_limit_exceeded`, `duplicate_order_limit`, `business_plan_required`, …) — the frontend maps these to Burmese copy via `src/domain/dbError.ts` (`mapDbError`, see D48) |

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
