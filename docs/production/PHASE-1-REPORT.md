# Phase 1 — Environment & Release Engineering Evidence Report

Date: 2026-09-25  
Official product status: **PRE-PRODUCTION / PRODUCTION HARDENING**  
Overall: **CONDITIONAL**

Production customer data was not modified. Production database schema was not changed. No Production secret was rotated or overwritten. No Production Vercel deployment or alias was changed.

## Baseline evidence

GitHub:
- Repository: `riddler9999/minishop`.
- Audit `main` SHA: `0c39e49ab452aa99748b6a058ce87d8751b15ba7`.
- `main` protection was disabled; direct pushes and destructive history changes were not blocked by a repository rule.
- Existing current-main CI run `36050929117` succeeded.
- No GitHub Releases were found.
- Current-main Vercel status was failing due Vercel's free-plan daily deployment limit.

Supabase Production:
- Project: `Mini Tiktok Shop` / `fsxdnmnycizjkgstokze`.
- Region/state: `ap-southeast-1` / `ACTIVE_HEALTHY`.
- PostgreSQL: 17.6.
- Development branches at audit: none.
- Live migration records: 19 through `production_db_hardening`.
- Storage: `payment-proofs` private; product image and shop-logo buckets public with explicit policies.
- Security Advisor: leaked-password protection disabled; also warnings for grants on intended buyer SECURITY DEFINER RPCs `place_order` and `lookup_order`.
- Branch creation quote: **$0.01344/hour**. Creation requires explicit cost approval.

Vercel:
- Team: `team_IJW15uLmgAziPpL6a7zbTOiF`.
- Project: `prj_IfW2lxtF7XZUEmxEjTOuFhzAZHX2`.
- Production deployment: `dpl_AGEjZDsfJgG3TQJn88E2ftBtye46`.
- Production Git SHA: `e832dd1e695640211d64ffffedf0d25fd94368a2`.
- Primary alias observed: `minishopmm.vercel.app`.
- Audit drift: GitHub main `0c39e49...` != Production `e832dd1...`.
- Production `/api/health`: HTTP 500 `FUNCTION_INVOCATION_FAILED`.
- Production `/api/storefront-config`: HTTP 500 `FUNCTION_INVOCATION_FAILED`.
- Runtime root cause: compiled `api/_http.js` attempted to import missing `/var/task/api/_security.ts`.
- Production `/api/version`: HTTP 404.
- Available connector cannot list/edit Vercel environment-variable scopes.
- PR deployment attempts are currently blocked by Vercel code `api-deployments-free-per-day` (>100 deployments/day).

## Implementation / PR evidence

Branch: `chore/production-phase-1-environments`  
PR: **#94** — `https://github.com/riddler9999/minishop/pull/94`

Code-verification commit: `0479bf688177720fe2da01f1b6bf32ed79e207c1`.

Verification against that commit:
- `CI / verify`: **PASS**, run `36060380000`; lint/typecheck, unit tests and build all passed.
- `CI / release-safety`: **PASS**, run `36060380000`.
- `Network resilience / check`: **PASS**, run `36060379801`; full `npm run check` passed.
- PR mergeability after the code-verification commit: `true`.
- Code-review threads/reviews at evidence time: none.
- Vercel bot status: external **FAIL** because the account exceeded the free daily deployment limit; this is not classified as an application test failure.

The final report commit is documentation-only and follows the verified code commit above. PR status remains the authoritative live check after that commit.

## Task status

