# MiniShop Production Readiness — Task Prompts

Repository: `riddler9999/minishop`  
Reference assessment: `MiniShop-Technical-Assessment-2026-09-28.md`  
Path in this repository: `docs/superpowers/plans/2026-09-28-minishop-production-readiness-task-prompts.md`  
Purpose: Moe can send **`@GitHub Task 5`** (or any task number below) and the agent must open this exact file, use that task's prompt, and execute it. Moe does not need to paste the prompt again.

## How to invoke

Invoke with only `@GitHub Task 0`, `@GitHub Task 1`, ... `@GitHub Task 16`. Add `Review` when you want the current task/PR reviewed, for example `@GitHub Task 0 Review`. GitHub identifies the repository; this file selects the exact execution prompt and Superpowers workflow. Do not ask Moe to paste the prompt. The agent must:

1. Read this file and select exactly that numbered task.
2. Read the referenced assessment if it is available in the current session or repository, plus relevant repository instructions/specs. The task prompts also contain the assessment findings needed for their own scope; do not block just because the original report is not checked into GitHub.
3. Re-fetch the current repository, branch, PR, and CI state; this plan is not permission to trust a stale SHA or stale PR status.
4. Execute only the selected task and continue through implementation (if needed), independent review, fix, re-review, required checks, and merge. Do not start the next task automatically.
5. If the request includes `Review`, inspect the selected task's existing PR/changes first, fix every confirmed issue, request or perform an independent re-review, rerun affected and required checks, and keep going until the clean PR is merged. `Review` is not a report-only request. If the task is already merged, verify that fact and its final checks.
6. If blocked by a real human-only product decision, missing credential, or unavailable reviewer/check, finish all independent work and explain the specific blocker; never claim the task is merged or complete.
7. Give a concise report with changed files, PR/merge link and SHA, evidence, test results, remaining blockers, and exact next task number.

If the user says `Task N` without a repository change, interpret it as execution authorization for that task. Do not ask them to paste the prompt. Ask only if an actual decision is blocked by missing product policy, credentials, or an approval requirement. Keep production data and deployment safe as stated below.

## Shared rules for every task

- Repository: `riddler9999/minishop`; default working branch is the current `main` unless the task explicitly creates a scoped branch/PR. Inspect `AGENTS.md`, repo instructions, current docs, and live GitHub state first.
- The assessment is evidence, not a substitute for fresh code inspection. Fix confirmed current defects only. Reclassify anything already fixed or superseded.
- Use the selected **GitHub** and **Superpowers** plugins. Use GitHub tools for current PR/CI/repository evidence. Use Superpowers workflows for systematic inspection, small scoped changes, RED → GREEN behavioral fixes, verification, and independent review.
- No broad redesign, framework rewrite, unrelated cleanup, new feature, or blanket refactor. Do not implement roadmap items unless they are the selected task.
- Never test mutations against Production. Never apply migrations to Production as part of Tasks 0–16. Use disposable local Supabase/PostgreSQL or CI runtime infrastructure. Any production rollout requires a separate, explicit task and reviewed backup/rollback plan.
- Do not expose secrets or copy credentials into code, logs, prompts, or reports. Do not invent production values or unsupported business rules.
- Behavioral fix: first write/run a failing regression test (RED), make the smallest fix (GREEN), then run affected tests. Review the final diff and relevant security/data invariants.
- Preserve unrelated user changes. Every task must have a focused, reviewable PR or use its already-existing task PR. Complete review → fix → re-review → required checks → merge. Never merge with unresolved Critical/Important findings or failing required checks. Do not deploy or apply a Production migration in Tasks 0–16.
- If independent subagents are used, give each a disjoint worktree/branch and explicit file/domain ownership. Agents may inspect in parallel. Never allow two agents to edit the same SQL migration, shared checkout contract, or files at the same time. The lead integrates sequentially and re-runs tests.
- Required completion evidence is task-specific below. A green frontend test suite alone is not proof of API, database, browser, or operations correctness.

## Agent, model, effort, plugin, and skill setup

Use only the agents needed by the selected task; do not spawn the whole roster for every task. Maximum four implementation/review subagents at once, with one lead agent coordinating. The assignments below are defaults; narrow them if current repo evidence shows smaller scope.

