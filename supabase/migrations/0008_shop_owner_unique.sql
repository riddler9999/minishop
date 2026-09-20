-- Enforce one shop per owner at the database level.
--
-- The entire seller admin flow (RequireAdmin, Onboarding's self-guard, and
-- ownShop resolution) assumes a single `shops` row per owner and reads it with
-- `.maybeSingle()`, which THROWS when more than one row matches. Until now only
-- `slug` was unique; `owner_id` had a plain index (`shops_owner_idx`) but no
-- uniqueness. A duplicate insert (double-submit on a slow network, two tabs, a
-- retry before the post-create navigate lands) would therefore wedge a seller
-- out of the console permanently: every later `getOwnShop()` throws, so
-- RequireAdmin bounces them to onboarding, where re-inserting collides on the
-- unique slug and dead-ends.
--
-- Adding this constraint makes that invariant real. It also lets createOwnShop
-- treat an owner collision as "shop already exists" and recover idempotently.
--
-- NOTE: this fails if duplicate rows already exist. Resolve any duplicates
-- before applying (none expected on the current single-tenant-per-owner data).

alter table public.shops
  add constraint shops_owner_unique unique (owner_id);
