# MiniShop Admin V3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current seller admin experience with the approved English-only Admin V3 commerce workspace while preserving MiniShop's production backend, security boundaries, and Store Design lifecycle.

**Architecture:** Keep the current feature-first React/Vite structure and existing domain/API contracts. Introduce reusable Admin V3 shell/primitives under `src/features/admin/components`, then migrate each admin surface incrementally. Store Builder remains backed by the existing lifecycle, editor state, section operations, and shared storefront renderer; only its workspace UX is redesigned.

**Tech Stack:** React, Vite, TypeScript, Tailwind CSS v4, React Router, Lucide React, Supabase, Node test runner.

**Spec:** `docs/superpowers/specs/2026-10-01-minishop-admin-v2-design.md`

## Global Constraints

- Admin UI is English-only.
- Preserve Supabase auth, tenant RLS, checkout/order semantics, inventory rules, billing/entitlement enforcement, financial idempotency, and RPC privilege boundaries.
- Preserve Store Design Draft/Published lifecycle and shared storefront renderer.
- Do not create a second storefront renderer or duplicate ProductCard/cart implementations.
- Frontend visibility is never authorization.
- Do not introduce a new UI dependency unless a concrete implementation need is demonstrated.
- Responsive acceptance includes 375 px, 390 px, 414 px, normal laptop, and wide desktop.
- Buyer storefront localization and buyer commerce behavior are out of scope except where shared renderer regression tests prove preservation.
- Work remains on `feature/admin-v3-shopify-inspired` or child branches until Preview QA and explicit approval.

## Review Focus

1. Narrow mobile widths: primary actions, sidebar/drawers, data tables, and Store Builder controls remain reachable with no document-level horizontal overflow.
2. Backend/API failures: each redesigned page shows recoverable English error UI and does not silently render zero/empty data.
3. Tenant/security boundaries: UI changes never bypass existing API/RLS/entitlement contracts and no direct unscoped Supabase reads are added.
4. Store Builder lifecycle: autosave, retry, conflict, Publish, and Buy Now protection remain behaviorally identical while chrome changes.
5. Route compatibility: existing production admin URLs either remain canonical or redirect intentionally so old links do not break.

---

### Task 1: Admin V3 foundation and shell

**Files:**
- Modify: `src/features/admin/components/AdminLayout.tsx`
- Create: `src/features/admin/components/AdminPageHeader.tsx`
- Create: `src/features/admin/components/AdminNav.tsx`
- Create: `src/features/admin/components/AdminMobileNav.tsx`
- Create: `src/features/admin/components/AdminSurface.tsx`
- Create: `src/features/admin/components/AdminStatusBadge.tsx`
- Create: `src/features/admin/components/AdminEmptyState.tsx`
- Create: `src/features/admin/components/AdminErrorState.tsx`
- Modify: `src/app/routes/AdminConsole.tsx`
- Modify: `src/app/App.tsx`
- Test: `tests/adminNavigation.test.ts`
- Create: `tests/adminV2Shell.test.ts`

**Interfaces:**
- Produces: reusable Admin V3 chrome and UI primitives consumed by Tasks 2–9.
- Preserves: `AdminConsole` route nesting and `RequireAdmin` security boundary.

- [ ] **Step 1: Write failing shell/navigation tests**

Assert the English-only navigation order is exactly Dashboard, Orders, Products, Customers, Store, Analytics, Settings; Marketing and top-level Billing are absent; Store exposes Store Builder and Themes only; Domains and Policies are reachable from Settings; mobile navigation has an accessible open/close contract; no duplicate competing admin shell is introduced.

- [ ] **Step 2: Run focused tests**

Run: `npm test -- tests/adminNavigation.test.ts tests/adminV2Shell.test.ts`
Expected: FAIL against current shell/copy.

- [ ] **Step 3: Implement shell and shared primitives**

Refactor `AdminLayout` into dark persistent desktop sidebar + light content workspace. Keep page-specific business logic out of the layout. Add responsive drawer navigation and shared English-only page/status/empty/error primitives.

- [ ] **Step 4: Run focused tests**

Run: `npm test -- tests/adminNavigation.test.ts tests/adminV2Shell.test.ts`
Expected: PASS.

- [ ] **Step 5: Run lint/typecheck**

