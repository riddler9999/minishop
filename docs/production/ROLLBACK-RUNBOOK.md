# MiniShop Rollback Runbook

Official status: **PRE-PRODUCTION / PRODUCTION HARDENING**

Treat application, database and configuration failures separately.

## Application rollback

Triggers include serverless failures, critical buyer/seller regression, authorization regression, or deployed SHA differing from approved SHA.

1. Record current `/api/version`, deployment ID and symptoms.
2. Identify a previous **known-good** Vercel Production deployment by deployment ID + Git SHA.
3. Confirm candidate is schema-compatible with current Production DB.
4. Promote/redeploy the exact known-good SHA using the approved Vercel mechanism.
5. Verify `/api/version`, `/api/health`, storefront, checkout, seller login and admin boundaries.
6. Preserve failed SHA/evidence; never rewrite Git history.

Audit observation: Production was `dpl_AGEjZDsfJgG3TQJn88E2ftBtye46` / `e832dd1e695640211d64ffffedf0d25fd94368a2`. It is **not** classified as known-good because its API functions were observed failing.

## Database failure

Never casually down-migrate Production.

Freeze dependent app releases; capture exact migration history/error; determine committed statements; prefer a forward-fix; test on Staging; re-obtain explicit Production approval; apply and rerun both Supabase Advisors + smoke tests.

A restore is disaster recovery. Verify backup/PITR availability before relying on it. Older app rollback is allowed only when compatible with the newer schema.

## Configuration failure

1. Identify changed variable **name and scope** without exposing value.
2. Restore last verified value for that environment.
3. Redeploy if required.
4. Verify version/health/superadmin/affected flow.
5. Confirm Preview still points only to Staging.

Never copy a Production service-role key into Preview.

## Staging rollback drill

Deploy harmless revision A, then B; designate A known-good; roll back to A; verify version + health + one synthetic buyer flow; record both deployment IDs/timestamps.

Phase 1: **NOT TESTED** — no Staging Supabase branch exists and Vercel env scopes are not manageable/verifiable through the available connector.
