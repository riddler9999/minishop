# MiniShop Store Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform MiniShop seller admin into a Shopify-inspired Store Builder platform with safe draft/publish/rollback lifecycle, shared storefront rendering, commerce section editing, and protected Buy Now behavior without regressing existing production commerce flows.

**Architecture:** Store Design becomes a dedicated deep module: pure document/normalization logic in `src/domain/storeDesign`, lifecycle persistence in `src/features/shop/api/storeDesign.ts` backed by one `store_designs` row per shop, and a catalog-owned shared renderer consumed by both buyer storefront and editor preview. Seller editing is optimistic-concurrency Draft state; Publish/Rollback are atomic DB operations. Existing `shops.theme` remains a compatibility source until the new runtime is verified.

**Tech Stack:** React, TypeScript, Vite, Tailwind CSS v4, Supabase Postgres/RLS/RPC, native Node test runner, existing MiniShop data-source composition.

**Spec:** `docs/superpowers/specs/2026-09-26-minishop-store-builder-design.md`

## Global Constraints

- Node.js 22; use existing package manager and dependencies unless a task proves an existing stack gap.
- Preserve import direction: `domain/ ← core/, shared/ ← features/* ← data/ ← app/`.
- Feature modules never import another feature's `api/`; cross-feature composition stays in `src/data/liveApi.ts`.
- Storefront pages access backend only through `@/data/dataSource`.
- Seller/buyer UI copy defaults to Burmese unless an explicit existing decision says otherwise.
- Never apply a new migration to Production without explicit owner approval.
- Additive migration first; preserve `shops.theme` and current live storefront behavior during compatibility period.
- Product Detail Buy Now may be restyled/relabelled but may never be hidden, removed, or disabled.
- Buyer storefront reads Published only; Draft and Previous Published must remain seller-only.
- Use existing category domain in V1. “Collection” is UI terminology only; do not add a collections table.
- No Custom HTML/JS, full version history, editable checkout structure, AI layout generation, or real-time collaboration.
- Create/update `DESIGN.md` before admin/editor UI implementation and treat it as a durable source of truth.
- Keep tasks reviewable. No task should intentionally exceed ~5 implementation files excluding focused tests/docs.
- Run focused tests per task and `npm run check` at every phase checkpoint.

## Review Focus

1. **Stale autosave response arrives after a newer save** — stale revision must be rejected and must never overwrite newer Draft; covered in Task 4.
2. **Malformed/legacy Product template has no sections or Buy Now config** — required purchase area must still render; covered in Tasks 2 and 8.
3. **Seller attempts another shop's Draft/publish/rollback** — DB authorization must deny it regardless of supplied shop id; covered in Task 3.
4. **Theme switch while live store serves traffic** — new theme remains Draft-only until Publish and buyer still receives old Published; covered in Tasks 5 and 6.
5. **Dynamic Best Selling with cancelled/RTO/refunded later statuses** — ranking follows created-order historical demand contract and does not subtract later status changes; covered in Task 7.

---

## File / Module Map

### Domain deep module
- Create `src/domain/storeDesign/types.ts` — Store Design document, templates, section types, product-source types, lifecycle result types.
- Create `src/domain/storeDesign/registry.ts` — pure section metadata/capabilities/default settings; no React.
- Create `src/domain/storeDesign/normalize.ts` — schema normalization, legacy conversion, invariant repair for rendering.
- Create `src/domain/storeDesign/migrateTheme.ts` — content-preserving new-theme Draft creation.
- Create `src/domain/storeDesign/index.ts` — narrow public exports.

### Persistence / data adapters
- Create migration `supabase/migrations/0024_store_design_lifecycle.sql` — `store_designs`, RLS, save/publish/rollback functions, legacy initialization helpers.
- Create `src/features/shop/api/storeDesign.ts` — seller lifecycle adapter.
- Create/update buyer Store Design read path under catalog/storefront gateway.
- Modify `src/data/liveApi.ts` and demo adapter composition only as needed to expose narrow interfaces.

