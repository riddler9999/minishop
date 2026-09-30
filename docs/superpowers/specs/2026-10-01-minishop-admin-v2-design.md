# MiniShop Admin V2 Design

**Status:** Approved product direction
**Date:** 2026-10-01
**Scope:** Seller Admin Dashboard and Store Builder UX/UI redesign
**Language:** English-first seller admin UI

## 1. Goal

Redesign the complete MiniShop seller-admin experience into a focused commerce workspace for Myanmar social-commerce sellers while preserving the production backend and existing domain contracts.

Admin V2 is a frontend/product-experience redesign, not a backend rewrite.

Success means a seller can understand what needs attention, manage products and orders quickly, and customize the storefront through a professional visual editor without needing to understand MiniShop implementation details.

## 2. Non-goals and protected boundaries

Admin V2 must not unnecessarily redesign or replace:

- Supabase authentication
- tenant ownership and RLS
- checkout and order semantics
- inventory rules
- billing and entitlement enforcement
- financial idempotency
- RPC privilege boundaries
- Store Design Draft/Published lifecycle
- Store Design schema and normalization unless a concrete UI requirement proves a compatible extension is necessary
- the catalog-owned storefront renderer
- buyer storefront commerce invariants

Production `main` is not the redesign workspace. Work proceeds on an isolated feature branch and reaches Production only after regression gates, Preview QA, and explicit approval.

## 3. Product direction

Use a clean modern commerce-SaaS workspace rather than a generic card dashboard.

Visual character:

- dark charcoal navigation sidebar
- white/light-neutral working canvas
- subtle borders and restrained shadows
- compact but comfortable spacing
- purple as the primary admin action/accent family
- Lucide iconography
- strong table readability
- clear semantic success/warning/error states
- consistent 8–12 px radius family
- responsive layouts without empty decorative space

The approved visual mockup is directional rather than a pixel-for-pixel contract. Real MiniShop workflows and accessibility take precedence over decorative similarity.

## 4. Language and copy

Admin V2 is English-first.

Primary seller UI uses concise commerce terminology such as:

- Dashboard
- Orders
- Products
- Customers
- Store
- Marketing
- Analytics
- Settings
- Billing
- Action Required
- Add Product
- Customize Store
- Preview
- Publish
- Saved
- Low Stock
- Payment Pending

Buyer-facing storefront localization is outside this admin-language decision and remains governed by storefront requirements.

Avoid internal implementation terminology such as RLS, RPC, draft_revision, schemaVersion, productIds, or database field names in seller-facing copy.

## 5. Information architecture

Primary navigation:

1. Dashboard
2. Orders
3. Products
4. Customers
5. Store
   - Store Builder
   - Navigation
   - Domains
   - Policies
6. Marketing
7. Analytics
8. Settings
9. Billing

Operational selling surfaces appear before configuration surfaces.

Subscription/usage management belongs under Billing rather than competing with daily commerce operations.

Storefront configuration is grouped under Store.

## 6. Admin shell

Desktop uses a persistent dark sidebar and a light workspace.

The shell owns:

- MiniShop identity
- shop identity/context
- primary navigation
- active navigation state
- account/shop actions
- responsive navigation behavior
- consistent page title/action region

The shell must not own page-specific business logic.

On mobile, navigation becomes a deliberate drawer/sheet pattern rather than a compressed desktop sidebar.

All primary actions remain reachable at 375 px, 390 px, and 414 px widths without horizontal document overflow.

## 7. Dashboard

Dashboard is an operational home, not a chart gallery.

Top summary prioritizes:

- Sales
- Orders
- Pending Orders
- Customers

Below the summary, prioritize:

- Action Required
- Recent Orders
- Low Stock
- Sales Overview
- Orders by Status
- Store Setup / onboarding when incomplete

Empty states must use the space to provide a meaningful next action such as Add Product, Customize Store, or Configure Delivery rather than leaving large blank areas.

Detailed analysis belongs under Analytics.

## 8. Products

Products is a commerce data workspace.

Core list capabilities:

- search
- useful filters
- sort
- product status
- stock state
- category
- price
- storefront visibility
- bulk selection where supported by current domain behavior
- prominent Add Product action

Product create/edit organizes existing fields into coherent groups:

- General
- Media
- Pricing
- Inventory
- Variants where the current domain supports them
- Store Visibility

The redesign must not invent unsupported backend semantics merely to fill the UI.

## 9. Orders

Orders is the seller's primary operational workspace.

The list makes status, payment state, fulfillment state, customer identity, amount, and recency easy to scan.

Order detail consolidates:

- order summary
- customer information
- delivery information
- payment verification state
- order items
- status actions allowed by the existing domain
- timeline/history where supported

The UI must map to the existing order-state machine rather than inventing a visually convenient but false workflow.

## 10. Customers

Customers provides a practical seller view based on data MiniShop can reliably derive.

Prioritize:

- customer identity
- total orders
- total spend where derivable from authoritative order data
- last order
- useful status/context

Do not introduce a new CRM subsystem as part of Admin V2.

## 11. Analytics

Analytics owns detailed performance exploration so Dashboard can remain operational.

Use only metrics supported by authoritative MiniShop data. Do not fabricate precision or introduce tracking infrastructure solely for decorative charts.

Charts must have readable labels, meaningful empty states, and accompanying numeric context.

## 12. Settings and Billing

Settings contains shop/platform configuration that does not belong in daily operational flows.

Billing contains:

- current plan
- usage/entitlement information
- renewal/upgrade surfaces supported by existing billing behavior
- Extra Orders where supported

