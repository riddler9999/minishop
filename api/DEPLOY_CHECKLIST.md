# Deployment checklist — legacy pointer

The canonical release gate is now:

- `docs/production/RELEASE-CHECKLIST.md`
- `docs/production/ENVIRONMENT-MATRIX.md`
- `docs/production/MIGRATION-RUNBOOK.md`
- `docs/production/ROLLBACK-RUNBOOK.md`

This file is retained so older links do not break. Do not release from this abbreviated checklist.

For the Vercel runtime, `SUPABASE_URL` and `SUPABASE_ANON_KEY` are server-side gateway values. `SUPABASE_SERVICE_ROLE_KEY` and `SUPERADMIN_EMAILS` are server-only and are used only by the authenticated superadmin boundary. Never create a `VITE_*` service-role variable.
