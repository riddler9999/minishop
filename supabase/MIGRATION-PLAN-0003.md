# Migration & Compatibility Plan — 0003 (Platform / Plan + Usage)

Prepares the existing Mini TikTok Shop backend for a **commercial multi-tenant
platform** with plan-based features and monthly order-usage tracking.

**Scope (backend/DB only):** shop plan model, monthly billable-order usage
tracking + tiers, seller-managed payment accounts (self-service), Supabase
Storage for logos/product images with tenant-safe policies, RLS hardening.

**Deliberately out of scope (owner's "Do NOT" list):** subscription payment
collection, auto payment verification, AI, CRM, staff accounts, custom domains.
Nothing here touches those.

---

## 0. Baseline (what already exists — must be preserved)

| Object | Preserve | Notes |
| --- | --- | --- |
| `place_order()` RPC | **UNCHANGED** | Only anon write path. Signature `(text,text,text,text,text,text,text,text,jsonb)` stays byte-identical. |
| `lookup_order()` RPC | **UNCHANGED** | Anti-enumeration buyer lookup. Signature stays. |
| RLS on all 6 tables | **EXTENDED, not rewritten** | Existing policies untouched; new columns default-safe. |
| `/s/:slug` architecture | **UNCHANGED** | No routing/slug assumption changes. |
| `shops / products / orders / order_items / payment_accounts / shipping_zones` | **ADDITIVE** | Only `ADD COLUMN ... DEFAULT`, new function/view, storage. No drops, no renames, no type changes. |

**Compatibility guarantee:** 0003 is **purely additive**. Every new column has a
`NOT NULL DEFAULT`, so existing rows and existing `INSERT`s (including
`place_order()`'s) keep working with no code change. No existing storefront API
breaks. No `place_order`/`lookup_order` reprice or output shape changes.

---

## 1. Shop plan field — `starter | business`

```sql
alter table public.shops
  add column plan text not null default 'starter'
    check (plan in ('starter','business'));
```

- Default `starter` → every existing shop is a Starter shop, no data backfill.
- Constraint mirrors the storefront contract exactly (two values only).
- **Plan is set by the platform owner, not the seller.** No RLS change needed:
  the seller already has `shops_owner_all` (full row access to their own shop),
  but the **frontend contract** must treat `plan` as **read-only for sellers**
  (they can technically `update` it via RLS today — enforcing "owner-only writes
  to `plan`" is a Phase-2 concern once billing exists; documented as a known gap,
  not a v1 blocker, because no feature is unlocked by `plan` server-side yet).

## 2. Monthly billable-order usage tracking

### Billable definition (single source of truth)

Spec: billable orders **exclude cancelled, test, duplicate**. Implemented as a
**generated stored column** so the rule lives in exactly one place:

```sql
alter table public.orders
  add column is_test      boolean not null default false,
  add column is_duplicate boolean not null default false;

alter table public.orders
  add column is_billable boolean
    generated always as (
      status <> 'cancelled' and is_test = false and is_duplicate = false
    ) stored;
```

- `is_test` / `is_duplicate` are **seller/admin-set flags** (admin console), both
  default `false` → every existing order is billable unless `cancelled`.
- **Interpretation note:** the spec lists exactly three exclusions, so billable =
  "not cancelled AND not test AND not duplicate" — a `cod_pending` /
  `pending_payment` order **counts**. If the owner later wants "confirmed =
  `checked|shipped|completed` only", change **one expression** (the generated
  column) and every count follows. This is why the rule is centralized.
- Generated column expression is immutable (only same-row base columns) → valid.

### Counting index (partial, covers the monthly count query)

```sql
create index orders_shop_billable_month_idx
  on public.orders (shop_id, created_at)
  where is_billable;
```

### Per-shop monthly usage view (tenant-safe)

```sql
create view public.shop_monthly_usage
  with (security_invoker = on) as
  select o.shop_id,
         date_trunc('month', o.created_at) as month,
         count(*)::int as billable_orders
  from public.orders o
  where o.is_billable
  group by o.shop_id, date_trunc('month', o.created_at);
```

- `security_invoker = on` → the **caller's** RLS on `orders` applies. Owner sees
  only their shop; `anon` sees nothing (no anon policy on `orders`). Tenant-safe
  by construction — no `shop_id` filter can be forgotten.

## 3. Monthly usage tiers

```sql
create function public.usage_tier(p_count integer)
  returns text language sql immutable set search_path = public as $$
  select case
    when p_count <= 100  then '0-100'
    when p_count <= 500  then '101-500'
    when p_count <= 1500 then '501-1500'
    when p_count <= 3000 then '1501-3000'
    else '3000+'
  end;
$$;
```

Boundaries match the spec exactly: 0–100 / 101–500 / 501–1500 / 1501–3000 / 3000+.

### Convenience RPC — current-month usage for the signed-in seller

```sql
create function public.current_shop_usage()
  returns jsonb language sql stable security invoker
  set search_path = public as $$
  select jsonb_build_object(
    'shop_id',         s.id,
    'plan',            s.plan,
    'month',           to_char(date_trunc('month', now()), 'YYYY-MM'),
    'billable_orders', coalesce(u.billable_orders, 0),
    'tier',            public.usage_tier(coalesce(u.billable_orders, 0))
  )
  from public.shops s
  left join public.shop_monthly_usage u
    on u.shop_id = s.id and u.month = date_trunc('month', now())
  where s.owner_id = auth.uid()
  limit 1;
$$;
```

- `security invoker` → RLS on `shops` + `orders` both apply; a seller can only
  ever read their own usage. Anon gets no row (`auth.uid()` is null).

## 4. Seller-manageable KBZPay / Wave payment accounts

- **Table + RLS already exist** (`payment_accounts`, `payacc_owner_all` for CRUD,
  `payacc_public_read` for the storefront). **No migration change needed.**
- The gap is **backend surface only**: `adminApi` in `src/lib/backend.ts` had no
  CRUD for payment accounts. 0003 adds `adminApi.listPaymentAccounts /
  createPaymentAccount / updatePaymentAccount / deletePaymentAccount`
  (RLS-enforced, scoped to the owner's shop). Fully self-service.

## 5. Supabase Storage — logos & product images (tenant-safe)

Two **public-read** buckets; writes gated to the owning seller by path.

```sql
insert into storage.buckets (id, name, public)
values ('shop-logos','shop-logos', true),
       ('product-images','product-images', true)
on conflict (id) do nothing;
```

**Path convention (enforced by policy):** the **first folder segment is the
`shop_id`** —
`shop-logos/<shop_id>/logo.<ext>` and
`product-images/<shop_id>/<product_id>/<file>.<ext>`.

Policies on `storage.objects`:

- **Public read** on both buckets (storefront shows the media).
- **Insert / update / delete** only when
  `(storage.foldername(name))[1] = shop_id` of a shop owned by `auth.uid()`.
  A seller can never write into another tenant's folder.

`shops.logo_url` and `products.images[]` continue to hold **public URLs** — no
schema change, storefront read path unchanged. Upload helpers added to
`adminApi` (`uploadShopLogo`, `uploadProductImage`) return the public URL the
seller then saves onto the shop/product row.

## 6. RLS & isolation validation (done pre-commit)

Validated against the live project `fsxdnmnycizjkgstokze` via
`execute_sql` inside a **`BEGIN … ROLLBACK`** transaction (nothing persisted —
same non-destructive validation pattern used for the 0001 backend audit):

1. DDL compiles clean (all of §1–§5).
2. `usage_tier()` boundary table (100/101/500/501/1500/1501/3000/3001).
3. Billable counting excludes cancelled / test / duplicate; two tenants,
   cross-tenant count isolation holds under `security_invoker`.
4. `place_order()` / `lookup_order()` still resolve and run unchanged after the
   additive columns.

## 7. Apply procedure (owner-gated — D7)

Per Decision **D7**, migrations are **not** applied to the live project without
the owner's go-ahead. When approved:

1. `mcp__Supabase__apply_migration` — name `platform_plan_and_usage`, body =
   `supabase/migrations/0003_platform_plan_and_usage.sql`.
2. `mcp__Supabase__generate_typescript_types` → overwrite
   `src/lib/database.types.ts` (this plan ships a hand-authored types delta so
   the frontend compiles now; regeneration replaces it 1:1 after apply).
3. `mcp__Supabase__get_advisors(security)` → expect clean apart from the known
   intentional anon `SECURITY DEFINER` findings on `place_order`/`lookup_order`.

## 8. Frontend migration impact

**No breaking change.** All additions are new columns/functions/methods. The one
thing the frontend agent MUST know: `ordersByPhone` / `place_order` /
`lookup_order` shapes are **untouched**. New optional surfaces (usage, payment
account CRUD, storage upload) are opt-in. Full contract list in the handoff
section of `PROJECT.md`.
</content>
</invoke>