1. Audit current environment state — **PASS**. Read-only GitHub/Supabase/Vercel evidence captured, including Git/Vercel SHA drift and live runtime failure.
2. Staging architecture — **CONDITIONAL**. Persistent data-less Supabase branch selected; creation blocked pending explicit approval of $0.01344/hour. No Production data copied.
3. Vercel environment separation — **CONDITIONAL**. Actual code variables were audited. The connector cannot list/edit Vercel environment-variable scopes and staging is absent, so Preview -> Staging and secret separation are not yet proven.
4. Environment matrix — **PASS**. Canonical `docs/production/ENVIRONMENT-MATRIX.md` created.
5. GitHub protection/release gates — **CONDITIONAL**. Exact checks are proven green, but `main` is unprotected and the connector has no branch-protection/ruleset write action.
6. Migration release pipeline — **CONDITIONAL**. Static migration/release gates and runbook exist; staging apply/schema/integration verification is blocked by staging creation.
7. Deployment SHA traceability — **CONDITIONAL**. `GET /api/version` is implemented and tested; current Production remains 404 until an approved release. Current Production SHA is independently observable from Vercel deployment metadata.
8. Release checklist — **PASS**. Canonical checklist created and legacy API checklist kept as an executable compatibility entry point.
9. Rollback procedure — **CONDITIONAL**. Application/database/config rollback runbook created. Staging rollback drill is **NOT TESTED** because staging does not exist and Preview scopes are unverified.
10. CI improvements — **PASS**. `CI / release-safety` verifies migration ordering, browser privileged-key boundaries, committed environment safety, API runtime import/version contracts and required runbooks. Full CI and network checks pass on the verified code commit.
11. Documentation truth reconciliation — **PASS**. `PROJECT.md`, `CONTEXT.md`, `README.md`, `CLAUDE.md`, `supabase/README.md`, `.env.example`, API deploy docs and production runbooks now identify the official status as PRE-PRODUCTION / PRODUCTION HARDENING without rewriting historical ADRs.
12. Phase 1 evidence report — **PASS**. This file records verified state, changes, blockers, impact and CI/PR evidence.

## GitHub protection manual target

When repository administration is available, protect `main` with:
- pull request required before merge,
- required checks: `CI / verify`, `CI / release-safety`, `Network resilience / check`,
- force-push disabled,
- branch deletion disabled,
- conversation resolution required.

Do not require the currently quota-blocked Vercel check until the deployment limit is resolved. Keep required approvals at 0 while there is only one maintainer if a 1-review rule would make the repository unmergeable; increase to 1 when an independent reviewer is available.

## Production risks discovered

1. Current Production API serverless functions fail because a TypeScript file extension survived into compiled runtime imports.
2. Production is running a different/older Git SHA than audited `main`.
3. Vercel free-plan daily deployment quota currently prevents a final PR Preview deployment.
4. No isolated Supabase staging environment exists.
5. Preview -> Production database separation is not proven.
6. Production/Staging Vercel secret separation is not proven through the available connector.
7. GitHub `main` is not protected.
8. Supabase Auth leaked-password protection is disabled.
9. Buyer-facing SECURITY DEFINER RPC grants are intentional public boundaries but remain security-sensitive and require continued contract testing.
10. Preview HTTP smoke of the fixed API is not verified: protected Preview URLs redirected to Vercel SSO, and a final Preview could not be created after the daily deployment quota was reached.

## Production impact

- Production Supabase: read-only inspection only; no data mutation and no DDL.
- Production Vercel: no deployment, alias promotion or rollback.
- Secrets: no rotation, overwrite or disclosure.
- Storefront/buyer/seller flows: no Production change from this branch because PR #94 is not merged.

## Phase 1 closure blockers before Phase 2

Phase 2 should not rely on environment isolation until these Phase 1 blockers are closed:

1. Explicitly approve the quoted Supabase staging branch cost, then create `MiniShop Staging`.
2. Reconcile live migration history and verify the complete schema/RLS/RPC/view/Storage/pricing/entitlement contract on Staging using synthetic data only.
3. Configure Vercel Preview -> Staging and Production -> Production environment scopes, then independently verify that Preview cannot access Production Supabase.
4. Apply the documented `main` branch-protection rules.
5. After Vercel deployment quota is available, obtain a READY Preview for PR #94 and smoke `/api/version`, `/api/health` and the affected gateway using Staging only.
6. Perform and record the safe Staging application rollback drill.

The exact Phase 2 starting point is the first staging-backed end-to-end release candidate after these environment/release gates are closed; Phase 2 must not treat this Phase 1 PR as proof that MiniShop is Production Ready.
