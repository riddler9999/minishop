# MiniShop Production Readiness Baseline — 2026-09-28

## Scope

Task 0 baseline reconciliation only. This record is read-only with respect to application behavior and Production data. It does not authorize deployment or Production migration changes.

## Verified repository state

- Repository: `riddler9999/minishop`
- Baseline `main` SHA: `d4e5b9fafe7d69c6de9152286fdab73db99212de`
- Baseline CI: GitHub Actions CI run #482 completed successfully for that SHA.
- Open PRs relevant to current repository state:
  - PR #157 — `fix: clear Vercel API TypeScript diagnostics`; open, mergeable, not merged. Its existing CI and Network Resilience runs are green.
  - PR #152 — landing-page visual redesign draft; unrelated to the production-readiness findings below.
- Production migration metadata was inspected read-only. Production currently records migrations through `store_design_lifecycle` (repository migration 0024). Repository migration `0025_minishop_mcp_audit.sql` is not present in the inspected Production migration history.

The prior assessment baseline was `5b151b9722a50c0334512866077e80980cb10c1f`. Current `main` is ahead; the intervening substantive files are MiniShop MCP V1 implementation/docs plus migration 0025 and task-plan documentation. They do not modify the existing F1-F10 implementation surfaces.

## Assessment finding dispositions

| Finding | Disposition | Current evidence | Required task |
|---|---|---|---:|
| F1 — platform suspension / delete-recreate lifecycle | still open | No post-assessment change to the relevant seller shop lifecycle or platform-control implementation surface was found. | 2 |
| F2 — failed-attempt rate-limit rollback | still open | Existing `lookup_order` / database rate-limit path remains; no post-assessment fix to the failure-accounting transaction boundary was found. Existing requester-IP forwarding hardening does not by itself resolve the rollback finding. | 3 |
| F3 — authoritative shipping/cart quote | still open | No post-assessment change establishes one server-authoritative quote contract shared by displayed checkout totals and order creation. | 5 |
| F4 — tenant-isolated cart state | still open | The earlier tenant-cart hardening predates the assessment. No post-assessment cart-state change supersedes the assessment finding. | 6 |
| F5 — API TypeScript compile and CI gate | still open | PR #157 contains a narrow fix for two API TypeScript diagnostics and is green, but it remains unmerged. The production-readiness task also requires a meaningful API compiler gate in the required check path. | 1 |
| F6 — Store Design schema/revision safety | still open | Production records the Store Design lifecycle migration, but no post-assessment change addresses the assessed malformed/null/stale revision boundary. | 7 |
| F7 — financial grant/payment idempotency | still open | Existing order idempotency does not establish the required immutable payment identity + exactly-once contract for activation/renewal/order-pack financial grants. No post-assessment fix was found. | 8 |
| F8 — anonymous storefront field projection | still open | Gateway projections are narrow, but no post-assessment database-boundary change removes unnecessary anonymous base-table field exposure identified by the assessment. | 4 |
| F9 — seller/superadmin pagination and aggregates | still open | `api/superadmin.ts` still contains fixed caps including 500-row shop/entitlement reads and 200-row application/pack reads. | 10 |
| F10 — seller dashboard errors / truthful sales metrics | still open | No post-assessment dashboard data/error-semantics change supersedes the finding. | 11 |

No F1-F10 finding is classified as `already fixed`, `superseded`, or `needs decision` at this baseline. A later task may uncover that a narrower sub-case is already fixed; that must be proven with fresh task-specific evidence rather than inferred here.

## Acceptance and operations gaps

| Gap | Disposition | Required task |
|---|---|---:|
| Lost-response checkout retry and final-quota concurrency | still open | 9 |
| Transactional notifications with dedup/retry/failure visibility | still open | 12 |
| Inventory movement audit plus supported cancel/refund/restock boundary | still open | 13 |
| Fresh auth, buyer journey, Store Builder acceptance | still open | 14 |
| Real Android TikTok in-app WebView acceptance | still open | 14 |
| Structured operational telemetry/alerts | still open | 15 |
| Disposable backup restore drill with measured integrity/RPO/RTO | still open | 15 |
| Bounded pilot load/contention/queue evidence | still open | 15 |

## Dependency graph

1. Task 1 is the immediate next task because F5 already has an open scoped PR and the API compiler gate should become a prerequisite for later changes.
2. After Task 1, Tasks 2, 3, and 4 may proceed in isolated workstreams; Tasks 5 and 6 may also proceed in parallel where files/contracts do not overlap.
3. Tasks 7, 8, and 9 share database/financial invariants and should be integrated sequentially by one DB owner.
4. Tasks 10 and 11 may proceed in parallel after their pagination/dashboard data contracts are explicit. Task 12 can proceed separately. Task 13 requires one order/inventory state owner.
5. Task 14 provides release-candidate acceptance evidence only after prerequisite flow fixes are complete.
6. Task 15 provides final operations evidence against the release-candidate SHA.
7. Task 16 is the final evidence-based restricted-pilot readiness review.

## Remaining required tasks

Current evidence requires Tasks **1 through 15**, followed by **Task 16** final readiness review. This baseline does not execute any of them.