### Shared renderer
- Create `src/features/catalog/storeDesign/StorefrontRenderer.tsx` — normalized document → template renderer.
- Create `src/features/catalog/storeDesign/sections/*` — focused section renderers grouped by responsibility.
- Modify Home / Products / Product Detail composition to delegate editable storefront surfaces to the renderer.
- Retire/reduce `src/features/shop/components/StorePreview.tsx` to a thin wrapper.

### Admin / editor UI
- Create/update `DESIGN.md`.
- Refactor `src/features/admin/components/AdminLayout.tsx` for target IA.
- Add `src/features/shop/pages/Themes.tsx`.
- Refactor `src/features/shop/pages/StoreDesign.tsx` into Store Builder shell or replace with focused modules under `src/features/shop/storeBuilder/*`.
- Add section tree, preview canvas, inspector, add-section library, save/conflict state, responsive mobile drawer/sheet.

---

### Task 1: Lock durable admin/editor design contract

**Files:**
- Create: `DESIGN.md`
- Modify: `docs/superpowers/specs/2026-09-26-minishop-store-builder-design.md` only if implementation-level visual ambiguity is discovered
- Test: documentation review only

**Interfaces:**
- Consumes: approved design spec.
- Produces: durable visual/interaction rules used by Tasks 9–12.

- [ ] **Step 1: Write `DESIGN.md` with exact admin/editor rules**
  
  Include admin shell hierarchy, neutral platform chrome, pane behavior, desktop/mobile preview rules, Burmese seller copy default, save/conflict states, touch/focus/contrast requirements, 375/390/414 overflow rule, and reuse-first token policy.

- [ ] **Step 2: Cross-check against current brand tokens and admin shell**
  
  Verify the contract does not require unrelated storefront brand redesign or new dependencies.

- [ ] **Step 3: Commit**
  
  ```bash
  git add DESIGN.md
  git commit -m "docs: define store builder design contract"
  ```

---

### Task 2: Build the pure Store Design deep module

**Files:**
- Create: `src/domain/storeDesign/types.ts`
- Create: `src/domain/storeDesign/registry.ts`
- Create: `src/domain/storeDesign/normalize.ts`
- Create: `src/domain/storeDesign/migrateTheme.ts`
- Create: `src/domain/storeDesign/index.ts`
- Test: `tests/storeDesignDomain.test.ts`

**Interfaces:**
- Consumes: existing `ThemePresetId`, current theme presets, product/category domain terms.
- Produces:
  - `normalizeStoreDesign(input: unknown): StoreDesignDocument`
  - `createDefaultStoreDesign(themeId: ThemePresetId): StoreDesignDocument`
  - `createThemeDraft(current: StoreDesignDocument, targetThemeId: ThemePresetId): StoreDesignDocument`
  - typed section registry lookup
  - `validatePublishableStoreDesign(document): PublishValidationResult`

- [ ] **Step 1: Write failing domain tests**
  
  Assert schema version normalization, legacy theme conversion, explicit section IDs, supported-template enforcement, Category alias behavior, and malformed empty Product template still normalizes to required commerce capability.

- [ ] **Step 2: Run focused tests and confirm failure**
  
  Run: `npm test -- tests/storeDesignDomain.test.ts` or repository-equivalent native test command.  
  Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement types and pure registry**
  
  Registry contains metadata/defaults/capabilities only; no React imports.

- [ ] **Step 4: Implement normalization and publish validation**
  
  Rendering normalization may repair non-critical malformed input; publish validation must reject true invariant violations rather than silently publishing invalid state.

- [ ] **Step 5: Implement content-preserving theme Draft migration**
  
  Preserve compatible Hero copy/image, Announcement, product/category selections, and semantically equivalent section content. Target-theme visual defaults win over incompatible old visual settings.

- [ ] **Step 6: Run focused tests**
  
  Expected: PASS.

- [ ] **Step 7: Commit**
  
  ```bash
  git add src/domain/storeDesign tests/storeDesignDomain.test.ts
  git commit -m "feat: add store design domain model"
  ```

---

### Task 3: Add additive Store Design lifecycle schema, RLS, and atomic RPCs

**Files:**
- Create: `supabase/migrations/0024_store_design_lifecycle.sql`
- Test: `tests/storeDesignMigration.test.ts`
- Test: `tests/storeDesignRlsContract.test.ts`
- Modify: `supabase/README.md`

