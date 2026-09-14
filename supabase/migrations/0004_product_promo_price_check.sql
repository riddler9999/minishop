-- =============================================================================
-- Enforce promo_price < price at the DB level when is_promotion is set.
-- Previously guarded client-side only (AdminProducts.tsx save()) — a direct
-- write (buggy client, manual SQL, future admin tool) could otherwise store
-- an inverted or missing promo price that the storefront would then display
-- or price orders from. place_order() already reads promo_price correctly
-- when set (0001_init_saas.sql), so this only rules out bad states, it does
-- not change any pricing behavior for existing valid rows.
-- =============================================================================
alter table public.products
  add constraint products_promo_price_lt_price
  check (not is_promotion or (promo_price is not null and promo_price < price));
