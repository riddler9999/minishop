-- Task 13: auditable inventory movements and explicit cancellation/refund policy boundary.
-- Forward-only. Do not apply to Production from this task.
begin;

create table if not exists public.inventory_movements (
  id bigint generated always as identity primary key,
  shop_id uuid not null references public.shops(id) on delete cascade,
  -- Deliberately not an FK: permanent product deletion is supported, but audit
  -- history must retain the original product identifier after the catalog row is gone.
  product_id uuid not null,
  product_name_snapshot text not null,
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
create index if not exists inventory_movements_source_idx
  on public.inventory_movements (source_type, source_id)
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

-- place_order() creates the order row before it decrements product stock. Capture
-- that exact order id transaction-locally so the product trigger can record real
-- provenance without racing another checkout or rewriting place_order().
create or replace function public.set_inventory_order_context()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $order_context$
begin
  perform set_config('minishop.inventory_order_id', new.id::text, true);
  perform set_config('minishop.inventory_order_no', new.order_no, true);
  return new;
end;
$order_context$;

drop trigger if exists orders_inventory_context on public.orders;
create trigger orders_inventory_context
after insert on public.orders
for each row execute function public.set_inventory_order_context();

create or replace function public.capture_product_stock_movement()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $inventory$
declare
  v_delta integer;
  v_order_id text := nullif(current_setting('minishop.inventory_order_id', true), '');
  v_order_no text := nullif(current_setting('minishop.inventory_order_no', true), '');
  v_manual_reason text := nullif(current_setting('minishop.inventory_manual_reason', true), '');
  v_manual_source text := nullif(current_setting('minishop.inventory_manual_source', true), '');
begin
  if old.stock is not distinct from new.stock then
    return new;
  end if;

  v_delta := new.stock - old.stock;

  -- Explicit operational adjustment through adjust_own_product_stock().
  if v_manual_reason is not null then
    insert into public.inventory_movements(
      shop_id, product_id, product_name_snapshot, movement_type, quantity_delta,
      stock_before, stock_after, source_type, source_id, reason, actor_user_id
    ) values (
      new.shop_id, new.id, new.name, 'manual_adjustment', v_delta,
      old.stock, new.stock, 'manual', v_manual_source, v_manual_reason, auth.uid()
    );
    return new;
  end if;

  -- A real order row was inserted earlier in this same transaction. Because the
  -- context is transaction-local, concurrent checkouts cannot be mistaken for
  -- one another. source_id is the actual orders.id UUID.
  if v_delta < 0 and v_order_id is not null then
    insert into public.inventory_movements(
      shop_id, product_id, product_name_snapshot, movement_type, quantity_delta,
      stock_before, stock_after, source_type, source_id, reason
    ) values (
      new.shop_id, new.id, new.name, 'order_consume', v_delta,
      old.stock, new.stock, 'order', v_order_id,
      coalesce('order stock consumption: ' || v_order_no, 'order stock consumption')
    );
    return new;
  end if;

  -- The existing seller product editor writes products.stock directly. Treat
  -- that authenticated owner edit as a manual adjustment rather than falsely
  -- labelling a stock decrease as order consumption. RLS remains the ownership
  -- boundary; actor_user_id makes the edit attributable.
  if auth.uid() is not null then
    insert into public.inventory_movements(
      shop_id, product_id, product_name_snapshot, movement_type, quantity_delta,
      stock_before, stock_after, source_type, reason, actor_user_id
    ) values (
      new.shop_id, new.id, new.name, 'manual_adjustment', v_delta,
      old.stock, new.stock, 'manual', 'seller product editor stock update', auth.uid()
    );
    return new;
  end if;

  -- Privileged/system mutations outside checkout remain explicit rather than
  -- being misrepresented as an order.
  insert into public.inventory_movements(
    shop_id, product_id, product_name_snapshot, movement_type, quantity_delta,
    stock_before, stock_after, source_type, reason
  ) values (
    new.shop_id, new.id, new.name, 'system_adjustment', v_delta,
    old.stock, new.stock, 'system', 'unclassified privileged product stock mutation'
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
