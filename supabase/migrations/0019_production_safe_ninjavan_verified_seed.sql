-- PR5: production-safe Ninja Van verified rate seed.
-- Depends on 0018_production_safe_delivery_reconciliation.sql.
-- Review-only until explicitly approved for production.
begin;

do $$
begin
  if to_regclass('public.ninjavan_rates') is null then
    raise exception 'ninjavan_rates_missing';
  end if;
end $$;

insert into public.ninjavan_rates
  (origin_township, destination_region, destination_township, fee, source_label, is_active)
values
  ('Yangon', 'Yangon', 'Insein', 4000, 'Supplied Ninja Van Myanmar coverage chart', true),
  ('Yangon', 'Yangon', 'North Okkalapa', 4000, 'Supplied Ninja Van Myanmar coverage chart', true),
  ('Yangon', 'Yangon', 'Mingaladon', 4000, 'Supplied Ninja Van Myanmar coverage chart', true),
  ('Yangon', 'Yangon', 'Shwe Pyi Thar', 4000, 'Supplied Ninja Van Myanmar coverage chart', true),
  ('Yangon', 'Yangon', 'Hlaing Thar Yar', 4000, 'Supplied Ninja Van Myanmar coverage chart', true),
  ('Yangon', 'Yangon', 'Dagon Seikkan', 4000, 'Supplied Ninja Van Myanmar coverage chart', true),
  ('Yangon', 'Yangon', 'Thanlyin', 6000, 'Supplied Ninja Van Myanmar coverage chart', true),
  ('Yangon', 'Yangon', 'Kyauktan', 6000, 'Supplied Ninja Van Myanmar coverage chart', true),
  ('Yangon', 'Yangon', 'Hlegu', 6000, 'Supplied Ninja Van Myanmar coverage chart', true),
  ('Yangon', 'Yangon', 'Dala', 6000, 'Supplied Ninja Van Myanmar coverage chart', true),
  ('Yangon', 'Yangon', 'Twante', 6000, 'Supplied Ninja Van Myanmar coverage chart', true)
on conflict (origin_township, destination_region, destination_township)
do update
set
  fee = excluded.fee,
  source_label = excluded.source_label,
  is_active = true;

commit;
