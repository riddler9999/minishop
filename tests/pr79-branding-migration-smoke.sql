-- PR79 migration smoke test.
-- Run AFTER 0020_branding_core_all_plans.sql in a staging/preview database.
-- This script is read-only and fails fast if the migration did not preserve
-- platform-managed owner/plan protection while removing the Business-only logo guard.

do $$
declare
  v_def text;
begin
  select pg_get_functiondef(
    'public.protect_shop_managed_fields()'::regprocedure
  ) into v_def;

  if v_def is null then
    raise exception 'smoke_protect_shop_managed_fields_missing';
  end if;

  if position('owner_is_platform_managed' in v_def) = 0 then
    raise exception 'smoke_owner_guard_missing';
  end if;

  if position('plan_is_platform_managed' in v_def) = 0 then
    raise exception 'smoke_plan_guard_missing';
  end if;

  if position('business_plan_required' in v_def) > 0 then
    raise exception 'smoke_business_logo_guard_still_present';
  end if;

  if position('new.logo_url is distinct from old.logo_url' in v_def) > 0 then
    raise exception 'smoke_logo_plan_guard_still_present';
  end if;
end $$;