Run: `npm run lint && npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

`git commit -am "feat(admin): add Admin V3 shell and primitives"`

---

### Task 2: Operational Dashboard V2

**Files:**
- Refactor: `src/features/admin/pages/Dashboard.tsx`
- Create: `src/features/admin/components/AdminStatCard.tsx`
- Create: `src/features/admin/components/ActionRequiredPanel.tsx`
- Create: `src/features/admin/components/RecentOrdersPanel.tsx`
- Create: `src/features/admin/components/LowStockPanel.tsx`
- Test: `tests/adminDashboardMetrics.test.ts`
- Create: `tests/adminV2Dashboard.test.ts`

**Interfaces:**
- Consumes: existing dashboard/order/product admin APIs and Task 1 primitives.
- Produces: operational Dashboard used only at `/admin`; Analytics becomes a separate route later.

- [ ] **Step 1: Write failing tests**

Pin English labels, Sales/Orders/Pending Orders/Customers summary, Action Required, Recent Orders, Low Stock, and meaningful empty/error actions. Assert current recognized-sales semantics remain unchanged.

- [ ] **Step 2: Run tests**

Run: `npm test -- tests/adminDashboardMetrics.test.ts tests/adminV2Dashboard.test.ts`
Expected: FAIL for new layout/copy.

- [ ] **Step 3: Refactor Dashboard**

Remove chart-first/duplicative presentation. Reuse current authoritative metrics and independent loading/error behavior. Add setup actions when a seller has insufficient product/store configuration.

- [ ] **Step 4: Verify**

Run: `npm test -- tests/adminDashboardMetrics.test.ts tests/adminV2Dashboard.test.ts && npm run lint && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

`git commit -am "feat(admin): redesign operational dashboard"`

---

### Task 3: Shopify-inspired Products workspace V3

**Files:**
- Refactor: `src/features/catalog/pages/AdminProducts.tsx`
- Create: `src/features/catalog/components/AdminProductTable.tsx`
- Create: `src/features/catalog/components/AdminProductFilters.tsx`
- Create: `src/features/catalog/components/AdminProductEditor.tsx`
- Modify only if required by existing UI reads: `src/features/catalog/api/admin.ts`
- Create: `tests/adminProductsV2.test.ts`
- Preserve existing catalog/product tests.

**Interfaces:**
- Consumes: current product admin API and current plan/product-limit behavior.
- Produces: searchable/filterable product workspace; no new product-domain semantics.

- [ ] **Step 1: Write failing product workspace tests**

Assert All Products, Add Product, search/filter/sort affordances, status/inventory/category/price/visibility columns, deliberate empty/error state, and editor grouping: General, Media, Pricing, Inventory, Product Organization, Store Visibility. Assert Variants, Collections, Tags, CSV import/export only when repository inspection proves current support; never add fake functional UI.

- [ ] **Step 2: Run focused tests**

Run: `npm test -- tests/adminProductsV2.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement the workspace**

Split the existing large page into focused table/filter/editor components while preserving current create/update/delete/image/plan-limit behavior and typed DB error mapping.

- [ ] **Step 4: Verify catalog regressions**

Run: `npm test -- tests/adminProductsV2.test.ts tests/dbError.test.ts && npm run lint && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

`git commit -am "feat(admin): redesign products workspace"`

---

### Task 4: Orders workspace V3

**Files:**
- Refactor: `src/features/orders/pages/AdminOrders.tsx`
- Create: `src/features/orders/components/AdminOrdersTable.tsx`
- Create: `src/features/orders/components/AdminOrderDetail.tsx`
- Create: `src/features/orders/components/AdminOrderTimeline.tsx` only if existing data can truthfully populate it
- Modify only if UI-read support is required: `src/features/orders/api/admin.ts`
- Create: `tests/adminOrdersV2.test.ts`
- Preserve existing order-status and financial tests.

**Interfaces:**
- Consumes: existing canonical order state machine and payment verification behavior.
- Produces: scannable operations list + focused detail UI without inventing new statuses.

- [ ] **Step 1: Write failing tests**

First inspect and pin the canonical backend order states. Assert seller-facing tabs/stages are All, Pending, Confirmed, Delivered, Return; verify a deterministic presentation mapping to canonical backend states; verify only allowed transitions are exposed, Return is gated after Delivered unless backend truth requires otherwise, status changes require confirmation, and failure states provide Retry.

- [ ] **Step 2: Run tests**