| Role | Model | Effort | Plugin / skills | Ownership |
|---|---|---:|---|---|
| Lead / integrator | `gpt-6-sol` | high | GitHub, Superpowers; `engineering-suite-build:source-driven-development`, `engineering-suite-build:incremental-implementation`, `codex-engineering-guardrails:code-verification` | Fresh baseline, task scope, integration, final verification/report |
| DB/security implementer | `gpt-6-sol` | high | GitHub, Superpowers; `engineering-suite-build:tdd`, `engineering-suite-debug:systematic-debugging` | One named policy/RPC/schema task only; never share migration ownership |
| Billing/checkout implementer | `gpt-6-sol` | high | GitHub, Superpowers; `engineering-suite-build:tdd`, `engineering-suite-build:incremental-implementation` | One named payment/checkout contract only |
| Frontend implementer | `gpt-6-sol` | medium | GitHub, Superpowers; `engineering-suite-build:tdd`, `build-web-apps:frontend-testing-debugging` | One named UI/state/pagination task only |
| Independent reviewer | `gpt-6-astra` | high | GitHub, Superpowers; `engineering-suite-build:code-review`, `compound-engineering:ce-code-review` | Read-only review; identify Critical/Important defects and test gaps |
| Browser/device QA | `gpt-6-sol` | medium | GitHub, Superpowers; `compound-engineering:ce-test-browser`, `codex-engineering-guardrails:code-verification` | Acceptance runs only after implementation; report actual device/environment |
| Operations verifier | `gpt-6-sol` | medium | GitHub, Superpowers; `codex-engineering-guardrails:code-verification` | Logs, alert, backup/restore and bounded pilot load evidence |

Skill names above are the intended Superpowers/engineering workflow selections. If one is unavailable in the active session, use the closest available Superpowers workflow and state that substitution in the task report. Do not change the task scope to compensate.

## Task 0 — Fresh baseline and backlog reconciliation

**Lead:** `gpt-6-sol`, high; no subagent required.  
**Plugins/skills:** GitHub, Superpowers; `engineering-suite-build:source-driven-development`, `codex-engineering-guardrails:code-verification`.

### Execution prompt

> Inspect the current `riddler9999/minishop` repository state before implementation. Fetch current `main`, relevant open PRs, CI statuses, and read-only migration metadata. Compare with the 2026-09-28 assessment and resolve contradictory PR metadata from authoritative GitHub resources. Mark F1–F10 and each unverified acceptance/operations gap as `still open`, `already fixed`, `superseded`, or `needs decision`, with evidence. Update or create a concise baseline record under `docs/production/` containing the verified SHA, dispositions, dependencies, and required remaining tasks; do not copy sensitive metadata into the record. Open a focused PR for that record, review it, fix any documentation errors, re-review, run `npm run check`, and merge when clean. Do not change application code, create issues, deploy, or mutate Production. Do not execute any other task.

**Done when:** fresh SHA and current PR state are recorded; each finding is dispositioned with evidence; the baseline-record PR passed review/checks and was merged; no code or production mutation occurred.

## Task 1 — API TypeScript compile and required CI gate (F5)

**Lead:** `gpt-6-sol`, high. Optional independent reviewer: `gpt-6-astra`, high.  
**Plugins/skills:** GitHub, Superpowers; `engineering-suite-build:tdd`, `codex-engineering-guardrails:code-verification`, `engineering-suite-build:code-review`.

### Execution prompt

> Re-check whether the API TypeScript diagnostics from assessment F5 and PR #157 still exist on current `main`. Inspect current CI and branch rules. Review any existing fix before duplicating it. Add the smallest reliable API compile command to the repository's mandatory CI/check path, fix only actual compiler failures, and make the check meaningful (not a source-text test). Run the API compiler, focused tests, repository check, and production build using the repo-supported Node version. Do not change runtime behavior or unrelated lint warnings. Do not alter branch settings unless the required-check task can be completed with the available authorization. Create/update the focused PR and merge only after clean independent review and required checks; do not deploy. If repository permissions do not allow required-check settings to be read or changed, report the exact limitation; do not claim enforcement is enabled. Return CI evidence and the exact SHA.

