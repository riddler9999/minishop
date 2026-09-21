-- Ninja Van / custom delivery service foundation
alter table public.shops
  add column if not exists origin_region text,
  add column if not exists origin_township text,
  add column if not exists delivery_service text not null default 'custom'
    check (delivery_service in ('ninjavan','custom'));

alter table public.orders
  add column if not exists delivery_service text,
  add column if not exists origin_township text;

-- Ninja Van rate table keyed by sender city + receiver township.
-- Prices are seeded separately from the supplied official Ninja Van coverage charts.
create table if not exists public.ninjavan_rates (
  id uuid primary key default gen_random_uuid(),
  origin_township text not null,
  destination_region text not null,
  destination_township text not null,
  fee bigint not null check (fee >= 0),
  source_label text not null default 'Ninja Van Myanmar coverage chart',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (origin_township, destination_region, destination_township)
);
create index if not exists ninjavan_rates_route_idx
  on public.ninjavan_rates(origin_township, destination_region, destination_township)
  where is_active = true;

alter table public.ninjavan_rates enable row level security;

drop policy if exists ninjavan_rates_public_read on public.ninjavan_rates;
create policy ninjavan_rates_public_read on public.ninjavan_rates
  for select to anon, authenticated
  using (is_active = true);

comment on table public.ninjavan_rates is
  'MiniShop normalized Ninja Van Myanmar sender-city -> destination-township tariff table. Keep tariff updates in data, not application code.';
