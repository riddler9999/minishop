-- Product Variants + AI Store Builder security remediation.
-- Forward-only. This migration is designed for isolated verification first and
-- must not be applied to Production without separate owner approval.
begin;

create table public.ai_provider_credentials (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  provider text not null check (provider in ('gemini', 'openai', 'anthropic')),
  encrypted_credential text not null,
  key_masked text not null,
  credential_metadata jsonb not null default '{}'::jsonb,
  last_tested_at timestamptz,
  last_test_ok boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, provider)
);

alter table public.ai_provider_credentials enable row level security;
revoke all on public.ai_provider_credentials from public, anon, authenticated;
grant all on public.ai_provider_credentials to service_role;
create trigger ai_provider_credentials_updated_at
before update on public.ai_provider_credentials
for each row execute function public.set_updated_at();

create table public.store_media (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  storage_path text not null,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  byte_size bigint not null check (byte_size between 1 and 10485760),
  checksum text,
  storefront_authorized boolean not null default false,
  created_at timestamptz not null default now(),
  unique (shop_id, storage_path)
);

alter table public.store_media enable row level security;
revoke all on public.store_media from public, anon, authenticated;
grant all on public.store_media to service_role;

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  legacy_key text,
  sku text,
  name text not null,
  size text,
  color text,
  price bigint check (price is null or price >= 0),
  promo_price bigint check (promo_price is null or promo_price >= 0),
  stock integer not null default 0 check (stock >= 0),
  status text not null default 'active' check (status in ('active', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_variants_price_check check (
    promo_price is null or price is null or promo_price < price
  ),
  unique (product_id, id),
  unique (product_id, legacy_key)
);

create index product_variants_product_idx on public.product_variants(product_id);
create index product_variants_shop_product_idx on public.product_variants(shop_id, product_id);
create unique index product_variants_shop_sku_unique
  on public.product_variants(shop_id, lower(sku))
  where nullif(btrim(sku), '') is not null;
create trigger product_variants_updated_at
before update on public.product_variants
for each row execute function public.set_updated_at();

alter table public.product_variants enable row level security;
create policy product_variants_owner_all on public.product_variants
for all to authenticated
using (exists (
  select 1 from public.shops s
  where s.id = product_variants.shop_id and s.owner_id = auth.uid()
))
with check (
  exists (
    select 1 from public.shops s
    where s.id = product_variants.shop_id and s.owner_id = auth.uid()
  )
  and exists (
    select 1 from public.products p
    where p.id = product_variants.product_id and p.shop_id = product_variants.shop_id
  )
);
revoke all on public.product_variants from public, anon;
grant select, insert, update, delete on public.product_variants to authenticated;

create or replace view public.buyer_public_product_variants
with (security_barrier = true)
as
select
  v.id,
  v.shop_id,
  v.product_id,
  v.sku,
  v.name,
  v.size,
  v.color,
  v.price,
  v.promo_price,
  v.stock,
  v.status,
  v.created_at
from public.product_variants v
join public.products p on p.id = v.product_id and p.shop_id = v.shop_id
join public.shops s on s.id = v.shop_id
where v.status = 'active' and p.status = 'active' and s.is_active = true;

revoke all on public.buyer_public_product_variants from public, anon, authenticated;
grant select on public.buyer_public_product_variants to anon;

alter table public.order_items
  add column variant_id uuid,
  add column variant_name text,
  add column variant_sku text;

alter table public.order_items
  add constraint order_items_variant_product_fkey
  foreign key (product_id, variant_id)
  references public.product_variants(product_id, id)
  on delete set null (variant_id);

create index order_items_variant_idx on public.order_items(variant_id)
where variant_id is not null;

-- Deterministic, repeat-safe legacy backfill. Malformed payloads remain untouched
-- for manual inspection; only valid JSON arrays are migrated and removed.
do $$
declare
  product_row record;
  payload_text text;
  payload jsonb;
  variant jsonb;
  ordinal integer;
  legacy_key text;
  valid_payload boolean;
begin
  for product_row in
    select id, shop_id, description
    from public.products
    where description like '%<!--VARIANTS:%-->'
    order by id
  loop
    payload_text := substring(product_row.description from '<!--VARIANTS:(.*?)-->');
    begin
      payload := payload_text::jsonb;
    exception when others then
      continue;
    end;
    if jsonb_typeof(payload) <> 'array' then continue; end if;

    -- Backfill is all-or-nothing per product. Any malformed row leaves both the
    -- legacy payload and description untouched for manual inspection.
    valid_payload := true;
    for variant in select value from jsonb_array_elements(payload) loop
      if jsonb_typeof(variant) <> 'object'
         or coalesce(btrim(variant->>'name'), '') = ''
         or coalesce(variant->>'stock', '') !~ '^[0-9]{1,9}$'
         or (variant ? 'price' and variant->>'price' is not null and coalesce(variant->>'price', '') !~ '^[0-9]+$')
         or (variant ? 'promoPrice' and variant->>'promoPrice' is not null and coalesce(variant->>'promoPrice', '') !~ '^[0-9]+$')
         or (
           coalesce(variant->>'price', '') ~ '^[0-9]+$'
           and coalesce(variant->>'promoPrice', '') ~ '^[0-9]+$'
           and (variant->>'promoPrice')::numeric >= (variant->>'price')::numeric
         ) then
        valid_payload := false;
        exit;
      end if;
    end loop;
    if not valid_payload then continue; end if;

    begin
      ordinal := 0;
      for variant in select value from jsonb_array_elements(payload) loop
        ordinal := ordinal + 1;
        legacy_key := coalesce(nullif(variant->>'id', ''), ordinal::text);
        insert into public.product_variants (
          shop_id, product_id, legacy_key, sku, name, size, color,
          price, promo_price, stock, status
        ) values (
          product_row.shop_id,
          product_row.id,
          legacy_key,
          nullif(left(btrim(variant->>'sku'), 160), ''),
          left(btrim(variant->>'name'), 160),
          nullif(left(btrim(variant->>'size'), 100), ''),
          nullif(left(btrim(variant->>'color'), 100), ''),
          case when variant->>'price' is null then null else (variant->>'price')::bigint end,
          case when variant->>'promoPrice' is null then null else (variant->>'promoPrice')::bigint end,
          (variant->>'stock')::integer,
          'active'
        )
        on conflict (product_id, legacy_key) do nothing;
      end loop;

      update public.products
      set description = btrim(regexp_replace(description, '<!--VARIANTS:.*?-->', '', 's'))
      where id = product_row.id;
    exception
      when unique_violation or check_violation or numeric_value_out_of_range then
        null;
    end;
  end loop;
end;
$$;

update public.products p
set stock = totals.stock
from (
  select product_id, sum(stock)::integer as stock
  from public.product_variants
  where status = 'active'
  group by product_id
) totals
where p.id = totals.product_id;

create or replace function private.sync_product_stock_from_variants()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  target_product_id uuid := coalesce(new.product_id, old.product_id);
begin
  update public.products p
  set stock = coalesce((
    select sum(v.stock)::integer
    from public.product_variants v
    where v.product_id = target_product_id and v.status = 'active'
  ), 0)
  where p.id = target_product_id;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function private.sync_product_stock_from_variants() from public, anon, authenticated;
create trigger product_variants_sync_product_stock
after insert or update or delete on public.product_variants
for each row execute function private.sync_product_stock_from_variants();

-- Seller-scoped replacement is one transaction and never accepts a tenant id.
create or replace function public.replace_product_variants(
  p_product_id uuid,
  p_variants jsonb
) returns setof public.product_variants
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  shop_id uuid;
  item jsonb;
  variant_id uuid;
begin
  if jsonb_typeof(p_variants) is distinct from 'array' or jsonb_array_length(p_variants) > 100 then
    raise exception 'invalid_variants';
  end if;
  select p.shop_id into shop_id
  from public.products p
  join public.shops s on s.id = p.shop_id
  where p.id = p_product_id and s.owner_id = auth.uid()
  for update of p;
  if shop_id is null then raise exception 'product_not_found'; end if;

  delete from public.product_variants where product_id = p_product_id;
  for item in select value from jsonb_array_elements(p_variants) loop
    if jsonb_typeof(item) <> 'object'
       or coalesce(btrim(item->>'name'), '') = ''
       or coalesce(item->>'stock', '') !~ '^[0-9]{1,9}$'
       or (item ? 'price' and item->>'price' is not null and coalesce(item->>'price','') !~ '^[0-9]+$')
       or (item ? 'promoPrice' and item->>'promoPrice' is not null and coalesce(item->>'promoPrice','') !~ '^[0-9]+$') then
      raise exception 'invalid_variant';
    end if;
    variant_id := case
      when coalesce(item->>'id','') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      then (item->>'id')::uuid else gen_random_uuid() end;
    insert into public.product_variants (
      id, shop_id, product_id, sku, name, size, color, price, promo_price, stock, status
    ) values (
      variant_id, shop_id, p_product_id,
      nullif(left(btrim(item->>'sku'), 160), ''), left(btrim(item->>'name'), 160),
      nullif(left(btrim(item->>'size'), 100), ''), nullif(left(btrim(item->>'color'), 100), ''),
      case when item->>'price' is null then null else (item->>'price')::bigint end,
      case when item->>'promoPrice' is null then null else (item->>'promoPrice')::bigint end,
      (item->>'stock')::integer,
      case when item->>'status' = 'hidden' then 'hidden' else 'active' end
    );
  end loop;
  return query select * from public.product_variants where product_id = p_product_id order by created_at, id;
end;
$$;

revoke all on function public.replace_product_variants(uuid,jsonb) from public, anon;
grant execute on function public.replace_product_variants(uuid,jsonb) to authenticated;

commit;
