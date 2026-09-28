begin;

-- Task 4 / F8: anonymous buyers should receive only the fields required by
-- storefront and checkout. Seller/admin clients continue to use the owner-scoped
-- base tables under their existing authenticated/service-role boundaries.

create or replace view public.buyer_public_shops
with (security_barrier = true)
as
select
  id,
  slug,
  name,
  logo_url,
  default_delivery_fee,
  delivery_service,
  origin_region,
  origin_township,
  theme
from public.shops
where is_active = true;

create or replace view public.buyer_public_products
with (security_barrier = true)
as
select
  p.id,
  p.shop_id,
  p.name,
  p.description,
  p.category,
  p.color,
  p.size,
  p.price,
  p.promo_price,
  p.is_promotion,
  p.stock,
  p.status,
  p.images,
  p.arrival_date,
  p.created_at
from public.products p
join public.shops s on s.id = p.shop_id
where p.status = 'active'
  and s.is_active = true;

create or replace view public.buyer_public_payment_accounts
with (security_barrier = true)
as
select
  pa.shop_id,
  pa.provider,
  pa.account_name,
  pa.phone
from public.payment_accounts pa
join public.shops s on s.id = pa.shop_id
where pa.is_active = true
  and s.is_active = true;

create or replace view public.buyer_public_shipping_zones
with (security_barrier = true)
as
select
  z.shop_id,
  z.region,
  z.township,
  z.fee
from public.shipping_zones z
join public.shops s on s.id = z.shop_id
where s.is_active = true;

-- Views run with the view owner's privileges so anon does not need direct SELECT
-- on tenant base tables. The projection and predicates above are therefore the
-- buyer trust boundary; keep grants narrow and explicit.
revoke all on public.buyer_public_shops from public, anon, authenticated;
revoke all on public.buyer_public_products from public, anon, authenticated;
revoke all on public.buyer_public_payment_accounts from public, anon, authenticated;
revoke all on public.buyer_public_shipping_zones from public, anon, authenticated;

grant select on public.buyer_public_shops to anon;
grant select on public.buyer_public_products to anon;
grant select on public.buyer_public_payment_accounts to anon;
grant select on public.buyer_public_shipping_zones to anon;

revoke select on public.shops from anon;
revoke select on public.products from anon;
revoke select on public.payment_accounts from anon;
revoke select on public.shipping_zones from anon;

commit;
