-- =============================================================================
-- Harden set_updated_at() against the mutable-search_path advisory finding
-- (Supabase security linter: function_search_path_mutable). Pins search_path
-- so the trigger function can't be tricked by a session-level search_path
-- change into resolving `now()`/other calls against an attacker schema.
-- =============================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