**Done when:** API compiler runs in required CI; compiler and all applicable checks pass; only scoped files changed; independent review finds no Critical/Important issue; task PR is merged.

## Task 2 — Platform shop suspension and delete/recreate lifecycle (F1)

**Lead:** `gpt-6-sol`, high. One DB/security implementer: `gpt-6-sol`, high; reviewer: `gpt-6-astra`, high.  
**Plugins/skills:** GitHub, Superpowers; `engineering-suite-build:tdd`, `engineering-suite-debug:systematic-debugging`, `engineering-suite-build:code-review`.

### Execution prompt

> Reproduce the current platform-suspension bypass and verify whether seller delete/recreate resets trials, lifetime quotas, entitlements, or ledger history. Treat the quota-reset route as unconfirmed until runtime evidence proves it. Write isolated runtime tests first. Make the smallest forward-only database/API change that separates platform suspension from seller-operational open/close state and prevents unauthorized seller reactivation or lifecycle deletion from bypassing platform controls. Preserve permitted seller operations and authorized admin actions. Do not edit historical migrations or Production. Run local Supabase/PostgreSQL runtime tests and relevant RLS tests, then request an independent read-only security review. Open/update the focused task PR; complete independent review → fixes → re-review → required checks → merge. Do not deploy.

**Done when:** seller cannot restore platform-suspended access or regain benefits via delete/recreate; permitted seller changes/admin controls still work; runtime evidence and migration safety are reviewed. The task PR must pass review and required checks, then be merged.

## Task 3 — Failed-attempt rate limit (F2)

**Lead:** `gpt-6-sol`, high. One backend/DB implementer: `gpt-6-sol`, high; reviewer optional.  
**Plugins/skills:** GitHub, Superpowers; `engineering-suite-build:tdd`, `engineering-suite-debug:systematic-debugging`.

### Execution prompt

> Reproduce the failed lookup/rate-limit rollback on current code. Add RED tests for repeated invalid lookups, valid lookups, direct anonymous RPC access, caller/IP identity, and proxy header handling. Change only the limiter/lookup boundary needed so every intended attempt is durably counted even when the business result is failure. Do not trust arbitrary forwarded headers; preserve the repository's trusted proxy contract. Inspect query/index/cleanup behavior and avoid an unbounded delete-on-every-request if current evidence shows it is unsafe, but do not redesign unrelated rate limiting. Run isolated database/API tests and the full required check. No Production writes or deploy. Open/update the focused task PR and complete independent review → fixes → re-review → required checks → merge.

**Done when:** failed attempts persist and eventually throttle; successful behavior remains correct; direct RPC cannot bypass the limit; caller identity has a tested trust boundary. The task PR must pass review and required checks, then be merged.

## Task 4 — Anonymous storefront field projection (F8)

**Lead:** `gpt-6-sol`, high. Optional DB implementer/reviewer.  
**Plugins/skills:** GitHub, Superpowers; `engineering-suite-build:tdd`, `engineering-suite-build:code-review`.

### Execution prompt

> Re-audit public shop/catalog grants and every buyer read path. Confirm which fields are required by the current storefront. Add or use a narrow buyer-safe view/RPC and restrict unnecessary anonymous base-table reads with a forward-only migration. Keep owner/admin read paths intact. Add runtime tests proving anonymous callers cannot read owner IDs, plan details, or other non-public fields while storefront rendering/catalog continues to work. Do not treat public product/catalog data itself as a vulnerability. Do not change unrelated RLS policies, deploy, or mutate Production. Open/update the focused task PR and complete independent review → fixes → re-review → required checks → merge.

**Done when:** anonymous access is limited to documented storefront fields; storefront, seller, and admin read behavior passes isolated runtime tests. The task PR must pass review and required checks, then be merged.

## Task 5 — Authoritative shipping/cart quote (F3)

**Lead:** `gpt-6-sol`, high. Backend quote implementer: `gpt-6-sol`, high; independent reviewer: `gpt-6-astra`, high.  
**Plugins/skills:** GitHub, Superpowers; `engineering-suite-build:tdd`, `engineering-suite-build:incremental-implementation`, `engineering-suite-build:code-review`.