Run: `npm test -- tests/adminOrdersV2.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement Orders V2**

Split list/detail concerns, keep copy English-only, introduce a small order-stage presentation mapping module if canonical backend statuses differ from Pending/Confirmed/Delivered/Return, retain current RPC/API write paths, and preserve backend order-status validation, payment semantics, and audit truth.

- [ ] **Step 4: Verify**

Run: `npm test -- tests/adminOrdersV2.test.ts tests/orderStatus*.test.ts && npm run lint && npm run typecheck`
Expected: PASS; if the glob is unsupported, run repository-listed order status tests explicitly.

- [ ] **Step 5: Commit**

`git commit -am "feat(admin): redesign orders workspace"`

---

### Task 5: Customers derived workspace

**Files:**
- Create: `src/features/admin/pages/Customers.tsx`
- Create: `src/features/admin/lib/customerSummary.ts`
- Modify: `src/app/App.tsx`
- Create: `tests/adminCustomers.test.ts`

**Interfaces:**
- Consumes: existing seller-owned order data already available to admin.
- Produces: derived `CustomerSummary` view model with identity, order count, authoritative total spend, and last order.
- Must not create a new CRM database subsystem.

- [ ] **Step 1: Write failing pure aggregation tests**

Define `buildCustomerSummaries(orders): CustomerSummary[]` with deterministic grouping by the best existing customer identity key available in order data; ensure cancelled/non-recognized amounts follow existing recognized-sales semantics.

- [ ] **Step 2: Run test**

Run: `npm test -- tests/adminCustomers.test.ts`
Expected: FAIL because helper/page do not exist.

- [ ] **Step 3: Implement helper and page**

Build summaries in the admin feature from existing authoritative order records. Add search/read-only customer list UI and explicit empty/error states.

- [ ] **Step 4: Verify**

Run: `npm test -- tests/adminCustomers.test.ts tests/adminDashboardMetrics.test.ts && npm run lint && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

`git commit -am "feat(admin): add derived customers workspace"`

---

### Task 6: Analytics V2 as a truthful separate surface

**Files:**
- Create: `src/features/admin/pages/Analytics.tsx`
- Create: `src/features/admin/lib/analyticsSummary.ts`
- Modify: `src/app/App.tsx`
- Create: `tests/adminAnalytics.test.ts`

**Interfaces:**
- Consumes: existing authoritative orders/products metrics.
- Produces: descriptive analytics only; no fabricated tracking precision.

- [ ] **Step 1: Write failing metric tests**

Pin recognized-sales semantics, order counts/status distribution, and explicit empty-state behavior. Ensure `/admin/analytics` no longer renders `Dashboard`.

- [ ] **Step 2: Run test**

Run: `npm test -- tests/adminAnalytics.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement Analytics page**

Use existing data only. Provide numeric context alongside charts/visual summaries and independent error/loading states.

- [ ] **Step 4: Verify**

Run: `npm test -- tests/adminAnalytics.test.ts tests/adminDashboardMetrics.test.ts && npm run lint && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

`git commit -am "feat(admin): add truthful analytics workspace"`

---

### Task 7: Settings, Billing, and Store navigation surfaces

**Files:**
- Refactor: `src/features/shop/pages/Settings.tsx`
- Refactor: `src/features/billing/pages/Billing.tsx`
- Refactor: `src/features/shop/pages/Themes.tsx`
- Create: `src/features/shop/pages/StoreNavigation.tsx`
- Create: `src/features/shop/pages/StoreDomains.tsx`
- Create: `src/features/shop/pages/StorePolicies.tsx`
- Modify: `src/app/App.tsx`
- Create: `tests/adminStoreSettingsV2.test.ts`

**Interfaces:**
- Consumes: existing settings/billing/theme data and entitlement rules.
- Produces: coherent Store and Billing IA; placeholder/config pages must clearly represent only functionality that actually exists.

- [ ] **Step 1: Write failing routing/IA tests**

Assert Store grouping, English-only labels, Billing separation, existing theme lifecycle entry, and intentional non-destructive handling for capabilities not yet backed by APIs.

- [ ] **Step 2: Run tests**

Run: `npm test -- tests/adminStoreSettingsV2.test.ts tests/adminNavigation.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement pages/routes**

Refactor visual structure without changing backend enforcement. Where Navigation/Domains/Policies functionality is not currently implemented, show truthful setup/readiness states rather than fake controls.

- [ ] **Step 4: Verify**

Run: `npm test -- tests/adminStoreSettingsV2.test.ts tests/adminNavigation.test.ts && npm run lint && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

`git commit -am "feat(admin): reorganize store settings and billing"`

---

### Task 8: Store Builder V2 workspace shell