**Interfaces:**
- Consumes: Store Design document JSON contract from Task 2; existing `shops` ownership model.
- Produces DB functions with stable intent-level interfaces:
  - seller load own lifecycle
  - save Draft with expected revision
  - publish Draft atomically
  - rollback Published atomically
  - buyer-safe Published read path or support for gateway read

- [ ] **Step 1: Write failing migration contract tests**
  
  Assert one `store_designs` row per shop, three lifecycle slots, Draft/Published revisions, additive legacy initialization, no `shops.theme` removal, and RPC ownership checks.

- [ ] **Step 2: Write failing RLS/security tests**
  
  Cover owner read/write, cross-tenant denial, anon Draft/Previous denial, and publish/rollback ownership enforcement.

- [ ] **Step 3: Run focused tests and confirm failure**

- [ ] **Step 4: Implement `0024_store_design_lifecycle.sql`**
  
  Use one row per shop. Save Draft uses optimistic revision check. Publish and rollback lock the lifecycle row and mutate slots atomically. Migration initializes from legacy `shops.theme` without destructive cutover.

- [ ] **Step 5: Update Supabase migration documentation**
  
  Mark migration as pending until explicit production approval.

- [ ] **Step 6: Run migration/RLS tests**
  
  Expected: PASS in repository-local/disposable test environment; do not apply Production.

- [ ] **Step 7: Commit**
  
  ```bash
  git add supabase/migrations/0024_store_design_lifecycle.sql supabase/README.md tests/storeDesignMigration.test.ts tests/storeDesignRlsContract.test.ts
  git commit -m "feat: add store design lifecycle persistence"
  ```

---

### Task 4: Add seller lifecycle adapter with optimistic concurrency

**Files:**
- Create: `src/features/shop/api/storeDesign.ts`
- Modify: `src/data/liveApi.ts`
- Modify: `src/data/demo/demoApi.ts` or focused demo Store Design adapter
- Test: `tests/storeDesignApi.test.ts`

**Interfaces:**
- Consumes: Task 3 DB functions.
- Produces:
  - `loadOwnStoreDesign(): Promise<StoreDesignLifecycle>`
  - `saveDraft({expectedRevision, document}): Promise<{revision:number; document:StoreDesignDocument}>`
  - `publishDraft({expectedDraftRevision}): Promise<StoreDesignLifecycle>`
  - `rollbackPublished(): Promise<StoreDesignLifecycle>`

- [ ] **Step 1: Write failing adapter tests**
  
  Assert typed success, stale-revision mapping to a distinct conflict error, generic network/save failure separation, publish result, and rollback result.

- [ ] **Step 2: Run focused tests and confirm failure**

- [ ] **Step 3: Implement seller adapter behind the existing data composition seam**
  
  Callers must not supply authoritative `shop_id`; ownership remains DB-side.

- [ ] **Step 4: Add demo/in-memory behavior only as required by existing root/demo routing**
  
  Match interface semantics, including revision conflict behavior where feasible.

- [ ] **Step 5: Run focused tests**
  
  Expected: PASS.

- [ ] **Step 6: Commit**

---

## Checkpoint A — Domain + lifecycle foundation

- [ ] `npm run check`
- [ ] Migration is additive and not applied to Production
- [ ] Cross-tenant tests pass
- [ ] Stale Draft writes are rejected
- [ ] Legacy `shops.theme` remains intact
- [ ] Fresh review of Tasks 1–4 before renderer work

---

### Task 5: Add Published-only buyer Store Design read path

**Files:**
- Create: `src/features/catalog/api/storeDesign.ts` or extend the existing catalog storefront adapter with a focused module
- Modify: `api/storefront.ts`
- Modify: `src/data/liveApi.ts`
- Test: `tests/storeDesignStorefrontApi.test.ts`

**Interfaces:**
- Consumes: Task 3 lifecycle table and Task 2 normalizer.
- Produces: `loadPublishedStoreDesign(shopSlug: string): Promise<StoreDesignDocument>` through storefront data composition.

- [ ] **Step 1: Write failing tests**
  
  Assert buyer receives Published only, never Draft/Previous; legacy fallback works when lifecycle row is absent during transition.

- [ ] **Step 2: Run and confirm failure**

