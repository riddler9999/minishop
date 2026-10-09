-- Match the AI Store Builder media upload contract: JPEG, PNG, WebP, up to 10 MiB.
-- This changes only the existing product-images bucket; shop-logos remains untouched.
-- Supabase Storage upload constraints apply before server-side content verification.
begin;

do $$
begin
  if not exists (select 1 from storage.buckets where id = 'product-images') then
    raise exception 'product-images bucket is required for AI Store Builder';
  end if;
end;
$$;

update storage.buckets
set file_size_limit = 10485760,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']::text[]
where id = 'product-images';

commit;
