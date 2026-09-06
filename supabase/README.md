# Supabase backend — Mini TikTok Shop SaaS

Multi-tenant backend for the storefront SaaS. Schema, RLS and RPCs live in
`migrations/`.

## Migrations

| File | What it creates |
|---|---|
| `0001_init_saas.sql` | `shops`, `payment_accounts`, `shipping_zones`, `products`, `orders`, `order_items`; RLS on all tables; `place_order()` + `lookup_order()` RPCs |

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
> The target project ref is an infrastructure decision (see
> `context/infrastructure.md` — a shared Supabase project already exists).

Options:

1. **Supabase SQL editor** — paste `0001_init_saas.sql` and run.
2. **Supabase CLI** — `supabase db push` against a linked project.
3. **MCP** — `apply_migration` with the file contents (owner-confirmed target).

After applying, set the frontend env (`.env.local`, see `../.env.example`) to
the project URL + public anon key.

## Open items (Phase 2)

- Storage bucket + policy for shop logos / (optional) payment slips.
- Anti-abuse on `place_order` (anon insert) — rate limit / captcha / hCaptcha.
- Auto payment verification (KBZPay/WavePay notification ingestion) — the moat.
