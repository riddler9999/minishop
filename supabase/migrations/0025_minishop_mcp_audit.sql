create table if not exists public.mcp_audit_log (
  id bigint generated always as identity primary key,
  actor_user_id uuid not null,
  shop_id uuid not null references public.shops(id) on delete cascade,
  mcp_tool text not null,
  action text not null,
  before_revision bigint,
  after_revision bigint,
  request_id text not null,
  created_at timestamptz not null default now()
);

alter table public.mcp_audit_log enable row level security;
revoke all on table public.mcp_audit_log from public, anon, authenticated;
grant insert on table public.mcp_audit_log to authenticated;

drop policy if exists mcp_audit_owner_insert on public.mcp_audit_log;
create policy mcp_audit_owner_insert on public.mcp_audit_log
for insert to authenticated
with check (
  actor_user_id = (select auth.uid())
  and exists (
    select 1 from public.shops s
    where s.id = shop_id
      and s.owner_id = (select auth.uid())
  )
);
