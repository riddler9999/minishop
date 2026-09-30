# Task 14 — Auth, Buyer Journey, Store Builder, and TikTok WebView Acceptance

Date: 2026-09-30
Candidate SHA: `7d1cac586271880e94b469853504632e8703ab2d`
Branch: `task-14-acceptance-evidence`
Status: **BLOCKED / UNVERIFIED — not release-ready**

## Scope

This report follows Task 14 from `docs/superpowers/plans/2026-09-28-minishop-production-readiness-task-prompts.md`.

Task 14 requires all acceptance journeys to be evidenced against:
- one exact candidate SHA,
- an isolated non-production staging environment,
- a schema manifest reconciled to that candidate,
- desktop/mobile browser coverage,
- a real Android TikTok in-app WebView,
- working non-production email service for fresh signup/confirmation/recovery.

Production accounts, customer data, Production deployment, and Production database mutations are explicitly out of scope.

## Baseline verification

- Latest `main` at task start: `7d1cac586271880e94b469853504632e8703ab2d`.
- Commit `7d1cac586271880e94b469853504632e8703ab2d` is present and is the Task 13 merge commit for PR #175.
- Task 13 was not redone.
- No existing Task 14 branch or Task 14 acceptance PR was found before starting this task.
- No Production deployment was performed.
- No Production migration was applied.

## Required environment contract

Repository source of truth requires PREVIEW/STAGING to use an isolated non-production Supabase target. Preview must not be treated as safe for test mutations until its database/auth/storage isolation from Production is positively verified.

For this candidate, repository migrations include through:

- `0026_platform_shop_lifecycle.sql`
- `0027_anonymous_storefront_projection.sql`
- `0028_failed_lookup_rate_limit.sql`
- `0029_authoritative_checkout_quote.sql`
- `0030_store_design_schema_revision_safety.sql`
- `0031_financial_idempotency.sql`
- `0032_superadmin_pagination_aggregates.sql`
- `0033_transactional_notifications.sql`
- `0034_inventory_movements.sql`

Task 14 acceptance therefore requires a non-production database target whose schema is reconciled through the candidate's required migrations. GitHub repository evidence alone does not establish such a deployed staging target or its environment-variable scopes.

## Acceptance matrix

| Journey | Result | Evidence / blocker |
|---|---|---|
| Fresh signup | UNVERIFIED | Requires isolated non-production Auth target and working staging email delivery. Neither is established by current GitHub evidence. |
| Email confirmation | UNVERIFIED | Requires staging email service and inbox evidence. |
| Password recovery | UNVERIFIED | Requires staging email service and inbox evidence. |
| Login | UNVERIFIED | Must be executed against isolated staging Auth on the exact candidate SHA. |
| Session refresh | UNVERIFIED | Must be exercised in deployed isolated staging. |
| Signout | UNVERIFIED | Must be exercised in deployed isolated staging. |
| Owner authorization | PARTIALLY VERIFIED BY AUTOMATED CONTRACTS, ACCEPTANCE UNVERIFIED | Repository has RLS/runtime coverage from prior tasks, but Task 14 requires end-to-end staging acceptance on this candidate. |
| Public storefront | UNVERIFIED | Requires exact-SHA isolated staging deployment. |
| Tenant-isolated cart | PARTIALLY VERIFIED BY TASK 6 AUTOMATED TESTS, ACCEPTANCE UNVERIFIED | Browser acceptance on this exact deployed candidate is still required. |
| Shipping quote / checkout amount | PARTIALLY VERIFIED BY TASK 5 AUTOMATED TESTS, ACCEPTANCE UNVERIFIED | Staging end-to-end quote → order total evidence is still required. |
| Payment proof upload | UNVERIFIED | Requires isolated Storage/Auth/DB target; must not use Production payment-proof storage. |
| Order creation | PARTIALLY VERIFIED BY DATABASE RUNTIME TESTS, ACCEPTANCE UNVERIFIED | End-to-end staging flow is still required. |
| Order lookup | PARTIALLY VERIFIED BY API/DB TESTS, ACCEPTANCE UNVERIFIED | End-to-end staging flow is still required. |
| Lost-response/retry | PARTIALLY VERIFIED BY TASK 9 TESTS, ACCEPTANCE UNVERIFIED | Browser staging acceptance still required. |
| Store Builder save | PARTIALLY VERIFIED BY AUTOMATED TESTS, ACCEPTANCE UNVERIFIED | Requires staging schema including Store Design lifecycle/safety migrations. |
| Store Builder publish | PARTIALLY VERIFIED BY AUTOMATED TESTS, ACCEPTANCE UNVERIFIED | Same staging requirement. |
| Store Builder rollback | PARTIALLY VERIFIED BY AUTOMATED TESTS, ACCEPTANCE UNVERIFIED | Same staging requirement. |
| Published public rendering | PARTIALLY VERIFIED BY AUTOMATED TESTS, ACCEPTANCE UNVERIFIED | Same staging requirement. |
| Desktop browser | UNVERIFIED | No isolated exact-SHA staging URL was established for this task. |
| Mobile browser | UNVERIFIED | No isolated exact-SHA staging URL was established for this task. |
| Real Android TikTok WebView | UNVERIFIED — BLOCKER | Task contract explicitly says desktop emulation is not proof. This execution environment has no physical Android/TikTok device access. |
| TikTok session persistence | UNVERIFIED — BLOCKER | Requires real Android TikTok in-app WebView. |
| TikTok back/navigation | UNVERIFIED — BLOCKER | Requires real Android TikTok in-app WebView. |
| TikTok image upload | UNVERIFIED — BLOCKER | Requires real Android TikTok in-app WebView and isolated storage. |
| TikTok deep link/refresh | UNVERIFIED — BLOCKER | Requires real Android TikTok in-app WebView. |
| TikTok checkout return | UNVERIFIED — BLOCKER | Requires real Android TikTok in-app WebView. |

## Security / tenant-isolation implications

No security boundary was weakened in this task.

Task 14 did not:
- expose a service-role key to browser code,
- use Production accounts or customer data,
- mutate Production,
- apply migrations to Production,
- bypass RLS,
- relax tenant isolation,
- weaken financial/idempotency/entitlement/inventory contracts.

The acceptance run is intentionally blocked rather than using Production as a substitute for missing staging.

## Required closure before Task 14 can be marked PASS

1. Provide or establish an isolated non-production Supabase/Auth/Storage target.
2. Positively verify Preview/STAGING environment-variable scopes point to that non-production target, not Production.
3. Reconcile the staging schema to the exact candidate SHA's required migration manifest.
4. Deploy the exact candidate SHA to a non-production Preview/STAGING URL.
5. Confirm staging email delivery for signup confirmation and password recovery.
6. Execute the full Task 14 browser acceptance matrix on that same SHA and schema.
7. Execute the required flows on a real Android device inside the TikTok in-app WebView, recording device model, Android version, TikTok version, steps, and redacted screenshots/logs.
8. Run repository-required CI/check gates for this documentation PR.

Until those are done, Task 14 must remain **UNVERIFIED / BLOCKED**, not PASS.
