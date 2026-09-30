# Task 14 — Auth, Buyer Journey, Store Builder, and TikTok WebView Acceptance

Date: 2026-09-30
Candidate SHA: `7d1cac586271880e94b469853504632e8703ab2d`
Branch: `task-14-acceptance-evidence`
Status: **IN PROGRESS — email acceptance explicitly deferred**

## Scope

This report follows Task 14 from `docs/superpowers/plans/2026-09-28-minishop-production-readiness-task-prompts.md`.

All non-email acceptance remains in scope. The owner explicitly deferred email-dependent acceptance until a domain and email infrastructure are available. This is a scope deferral, not a PASS and not a product defect.

Production accounts, customer data, Production deployment, and Production database mutations remain out of scope.

## Baseline verification

- Candidate `main` at task start: `7d1cac586271880e94b469853504632e8703ab2d`.
- Commit `7d1cac586271880e94b469853504632e8703ab2d` is present and is the Task 13 merge commit for PR #175.
- Task 13 was not redone.
- No Production deployment was performed.
- No Production migration was applied.

## Email acceptance deferral

The following acceptance items are intentionally deferred until the owner purchases/configures a domain and staging email infrastructure:

- fresh signup email confirmation,
- confirmation-link delivery,
- password-recovery email delivery,
- transactional email delivery acceptance.

These items must be reopened and tested before email functionality is considered production-ready. Their deferral must not block execution of unrelated Task 14 acceptance work.

## Required non-production environment contract

Repository source of truth requires PREVIEW/STAGING acceptance mutations to use an isolated non-production Supabase/Auth/Storage target. Preview must not be treated as safe for test mutations until its database/auth/storage isolation from Production is positively verified.

For this candidate, repository migrations include through `0034_inventory_movements.sql`, including the post-Production-readiness migrations `0026`–`0034`.

Vercel inspection on 2026-09-30 found the MiniShop project and historical Preview deployments, but no Preview deployment for candidate SHA `7d1cac586271880e94b469853504632e8703ab2d`. The latest listed deployment for `main` is a Production deployment at older SHA `9df3c8f0f36562a720845eeed9c8465e2d604824`. Therefore an older Preview/Production URL must not be used as Task 14 evidence for this candidate.

## Acceptance matrix

| Journey | Result | Evidence / blocker |
|---|---|---|
| Fresh signup email confirmation | DEFERRED | Owner decision: domain/email infrastructure will be configured later. |
| Password recovery email | DEFERRED | Owner decision: domain/email infrastructure will be configured later. |
| Transactional email delivery | DEFERRED | Domain/provider acceptance is a later gate. |
| Login | UNVERIFIED | Requires exact-candidate isolated staging Auth. |
| Session refresh | UNVERIFIED | Requires exact-candidate isolated staging Auth. |
| Signout | UNVERIFIED | Requires exact-candidate isolated staging Auth. |
| Owner authorization | PARTIALLY VERIFIED BY AUTOMATED CONTRACTS, ACCEPTANCE UNVERIFIED | Existing RLS/runtime coverage is not a substitute for Task 14 staging acceptance. |
| Public storefront | UNVERIFIED | No exact-SHA isolated staging deployment currently established. |
| Tenant-isolated cart | PARTIALLY VERIFIED BY TASK 6 AUTOMATED TESTS, ACCEPTANCE UNVERIFIED | Browser acceptance on the exact candidate is still required. |
| Shipping quote / checkout amount | PARTIALLY VERIFIED BY TASK 5 AUTOMATED TESTS, ACCEPTANCE UNVERIFIED | Staging quote → order-total evidence is still required. |
| Payment proof upload | UNVERIFIED | Requires isolated Storage/Auth/DB; Production payment-proof storage must not be used. |
| Order creation | PARTIALLY VERIFIED BY DATABASE RUNTIME TESTS, ACCEPTANCE UNVERIFIED | End-to-end isolated staging flow is still required. |
| Order lookup | PARTIALLY VERIFIED BY API/DB TESTS, ACCEPTANCE UNVERIFIED | End-to-end isolated staging flow is still required. |
| Lost-response/retry | PARTIALLY VERIFIED BY TASK 9 TESTS, ACCEPTANCE UNVERIFIED | Browser staging acceptance still required. |
| Store Builder save | PARTIALLY VERIFIED BY AUTOMATED TESTS, ACCEPTANCE UNVERIFIED | Requires candidate-aligned staging schema. |
| Store Builder publish | PARTIALLY VERIFIED BY AUTOMATED TESTS, ACCEPTANCE UNVERIFIED | Requires candidate-aligned staging schema. |
| Store Builder rollback | PARTIALLY VERIFIED BY AUTOMATED TESTS, ACCEPTANCE UNVERIFIED | Requires candidate-aligned staging schema. |
| Published public rendering | PARTIALLY VERIFIED BY AUTOMATED TESTS, ACCEPTANCE UNVERIFIED | Requires candidate-aligned staging schema. |
| Desktop browser | UNVERIFIED | No exact-SHA isolated staging URL is currently available. |
| Mobile browser | UNVERIFIED | No exact-SHA isolated staging URL is currently available. |
| Real Android TikTok WebView | UNVERIFIED — MANUAL DEVICE GATE | Desktop emulation is not proof; physical Android/TikTok evidence is required. |
| TikTok session persistence | UNVERIFIED — MANUAL DEVICE GATE | Requires real Android TikTok in-app WebView. |
| TikTok back/navigation | UNVERIFIED — MANUAL DEVICE GATE | Requires real Android TikTok in-app WebView. |
| TikTok image upload | UNVERIFIED — MANUAL DEVICE GATE | Requires real Android TikTok WebView plus isolated storage. |
| TikTok deep link/refresh | UNVERIFIED — MANUAL DEVICE GATE | Requires real Android TikTok in-app WebView. |
| TikTok checkout return | UNVERIFIED — MANUAL DEVICE GATE | Requires real Android TikTok in-app WebView. |

## Security / tenant-isolation implications

No security boundary was weakened. This task did not expose a service-role key to browser code, use Production customer data, mutate Production, apply Production migrations, bypass RLS, relax tenant isolation, or weaken financial/idempotency/entitlement/inventory contracts.

The current Vercel Production deployment is deliberately not reused for destructive acceptance testing.

## Remaining non-email closure work

1. Establish/identify an isolated non-production Supabase/Auth/Storage target.
2. Positively verify Preview/STAGING environment scopes point to that target rather than Production.
3. Reconcile its schema to the exact candidate migration manifest.
4. Create an exact-candidate non-production Preview/STAGING deployment.
5. Execute login/session/signout, buyer journey, payment-proof, order, retry, Store Builder, desktop and mobile acceptance on that same candidate/schema.
6. Execute TikTok-specific flows on a real Android device in the TikTok in-app WebView and record device/app versions plus redacted evidence.
7. Run repository-required CI/check and final review gates.

Email-dependent acceptance remains separately **DEFERRED** until domain/email infrastructure is ready.