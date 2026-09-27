# MiniShop Migration Runbook

Official status: **PRE-PRODUCTION / PRODUCTION HARDENING**

Repository migrations are source-controlled intent. Supabase live migration history is deployment evidence. Neither alone proves the other.

## Required flow

`migration file -> static migration tests -> staging history reconciliation -> staging apply -> staging schema verification -> staging integration tests -> review -> explicit Production approval -> Production apply -> Security Advisor -> Performance Advisor -> smoke verification -> evidence`

## Preflight

- Record exact Git SHA and migration filename(s).
- Run `npm run lint`, `npm test`, `npm run build`, `npm run check`.
- Verify migration prefixes are unique/ordered.
- Read target Supabase migration history and affected schema objects first.
- Run duplicate/null/data-shape checks required by new constraints.
- Prove no destructive statement removes live data.
- Verify recovery capability appropriate to the change; do not assume PITR exists.
- Production DDL requires explicit owner approval after Staging PASS.

## Staging reconciliation

The repository currently contains the ordered migration chain through `0023_database_rls_concurrency_reconciliation.sql`. That repository fact does **not** prove migration 0023, or any other migration, has been applied to Staging or Production.

For a Production-derived Supabase branch, do not blindly replay the repository chain: a derived branch may already contain parent schema/history. For a separate blank staging project, replay from the beginning only when clean bootstrap is explicitly intended.

1. List current Staging and Production migration history from the target systems.
2. Compare repository files with live recorded/superseding migrations.
3. Identify only genuinely pending/applicable migrations.
4. Apply those in repository order.
5. Record the mapping between repository numeric filenames and Supabase migration records.

Repository numeric filenames and Supabase timestamp/name records are different identifiers; record the mapping in evidence.

## Staging verification

After apply:
- tables + constraints,
- RLS enabled and policies,
- RPC signatures/grants,
- views,
- Storage buckets/policies,
- pricing + entitlement contracts,
- full app tests/build,
- affected buyer/seller/admin flows using synthetic data,
- Security Advisor,
- Performance Advisor.

No evidence means no staging PASS.

## Production approval/apply

Required: approved PR, exact SHA, Staging PASS, migration/data preflight PASS, recovery posture recorded, and explicit approval for the exact Production migration.

Use controlled migrations; Dashboard hand-edits are not the normal method.

Post-apply: confirm migration history, schema/RLS/RPC/Storage, run both Advisors, targeted smoke tests, and record evidence.

## Failure strategy

Do not casually down-migrate Production. Stop dependent releases, capture the exact error/history, determine committed statements, create a forward-safe fix, test it on Staging, and re-obtain Production approval.

Restore/PITR is disaster recovery, not routine rollback. If recovery capability is not verified for a destructive/data rewrite, the migration is not eligible for Production.

## Historical audit note — 2026-09-25

The PR #94 audit recorded 19 Production migration records through `production_db_hardening` at that time. This is **historical evidence only**, not a current migration count or proof of current Production state. Re-read live migration history for every release. In particular, do not infer that repository migration `0023_database_rls_concurrency_reconciliation.sql` is applied to Production unless current verified evidence proves it.
