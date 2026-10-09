-- Preserve seller ownership checks while avoiding per-row auth.uid() evaluation.
begin;

drop policy if exists product_variants_owner_all on public.product_variants;
create policy product_variants_owner_all on public.product_variants
for all to authenticated
using (exists (
  select 1 from public.shops s
  where s.id = product_variants.shop_id
    and s.owner_id = (select auth.uid())
))
with check (
  exists (
    select 1 from public.shops s
    where s.id = product_variants.shop_id
      and s.owner_id = (select auth.uid())
  )
  and exists (
    select 1 from public.products p
    where p.id = product_variants.product_id
      and p.shop_id = product_variants.shop_id
  )
);

commit;
