# MiniShop Admin + Store Builder Redesign — Design Specification

**Date:** 2026-09-26  
**Status:** Approved design  
**Repository:** `riddler9999/minishop`

## 1. Goal

Redesign the MiniShop seller admin from a dashboard/CRUD-first console into a Shopify-inspired commerce workspace centered around a real Store Builder, while preserving existing production business logic for orders, products, checkout, billing, entitlements, RLS, and tenant storefront behavior.

The product direction is:

> **Shopify-style architecture with Canva-level simplicity for Myanmar social sellers.**

This is a hybrid redesign:
- Redesign the Admin shell and information architecture.
- Fully redesign the Online Store / Theme / Customize experience.
- Preserve existing Products, Orders, Shipping, Billing, and Settings business logic, changing their visual presentation only where needed for consistency.
- Do not redesign or weaken existing checkout, order, pricing, entitlement, or tenant-isolation rules.

---

## 2. Approved Product Scope

### 2.1 Admin redesign mode

Use the **Hybrid** approach.

The seller admin becomes a commerce operating workspace rather than an analytics dashboard.

### 2.2 Builder scope

Use **Builder V1**:
- Sellers can add predefined sections from a section library.
- Sellers can reorder sections.
- Sellers can hide/show eligible sections.
- Sellers can edit section settings.
- Sellers can remove eligible sections.
- Arbitrary HTML, arbitrary JavaScript, arbitrary nested page-builder trees, and plugin-provided custom sections are out of scope.

### 2.3 Save / publish model

Use **Auto-save Draft + Publish**.

- Edits update local editor state immediately.
- Draft changes auto-save to server after a short debounce.
- Buyers continue seeing the last Published version.
- Draft changes become live only after explicit Publish.
- Leaving and returning to the editor restores the saved Draft.
- Auto-save failures must be visible and retryable; they must not fail silently.

### 2.4 Theme switching

Theme changes create a **separate Draft**.

- Current Published theme remains live.
- Seller can preview and customize the new theme Draft safely.
- Existing reusable seller content should be preserved where compatible.
- Unsupported theme settings fall back to the new theme's defaults.
- Publish is the only action that changes the buyer-facing theme.

### 2.5 Version history

V1 stores:
- Draft
- Published
- Previous Published

No full multi-version history in V1.

Rollback is one-click and swaps Previous Published back into Published using the same validation and transaction guarantees as Publish.

### 2.6 Editable templates

V1 Builder edits:
- Home
- Collection / Category
- Product Detail

The following are not structurally editable in V1:
- Cart
- Checkout
- Order Success
- Order Tracking

Those commerce surfaces inherit the selected published theme's global visual tokens and CTA language where applicable, but their flow and required structure remain platform-controlled.

### 2.7 Product Detail purchase CTA invariant

The Product Detail **Buy Now** CTA is a hard platform invariant.

Seller may customize:
- Button label
- Style variant
- Width / layout presentation

Seller may not:
- Hide it
- Remove it
- Disable it

This rule must be enforced by:
1. Editor capability model
2. Schema normalization / validation
3. Storefront rendering fallback

The renderer must preserve a working purchase CTA even if stored design data is old, malformed, or maliciously missing the CTA configuration.

---

## 3. Target Admin Information Architecture

Desktop seller navigation:

```text
MiniShop

Home
Orders
Products
  ├─ All Products
  ├─ Categories
  └─ Inventory

Online Store
  ├─ Themes
  ├─ Navigation
  └─ Store Settings

Marketing
Analytics
Shipping

Settings
```

### 3.1 Home

Home is no longer a chart-first `Sale Analytics` page.

It should prioritize:
- Shop setup / store health
- Orders needing action
- Inventory warnings
- Quick actions
- Concise business summary

Detailed analytics belongs under Analytics.

### 3.2 Online Store

`Online Store` is the primary entry point for storefront building.

`Themes` shows:
- Current Published theme prominently
- Customize as the primary action
- Available theme families below
- Safe preview of alternate themes as Drafts

Existing theme families remain category-neutral aesthetic systems:
- Clean & Minimal
- Street & Bold
- Soft & Elegant
- Grid & Catalog
- Dark Modern

---

## 4. Store Editor UX

### 4.1 Desktop layout

Use a three-pane **Split View Editor**:

