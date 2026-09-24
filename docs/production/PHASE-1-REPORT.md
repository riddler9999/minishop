# Phase 1 — Environment & Release Engineering Evidence Report

Date: 2026-09-25  
Official product status: **PRE-PRODUCTION / PRODUCTION HARDENING**  
Overall: **CONDITIONAL**

Production customer data was not modified. Production database schema was not changed.

## Baseline evidence

GitHub: `main` audit SHA `0c39e49ab452aa99748b6a058ce87d8751b15ba7`; protection disabled; current-main CI run `36050929117` succeeded; no GitHub Releases found; current-main Vercel status failed due build-rate limiting.

Supabase: `Mini Tiktok Shop` / `fsxdnmnycizjkgstokze` / `ap-southeast-1` / ACTIVE_HEALTHY / PostgreSQL 17.6; no development branches; 19 live migration records through `production_db_hardening`; branch quote $0.01344/hour; payment-proofs bucket private and storefront image/logo buckets public with policies. Security Advisor also reports leaked-password protection disabled plus grants on intended buyer SECURITY DEFINER RPCs `place_order` and `lookup_order`.

Vercel: project `prj_IfW2lxtF7XZUEmxEjTOuFhzAZHX2`; Production `dpl_AGEjZDsfJgG3TQJn88E2ftBtye46` at `e832dd1e695640211d64ffffedf0d25fd94368a2`; Production drifted behind main. `/api/health` and `/api/storefront-config` returned 500 `FUNCTION_INVOCATION_FAILED`; runtime log showed `api/_http.js` importing missing `api/_security.ts`; `/api/version` returned 404.

## Task status

1. Audit current environment state — **PASS**. Read-only GitHub/Supabase/Vercel evidence captured.
2. Staging architecture — **CONDITIONAL**. Persistent data-less Supabase branch selected; creation blocked pending explicit $0.01344/hour approval. No Production data copied.
3. Vercel separation — **CONDITIONAL**. Actual env names audited; connector cannot list/edit Vercel env scopes, staging absent, so Preview -> Staging is not proven.
4. Environment matrix — **PASS**. Canonical matrix created.
5. GitHub protection/release gates — **CONDITIONAL**. `main` unprotected; connector has no ruleset/protection write action. Target required checks: `CI / verify`, `CI / release-safety`, `Network resilience / check`. Do not require the currently rate-limited Vercel check until fixed.
6. Migration pipeline — **CONDITIONAL**. Runbook/static gate implemented; staging apply/integration evidence blocked by staging.
7. Deployment SHA traceability — **CONDITIONAL**. `GET /api/version` implemented/tested on branch; current Production remains 404 until approved release. Current Production SHA is independently known from Vercel metadata.
8. Release checklist — **PASS**.
9. Rollback procedure — **CONDITIONAL**. Runbook created; staging drill NOT TESTED.
10. CI improvements — **PASS pending PR run evidence**. New release-safety job covers migration ordering, browser service-role boundary, committed env safety, API runtime imports/version metadata and runbook presence.
11. Documentation truth — **PASS pending final truth-reconciliation commit**. Historical ADRs remain intact.
12. Phase 1 report — **PASS**. PR/CI evidence will be appended after PR creation.

## GitHub protection manual target

Require PR before merge; require `CI / verify`, `CI / release-safety`, `Network resilience / check`; block force push/deletion; require conversation resolution. Keep required approvals at 0 while there is only one maintainer to avoid making the repository unmergeable; raise to 1 when an independent reviewer is available.

## Production risks discovered

1. Production API serverless functions currently fail from a TypeScript-extension runtime import.
2. Production SHA drift vs GitHub main.
3. Current-main Vercel build-rate-limit failure.
4. No staging Supabase environment.
5. Preview -> Production DB separation unproven.
6. GitHub main unprotected.
7. Supabase leaked-password protection disabled.
8. Buyer SECURITY DEFINER RPC grants are intentional but security-sensitive.
9. Vercel env scopes cannot be audited through the currently available connector.

## Production impact

No Production Supabase write/DDL, secret rotation, Vercel deployment, or alias change was performed. All changes remain on `chore/production-phase-1-environments`.
