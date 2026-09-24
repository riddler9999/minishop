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

A Production-derived Supabase branch already contains the parent's schema/history and no Production row data by default. **Do not blindly replay `0001..0022`.**

1. List Staging and Production migration history.
2. Compare repository files with live recorded/superseding migrations.
3. Identify only genuinely pending/applicable migrations.
4. Apply those in repository order.
5. For a separate blank staging project, replay from the beginning only when clean bootstrap is explicitly intended.

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

## Current reconciliation note

At the 2026-09-25 audit Production reported 19 migration records through `production_db_hardening`, while the repository contains `0001..0022`. Earlier delivery files remain historical source artifacts while later production-safe reconciliation migrations are live evidence. Never infer Production state from filename count.