- [ ] **Step 3: Implement gateway/read adapter**
  
  Preserve existing active-shop and tenant routing semantics.

- [ ] **Step 4: Run focused tests**

- [ ] **Step 5: Commit**

---

### Task 6: Build shared catalog-owned storefront renderer

**Files:**
- Create: `src/features/catalog/storeDesign/StorefrontRenderer.tsx`
- Create: focused section renderer files under `src/features/catalog/storeDesign/sections/`
- Modify: `src/features/catalog/pages/Home.tsx`
- Modify: Product Detail page file
- Modify: Category/Products page file
- Test: `tests/storefrontRenderer.test.ts`

**Interfaces:**
- Consumes: normalized `StoreDesignDocument`, products, categories, shop identity.
- Produces: one real renderer used by buyer storefront and editor preview.

- [ ] **Step 1: Write failing renderer tests**
  
  Cover Home section order, hidden section behavior, Product/Category template rendering, malformed Product document fallback, and mandatory Buy Now presence.

- [ ] **Step 2: Run and confirm failure**

- [ ] **Step 3: Implement renderer composition and focused section renderers**
  
  Keep catalog rendering logic in catalog feature. Avoid a giant switch file when section-specific rendering has meaningful complexity.

- [ ] **Step 4: Route buyer Home/Product/Category surfaces through the renderer**
  
  Preserve checkout/cart/order behavior and current tenant routing.

- [ ] **Step 5: Run focused renderer + existing buyer regression tests**

- [ ] **Step 6: Commit**

---

### Task 7: Implement deterministic product-source resolution

**Files:**
- Create: `src/features/catalog/storeDesign/productSource.ts`
- Modify: storefront gateway/query path as required
- Test: `tests/storeDesignProductSource.test.ts`
- Test: focused gateway test if SQL/query behavior changes

**Interfaces:**
- Consumes: typed `ProductSource`.
- Produces: `resolveSectionProducts(source, context): Promise<Product[]>` or equivalent catalog-owned function.

- [ ] **Step 1: Write failing tests**
  
  Manual IDs preserve configured order while dropping unavailable products; New Arrivals sorts active products newest-first; Sale uses current promotion invariant; Category maps to existing `products.category`; Best Selling aggregates `order_items.quantity` from created historical demand and does not subtract later cancellation/RTO/refund.

- [ ] **Step 2: Run and confirm failure**

- [ ] **Step 3: Implement deterministic resolution with bounded limits**
  
  Avoid N+1 queries and unbounded product/order fetches.

- [ ] **Step 4: Run focused tests and any query contract tests**

- [ ] **Step 5: Commit**

---

### Task 8: Enforce protected Product commerce area end-to-end

**Files:**
- Modify: Product renderer module from Task 6
- Modify: relevant product section metadata in domain registry
- Test: `tests/storeDesignBuyNowInvariant.test.ts`

**Interfaces:**
- Consumes: Task 2 registry/normalizer and Task 6 renderer.
- Produces: platform-required purchase area independent of removable seller sections.

- [ ] **Step 1: Write failing invariant tests**
  
  Empty sections, disabled sections, unknown section types, and malicious Buy Now visibility fields must all still render an enabled purchase CTA.

- [ ] **Step 2: Run and confirm failure**

- [ ] **Step 3: Implement protected commerce composition**
  
  Expose only label/style/width configuration to seller-editable settings.

- [ ] **Step 4: Run focused and Product/Checkout regression tests**

- [ ] **Step 5: Commit**

---

## Checkpoint B — Buyer rendering + commerce invariants

- [ ] `npm run check`
- [ ] Existing checkout and order tests remain green
- [ ] Buyer storefront reads Published only
- [ ] Draft theme switch does not change buyer output
- [ ] Buy Now invariant tests pass
- [ ] Best Selling contract tests pass

---

### Task 9: Refactor Admin IA and add Themes entry screen

**Files:**
- Modify: `src/features/admin/components/AdminLayout.tsx`
- Modify: `src/app/App.tsx`
- Create: `src/features/shop/pages/Themes.tsx`
- Modify: Home/Dashboard page as needed to become operations-first
- Test: `tests/adminNavigation.test.ts`
- Test: `tests/themesPage.test.ts`