```text
┌───────────────────────────────────────────────────────┐
│ Exit     Template      Desktop/Mobile      Publish   │
├──────────────┬───────────────────────┬────────────────┤
│ SECTION TREE │                       │   INSPECTOR    │
│              │    LIVE STOREFRONT    │                │
│ Announcement │                       │ Content        │
│ Hero         │    Actual renderer    │ Style          │
│ Categories   │                       │ Layout         │
│ Featured     │                       │                │
│ Image + Text │                       │                │
│ ...          │                       │                │
│ + Add        │                       │                │
└──────────────┴───────────────────────┴────────────────┘
```

Top bar includes:
- Exit
- Template selector
- Undo / Redo
- Desktop / Mobile preview switch
- Preview
- Draft save state
- Publish

Save state must communicate:
- Saving…
- Saved
- Changes not saved — Retry
- Conflict / stale draft state

### 4.2 Selection behavior

Selecting a section in the Section Tree:
- Selects the same section in preview
- Opens its Inspector

Clicking an editable region in Preview:
- Selects the corresponding section/block
- Opens its Inspector

The editor must use explicit section IDs so preview/editor selection is deterministic.

### 4.3 Section controls

Eligible sections support:
- Drag reorder
- Show / hide
- Edit
- Remove

Required platform components do not expose destructive controls.

### 4.4 Mobile editor

Do not squeeze the desktop three-pane layout.

Mobile behavior:
- Preview is the primary surface
- Section tree opens as a drawer
- Inspector opens as a bottom sheet / drawer
- Tap on preview selects the corresponding section
- Publish and save state remain accessible without requiring desktop width

---

## 5. Commerce Section Library — V1

The predefined section library contains:

- Hero
- Categories
- Featured Products
- Best Selling
- Promotion Banner
- Image + Text
- Product Collection
- New Arrivals
- Sale Products
- Announcement
- Rich Text
- Spacer

Out of scope for V1:
- Video
- Slideshow
- FAQ
- Map
- Custom HTML
- Custom JavaScript
- Third-party section plugins

---

## 6. Product Source Model

Product-driven sections support **Hybrid Product Source**.

Each compatible section can use either:

### 6.1 Manual

```text
mode: manual
productIds: [...]
```

Seller explicitly chooses products.

### 6.2 Dynamic

```text
mode: dynamic
rule: best_selling | new_arrivals | sale | collection
limit: N
```

Rules must be deterministic and platform-defined.

AI-based product selection is out of scope for V1.

---

## 7. Architecture Direction

Use a dedicated **Store Design domain**, rather than continuing to grow `shops.theme` into a mixed lifecycle blob.

Conceptual model:

```text
Shop
 └── Store Design
      ├── Draft
      │    ├── Theme
      │    ├── Global Settings
      │    └── Templates
      │         ├── Home
      │         ├── Collection
      │         └── Product
      │
      ├── Published
      └── Previous Published
```

`shops` continues to own shop identity and non-editor shop configuration.

The exact persistence table/function names must follow repository/database conventions during implementation, but responsibilities must remain separated:
- Shop identity/config
- Store design lifecycle
- Theme/schema normalization
- Publish/rollback transaction boundary

---

## 8. Store Design Document Schema

Every design document must include a schema version.

Conceptual shape:

```ts
interface StoreDesignDocument {
  schemaVersion: number;
  themeId: ThemePresetId;
  globalSettings: GlobalThemeSettings;
  templates: {
    home: StoreTemplate;
    collection: StoreTemplate;
    product: StoreTemplate;
  };
}
```

A template owns an ordered list of sections.

Conceptual section shape:

```ts
interface StoreSection {
  id: string;
  type: StoreSectionType;
  enabled: boolean;
  settings: unknown;
}
```

The implementation must use typed per-section settings rather than treating `settings` as unvalidated arbitrary JSON.

A central Section Registry defines:
- Section type
- Supported templates
- Default settings
- Validation
- Normalization
- Editor component
- Renderer component
- Whether section is removable
- Whether section is hideable
- Product-source capability where applicable

---

## 9. Shared Renderer Contract

Editor preview must not use a fake parallel storefront implementation.

The Draft preview and buyer-facing storefront must share the same rendering contract and storefront components.

The difference is the design input:
- Editor Preview → Draft
- Buyer Storefront → Published

This prevents preview/production drift.

