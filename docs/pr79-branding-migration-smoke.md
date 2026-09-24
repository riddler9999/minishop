# PR79 — Branding migration smoke-test plan

Target migration: `0020_branding_core_all_plans.sql`.

## Goal

Prove that Free Trial / Starter sellers can save branding while the existing platform-managed `owner_id` and `plan` protections remain intact.

## Pre-merge verification

- CI and Network resilience must be green on the final PR head.
- Migration contract test must pass.
- `tests/pr79-branding-migration-smoke.sql` must remain read-only and contain no INSERT/UPDATE/DELETE/DDL.

## Staging / preview database sequence

1. Snapshot one Free Trial shop, one Starter shop, and one Business shop: `id`, `owner_id`, `plan`, `logo_url`.
2. Apply `0020_branding_core_all_plans.sql`.
3. Run `tests/pr79-branding-migration-smoke.sql`; it must complete without exception.
4. With an authenticated seller session for Free Trial, upload/save a logo, reload Settings, and confirm the same URL persists.
5. Repeat logo save/remove for Starter.
6. Confirm Business branding still works.
7. Attempt to change `shops.plan` through the normal seller write path; it must still fail with `plan_is_platform_managed`.
8. Attempt to change `owner_id` through the normal seller write path; it must still fail with `owner_is_platform_managed`.
9. Open Store Design on Free Trial and Starter, save a theme change, reload, and verify persistence.
10. Open Analytics on Free Trial and Starter and confirm the low-stock analytics section renders without an upgrade card.

## Production rollout gate

Only apply production migration after the staging sequence passes. After production apply, repeat steps 3–10 on designated test shops before considering the rollout complete.

## Rollback

If seller branding writes fail or owner/plan protection regresses, restore the previous `protect_shop_managed_fields()` definition from migration `0016_entitlements_and_pricing.sql` and re-run the smoke test adapted to the rollback state.
