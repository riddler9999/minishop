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
-- ============================================================================
-- BEFORE APPLYING — this migration FAILS if duplicate `owner_id` rows already
-- exist (the UNIQUE constraint cannot be created over them). Run this read-only
-- check first; it must return ZERO rows before you apply. It only reads — it
-- neither deletes nor merges anything, and resolving any duplicates it surfaces
-- is a manual, owner-approved decision (never automate row deletion/merge):
--
--   select owner_id, count(*) as shop_count, array_agg(id) as shop_ids
--   from public.shops
--   group by owner_id
--   having count(*) > 1;
--
-- Never apply to production without the owner's explicit go-ahead — see
-- .claude/skills/supabase-migration/SKILL.md.
-- ============================================================================

alter table public.shops
  add constraint shops_owner_unique unique (owner_id);

-- The UNIQUE constraint above is backed by its own unique index on (owner_id),
-- so the pre-existing non-unique index is now redundant — drop it to avoid
-- maintaining two indexes on the same column. `if exists` keeps this safe on a
-- database where the index was never created.
drop index if exists public.shops_owner_idx;