The same normalizer must be used before rendering both Draft and Published documents.

---

## 10. Theme Migration / Content Preservation

Switching themes creates a new Draft from:
1. Target theme defaults
2. Compatible reusable content from current design

Preserve where compatible:
- Hero headline/subtext
- Hero image
- Announcement text
- Product selections
- Collection selections
- Relevant section copy
- Other semantically equivalent content

Do not blindly copy incompatible visual settings.

Unsupported target-theme properties use target-theme defaults.

---

## 11. Auto-save and Concurrency

Draft persistence must use optimistic concurrency.

Conceptual flow:

```text
Client loads revision 18
        ↓
edit
        ↓
save(expectedRevision = 18)
        ↓
server commits revision 19
```

A stale request using revision 18 after revision 19 exists must not overwrite newer work.

Conflict behavior:
- Server rejects stale write
- Editor shows that the design changed elsewhere
- Seller receives an explicit reload/recovery path

Do not use last-write-wins for Store Builder drafts.

Auto-save:
- Updates local state immediately
- Debounces network persistence
- Must not issue a write for every keystroke
- Must expose failed saves clearly
- Must not publish implicitly

---

## 12. Publish Contract

Publish must be an atomic server/database operation.

Conceptual transaction:

```text
BEGIN

lock store design

load Draft

validate schema
normalize document
validate commerce invariants

Published → Previous Published
Draft     → Published

increment lifecycle revision

COMMIT
```

If any step fails:
- Transaction rolls back
- Existing Published storefront remains unchanged
- No half-published state is allowed

Publish must reject an invalid design rather than attempting partial repair at the transaction boundary.

---

## 13. Rollback Contract

Rollback must also be atomic.

Conceptual behavior:
- Validate Previous Published
- Swap Previous Published into Published
- Move current Published into Previous Published
- Commit in one transaction

This allows a mistaken rollback to be reversed with another swap if necessary.

---

## 14. Security and Tenant Isolation

Store Design is production multi-tenant data.

Requirements:
- Browser-provided `shop_id` is not trusted as authorization.
- Authenticated user ownership must be resolved/enforced server/database-side.
- New design persistence tables must have tenant-safe RLS.
- Draft, Published, Previous Published must only be readable/writable by the owning seller, except buyer storefront reads of Published through the controlled storefront data path.
- Cross-tenant access must have explicit regression coverage.
- Publish and rollback functions must enforce shop ownership internally.

The redesign must not weaken the repository's existing RLS posture.

---

## 15. Legacy `shops.theme` Compatibility

Existing `shops.theme` data is a migration source, not the long-term lifecycle store.

Migration strategy:

```text
Existing shops.theme
       ↓
Compatibility parser / normalizer
       ↓
Store Design schema v1
       ↓
Initialize Draft + Published
```

Requirements:
- No destructive cutover in the first Store Builder migration.
- Existing storefront design must not reset.
- Legacy theme IDs normalize to supported current theme families.
- Keep transitional read compatibility until the new runtime is verified.
- Removal of the legacy field/path is a separate future migration.

---

## 16. Required Product Detail Commerce Boundary

Product Detail rendering must preserve required commerce functionality independently of seller-configurable sections.

Conceptual composition:

```text
Product Template

Gallery             customizable
Product Info        customizable
Price               required
Variant Selector    required when applicable

BUY NOW             PLATFORM REQUIRED
                    cannot hide/remove/disable

Description         customizable
Related Products    customizable
```

The Buy Now CTA may not depend on a removable section being present.

A malformed design such as:

```json
{
  "templates": {
    "product": {
      "sections": []
    }
  }
}
```

must still render the platform-required purchase area and Buy Now CTA.

---

## 17. Home Page Blank-State Policy

Do not hard-lock sellers into a specific Home composition.

A seller may technically publish a very sparse Home page.

However:
- Editor should warn before publishing a nearly blank / empty Home.
- Warning is advisory unless a true platform invariant is violated.
- Product Detail purchase capability remains a hard invariant and is not advisory.

---

## 18. Error Handling

### Draft save failure
- Keep unsaved local state
- Show explicit failure
- Allow retry

### Draft conflict
- Do not overwrite newer server revision
- Show changed-elsewhere state
- Offer reload/recovery

### Publish validation failure
- Keep current Published unchanged
- Keep Draft for correction
- Show actionable validation errors

