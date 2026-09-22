-- Seed only confidently verified Ninja Van Myanmar rates from supplied charts.
-- Unknown routes remain absent and fail closed via resolve_delivery_fee().
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
do update set fee = excluded.fee, source_label = excluded.source_label, is_active = true;
