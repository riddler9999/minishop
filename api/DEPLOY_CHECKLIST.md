# Deployment checklist — compatibility entry point

The canonical release gate is `docs/production/RELEASE-CHECKLIST.md`. This file remains an executable compatibility checklist because automated gateway tests and older operator links depend on it.

Before any Production deploy, complete the canonical checklist and record evidence.

## Mandatory runtime smoke subset

- Verify the exact deployed SHA with `GET /api/version`.
- Verify `GET /api/health` reports a healthy backend.
- Verify `GET /api/storefront-config` returns the expected first-party gateway marker.
- Open the tenant storefront and verify products load.
- Verify product images load through the expected media path.
- Verify cart and checkout configuration.
- Place a test order using synthetic test data only.
- Verify order lookup for that test order.
- Verify seller login and seller admin.
- Verify superadmin authorization without exposing privileged configuration.
- Verify Storage public/private boundaries and the payment test path.
- Run the buyer flow once with VPN on and once off.
- Record mobile/WebView as a separate later gate.

## Environment safety

For the Vercel runtime, `SUPABASE_URL` and `SUPABASE_ANON_KEY` are server-side gateway values. `SUPABASE_SERVICE_ROLE_KEY` and `SUPERADMIN_EMAILS` are server-only and are used only by the authenticated superadmin boundary. Never create a `VITE_*` service-role variable.

Preview must use Staging Supabase. Production Supabase credentials are prohibited in Preview.

See also:
- `docs/production/ENVIRONMENT-MATRIX.md`
- `docs/production/MIGRATION-RUNBOOK.md`
- `docs/production/ROLLBACK-RUNBOOK.md`