**Files:**
- Refactor: `src/features/shop/storeBuilder/StoreBuilderShell.tsx`
- Refactor: `src/features/shop/storeBuilder/SectionTree.tsx`
- Refactor: `src/features/shop/storeBuilder/Inspector.tsx`
- Refactor: `src/features/shop/storeBuilder/PreviewCanvas.tsx`
- Refactor: `src/features/shop/storeBuilder/MobileEditorPanels.tsx`
- Modify: `src/features/shop/pages/LifecycleStoreBuilder.tsx`
- Test: `tests/storeBuilderShell.test.ts`
- Test: `tests/storeBuilderSections.test.ts`
- Test: `tests/storeBuilderResponsive.test.ts`
- Create: `tests/storeBuilderV2Workspace.test.ts`

**Interfaces:**
- Consumes unchanged: `EditorState`, `saveDraft`, `publishDraft`, section operations, normalized Store Design document, shared storefront renderer.
- Produces: focused full-screen editor chrome with Pages/Sections | Canvas | Inspector.

- [ ] **Step 1: Write failing V2 workspace tests**

Assert English toolbar, full-screen editor ownership, Back/page selector/viewport/save state/Preview/Publish, synchronized stable-ID selection, and no dependency on the normal Admin sidebar while editing.

- [ ] **Step 2: Run focused builder tests**

Run: `npm test -- tests/storeBuilderShell.test.ts tests/storeBuilderSections.test.ts tests/storeBuilderV2Workspace.test.ts`
Expected: FAIL for V2 chrome while lifecycle tests remain informative.

- [ ] **Step 3: Refactor builder chrome only**

Preserve existing editor state and persistence functions. Convert the visual hierarchy to the approved workspace and contextual inspector presentation. Do not alter buyer renderer contracts.

- [ ] **Step 4: Verify builder behavior**

Run: `npm test -- tests/storeBuilderShell.test.ts tests/storeBuilderSections.test.ts tests/storeBuilderProductSource.test.ts tests/storeBuilderV2Workspace.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

`git commit -am "feat(store-builder): redesign editor workspace"`

---

### Task 9: Store Builder contextual/global styling controls

**Files:**
- Refactor: `src/features/shop/storeBuilder/Inspector.tsx`
- Refactor: `src/features/shop/storeBuilder/ProductSourceInspector.tsx`
- Create only if current schema already supports it cleanly: `src/features/shop/storeBuilder/ThemeSettingsInspector.tsx`
- Modify if needed: `src/features/shop/storeBuilder/sectionOperations.ts`
- Test: `tests/storeBuilderProductSource.test.ts`
- Test: `tests/storeBuilderSections.test.ts`
- Create: `tests/storeBuilderInspectorV2.test.ts`

**Interfaces:**
- Consumes: typed Store Design settings/capabilities.
- Produces: section-specific Content/Style/Layout/Product Source controls; must not expose raw JSON.
- Protected invariant: Product Detail Buy Now remains present and functional.

- [ ] **Step 1: Write failing inspector tests**

Pin Hero-specific vs Featured Products-specific controls and verify protected controls cannot hide/remove Buy Now.

- [ ] **Step 2: Run tests**

Run: `npm test -- tests/storeBuilderInspectorV2.test.ts tests/storeBuilderProductSource.test.ts`
Expected: FAIL for new contextual grouping.

- [ ] **Step 3: Implement contextual grouping**

Only expose settings the current typed schema can persist. Treat theme families as presets; add global token controls only where the current Store Design document already has compatible fields.

- [ ] **Step 4: Verify**

Run: `npm test -- tests/storeBuilderInspectorV2.test.ts tests/storeBuilderSections.test.ts tests/storeBuilderProductSource.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

`git commit -am "feat(store-builder): add contextual inspector experience"`

---

### Task 10: Responsive and accessibility pass

**Files:**
- Modify Admin V3 components/pages created in Tasks 1–9 as required.
- Extend: `tests/storeBuilderResponsive.test.ts`
- Create: `tests/adminV2Responsive.test.ts`
- Create: `tests/adminV2Accessibility.test.ts`

**Interfaces:**
- Produces: responsive/accessibility acceptance evidence without changing domain behavior.

- [ ] **Step 1: Write failing static/contract tests**

Pin no fixed-width mobile traps, reachable primary actions, accessible dialog/drawer labels, focus-visible styles, status text beyond color, and Store Builder preview-first mobile controls.

- [ ] **Step 2: Run tests**

