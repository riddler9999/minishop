-- Task 14 acceptance finding: remove unintended RPC exposure from trigger-only
-- functions and make seller order-status mutation explicitly authenticated-only.
-- Forward-only privilege hardening; no data or business-contract changes.

revoke all on function public.set_inventory_order_context()
  from public, anon, authenticated;

revoke all on function public.capture_product_stock_movement()
  from public, anon, authenticated;

revoke all on function public.update_order_status_and_notify(text,uuid,text)
  from public, anon, authenticated;
grant execute on function public.update_order_status_and_notify(text,uuid,text)
  to authenticated;
