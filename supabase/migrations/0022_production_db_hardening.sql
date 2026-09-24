-- Production DB hardening after final pricing/packaging reconciliation.
-- Safe, additive changes only:
--   1) trigger-only SECURITY DEFINER helper is not directly callable by API roles
--   2) cover entitlement_ledger.order_id FK for deletes/joins
begin;

revoke all on function public.init_shop_entitlement()
  from public, anon, authenticated;

create index if not exists entitlement_ledger_order_id_idx
  on public.entitlement_ledger (order_id)
  where order_id is not null;

commit;