**Interfaces:**
- Consumes: `DESIGN.md`, seller lifecycle adapter.
- Produces: target admin navigation and Online Store → Themes entry flow.

- [ ] **Step 1: Write failing navigation/route tests**
  
  Assert Home, Orders, Products, Online Store, Marketing, Analytics, Shipping, Settings structure and Themes/Customize routes.

- [ ] **Step 2: Run and confirm failure**

- [ ] **Step 3: Refactor admin shell and routes**
  
  Keep existing business pages behaviorally intact. Move analytics away from Home prominence rather than deleting it.

- [ ] **Step 4: Implement Themes page**
  
  Show current Published theme prominently, available theme families, Customize action, and safe new-theme Draft creation.

- [ ] **Step 5: Run focused tests**

- [ ] **Step 6: Commit**

---

### Task 10: Build desktop Store Builder shell and autosave state machine

**Files:**
- Refactor/replace: `src/features/shop/pages/StoreDesign.tsx`
- Create: `src/features/shop/storeBuilder/StoreBuilderShell.tsx`
- Create: `src/features/shop/storeBuilder/editorState.ts`
- Create: `src/features/shop/storeBuilder/PreviewCanvas.tsx`
- Test: `tests/storeBuilderShell.test.ts`

**Interfaces:**
- Consumes: lifecycle adapter, shared catalog renderer, registry.
- Produces: three-pane editor with selection, preview mode, draft status, publish command.

- [ ] **Step 1: Write failing state-machine tests**
  
  Cover local immediate edits, debounced save intent, Saving/Saved/Retry/Conflict states, stale conflict blocking silent overwrite, and publish requiring latest saved revision.

- [ ] **Step 2: Run and confirm failure**

- [ ] **Step 3: Implement editor state module**
  
  Keep persistence orchestration separate from visual components.

- [ ] **Step 4: Implement split editor shell and preview wrapper**
  
  Desktop preview mode uses responsive canvas; mobile preview mode uses constrained viewport. Preview renders the same catalog renderer from Task 6.

- [ ] **Step 5: Reduce/retire old `StorePreview.tsx` parallel implementation**

- [ ] **Step 6: Run focused tests**

- [ ] **Step 7: Commit**

---

### Task 11: Add section tree, inspector, and Commerce section library

**Files:**
- Create: `src/features/shop/storeBuilder/SectionTree.tsx`
- Create: `src/features/shop/storeBuilder/Inspector.tsx`
- Create: `src/features/shop/storeBuilder/AddSectionPanel.tsx`
- Create: focused inspector field modules only when reused
- Test: `tests/storeBuilderSections.test.ts`

**Interfaces:**
- Consumes: domain registry and editor state from Task 10.
- Produces: add/reorder/hide/show/remove/edit interactions for eligible sections.

- [ ] **Step 1: Write failing interaction tests**
  
  Add each supported section type, reorder deterministically, hide/show eligible sections, reject destructive controls on protected content, remove eligible sections, and sync preview click ↔ tree selection.

- [ ] **Step 2: Run and confirm failure**

- [ ] **Step 3: Implement tree + add-section library**

- [ ] **Step 4: Implement inspector driven by typed section settings**
  
  Do not expose raw JSON editing.

- [ ] **Step 5: Run focused tests**

- [ ] **Step 6: Commit**

---

### Task 12: Add product-source controls and mobile editor behavior

**Files:**
- Create: `src/features/shop/storeBuilder/ProductSourceInspector.tsx`
- Create/Modify: mobile drawer/sheet modules under `src/features/shop/storeBuilder/`
- Modify: Store Builder shell responsive composition
- Test: `tests/storeBuilderResponsive.test.ts`
- Test: `tests/storeBuilderProductSource.test.ts`

**Interfaces:**
- Consumes: Task 7 product-source model and Task 10 editor state.
- Produces: Manual/Dynamic source editing and mobile preview-first editing UX.

- [ ] **Step 1: Write failing product-source UI tests**
  
  Manual product IDs and Dynamic rule/category/limit persist to Draft in typed form.

- [ ] **Step 2: Write failing responsive interaction tests**
  
  Mobile uses preview-first layout, section tree drawer, inspector bottom sheet, and accessible close/focus behavior.