### Execution prompt

> Trace frontend shipping calculation, gateway configuration, and database order pricing on current `main`. Add failing tests for Ninja Van, custom zones, default fee, unavailable route, changed quote, and buyer-visible total versus persisted order total. Implement the smallest server-authoritative quote contract so checkout display and order creation use the same pricing rule/source. If price/route changes between quote and submit, return a safe stale-quote response and require buyer confirmation of the new total. Never accept a client total as authority. Preserve atomic stock/quota/order behavior. Run API/UI/DB tests and a focused browser test if supported. Do not introduce carrier booking/labels, deploy, or touch Production. Open/update the focused task PR and complete independent review → fixes → re-review → required checks → merge.

**Done when:** displayed fee/total agrees with the created order across supported routes; missing route fails clearly without a misleading price; stale quotes require confirmation; existing transaction invariants pass. The task PR must pass review and required checks, then be merged.

## Task 6 — Tenant-isolated cart state (F4)

**Lead:** `gpt-6-sol`, medium-high. One frontend implementer: `gpt-6-sol`, medium; reviewer optional.  
**Plugins/skills:** GitHub, Superpowers; `engineering-suite-build:tdd`, `build-web-apps:frontend-testing-debugging`.

### Execution prompt

> Reproduce the current CartProvider behavior when the route changes from shop A to shop B. Add regression tests for first tenant hydration, A→B→A navigation, reload, demo→live navigation, and persistence. Make the smallest route-derived, per-tenant cart-state fix; do not redesign routing or cart UI. Verify cart clear/remove/update remain correct and no product from one shop appears in another shop's cart or checkout. Run focused frontend tests, full repository check/build, and a browser flow if the project supports one. Open/update the focused task PR; complete independent review → fixes → re-review → required checks → merge. Do not deploy.

**Done when:** tenant carts are isolated and reload/navigation behavior is verified; no unrelated UI changes. The task PR must pass review and required checks, then be merged.

## Task 7 — Store Design schema and revision safety (F6)

**Lead:** `gpt-6-sol`, high. Single DB implementer: `gpt-6-sol`, high; independent SQL reviewer: `gpt-6-astra`, high.  
**Plugins/skills:** GitHub, Superpowers; `engineering-suite-build:tdd`, `engineering-suite-debug:systematic-debugging`, `engineering-suite-build:code-review`.

### Execution prompt

> Inspect current Store Design save, publish, and rollback RPCs, types, legacy/current theme paths, and live migration history read-only. Add isolated RED runtime tests for missing/null/wrong-type schema fields, malformed and oversized documents, section limits, null/zero/negative/stale revisions, and rollback retries. Implement a forward-only migration that rejects validator results other than TRUE, validates expected revisions explicitly, uses null-safe revision comparisons, and enforces reasonable document constraints at the database boundary. Preserve valid existing saved/published documents and tenant RLS. Do not edit historical migrations, run writes on Production, or cut over legacy design paths without evidence. Run the actual migration/runtime suite and independent SQL review. Open/update the focused task PR; complete independent review → fixes → re-review → required checks → merge. Do not deploy.

**Done when:** invalid/stale input cannot save or publish; valid lifecycle works; existing data remains readable; RLS and rollback behavior pass isolated tests. The task PR must pass review and required checks, then be merged.

## Task 8 — Payment reference and admin financial idempotency (F7)

**Lead:** `gpt-6-sol`, high. Single billing/DB implementer: `gpt-6-sol`, high; reviewer: `gpt-6-astra`, high.  
**Plugins/skills:** GitHub, Superpowers; `engineering-suite-build:tdd`, `engineering-suite-debug:systematic-debugging`, `engineering-suite-build:code-review`.

### Execution prompt

