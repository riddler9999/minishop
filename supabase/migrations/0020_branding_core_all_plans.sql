-- Product decision: Store Branding is core on every plan.
-- Keep owner_id and plan platform-managed, but stop rejecting seller logo edits
-- solely because the shop is not on the Business plan.
create or replace function public.protect_shop_managed_fields()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_app_plan text;
begin
  if auth.uid() is not null then
    if tg_op = 'INSERT' then
      select plan into v_app_plan from public.shop_applications
        where owner_id = (select auth.uid()) and status = 'approved';
      new.plan := coalesce(v_app_plan, 'free_trial');
    end if;

    if tg_op = 'UPDATE' then
      if new.owner_id is distinct from old.owner_id then
        raise exception 'owner_is_platform_managed';
      end if;

      if new.plan is distinct from old.plan then
        raise exception 'plan_is_platform_managed';
      end if;
    end if;
  end if;

  return new;
end;
$$;
