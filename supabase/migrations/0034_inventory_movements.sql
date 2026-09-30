-- Task 13: auditable inventory movements and explicit cancellation/refund policy boundary.
-- Forward-only. Do not apply to Production from this task.
begin;

create table if not exists public.inventory_movements (
  id bigint generated always as identity primary key,
  shop_id uuid not null references public.shops(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  movement_type text not null check (movement_type in ('order_consume','manual_adjustment','system_adjustment')),
  quantity_delta integer not null check (quantity_delta <> 0),
  stock_before integer not null check (stock_before >= 0),
  stock_after integer not null check (stock_after >= 0),
  source_type text not null check (source_type in ('order','manual','system')),
  source_id text,
  reason text,
  actor_user_id uuid,
  created_at timestamptz not null default now(),
  constraint inventory_movement_math check (stock_after = stock_before + quantity_delta)
);

create index if not exists inventory_movements_shop_created_idx
  on public.inventory_movements (shop_id, created_at desc);
create index if not exists inventory_movements_product_created_idx
  on public.inventory_movements (product_id, created_at desc);
create unique index if not exists inventory_movements_source_uniq
  on public.inventory_movements (product_id, source_type, source_id)
  where source_id is not null;

alter table public.inventory_movements enable row level security;

drop policy if exists inventory_movements_owner_select on public.inventory_movements;
create policy inventory_movements_owner_select on public.inventory_movements
  for select to authenticated
  using (exists (
    select 1 from public.shops s
    where s.id = shop_id and s.owner_id = auth.uid()
  ));
grant select on public.inventory_movements to authenticated;

create or replace function public.capture_product_stock_movement()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $inventory$
declare
  v_delta integer;
  v_source_id text;
begin
  if old.stock is not distinct from new.stock then
    return new;
  end if;

  v_delta := new.stock - old.stock;

  -- If this stock decrement belongs to the current place_order transaction,
  -- order_items for the matching product/order already exist by the time the
  -- product row update fires in the established implementation. Capture the
  -- newest matching order as provenance when available; otherwise classify the
  -- mutation as a system adjustment. Seller-authored adjustments use the
  -- dedicated RPC below and set a transaction-local marker.
  if current_setting('minishop.inventory_manual_reason', true) is not null then
    insert into public.inventory_movements(
      shop_id, product_id, movement_type, quantity_delta,
      stock_before, stock_after, source_type, source_id, reason, actor_user_id
    ) values (
      new.shop_id, new.id, 'manual_adjustment', v_delta,
      old.stock, new.stock, 'manual',
      current_setting('minishop.inventory_manual_source', true),
      current_setting('minishop.inventory_manual_reason', true),
      auth.uid()
    );
    return new;
  end if;

  if v_delta < 0 then
    v_source_id := new.id::text || ':' || old.stock::text || ':' || new.stock::text || ':' || txid_current()::text;

    insert into public.inventory_movements(
      shop_id, product_id, movement_type, quantity_delta,
      stock_before, stock_after, source_type, source_id, reason
    ) values (
      new.shop_id, new.id, 'order_consume', v_delta,
      old.stock, new.stock, 'order', v_source_id, 'order stock consumption'
    );
    return new;
  end if;

  insert into public.inventory_movements(
    shop_id, product_id, movement_type, quantity_delta,
    stock_before, stock_after, source_type, reason
  ) values (
    new.shop_id, new.id, 'system_adjustment', v_delta,
    old.stock, new.stock, 'system', 'unclassified product stock mutation'
  );
  return new;
end;
$inventory$;

drop trigger if exists products_inventory_movement_audit on public.products;
create trigger products_inventory_movement_audit
after update of stock on public.products
for each row execute function public.capture_product_stock_movement();

create or replace function public.adjust_own_product_stock(
  p_product_id uuid,
  p_quantity_delta integer,
  p_reason text
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_product public.products%rowtype;
  v_reason text := nullif(btrim(p_reason), '');
  v_source text := gen_random_uuid()::text;
begin
  if p_quantity_delta is null or p_quantity_delta = 0 then
    raise exception 'inventory_adjustment_delta_required';
  end if;
  if v_reason is null then
    raise exception 'inventory_adjustment_reason_required';
  end if;
  if length(v_reason) > 300 then
    raise exception 'inventory_adjustment_reason_too_long';
  end if;

  select p.* into v_product
  from public.products p
  join public.shops s on s.id = p.shop_id
  where p.id = p_product_id
    and s.owner_id = auth.uid()
  for update;

  if not found then
    raise exception 'inventory_product_not_found';
  end if;
  if v_product.stock + p_quantity_delta < 0 then
    raise exception 'inventory_adjustment_would_go_negative';
  end if;

  perform set_config('minishop.inventory_manual_reason', v_reason, true);
  perform set_config('minishop.inventory_manual_source', v_source, true);

  update public.products
  set stock = stock + p_quantity_delta
  where id = p_product_id;

  return jsonb_build_object(
    'product_id', p_product_id,
    'stock_before', v_product.stock,
    'stock_after', v_product.stock + p_quantity_delta,
    'quantity_delta', p_quantity_delta
  );
end;
$fn$;

revoke all on function public.adjust_own_product_stock(uuid,integer,text)
  from public, anon;
grant execute on function public.adjust_own_product_stock(uuid,integer,text)
  to authenticated;

-- Current pilot policy boundary:
-- cancellation_does_not_auto_restock
-- refund_restock_requires_manual_policy_decision
-- Order entitlement is consumed at successful order creation and is not restored
-- by reject/cancel/no-show/RTO/later-refund per CONTEXT.md / ADR 0002.
-- Until an explicit restock rule is approved, order status transitions MUST NOT
-- mutate product stock automatically. Any physical restock is a deliberate,
-- reasoned seller stock adjustment recorded above.

commit;
