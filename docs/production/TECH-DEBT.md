# Production Technical Debt

This file records unresolved production-readiness debt without erasing historical decisions.

## Database / RLS / Concurrency — 2026-09-25

### P0
- **Production authenticated/public RLS overlap remains live until migration 0023 is applied.** Authenticated Seller A can currently read Seller B's active shop/product rows because public storefront SELECT policies apply to `public`, which includes `authenticated`. Repository fix: `0023_database_rls_concurrency_reconciliation.sql`. Do not mark resolved until safe-environment behavioral RLS tests pass and Production deployment is explicitly approved.

### P1
- **Anonymous base-table shop metadata is broader than the server storefront projection.** Active `shops` rows are anon-readable and expose columns including `owner_id` and `plan`. Replace buyer base-table access with buyer-safe views/RPCs or another explicitly projected DB surface, then revoke anon base-table SELECT. This needs coordinated storefront API tests.
- **Database mutation/concurrency suite is now behaviorally proven in zero-cost GitHub Actions local Supabase.** Run `36123942215` replayed migrations through 0023 and passed RLS, PostgREST/RPC, Storage, idempotency, stock, entitlement, rollback, product-cap, billing, and Extra Order race tests. Keep this CI gate required for future DB changes.
- **Migration 0023 requires coordinated server/database rollout.** `admin_credit_order_pack` changes signature to require full transaction ID. Runtime compatibility is proven locally, but Production apply remains a separate approval/deployment step.
- **Migration history is not a filename-for-filename mirror of repository migrations.** Reconcile timestamped Production history to intended final objects before future automated migration deployment.

### P2
- **Reject/RTO/refund non-restoration is only PARTIAL runtime proof.** Current schema does not persist distinct statuses for all three outcomes, so the suite can prove cancellation non-restoration but cannot execute separate rejection/RTO/refund transitions until the domain model represents them.
- **Supabase generated types drift.** `src/core/supabase/database.types.ts` is maintained but not a strict current generated snapshot; regenerate after 0023 reaches the target schema and review all service-only RPC differences.
- **Leaked password protection disabled.** Supabase Security Advisor reports Auth leaked-password protection is off. Handle in Auth/security hardening.
- **Advisor performance warnings.** Multiple permissive SELECT policies and several currently-unused indexes are reported. Reassess after 0023 and meaningful traffic; do not drop indexes solely from current low-traffic statistics.
- **Broad EXECUTE on non-definer trigger helpers.** Trigger functions such as `set_updated_at` and policy-protection helpers are not SECURITY DEFINER, so current direct EXECUTE is not a privilege escalation, but grants can be tightened in a future least-privilege cleanup.

## Evidence source

See `docs/production/DATABASE-RLS-CONCURRENCY-AUDIT.md` for live Production read-only evidence, severity rationale, and the behavioral/runtime coverage matrix.