> Inspect current activation, renewal, extra-order/pack grants, superadmin actions, ledger, and payment reference rules. First document the existing supported payment channels and get an explicit business rule from code/docs where available; do not invent provider semantics. Add runtime RED tests for missing reference, duplicate reference across shops/actions, same-key retry, same payment with a different key, concurrent approval, and unknown-result retry. Implement the smallest atomic contract requiring immutable verified payment identity plus request idempotency for each financial grant in scope. A repeated identical request must return its prior result; conflicting reuse must reject without changing cycle/quota/ledger twice. Update operator input/error UX only as required. Use an isolated database; no real payment or Production mutation. Independent review required.

**Done when:** no grant without valid identity; duplicate/retry/concurrency cases grant exactly once; audit provenance and operator error states are clear. The task PR must pass review and required checks, then be merged.

## Task 9 — Checkout lost-response and quota concurrency (related to F7)

**Lead:** `gpt-6-sol`, high. One checkout implementer: `gpt-6-sol`, high; reviewer optional.  
**Plugins/skills:** GitHub, Superpowers; `engineering-suite-build:tdd`, `engineering-suite-debug:systematic-debugging`.

### Execution prompt

> Inspect checkout intent lifetime, DB idempotency lookup order, quota locks, and error recovery. Add RED tests for committed order with lost HTTP response followed by reload/retry; same idempotency key concurrently using the final quota slot; different keys competing for the final slot; rollback after failure; and cart binding. Persist a safe expiring checkout intent/key before submission without storing unnecessary PII/payment proof. Make DB retry lookup return the existing order before a consumed-quota rejection for the same intent. Preserve inventory/quota transaction atomicity. Run isolated PostgreSQL/Supabase runtime, API, and browser tests where supported. Do not add blind mutation retries, deploy, or test Production. Open/update the focused task PR and complete independent review → fixes → re-review → required checks → merge.

**Done when:** reload/ambiguous retry is safe; same intent creates one order and stable result; distinct requests cannot exceed quota; failure rolls back cleanly. The task PR must pass review and required checks, then be merged.

## Task 10 — Seller and superadmin pagination/aggregates (F9)

**Lead:** `gpt-6-sol`, medium-high. Two implementers may work in separate worktrees: seller query/UI and superadmin queue/API; reviewer: `gpt-6-astra`, high.  
**Plugins/skills:** GitHub, Superpowers; `engineering-suite-build:tdd`, `engineering-suite-build:incremental-implementation`, `engineering-suite-build:code-review`.

### Execution prompt

> Reconfirm current seller order/catalog and superadmin shops/entitlements/approval queries and their row caps. Agree on cursor/page and response-total contracts before parallel edits. Replace truncating reads with bounded keyset pagination and database aggregates where appropriate; filter pending queues and page them. Generate proof signed URLs only for the opened record, not the entire queue. Add fixtures exceeding the previous 500-shop, 200-application/pack, and seller row caps. Verify page traversal, stable ordering, totals, authorization, and bounded request fan-out. Do not build a new analytics system or change business metrics beyond correcting truncation. Run API/UI/DB tests. No deploy or Production mutation. Open/update the focused task PR and complete independent review → fixes → re-review → required checks → merge.

**Done when:** all rows are reachable, aggregate totals are correct, queue operations remain tenant/admin scoped, and signed URL work is bounded. The task PR must pass review and required checks, then be merged.

## Task 11 — Seller dashboard errors and truthful sales metrics (F10)

**Lead:** `gpt-6-sol`, medium. One frontend/data implementer: `gpt-6-sol`, medium; reviewer optional.  
**Plugins/skills:** GitHub, Superpowers; `engineering-suite-build:tdd`, `build-web-apps:frontend-testing-debugging`.

### Execution prompt

> Reproduce dashboard API failures and inspect the source/status semantics for order totals, partial payments, recognized sales, and cash actually collected. Add tests for each independent data-load failure, retry, empty state, and partial payment. Implement explicit error/retry UI rather than presenting failed loads as zeros. Separate labels/aggregates according to data the system actually records; do not label order value as cash received without a payment ledger proving it. Preserve current dashboard scope and styling except what the truthful state requires. Run focused and full checks. No broad dashboard redesign or deploy. Open/update the focused task PR and complete independent review → fixes → re-review → required checks → merge.

**Done when:** API failure is visible/retryable; empty is distinct from failed; every sales label matches its authoritative source. The task PR must pass review and required checks, then be merged.

