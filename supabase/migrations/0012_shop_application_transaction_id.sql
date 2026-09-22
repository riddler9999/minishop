-- Full transaction ID captured from payment proof automation.
-- Nullable keeps manual/legacy applications compatible.
alter table public.shop_applications
  add column if not exists transaction_id text;

create unique index if not exists shop_applications_transaction_id_uidx
  on public.shop_applications (btrim(transaction_id))
  where transaction_id is not null and btrim(transaction_id) <> '';
