-- Distributed MCP rate limiting for serverless execution.
-- The authenticated seller identity comes from auth.uid(), never request input.
begin;

create table if not exists private.mcp_rate_limits (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  requested_at timestamptz not null default now()
);

alter table private.mcp_rate_limits enable row level security;
revoke all on table private.mcp_rate_limits from public, anon, authenticated;

create index if not exists mcp_rate_limits_user_action_requested_at_idx
  on private.mcp_rate_limits (user_id, action, requested_at);

-- Cleanup is global (not seller/action-scoped), so it needs its own timestamp
-- prefix to avoid scanning and sorting all rate-limit rows on every MCP call.
create index if not exists mcp_rate_limits_requested_at_idx
  on private.mcp_rate_limits (requested_at);

create or replace function public.enforce_own_mcp_rate_limit(p_action text)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_user_id uuid := auth.uid();
  v_count integer;
begin
  if v_user_id is null then
    raise exception 'mcp_auth_required';
  end if;

  if p_action not in (
    'get_store_design', 'update_store_theme', 'add_store_section',
    'update_store_section', 'move_store_section', 'remove_store_section',
    'publish_store', 'rollback_store_design', 'get_shop_profile',
    'update_shop_profile', 'list_products', 'get_product', 'list_orders',
    'get_order', 'get_inventory_summary', 'list_low_stock_products',
    'get_sales_summary', 'get_best_selling_products'
  ) then
    raise exception 'invalid_mcp_action';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text || ':' || p_action, 0));

  delete from private.mcp_rate_limits
  where id in (
    select id
    from private.mcp_rate_limits
    where requested_at < now() - interval '1 day'
    order by requested_at asc
    limit 500
  );

  select count(*) into v_count
  from private.mcp_rate_limits
  where user_id = v_user_id
    and action = p_action
    and requested_at >= now() - interval '1 minute';

  if v_count >= 120 then
    raise exception 'mcp_rate_limit_exceeded';
  end if;

  insert into private.mcp_rate_limits (user_id, action)
  values (v_user_id, p_action);
end;
$$;

revoke all on function public.enforce_own_mcp_rate_limit(text)
  from public, anon;
grant execute on function public.enforce_own_mcp_rate_limit(text)
  to authenticated;

commit;