## Task 12 — Minimum transactional notifications

**Lead:** `gpt-6-sol`, high. One implementer: `gpt-6-sol`, medium-high; reviewer optional.  
**Plugins/skills:** GitHub, Superpowers; `engineering-suite-build:tdd`, `engineering-suite-build:source-driven-development`, `engineering-suite-build:code-review`.

### Execution prompt

> Inspect existing auth email, order lifecycle, seller/admin capabilities, and configured notification providers. Propose the smallest channel already supported by the product/environment for order-created, order-status-changed, and payment-approved/rejected notices. Do not add an unconfigured paid provider or invent delivery guarantees. Implement durable event/outbox or an equally reliable existing pattern with deduplication, bounded retries, delivery status, and safe failure visibility. Add tests for duplicate events, provider failure/retry, and no duplicate customer notice. Keep notification content free of secrets and unnecessary PII. If required channel/provider policy or credentials are missing, complete code/tests that do not depend on them and report the exact blocker instead of fabricating live delivery proof. No Production sends or deploy. Open/update the focused task PR and complete independent review → fixes → re-review → required checks → merge.

**Done when:** events cannot silently disappear or duplicate on retry; delivery status/failure is observable; chosen channel works in isolated/staging verification. The task PR must pass review and required checks, then be merged.

## Task 13 — Inventory movements, cancellation/refund policy boundary

**Lead:** `gpt-6-sol`, high. One domain/DB implementer: `gpt-6-sol`, high; reviewer: `gpt-6-astra`, high.  
**Plugins/skills:** GitHub, Superpowers; `engineering-suite-build:tdd`, `engineering-suite-build:source-driven-development`, `engineering-suite-build:code-review`.

### Execution prompt

> Inspect existing stock decrement, order status transitions, cancellations, manual refunds, proof approval, and audit history. First document current behavior and identify the narrowest safe inventory invariant. Do not invent whether stock is reserved at order creation or only after payment; use existing behavior or stop for a product decision if behavior must change. Add regression/runtime tests for order creation, failure rollback, cancellation, authorized stock adjustment, and refund/restock policy that is actually supported. Implement auditable stock movement/adjustment history and safe transitions only where needed for the current pilot. Do not implement automated refunds, RTO, carrier flows, or new order statuses without explicit requirements. No Production writes or deploy. Open/update the focused task PR and complete independent review → fixes → re-review → required checks → merge.

**Done when:** stock changes are explainable and reconciled for supported order paths; unsupported refund policy is clearly documented as an operations procedure or a blocker. The task PR must pass review and required checks, then be merged.

## Task 14 — Auth, buyer journey, Store Builder, and TikTok WebView acceptance

**Lead:** `gpt-6-sol`, medium-high. Browser QA subagent: `gpt-6-sol`, medium; device QA may be separate if device access exists.  
**Plugins/skills:** GitHub, Superpowers; `compound-engineering:ce-test-browser`, `build-web-apps:frontend-testing-debugging`, `codex-engineering-guardrails:code-verification`.

### Execution prompt

> Run acceptance against an isolated staging environment and one exact candidate SHA only after Tasks 1–13 required for the tested flows are complete. Save the test evidence in a focused report in the repository. Test fresh signup, email confirmation/recovery, login/session refresh/signout, owner authorization, storefront, tenant cart, shipping quote/checkout amount, proof upload, order creation/lookup/retry, and Store Builder save/publish/rollback/public rendering. Test desktop/mobile browser and a real Android TikTok in-app WebView for session persistence, back/navigation, image upload, deep link/refresh, and checkout return. Desktop emulation is not proof of TikTok WebView behavior. Do not use Production accounts/data unless explicitly authorized, and do not deploy from this task. Record environment, device/app versions, SHA, schema manifest, reproducible steps, screenshots/log excerpts with secrets redacted, and pass/fail per scenario. If no physical device or email service is available, report as unverified; do not mark pass.

**Done when:** each required journey is evidenced on the same SHA; known failing/unavailable scenarios are explicitly listed and block readiness. The task PR must pass review and required checks, then be merged.

## Task 15 — Monitoring, backup restore, and pilot load evidence