Run: `npm test -- tests/adminV2Responsive.test.ts tests/adminV2Accessibility.test.ts tests/storeBuilderResponsive.test.ts`
Expected: FAIL until all migrated surfaces conform.

- [ ] **Step 3: Fix responsive/accessibility findings**

Validate 375/390/414 px behavior in implementation and preserve desktop layout at laptop/wide widths.

- [ ] **Step 4: Verify**

Run: `npm test -- tests/adminV2Responsive.test.ts tests/adminV2Accessibility.test.ts tests/storeBuilderResponsive.test.ts && npm run lint && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

`git commit -am "fix(admin): complete responsive and accessibility pass"`

---

### Task 11: Full regression and security boundary verification

**Files:**
- Tests only unless a concrete regression is found.
- Update design docs only for factual implementation notes if needed.

**Interfaces:**
- Verifies preservation of existing production contracts.

- [ ] **Step 1: Run full repository tests**

Run: `npm test`
Expected: 0 failures.

- [ ] **Step 2: Run lint/typecheck/build**

Run: `npm run lint && npm run typecheck && npm run build`
Expected: all exit 0.

- [ ] **Step 3: Run repository-supported database/runtime/security suites**

Run the existing Database Runtime Integration and security/RLS tests used by the current repository. Verify cross-tenant isolation, checkout/inventory/financial idempotency, billing enforcement, RPC hardening, and Store Design lifecycle remain green. Do not mutate Production.

- [ ] **Step 4: Run Network resilience**

Run the repository-supported Network resilience workflow/check for the exact branch SHA.
Expected: SUCCESS.

- [ ] **Step 5: Review final diff**

Confirm no new direct unscoped Supabase access, no second storefront renderer, no duplicated cart/ProductCard implementation, no Production secrets/config changes, and no unrelated refactors.

- [ ] **Step 6: Commit verification-only adjustments if any**

Use a focused commit message; otherwise do not create an empty commit.

---

### Task 12: Vercel Preview acceptance and release handoff

**Files:** None unless a concrete Preview-only defect is found.

**Interfaces:**
- Produces: exact-SHA Preview evidence for owner approval.

- [ ] **Step 1: Deploy exact branch SHA to Vercel Preview**

Do not deploy Production.

- [ ] **Step 2: Verify Preview SHA**

Confirm deployment metadata and `/api/version` match the exact branch SHA.

- [ ] **Step 3: Manual acceptance pass**

Verify at minimum:
- Dashboard
- Products list/create/edit
- Orders list/detail/actions
- Customers
- Analytics
- Settings
- Billing
- Store/Themes
- Store Builder desktop
- Store Builder mobile at 375/390/414 px
- Draft save/retry/conflict presentation
- Preview/Publish controls against non-production data
- shared buyer storefront rendering and Buy Now invariant

- [ ] **Step 4: Inspect Preview runtime logs**

Check 5xx, uncaught exceptions, Supabase/Postgres errors, authorization failures, missing config, module/import failures, and storefront/Store Design failures.

- [ ] **Step 5: Owner visual approval**

Stop before merge. Present Preview and acceptance results for explicit approval.

- [ ] **Step 6: Only after approval, prepare final PR/merge gate**

Use the normal MiniShop release process. Production deployment remains a separate controlled release task.


---

## Admin V3 Decision Amendment — 2026-10-03

This section supersedes any conflicting earlier task text.

### Final primary navigation

1. Dashboard
2. Orders
3. Products
4. Customers
5. Store
6. Analytics
7. Settings

Marketing is removed. Billing is nested under Settings. Domains and Policies are nested under Settings. Store is reserved for Store Builder and theme/design concerns.

### Orders presentation contract

Seller UI exposes All, Pending, Confirmed, Delivered, Return. Do not migrate or rename canonical database statuses until repository inspection proves a migration is necessary and separately approved. Prefer a presentation mapping seam with explicit allowed transitions. Backend/RPC validation remains authoritative.

### Products presentation contract

Use Shopify-inspired information architecture for list and editor organization, while retaining MiniShop domain semantics. Categories, Collections, Tags, Variants, CSV and bulk operations are enabled only when current schema/API support is verified.

### Settings contract

Use a Shopify-inspired Settings Hub, adapted to actual MiniShop capabilities. Do not ship non-functional controls. Plan and billing, Domains and Policies belong here.

### Git and release contract

All Admin V3 implementation work starts from `feature/admin-v3-shopify-inspired` or short-lived child branches. No Production deployment, migration, or merge is authorized by this plan update.