### Publish transaction failure
- Roll back atomically
- Do not mutate buyer-facing Published state

### Renderer normalization
- Old/malformed non-critical settings normalize to safe defaults
- Required commerce invariant remains enforced

---

## 19. Testing and Verification

The implementation plan must include tests for:

### Domain / schema
- Store Design schema
- Section Registry
- Per-section normalization
- Theme migration/content preservation
- Unsupported/legacy theme normalization

### Commerce invariants
- Buy Now cannot be removed through editor capability
- Buy Now cannot be disabled through malformed persisted config
- Empty product template still renders required commerce area

### Persistence
- Draft auto-save
- Revision increment
- Stale revision rejection
- Save failure recovery

### Publish / rollback
- Atomic publish
- Failed publish leaves Published untouched
- Published → Previous Published rotation
- Atomic rollback
- Rollback swap reversibility

### Security
- Owner can read/write own Draft
- Seller cannot read/write another shop's Draft
- Seller cannot publish/rollback another shop
- Buyer storefront cannot access Draft or Previous Published

### Rendering
- Editor preview and Published storefront share renderer contract
- Draft preview uses Draft
- Buyer storefront uses Published only
- Theme switch Draft does not change buyer storefront before Publish

### UI
- Desktop split editor
- Section selection synchronization
- Add section
- Reorder
- Hide/show
- Remove eligible section
- Product source Manual/Dynamic modes
- Mobile drawer/bottom-sheet behavior
- Save status
- Conflict state
- Publish validation state

### Regression
- Products admin
- Orders admin
- Shipping
- Billing/entitlements
- Existing checkout
- Existing order creation/tracking
- Existing tenant routing
- Existing theme normalization

### Final verification
- Tests
- Typecheck
- Lint
- Production build
- Responsive browser verification
- 375 / 390 / 414 mobile widths
- Desktop editor verification
- No horizontal overflow
- Existing buyer flow regression

---

## 20. Explicit Non-Goals — V1

Do not build:
- Custom HTML / JS
- Arbitrary nested page-builder engine
- Plugins/apps marketplace
- Full version history
- Editable Checkout structure
- Editable Order Success structure
- Editable Order Tracking structure
- AI-generated layouts
- Real-time multi-user collaborative editing
- Third-party theme marketplace

These require separate future specifications.

---

## 21. Migration Safety

This redesign must not require destructive Production changes during implementation.

Any schema migration must:
- Be additive first
- Preserve existing `shops.theme`
- Be testable in an isolated/disposable environment before Production
- Include rollback/recovery reasoning
- Avoid touching Production data until explicitly approved

Implementation completion does not imply Production migration approval.

---

## 22. Success Criteria

The redesign is successful when:

1. Seller perceives MiniShop as a Store Builder platform rather than a metrics dashboard.
2. Online Store / Themes / Customize form a coherent primary workflow.
3. Seller can add, reorder, configure, hide/show, and remove eligible predefined sections.
4. Draft edits auto-save safely without changing the buyer storefront.
5. Publish atomically promotes Draft to Published.
6. Previous Published can be restored safely.
7. Theme experiments never alter the live store before Publish.
8. Editor preview and buyer storefront use the same rendering contract.
9. Product Detail always retains a working Buy Now CTA.
10. Cross-tenant Store Design access is impossible under tested RLS and publish/rollback boundaries.
11. Existing Products, Orders, Checkout, Billing, Entitlements, Shipping, and tenant routing remain behaviorally intact.
12. Mobile seller editing remains usable without compressing the desktop three-pane UI.

---

## 23. Implementation Sequencing Constraint

Implementation should be decomposed into reviewable phases, with each phase producing working, testable software.

Recommended dependency order:

1. Store Design domain/schema + compatibility normalizer
2. Persistence + optimistic concurrency
3. Publish / rollback transaction boundary + RLS
4. Shared storefront renderer contract
5. Admin IA / shell
6. Themes screen
7. Desktop Store Editor shell
8. Section Registry + Commerce section library
9. Product-source controls
10. Product Detail protected commerce boundary
11. Mobile editor behavior
12. Legacy runtime migration / compatibility cutover
13. Full regression + browser verification

The implementation plan may refine task boundaries, but it must preserve these dependency constraints and the approved design contracts above.