**Lead:** `gpt-6-sol`, medium-high. Operations verifier: `gpt-6-sol`, medium; independent reviewer: `gpt-6-astra`, high.  
**Plugins/skills:** GitHub, Superpowers; `codex-engineering-guardrails:code-verification`, `engineering-suite-build:code-review`.

### Execution prompt

> Inspect current health/version endpoints, logs, alerting, backups, rollback runbook, hosting/database quotas, and available isolated infrastructure. Save reproducible evidence in a focused operations report in the repository. Define bounded pilot SLO/load target from actual pilot expectations; do not invent a scale guarantee. Implement only the telemetry/alert gaps needed to diagnose server errors, database failures, checkout failures, and stuck approval/notification queues, with correlation IDs and secret/PII redaction. Trigger and verify alert delivery in staging. Execute a backup restore drill into a disposable isolated database; record restore integrity and measured RPO/RTO. Run bounded catalog/checkout/contention/queue load tests in isolation, inspect query plans and provider allocation evidence. Never load test Production or claim capacity beyond the tested workload. Open/update the focused task PR and complete independent review → fixes → re-review → required checks → merge. Do not deploy.

**Done when:** an alert is received, restore succeeds with integrity checks, and a stated pilot workload has reproducible results and identified limits. The task PR must pass review and required checks, then be merged.

## Task 16 — Final readiness review and merged decision record (no deployment)

**Lead:** `gpt-6-astra`, high, coordinating read-only review; implementation agents only if a concrete blocker needs its own follow-up task.  
**Plugins/skills:** GitHub, Superpowers; `engineering-suite-build:code-review`, `compound-engineering:ce-code-review`, `codex-engineering-guardrails:code-verification`.

### Execution prompt

> Perform a production-readiness review of the current candidate `riddler9999/minishop` SHA. Re-fetch GitHub state and verify Tasks 0–15 evidence, mandatory CI, migration manifest, isolated database runtime results, browser/device results, alert delivery, restore drill, and bounded load results. Review changed diffs and open review threads for Critical/Important issues. Do not deploy, apply migrations, or mutate Production. Produce a GO/NO-GO for a restricted paid pilot only, with every unmet gate and evidence link. A READY hosting deployment or green frontend CI alone is not sufficient evidence. Save the final evidence-based readiness decision under `docs/production/`, open/update a focused PR for that record, review/fix/re-review it, run required checks, and merge when clean. List separate follow-up tasks for non-blocking roadmap items.

**Done when:** one exact SHA has a defensible pilot GO/NO-GO; all remaining blockers are explicit; the readiness record PR has passed review/checks and is merged. Production deployment remains a separate task requiring its own reviewed rollout instructions.

## Parallel execution map

- First: Task 0. Task 1 can follow immediately and should become a prerequisite check for later PRs.
- After Task 0: Tasks 2, 3, and 4 may proceed in parallel only with separate migration ownership. Task 5 and Task 6 may also proceed in parallel in disjoint worktrees. These streams must not share the same SQL migration or checkout contract edits.
- Tasks 7, 8, and 9 share database/financial invariants. One DB owner integrates them sequentially; agents may independently inspect/design test cases in parallel, but must not concurrently edit common migrations/RPCs.
- Tasks 10 and 11 may run in parallel after agreeing on pagination and dashboard DTO semantics. Task 12 can be developed separately after the existing event/status contract is mapped. Task 13 requires a single inventory/order state owner.
- Task 14 waits for the fixes it tests. Task 15's runbook/alert/restore preparation can start earlier, but its final evidence uses the release candidate SHA. Task 16 runs last.
- Lead must rebase/integrate one workstream at a time, run affected tests after each merge into the integration branch, then run the full required suite.

## Separate roadmap (not implied by these task numbers)

Staff memberships/roles, custom-domain onboarding, public developer API and signed webhooks, carrier booking/labels/shipment events, automatic payment verification, automated refund ledger/workflows, full support-case tooling, and funnel analytics are not silently included in the hardening tasks. Add them as separately scoped product tasks after pilot demand and policies are confirmed. The pilot must still document a manual cancellation/refund procedure where relevant.
