# Database RLS Concurrency Production Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reconcile MiniShop database security with the canonical production contract without mutating Production, and add auditable runtime-test procedures for RLS and transactional concurrency.

**Architecture:** Keep buyer storefront reads on the server's anon-key path while ensuring authenticated sellers only see tenant-owned rows. Fix branding storage policy drift. Harden Extra Order payment identity so one underlying transaction cannot credit twice. Add a disposable/staging behavioral SQL harness; source-contract tests remain explicitly separate from behavioral proof.

**Tech Stack:** PostgreSQL 17 / Supabase RLS + Storage, TypeScript/Node test runner, GitHub Actions.

**Spec:** CONTEXT.md and the DATABASE + RLS + TRANSACTIONAL CONCURRENCY FINAL AUDIT requirements supplied for this phase.

## Global Constraints
- No Production migration or data mutation during this phase.
- Do not weaken RLS.
- No service_role in browser code.
- free_trial/starter/business quotas = 20 lifetime / 60 cycle / 200 cycle.
- Product caps = 10 / 100 / 500 total rows; permanent delete frees a slot.
- Created valid orders consume exactly once; cancellation/rejection/RTO/refund do not restore.
- Branding, Store Design, basic Promotions, basic Analytics, township shipping are Core on all plans.
- Unknown plans fail closed.

## Review Focus
- Authenticated seller must not inherit anon storefront policies and read another seller's public rows.
- Anonymous storefront path must continue to read intentionally public active shop/catalog/checkout data.
- Logo storage writes must remain owner-path scoped while working on every plan.
- Extra Order pack credit must reject replay of the same real payment even when submitted as multiple purchase rows.
- Runtime concurrency claims must be backed by disposable/staging execution, not regex/source checks.

### Task 1: RLS public-role separation and branding storage reconciliation
**Files:** Create `supabase/migrations/0023_database_rls_concurrency_reconciliation.sql`; create `tests/database-rls-concurrency-migration.test.ts`.
**Interfaces:** Buyer server APIs use anon key. Browser seller APIs use authenticated role.
- [ ] Add failing source-contract tests requiring public-read policies to target `anon` only and logo storage ownership without plan gate.
- [ ] Verify tests fail against current migration chain.
- [ ] Add migration that recreates storefront read policies with `to anon` and recreates tenant media write policies without Business-only logo restriction.
- [ ] Verify focused tests pass.

### Task 2: Extra Order payment replay hardening
**Files:** Modify same migration; modify `src/features/billing/orderPacks.ts`, `api/superadmin.ts`, `src/core/supabase/database.types.ts`; add focused tests.
**Interfaces:** Pending pack gets a normalized full `transaction_id` during review/credit; approved credit source remains purchase ID for retry idempotency plus DB uniqueness for payment identity.
- [ ] Add failing tests proving schema requires normalized transaction identity and credit path requires it.
- [ ] Add nullable `transaction_id` column plus unique normalized partial index and platform-managed protection.
- [ ] Make credit RPC require transaction identity before approval and reject duplicate underlying payment.
- [ ] Thread transaction ID through superadmin credit action/types without exposing service role.
- [ ] Verify focused tests pass.

### Task 3: Behavioral audit harness
**Files:** Create `tests/database-runtime-audit.sql`; create `docs/production/DATABASE-RLS-CONCURRENCY-AUDIT.md`.
- [ ] Add disposable/staging-only behavioral assertions for anon/authenticated RLS, idempotent checkout, final-stock contention, final-entitlement contention, rollback, product-cap contention, pack-credit replay.
- [ ] Make harness refuse/clearly warn against Production use and wrap fixtures in rollback/isolated fixture identifiers.
- [ ] Record this session's Production read-only evidence and mark mutation/concurrency cases BLOCKED where not executed.

### Task 4: Tech debt, drift, and verification
**Files:** Create/update `docs/production/TECH-DEBT.md`; update generated/maintained types only for changed schema.
- [ ] Document migration-history drift versus live object drift separately.
- [ ] Document Supabase advisor findings and type drift.
- [ ] Run full repository gates through CI; distinguish source-contract vs behavioral runtime tests.
- [ ] Open one PR and do not merge.
