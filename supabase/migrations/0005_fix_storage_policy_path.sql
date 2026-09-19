-- Backfill of the live migration "fix_storage_policy_path".
-- Kept idempotent so a clean database replay and the existing production
-- database converge on the same first-folder tenant check.

drop policy if exists tenant_media_owner_insert on storage.objects;
create policy tenant_media_owner_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('shop-logos','product-images')
    and exists (
      select 1 from public.shops s
      where s.owner_id = (select auth.uid())
        and s.id::text = (storage.foldername(name))[1]
    )
  );

drop policy if exists tenant_media_owner_update on storage.objects;
create policy tenant_media_owner_update on storage.objects
  for update to authenticated
  using (
    bucket_id in ('shop-logos','product-images')
    and exists (
      select 1 from public.shops s
      where s.owner_id = (select auth.uid())
        and s.id::text = (storage.foldername(name))[1]
    )
  )
  with check (
    bucket_id in ('shop-logos','product-images')
    and exists (
      select 1 from public.shops s
      where s.owner_id = (select auth.uid())
        and s.id::text = (storage.foldername(name))[1]
    )
  );

drop policy if exists tenant_media_owner_delete on storage.objects;
create policy tenant_media_owner_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('shop-logos','product-images')
    and exists (
      select 1 from public.shops s
      where s.owner_id = (select auth.uid())
        and s.id::text = (storage.foldername(name))[1]
    )
  );
