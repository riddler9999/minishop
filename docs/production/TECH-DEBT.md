# Production Technical Debt

Updated: 2026-09-27

This file records unresolved production-readiness debt without erasing historical decisions.

## P0

- **Production authenticated/public RLS overlap remains live until migration 0023 is applied.** Authenticated Seller A can currently read Seller B's active shop/product rows because the existing storefront SELECT policies apply to `public`, which includes `authenticated`. Repository fix: `0023_database_rls_concurrency_reconciliation.sql`. The migration is runtime-proven only in disposable local Supabase; Production deployment still requires separate explicit owner approval.

## P1 follow-up debt

1. Add staging integration tests for the real superadmin Supabase Auth allow-list + service-role boundary.
2. Add browser E2E for tenant route switching, tenant-scoped cart state, checkout and order lookup.
3. Replace anonymous `shops` base-table access with a buyer-safe projected view/RPC or equivalent surface, then revoke anon base-table SELECT. Active shop rows currently expose columns broader than the server storefront projection, including `owner_id` and `plan`.
4. Reconcile timestamped Production migration history to intended final objects before future automated migration deployment; the live history is not a filename-for-filename mirror of repository migrations.
5. Coordinate the server and database rollout for migration 0023 because `admin_credit_order_pack` changes signature to require a full transaction ID.

The disposable database runtime gate now covers tenant isolation, PostgREST/RPC, Storage, order idempotency, stock and entitlement concurrency, rollback, product-cap serialization, billing, and Extra Order races. Keep that gate required for future database changes.

## P2 debt

- Replace module-global `shopContext` before SSR/concurrent server rendering.
- Replace Proxy-based storefront API dispatch with stable facade functions when the data layer is next refactored.
- Paginate superadmin collections and lazily generate proof signed URLs at scale.
- Reduce `any` at API/browser boundaries with runtime schemas.
- Create a separate safe storage-provider error taxonomy; do not reuse raw provider strings as user-facing diagnostics.
- Review large components (especially superadmin/admin pages) only when extracting them improves testability or correctness; no aesthetic-only refactor.
- Perform dependency freshness/security review separately; no broad upgrades were made in this audit.
- Reject/RTO/refund non-restoration remains only partially runtime-proven because the current schema does not persist distinct statuses for every outcome; cancellation non-restoration is proven.
- `src/core/supabase/database.types.ts` is maintained but not a strict current generated snapshot. Regenerate it after migration 0023 reaches the target schema and review service-only RPC differences.
- Supabase Auth leaked-password protection remains disabled and must be handled through Auth/security hardening.
- Reassess multiple-permissive-policy and currently-unused-index performance advisories after migration 0023 and meaningful traffic; do not drop indexes solely from low-traffic statistics.
- Tighten broad `EXECUTE` grants on non-definer trigger helpers in a future least-privilege cleanup.

## Evidence source

See `docs/production/DATABASE-RLS-CONCURRENCY-AUDIT.md` for Production read-only evidence, severity rationale, and the behavioral/runtime coverage matrix.
