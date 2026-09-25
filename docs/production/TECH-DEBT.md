# Production Technical Debt

Updated: 2026-09-25

## P1 follow-up debt

1. Add staging integration tests for real superadmin Supabase Auth allow-list + service-role boundary.
2. Add disposable Supabase/Postgres integration tests for tenant isolation and RLS.
3. Add concurrent `place_order` tests proving idempotency, stock decrement and entitlement consumption under retries/races.
4. Add concurrent product-create tests proving product-cap serialization.
5. Add browser E2E for tenant route switching, tenant-scoped cart state, checkout and order lookup.

## P2 debt

- Replace module-global `shopContext` before SSR/concurrent server rendering.
- Replace Proxy-based storefront API dispatch with stable facade functions when the data layer is next refactored.
- Paginate superadmin collections and lazily generate proof signed URLs at scale.
- Reduce `any` at API/browser boundaries with runtime schemas.
- Create a separate safe storage-provider error taxonomy; do not reuse raw provider strings as user-facing diagnostics.
- Review large components (especially superadmin/admin pages) only when extracting them improves testability or correctness; no aesthetic-only refactor.
- Perform dependency freshness/security review separately; no broad upgrades were made in this audit.
