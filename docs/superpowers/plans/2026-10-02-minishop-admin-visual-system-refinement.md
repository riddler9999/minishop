# MiniShop Admin Visual System Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the existing Admin V2 UI with the approved Charcoal/Mint/Soft-Neutral system, remove mobile bottom navigation, and normalize typography and spacing without changing commerce behavior.

**Architecture:** Add admin-scoped semantic tokens and migrate existing shared admin components before individual dashboard surfaces. Keep existing route structure and Store Builder's distinct editor shell; validate each change with focused tests and the repository's full regression commands.

**Tech Stack:** Existing React, TypeScript, Tailwind, Lucide and repository test/CI tooling.

**Spec:** `docs/superpowers/specs/2026-10-01-minishop-admin-v2-design.md` (Section 21 amendment)

## Global Constraints

- Branch: `feat/admin-v2-redesign`; audit the current head before editing.
- No production deployment, database migration, or PR merge.
- Preserve existing domain, RLS, checkout, inventory, billing and Store Design contracts.
- Admin-only tokens must not affect storefront preview or buyer theme.
- Remove admin mobile bottom tabs, not Store Builder editing sheets.
- Use approved Charcoal + Mint palette and typography/spacing values from Section 21; maintain WCAG 2.2 AA targets.

## Review Focus

1. At 375px, drawer opens/closes with keyboard and focus returns to trigger.
2. Deep-linked admin routes show exactly one active navigation item without bottom tabs.
3. Buyer storefront and Store Builder preview retain existing theme values.
4. Burmese text wraps without clipping in narrow cards and interactive rows.
5. Existing operational status colors and critical order amounts remain readable.

---

### Task 1: Audit and scoped admin tokens

**Files:**
- Modify: `src/index.css` or existing admin stylesheet based on repository convention
- Test: use existing stylesheet/component test convention; create a scoped regression test if absent

**Interfaces:**
- Produces: CSS `--admin-*` semantic tokens from spec Section 21, applied only to admin root.
- Consumes: existing Tailwind and root styles.

- [ ] Step 1: Inspect current branch HEAD, existing admin selectors, and tests; record baseline and any prior work already satisfying this task.
- [ ] Step 2: Write a failing test proving admin token values and storefront isolation; run it and confirm expected failure.
- [ ] Step 3: Implement minimal scoped semantic token definitions and any necessary Tailwind integration.
- [ ] Step 4: Run focused test and full repository-supported tests; record outputs.
- [ ] Step 5: Commit only Task 1 files.

### Task 2: Remove duplicate mobile navigation

**Files:**
- Modify: `src/features/admin/components/AdminLayout.tsx`, `AdminNav.tsx`, and actual mobile nav component if present
- Modify: admin page bottom-nav padding only where audit proves it exists
- Test: existing admin navigation/responsive tests or new focused regression test

**Interfaces:**
- Consumes: existing route/nav definitions and Task 1 admin tokens.
- Produces: one mobile top-bar drawer navigation and persistent desktop sidebar; no admin bottom tabs.

- [ ] Step 1: Locate every admin bottom-nav render and padding dependency; distinguish Store Builder editing sheets.
- [ ] Step 2: Write failing tests for mobile nav absence, drawer access, route active state and focus behavior; confirm RED.
- [ ] Step 3: Remove duplicate tabs, reuse the same nav model in sidebar/drawer, and eliminate obsolete padding.
- [ ] Step 4: Run focused and full tests; check narrow viewport behavior.
- [ ] Step 5: Commit only Task 2 files.

### Task 3: Shared component visual and typography migration

**Files:**
- Modify: existing `AdminSurface.tsx`, `AdminPageHeader.tsx`, `AdminStatCard.tsx`, `AdminStatusBadge.tsx`, `AdminEmptyState.tsx`, and admin navigation primitives only as applicable
- Test: shared admin component tests

**Interfaces:**
- Consumes: Task 1 tokens and Task 2 navigation behavior.
- Produces: consistent 24/32 page heading, 18/28 section heading, 14/22 body, 13/20 secondary, 12/18 metadata and 16/20 card padding.

- [ ] Step 1: Audit each shared component against the spec and note existing compliance.
- [ ] Step 2: Write failing focused tests for noncompliant semantic classes, text hierarchy, state contrast and responsive padding; confirm RED.
- [ ] Step 3: Apply minimal shared-component changes, retaining independent semantic success/warning/error colors.
- [ ] Step 4: Run focused and full test suites and review component rendering.
- [ ] Step 5: Commit only Task 3 files.

### Task 4: Dashboard composition and page consistency

**Files:**
- Modify: `src/features/admin/pages/Dashboard.tsx` and its existing panel components
- Modify: other admin pages only where shared-token audit finds residual inconsistencies
- Test: dashboard and admin regression tests

**Interfaces:**
- Consumes: Tasks 1–3 shared tokens/components.
- Produces: existing operational hierarchy with consistent 24px section rhythm and no fake interactive date selector.

- [ ] Step 1: Audit dashboard data/state contracts and find remaining hard-coded slate/violet usage in affected admin pages.
- [ ] Step 2: Write failing tests for date label behavior, dashboard structure and absence of obsolete mobile spacing; confirm RED.
- [ ] Step 3: Apply minimal visual/layout migration; keep actual status and order data untouched.
- [ ] Step 4: Run focused and full tests and build.
- [ ] Step 5: Commit only Task 4 files.

### Task 5: Responsive, accessibility and documentation verification

**Files:**
- Modify: affected tests and admin design documentation only where actual implementation differs from spec
- Test: repository-supported accessibility, responsive, lint, build and regression gates

**Interfaces:**
- Consumes: Tasks 1–4 implementation.
- Produces: reviewable QA evidence, updated design-system documentation, and a verified PR checkpoint.

- [ ] Step 1: Run QA at 375, 390, 414px, tablet, laptop and wide desktop; inspect drawer focus, text wrapping, overflow and Store Builder preview isolation.
- [ ] Step 2: Add failing regression tests for uncovered problems, confirm RED, implement minimal fixes and confirm GREEN.
- [ ] Step 3: Reconcile `DESIGN.md` and `design/design.md` without overriding buyer storefront design authority.
- [ ] Step 4: Run full repo-supported tests, lint, build and available CI/preview checks; report exact failures rather than claiming green without evidence.
- [ ] Step 5: Commit Task 5, perform whole-branch review, and leave PR unmerged pending explicit release approval.