Admin V2 must preserve existing entitlement and financial enforcement; UI state is never treated as the security boundary.

## 13. Store Builder V2

Store Builder is a dedicated editor application, not a normal dashboard settings page.

Entering the builder transitions from the normal admin shell into a focused full-screen editing workspace.

### Desktop layout

Three primary regions:

- Left: Pages + Sections
- Center: live storefront canvas
- Right: contextual Inspector

Top toolbar:

- Back
- page/template selector
- Desktop / Mobile viewport
- Undo / Redo when supported by the editor state contract
- save state
- Preview
- Publish

The center canvas must use the same catalog-owned storefront rendering contract as the buyer storefront. Admin V2 must not create a second storefront implementation.

### Selection model

Selecting a section in the tree selects the matching canvas region.

Selecting an editable canvas region selects the corresponding tree entry and opens its contextual settings.

Selection remains stable-ID based.

### Contextual Inspector

The Inspector shows controls relevant to the selected section rather than exposing a generic settings form.

Examples:

Hero:
- heading
- supporting text
- CTA content/link where supported
- image/media
- alignment
- spacing
- background/style controls supported by the Store Design contract

Featured Products:
- product source
- category/selection where supported
- product count
- layout
- card presentation controls supported by the contract
- visibility controls that do not violate platform commerce invariants

Global theme settings may expose supported design tokens such as colors, typography, radius, button style, card style, and section spacing. Existing theme families become useful starting presets rather than the end of customization.

Product Detail Buy Now remains platform-required and cannot be hidden, removed, or disabled.

### Persistence

Preserve the existing Draft/Published lifecycle.

The UI visibly distinguishes:

- unsaved/dirty
- saving
- saved
- retry/error
- conflict/stale draft
- published/live state where relevant

Autosave never means Publish.

Publish is explicit and atomic according to the existing Store Design lifecycle.

### Mobile Store Builder

Do not shrink the desktop three-pane layout.

Mobile is preview-first:

- storefront preview occupies the primary surface
- tapping an editable section selects it
- section navigation uses a drawer/sheet
- contextual editing uses a bottom sheet/drawer
- save state remains visible/reachable
- Preview and Publish remain reachable

Verify at 375 px, 390 px, and 414 px.

## 14. Design system

Admin V2 should establish reusable admin primitives rather than styling each page independently.

Required primitive families include:

- navigation item
- page header
- primary/secondary/destructive buttons
- KPI/stat card
- data table shell
- status badge
- filter/search controls
- form field groups
- empty state
- loading/skeleton state
- error state
- modal/drawer/sheet
- toast/feedback

Reuse existing accessible primitives and Lucide icons where practical. Do not add a new UI dependency unless the implementation plan proves it materially reduces complexity without compromising the current stack.

## 15. Responsive behavior

Admin V2 is responsive by design, not by desktop compression.

Acceptance widths include at least:

- 375 px
- 390 px
- 414 px
- normal laptop viewport
- wide desktop viewport

Requirements:

- no document-level horizontal overflow
- no clipped primary actions
- tables have an intentional narrow-screen representation
- forms remain readable
- navigation remains reachable
- dialogs/sheets have reachable close controls
- Store Builder remains usable independently from admin shell behavior

## 16. Accessibility

Target WCAG 2.2 AA for normal admin interaction patterns.

Requirements include:

- visible focus states
- semantic labels
- keyboard-operable primary controls
- status is not communicated by color alone
- accessible modal/drawer/sheet behavior
- reasonable touch targets on mobile
- reduced-motion support
- readable contrast

## 17. Error, loading, and empty states

Every major Admin V2 surface must intentionally define:

- initial loading
- empty data
- recoverable request failure
- authorization/entitlement denial where relevant
- destructive-action confirmation where relevant
- mutation success/failure feedback

Do not hide backend failures behind indefinite spinners or generic silent failures.

Existing typed/domain error mapping should be reused rather than replaced with page-specific ad-hoc strings.

## 18. Security and data integrity

The redesign must not weaken production controls.

Preserve and regression-test:

- tenant isolation
- RLS boundaries
- server-authoritative pricing and checkout
- inventory invariants
- financial idempotency
- billing/entitlement enforcement
- RPC privilege hardening
- protected Store Design commerce invariants

Frontend hiding is never authorization.

## 19. Delivery strategy

Implement incrementally on `feat/admin-v2-redesign` or task branches derived from it.

Recommended sequence:

1. Admin shell + design primitives
2. Dashboard
3. Products
4. Orders
5. Customers
6. Analytics
7. Settings + Billing
8. Store navigation surfaces
9. Store Builder V2 shell/interactions
10. responsive/mobile pass
11. accessibility/error-state pass
12. regression/security verification
13. Vercel Preview QA
14. explicit owner approval
15. merge/release through the normal production gate

Each stage must preserve working production-domain behavior and should be independently reviewable.

## 20. Acceptance criteria

Admin V2 is ready for merge only when:

- English-first admin IA is consistent across all redesigned surfaces
- admin pages share one coherent design system
- Dashboard prioritizes operations and actionable states
- Products and Orders are efficient data workspaces
- Store configuration is grouped coherently
- Store Builder behaves as a focused editor application
- Store Builder uses the shared storefront renderer
- Draft/Published behavior remains correct
- Buy Now invariant remains enforced
- responsive acceptance passes at 375/390/414 px and desktop targets
- loading, empty, error, and mutation feedback states are deliberate
- accessibility checks pass for core workflows
- existing auth/RLS/checkout/inventory/billing/security contracts remain green
- full repository-supported CI/regression gates pass
- a Vercel Preview is manually reviewed and approved before Production merge
