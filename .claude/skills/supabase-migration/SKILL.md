---
name: supabase-migration
description: Procedure for making a schema change in this repo's Supabase backend — creating a migration file, applying it, and regenerating TypeScript types. Use whenever adding or altering a table, column, RPC, or RLS policy under supabase/migrations/.
---

# Supabase schema migration procedure

Any schema change needs three things kept in sync:

1. A new `supabase/migrations/NNNN_*.sql` file.
2. Applying it via `mcp__Supabase__apply_migration` against the project — **never apply to
   production without the owner's explicit go-ahead**.
3. Regenerating `src/core/supabase/database.types.ts`.

See `CLAUDE.md`'s Supabase backend section for the existing migration history and the
security model (RLS, `place_order()`/`lookup_order()` RPCs) that migrations must preserve.
