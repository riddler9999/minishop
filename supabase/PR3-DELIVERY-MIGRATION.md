# PR3 — Production-safe Delivery Reconciliation Migration

This PR adds an exact reconciliation migration for review only. Production is unchanged.

Verified live state:
- Pricing/entitlements is already live.
- Production `place_order` is the 10-argument idempotency-aware function.
- Delivery-service/origin columns, `ninjavan_rates`, and `resolve_delivery_fee` are missing.
- Existing shops remain `custom` by default.
- Production currently has zero orders, so new nullable order audit columns require no backfill.
- Ninja Van rate seeding is intentionally excluded.

The migration adds the missing schema, RLS/policy/grants, a server-side fee resolver, and the repository's current 10-argument entitlement/idempotency-aware `place_order` with delivery pricing/audit fields.

Do not apply historical `0014_ninjavan_production_pricing.sql` directly to current production because it contains the obsolete 9-argument `place_order`.

Rollback is data-aware, not automatic. Before runtime adoption the function can be restored and new objects removed. After delivery configuration or order audit data is written, destructive rollback requires an explicit data-preservation plan.
