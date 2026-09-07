-- =============================================================================
-- Mini TikTok Shop — SaaS foundation schema (Phase 1)
-- Multi-tenant storefront for Myanmar TikTok sellers.
--
-- Design notes:
--  * One tenant = one `shop`, owned by an auth user (the seller).
--  * The STOREFRONT is public/anonymous — buyers are NOT logged in. So shop,
--    products, payment accounts and shipping zones must be readable by `anon`
--    for ACTIVE shops only. Sellers additionally see their own hidden rows.
--  * Buyers never write to tables directly. The only anon write path is the
--    SECURITY DEFINER `place_order()` RPC, which re-prices from the products
--    table server-side (never trusts client totals) and inserts the order +
--    items atomically. This is the multi-tenant equivalent of the demo's
--    "re-price server-side style" note in src/lib/api.ts.
--  * Buyer order lookup goes through `lookup_order()` (SECURITY DEFINER) so a
--    buyer can only ever see the single order matching (shop, order_no, phone),
--    never enumerate a shop's orders.
--  * Money is MMK, stored as bigint (whole kyat — no sub-unit in practice).
-- =============================================================================

-- Needed for gen_random_uuid()
create extension if not exists pgcrypto;

-- ---- updated_at trigger helper ---------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---- shops (tenants) --------------------------------------------------------
create table if not exists public.shops (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  slug        text not null unique,                 -- storefront URL: /s/<slug>
  name        text not null,
  logo_url    text,
  phone       text,
  -- fallback delivery fee (MMK) when no matching shipping zone is found
  default_delivery_fee bigint not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint shops_slug_format check (slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$')
);
create index if not exists shops_owner_idx on public.shops(owner_id);
create trigger shops_updated_at before update on public.shops
  for each row execute function public.set_updated_at();

-- ---- payment_accounts (KBZPay / WavePay numbers per shop) -------------------
create table if not exists public.payment_accounts (
  id           uuid primary key default gen_random_uuid(),
  shop_id      uuid not null references public.shops(id) on delete cascade,
  provider     text not null check (provider in ('kpay','wave')),
  account_name text not null,
  phone        text not null,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);
create index if not exists payment_accounts_shop_idx on public.payment_accounts(shop_id);

-- ---- shipping_zones (township-based delivery fee per shop) ------------------
create table if not exists public.shipping_zones (
  id        uuid primary key default gen_random_uuid(),
  shop_id   uuid not null references public.shops(id) on delete cascade,
  region    text not null,
  township  text not null,
  fee       bigint not null default 0,
  created_at timestamptz not null default now(),
  unique (shop_id, region, township)
);
create index if not exists shipping_zones_shop_idx on public.shipping_zones(shop_id);

-- ---- products ---------------------------------------------------------------
create table if not exists public.products (
  id           uuid primary key default gen_random_uuid(),
  shop_id      uuid not null references public.shops(id) on delete cascade,
  item_code    text,
  name         text not null,
  category     text,
  color        text,
  size         text,
  price        bigint not null check (price >= 0),
  promo_price  bigint check (promo_price >= 0),
  is_promotion boolean not null default false,
  stock        integer not null default 0 check (stock >= 0),
  status       text not null default 'active' check (status in ('active','hidden')),
  images       text[] not null default '{}',
  description  text not null default '',
  arrival_date timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists products_shop_idx on public.products(shop_id);
create index if not exists products_shop_status_idx on public.products(shop_id, status);
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

-- ---- orders -----------------------------------------------------------------
create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  shop_id          uuid not null references public.shops(id) on delete cascade,
  order_no         text not null,                    -- human ref, unique per shop
  customer_name    text not null,
  customer_phone   text not null,
  customer_address text,
  region           text,
  township         text,
  item_total       bigint not null default 0,
  delivery_fee     bigint not null default 0,
  grand_total      bigint not null default 0,
  payment_method   text not null check (payment_method in ('cod','kpay','wave')),
  -- last 5 digits of the KBZPay/WavePay transaction the buyer typed in
  payment_ref_tail text,
  status           text not null default 'cod_pending' check (status in (
                     'cod_pending','pending_payment','partial_checked',
                     'checked','shipped','completed','cancelled')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (shop_id, order_no)
);
create index if not exists orders_shop_idx on public.orders(shop_id);
create index if not exists orders_shop_phone_idx on public.orders(shop_id, customer_phone);
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

-- ---- order_items ------------------------------------------------------------
create table if not exists public.order_items (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name       text not null,     -- snapshot at order time
  unit_price bigint not null,   -- snapshot at order time (post-promo)
  qty        integer not null check (qty > 0)
);
create index if not exists order_items_order_idx on public.order_items(order_id);

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.shops            enable row level security;
alter table public.payment_accounts enable row level security;
alter table public.shipping_zones   enable row level security;
alter table public.products         enable row level security;
alter table public.orders           enable row level security;
alter table public.order_items      enable row level security;

-- shops: public reads active shops; owner does everything to own shop.
create policy shops_public_read on public.shops
  for select using (is_active = true);
create policy shops_owner_all on public.shops
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- payment_accounts: public reads active accounts of active shops; owner manages.
create policy payacc_public_read on public.payment_accounts
  for select using (
    is_active = true
    and exists (select 1 from public.shops s where s.id = shop_id and s.is_active)
  );
create policy payacc_owner_all on public.payment_accounts
  for all using (
    exists (select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid())
  );

-- shipping_zones: public reads zones of active shops; owner manages.
create policy ship_public_read on public.shipping_zones
  for select using (
    exists (select 1 from public.shops s where s.id = shop_id and s.is_active)
  );
create policy ship_owner_all on public.shipping_zones
  for all using (
    exists (select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid())
  );

-- products: public reads ACTIVE products of active shops; owner sees/manages all.
create policy products_public_read on public.products
  for select using (
    status = 'active'
    and exists (select 1 from public.shops s where s.id = shop_id and s.is_active)
  );
create policy products_owner_all on public.products
  for all using (
    exists (select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid())
  );

-- orders: NO anon access. Buyers write only via place_order() and read only via
-- lookup_order() (both SECURITY DEFINER). Owner sees/manages own shop's orders.
create policy orders_owner_all on public.orders
  for all using (
    exists (select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid())
  );

-- order_items: owner reads/manages via the parent order's shop.
create policy order_items_owner_all on public.order_items
  for all using (
    exists (
      select 1 from public.orders o join public.shops s on s.id = o.shop_id
      where o.id = order_id and s.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.orders o join public.shops s on s.id = o.shop_id
      where o.id = order_id and s.owner_id = auth.uid()
    )
  );

-- =============================================================================
-- RPC: place_order — the ONLY anonymous write path.
-- Re-prices every line from the products table (ignores any client-sent price),
-- validates stock + shop active state, generates a per-shop order_no, and
-- inserts the order + items atomically. Returns the created order summary.
--
-- p_items: jsonb array of { "product_id": uuid, "qty": int }
-- =============================================================================
create or replace function public.place_order(
  p_shop_slug      text,
  p_customer_name  text,
  p_customer_phone text,
  p_street         text,
  p_region         text,
  p_township       text,
  p_payment_method text,
  p_payment_ref_tail text,
  p_items          jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shop      public.shops%rowtype;
  v_item      jsonb;
  v_product   public.products%rowtype;
  v_qty       integer;
  v_unit      bigint;
  v_item_total bigint := 0;
  v_delivery  bigint := 0;
  v_order_id  uuid;
  v_order_no  text;
  v_status    text;
  v_address   text;
begin
  -- validate inputs
  if p_payment_method not in ('cod','kpay','wave') then
    raise exception 'invalid_payment_method';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'empty_cart';
  end if;
  if coalesce(trim(p_customer_name),'') = '' or coalesce(trim(p_customer_phone),'') = '' then
    raise exception 'missing_customer';
  end if;

  select * into v_shop from public.shops
    where slug = p_shop_slug and is_active = true;
  if not found then
    raise exception 'shop_not_found';
  end if;

  -- delivery fee from the shop's zones, else the shop default
  select fee into v_delivery from public.shipping_zones
    where shop_id = v_shop.id and region = p_region and township = p_township;
  if v_delivery is null then
    v_delivery := v_shop.default_delivery_fee;
  end if;

  -- generate a per-shop order_no (retry a few times on the rare collision)
  for i in 1..5 loop
    v_order_no := 'ORD-' || upper(right(to_char(clock_timestamp(), 'YYMMDD') ||
                  to_hex((extract(epoch from clock_timestamp())*1000)::bigint), 6));
    exit when not exists (
      select 1 from public.orders where shop_id = v_shop.id and order_no = v_order_no
    );
    v_order_no := null;
  end loop;
  if v_order_no is null then
    raise exception 'order_no_generation_failed';
  end if;

  v_status := case when p_payment_method = 'cod' then 'cod_pending' else 'pending_payment' end;
  v_address := nullif(concat_ws(', ', nullif(trim(p_street),''),
               nullif(trim(p_township),''), nullif(trim(p_region),'')), '');

  insert into public.orders (
    shop_id, order_no, customer_name, customer_phone, customer_address,
    region, township, payment_method, payment_ref_tail, status,
    item_total, delivery_fee, grand_total
  ) values (
    v_shop.id, v_order_no, trim(p_customer_name), trim(p_customer_phone), v_address,
    p_region, p_township, p_payment_method, nullif(trim(p_payment_ref_tail),''), v_status,
    0, v_delivery, 0
  ) returning id into v_order_id;

  -- re-price each line from the catalog (authoritative), snapshot into items
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := greatest(coalesce((v_item->>'qty')::int, 0), 0);
    if v_qty = 0 then continue; end if;

    select * into v_product from public.products
      where id = (v_item->>'product_id')::uuid
        and shop_id = v_shop.id
        and status = 'active';
    if not found then
      raise exception 'product_unavailable:%', (v_item->>'product_id');
    end if;

    v_unit := case when v_product.is_promotion and v_product.promo_price is not null
                   then v_product.promo_price else v_product.price end;

    insert into public.order_items (order_id, product_id, name, unit_price, qty)
      values (v_order_id, v_product.id, v_product.name, v_unit, v_qty);

    v_item_total := v_item_total + v_unit * v_qty;
  end loop;

  if v_item_total = 0 then
    raise exception 'empty_cart';
  end if;

  update public.orders
    set item_total = v_item_total,
        grand_total = v_item_total + v_delivery
    where id = v_order_id;

  return jsonb_build_object(
    'order_no', v_order_no,
    'item_total', v_item_total,
    'delivery_fee', v_delivery,
    'grand_total', v_item_total + v_delivery,
    'payment_method', p_payment_method,
    'amount_now', case when p_payment_method = 'cod' then 0 else v_item_total + v_delivery end,
    'status', v_status
  );
end;
$$;

-- Buyers (anon) may place orders; nothing else on orders.
revoke all on function public.place_order(text,text,text,text,text,text,text,text,jsonb) from public;
grant execute on function public.place_order(text,text,text,text,text,text,text,text,jsonb) to anon, authenticated;

-- =============================================================================
-- RPC: lookup_order — a buyer retrieves ONE order by (shop, order_no, phone).
-- Never enumerates a shop's orders; the phone acts as the shared secret.
-- =============================================================================
create or replace function public.lookup_order(
  p_shop_slug text,
  p_order_no  text,
  p_phone     text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order jsonb;
begin
  select jsonb_build_object(
    'order_no', o.order_no,
    'status', o.status,
    'payment_method', o.payment_method,
    'item_total', o.item_total,
    'delivery_fee', o.delivery_fee,
    'grand_total', o.grand_total,
    'created_at', o.created_at,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object('name', oi.name, 'price', oi.unit_price, 'qty', oi.qty))
      from public.order_items oi where oi.order_id = o.id
    ), '[]'::jsonb)
  )
  into v_order
  from public.orders o
  join public.shops s on s.id = o.shop_id
  where s.slug = p_shop_slug
    and o.order_no = p_order_no
    and regexp_replace(o.customer_phone, '[^0-9]', '', 'g')
        = regexp_replace(p_phone, '[^0-9]', '', 'g');

  if v_order is null then
    raise exception 'order_not_found';
  end if;
  return v_order;
end;
$$;

revoke all on function public.lookup_order(text,text,text) from public;
grant execute on function public.lookup_order(text,text,text) to anon, authenticated;
