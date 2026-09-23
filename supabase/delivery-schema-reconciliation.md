# Delivery Schema Reconciliation

This document records the verified repository-vs-production drift for the MiniShop delivery contract.

## Verified live production state

Project: `fsxdnmnycizjkgstokze`

Current production does **not** have:
- `shops.delivery_service`
- `shops.origin_region`
- `shops.origin_township`
- `orders.delivery_service`
- `orders.origin_township`
- `public.ninjavan_rates`
- `public.resolve_delivery_fee(uuid,text,text)`

Current production `place_order` is the 10-argument entitlement-aware SECURITY DEFINER function:
`place_order(text,text,text,text,text,text,text,text,jsonb,uuid)`.

Owner uniqueness preflight returned zero duplicate owners.

## Repository expectation

The repository already contains runtime and generated-type consumers for the pending delivery schema:
- `api/checkout.ts`
- `src/features/shop/sellerShop.ts`
- `src/core/supabase/database.types.ts`
- `0016_entitlements_and_pricing.sql`

Those consumers assume the delivery foundation introduced by `0013_delivery_services.sql`.

## Migration dependency order

The delivery chain is:
1. `0013_delivery_services.sql`
2. `0014_ninjavan_production_pricing.sql`
3. `0015_ninjavan_verified_seed.sql`

However, production already has `0016_entitlements_and_pricing.sql`, whose `place_order` body references delivery fields and `resolve_delivery_fee()`.

Therefore applying historical `0014` directly to current production would regress `place_order` from the 10-argument entitlement/idempotency version back to the older 9-argument implementation. That is unsafe.

A production-safe reconciliation must preserve the live 10-argument `place_order` signature and its entitlement/idempotency behavior while adding the missing delivery foundation.

## Security notes

`0013` enables RLS on `ninjavan_rates` and adds an active-rate SELECT policy for anon/authenticated.

`0014` creates `resolve_delivery_fee` as SECURITY DEFINER with a pinned search_path and explicitly revokes PUBLIC execute before granting anon/authenticated execute.

Any reconciliation migration must retain the existing `place_order` SECURITY DEFINER hardening and must not broaden table policies or grants.

## Rollback implications

Adding nullable origin columns and the defaulted `delivery_service='custom'` is structurally reversible, but dropping them after runtime starts writing them would destroy delivery configuration/order audit data.

Creating `ninjavan_rates` and `resolve_delivery_fee` is reversible only before application/runtime adoption.

Do not attempt automatic rollback in production. A rollback plan must first disable delivery consumers, then restore the prior `place_order` definition, then remove delivery objects only if no production data depends on them.

## Production action

No production migration was applied by this PR.

The exact production SQL must be reviewed and explicitly approved before execution.
