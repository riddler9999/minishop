-- 0009_shop_theme.sql
-- Store Design: a seller-editable storefront customization blob.
--
-- Adds `shops.theme` (jsonb). It holds cosmetic storefront settings only —
-- hero/section copy, section toggles, a hero image URL and an accent colour —
-- rendered by the buyer storefront (Homepage, Category page, Product page).
-- It is NEVER a security boundary: the frontend always re-validates it through
-- domain/theme.ts::normalizeTheme() before rendering, so a malformed or
-- hostile value can only ever collapse to the defaults.
--
-- Authorization is unchanged and already correct for this column:
--   * RLS policy `shops_owner_all` (0001) confines every UPDATE to the row whose
--     owner_id = auth.uid(), so a seller can only edit their own theme.
--   * The `protect_shop_managed_fields` trigger (0007) guards plan / owner_id /
--     logo_url only; it does not touch `theme`, so no trigger change is needed.
--     The Business-plan gate on Store Design is a FRONTEND commercial choice
--     (see CLAUDE.md "Plan gating"), not a DB rule — the DB stays permissive so
--     a downgraded shop keeps its saved theme (data reappears on upgrade).
--
-- Default '{}' means "no customization" → the storefront falls back to its
-- original hardcoded copy. Existing rows backfill to '{}' automatically.
--
-- NOTE: pending apply. Per D7 this is NOT applied to the live project without
-- the owner's explicit go-ahead. The frontend reads `theme` DEFENSIVELY (a
-- missing column resolves to the default theme and never breaks storefront or
-- console), so shipping the code ahead of the migration is safe; Store Design
-- simply cannot persist until 0009 is applied.

alter table public.shops
  add column if not exists theme jsonb not null default '{}'::jsonb;

comment on column public.shops.theme is
  'Seller-editable storefront customization (Store Design). Cosmetic only; '
  'always re-validated client-side via domain/theme.ts. Owner-scoped by the '
  'existing shops RLS; not a security boundary.';