- [ ] **Step 3: Run and confirm failure**

- [ ] **Step 4: Implement controls and responsive editor composition**

- [ ] **Step 5: Run focused tests**

- [ ] **Step 6: Commit**

---

## Checkpoint C — Seller editor functional completeness

- [ ] `npm run check`
- [ ] Desktop split editor works
- [ ] Mobile drawer/bottom-sheet flow works
- [ ] Autosave conflict/retry states work
- [ ] Add/reorder/hide/remove interactions work
- [ ] Manual/Dynamic product-source editing works
- [ ] Preview uses shared catalog renderer

---

### Task 13: Complete compatibility cutover, regression suite, and docs

**Files:**
- Modify: legacy theme read/write paths to prefer lifecycle store while preserving fallback
- Modify: `PROJECT.md`
- Modify: `CLAUDE.md` if architecture navigation guidance changes
- Modify: `supabase/README.md`
- Add/modify focused regression tests
- No Production migration application

**Interfaces:**
- Consumes: all previous tasks.
- Produces: verified compatibility runtime and durable repo guidance.

- [ ] **Step 1: Add failing compatibility/regression tests**
  
  Existing legacy shop theme still renders; lifecycle row takes precedence when present; Products/Orders/Shipping/Billing/tenant routing remain behaviorally intact.

- [ ] **Step 2: Run and confirm failure where cutover is incomplete**

- [ ] **Step 3: Complete compatibility preference logic**
  
  Do not delete `shops.theme`.

- [ ] **Step 4: Update architecture/product docs**
  
  Record Store Design lifecycle, renderer seam, pending migration status, and Production approval requirement.

- [ ] **Step 5: Run full automated verification**
  
  Run: `npm run check`  
  Expected: lint/typecheck, tests, production build all PASS.

- [ ] **Step 6: Browser verification**
  
  Verify desktop Store Builder and 375/390/414 widths: no horizontal overflow; accessible drawer/sheet; Preview selection; autosave status; Publish; theme Draft isolation; Product Buy Now; existing buyer checkout/order flow.

- [ ] **Step 7: Security verification**
  
  Re-run RLS/cross-tenant tests and verify Draft/Previous are not exposed through buyer gateway.

- [ ] **Step 8: Commit**
  
  ```bash
  git add PROJECT.md CLAUDE.md supabase/README.md src tests
  git commit -m "docs: finalize store builder architecture and verification"
  ```

---

## Final Release Gate

Before PR is marked Ready for Review:

- [ ] All task-specific tests green
- [ ] `npm run check` green on branch HEAD
- [ ] No Production DB migration applied
- [ ] Cross-tenant Store Design tests green
- [ ] Draft/Published/Previous lifecycle verified
- [ ] Stale revision conflict verified
- [ ] Buyer reads Published only
- [ ] Theme Draft isolation verified
- [ ] Product Buy Now invariant verified against malformed input
- [ ] Desktop browser verification complete
- [ ] 375 / 390 / 414 browser verification complete
- [ ] Existing Products / Orders / Shipping / Billing / Checkout / Tracking regressions green
- [ ] Diff reviewed for dead legacy preview code; remove only when proven unused
- [ ] `PROJECT.md`, `CLAUDE.md`, and migration docs reflect actual runtime state
- [ ] PR remains blocked from Production migration until explicit owner approval

## Execution Strategy

Recommended: **Subagent-driven, phase-gated execution**.

Reason: Tasks share foundational interfaces but form clean reviewable slices. A regression in tenant isolation, publish lifecycle, or shared rendering can affect production commerce, so each task should get an independent review before downstream work consumes it. Checkpoints A/B/C prevent a large UI branch from hiding a faulty persistence or renderer foundation.

Parallelization:
- Tasks 1 and domain test preparation for Task 2 can overlap after interfaces are fixed.
- After Task 3 lands, Task 4 is sequential.
- Tasks 6 and 7 can partially parallelize once Task 5 and domain interfaces are stable, but integration review must happen before Task 8.
- UI Tasks 9 and shell-state preparation for Task 10 may parallelize after lifecycle interfaces are frozen.
- Task 13 is strictly last.
