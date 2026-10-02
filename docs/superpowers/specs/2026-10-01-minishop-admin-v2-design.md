# MiniShop Admin V3 Design

**Status:** Approved product direction — supersedes conflicting Admin V3 IA
**Date:** 2026-10-03
**Scope:** Seller Admin Dashboard and Store Builder UX/UI redesign
**Language:** English-only seller admin UI

## 1. Goal

Redesign the complete MiniShop seller-admin experience into a focused commerce workspace for Myanmar social-commerce sellers while preserving the production backend and existing domain contracts.

Admin V3 is a frontend/product-experience redesign, not a backend rewrite.

Success means a seller can understand what needs attention, manage products and orders quickly, and customize the storefront through a professional visual editor without needing to understand MiniShop implementation details.

## 2. Non-goals and protected boundaries

Admin V3 must not unnecessarily redesign or replace:

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
- charcoal as the structural primary and Mint as the restrained admin interaction/accent family
- Lucide iconography
- strong table readability
- clear semantic success/warning/error states
- consistent 8–12 px radius family
- responsive layouts without empty decorative space

The approved visual mockup is directional rather than a pixel-for-pixel contract. Real MiniShop workflows and accessibility take precedence over decorative similarity.

## 4. Language and copy

Admin V3 is English-first.

Primary seller UI uses concise commerce terminology such as:

- Dashboard
- Orders
- Products
- Customers
- Store
- Analytics
- Settings
- Action Required
- Add Product
- Customize Store
- Preview
- Publish
- Saved
- Low Stock
- Payment Pending

Marketing is removed from seller-admin navigation. Billing is not a primary navigation destination; plan and billing management lives inside Settings.

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
   - Themes
6. Analytics
7. Settings

Operational selling surfaces appear before configuration surfaces.

Marketing is intentionally omitted from Admin V3 navigation.

Settings is the configuration hub. Plan and billing, Domains, Policies, and other store/account configuration belong inside Settings rather than occupying top-level navigation.

Store is reserved for storefront-design concerns such as Store Builder and Themes.

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

Products is a Shopify-inspired commerce workspace while retaining MiniShop domain semantics.

Core list capabilities:

- All Products workspace
- search
- useful filters and sort
- product status
- inventory/stock state
- category
- price
- storefront visibility
- bulk selection/actions only where current domain behavior safely supports them
- prominent Add Product action
- CSV import/export only if current implementation supports it truthfully

Product create/edit is organized into coherent groups:

- General
- Media
- Pricing
- Inventory
- Variants only where supported by the current domain/schema
- Product Organization
- Store Visibility

Product Organization may expose Categories, Collections, and Tags only when the current schema/API supports them. Admin V3 must not create fake functional UI for unsupported concepts.

The redesign must preserve existing product create/update/delete, media handling, plan limits, storefront rendering contracts, and tenant isolation.

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

Seller-facing Order stages are standardized to:

1. Pending
2. Confirmed
3. Delivered
4. Return

The intended presentation workflow is `Pending → Confirmed → Delivered → Return`.

`Return` is available only after `Delivered` unless the canonical backend state machine explicitly requires a different safe transition.

Admin V3 must not blindly replace database status values. Before implementation, inspect the canonical order state machine and introduce a small Order Status presentation mapping module when needed. The UI consumes presentation stages and allowed actions through that seam; backend/RPC validation remains authoritative.

Status changes require a confirmation interaction. Show status history/audit information only where authoritative data exists; do not fabricate history.

## 10. Customers

Customers provides a practical seller view based on data MiniShop can reliably derive.

Prioritize:

- customer identity
- total orders
- total spend where derivable from authoritative order data
- last order
- useful status/context

Do not introduce a new CRM subsystem as part of Admin V3.

## 11. Analytics

Analytics owns detailed performance exploration so Dashboard can remain operational.

Use only metrics supported by authoritative MiniShop data. Do not fabricate precision or introduce tracking infrastructure solely for decorative charts.

Charts must have readable labels, meaningful empty states, and accompanying numeric context.

## 12. Settings Hub

Settings is a Shopify-inspired configuration hub adapted to MiniShop's actual capabilities.

Settings groups may include, when supported by existing backend/domain behavior:

- Store details
- Plan and billing
- Users and permissions
- Payments
- Checkout
- Shipping and delivery
- Taxes / legal configuration where applicable
- Domains
- Policies
- Notifications
- Customer privacy
- Files / media where supported

Plan and billing is moved into Settings and is no longer a top-level navigation item.

Domains and Policies are moved from Store into Settings.

Do not surface a setting as functional merely because Shopify has it. Unsupported capabilities must not appear as working controls. Existing authorization, entitlement, financial idempotency, and RLS enforcement remain authoritative; frontend visibility is never the security boundary.

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

The center canvas must use the same catalog-owned storefront rendering contract as the buyer storefront. Admin V3 must not create a second storefront implementation.

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

Admin V3 should establish reusable admin primitives rather than styling each page independently.

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

Admin V3 is responsive by design, not by desktop compression.

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

Every major Admin V3 surface must intentionally define:

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

Implement incrementally on `feature/admin-v3-shopify-inspired` or short-lived task branches derived from it.

Recommended sequence:

0. reconcile Admin V3 spec/plan and existing implementation state
1. Admin shell + design primitives
2. operational Dashboard
3. Shopify-inspired Products workspace
4. Orders workspace with Pending / Confirmed / Delivered / Return presentation mapping
5. Customers
6. Analytics
7. Settings Hub, including Plan and billing, Domains, and Policies
8. Store / Store Builder consistency
9. responsive/mobile pass
10. accessibility/error-state pass
11. regression/security verification
12. Vercel Preview QA
13. explicit owner approval
14. merge/release through the normal production gate

Each stage must preserve working production-domain behavior and should be independently reviewable.

## 20. Acceptance criteria

Admin V3 is ready for merge only when:

- English-only admin IA is consistent across all redesigned surfaces
- Marketing is absent from primary navigation
- Billing, Domains, and Policies are correctly housed in Settings
- Products follows the approved Shopify-inspired workspace without inventing unsupported domain features
- Orders presents Pending, Confirmed, Delivered, Return through a verified mapping to the canonical backend state machine
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

## 21. Approved visual-system amendment (2026-10-02)

This amendment confirms Section 3's Charcoal + Mint direction and clarifies Sections 6, 14–16. Preserve all other Admin V3 domain and security constraints.

### Admin-only palette and semantics

- Deep sidebar: `#1F2421`
- Admin accent Mint: `#35B99D`; deep/hover Mint: `#29957F`
- Mint accent: `#8FD7C6`; soft selected surface: `#D8F1EA`
- Canvas Off-White: `#F4F7F5`; card surface: `#FFFFFF`
- Ink: `#1F2421`; secondary text: `#66706C`; border: `#E1E7E3`
- Success, warning, error, and informational status are separate semantic roles; do not equate Mint with success. Check WCAG 2.2 AA contrast for every text/state combination and adjust token variants when necessary.
- MiniShop now uses Charcoal + Mint as the canonical platform identity. Mint is an interaction/intelligence accent, not a status color. Scope admin tokens to the admin shell so storefront themes and Store Builder preview cannot inherit them accidentally.
- Prefer semantic admin tokens over page-specific hard-coded slate/violet classes. Do not add a second component library or decorative glassmorphism.

### Navigation

Desktop retains the persistent sidebar. Narrow screens use top bar plus accessible hamburger drawer as the single navigation source. Remove seller-admin mobile bottom tabs, duplicate nav state, and their compensating page padding across affected routes. Do not remove Store Builder's contextual bottom sheet; it is an editor, not navigation. Preserve keyboard focus management, close control, escape/backdrop dismissal, and active-route indication.

### Typography and spacing

Use Inter with Noto Sans Myanmar fallback where Burmese copy appears. Establish these admin defaults, with responsive adjustments only when content requires them:

| Role | Font size | Line height | Weight |
| --- | ---: | ---: | ---: |
| Page title | 24px | 32px | 700 |
| KPI value | 24px | 32px | 700 |
| Section heading | 18px | 28px | 600 |
| Body and navigation | 14px | 22px | 400–500 |
| Secondary text | 13px | 20px | 400 |
| Metadata | 12px | 18px | 400 |

Do not shrink metadata below 12px. Allow Burmese multi-line content approximately 24–26px line-height at 14px font where visual QA shows glyph collisions or poor readability. Use mobile page padding 16px, desktop page padding 24px, section gaps 24px, card gaps 12–16px, card padding 16px mobile / 20px desktop, form field gaps 16px, and 44px minimum interactive touch targets. Keep row heights content-driven (typically 48–56px); allow expansion for Burmese or wrapped content.

### Dashboard and delivery

Preserve the existing operational hierarchy and supported data; do not invent comparison percentages or trends. The current date-window label must be visibly static unless backed by working filtering. Retain restrained transitions (roughly 150–220ms) and reduced-motion support. QA at 375/390/414px, tablet, laptop, and wide desktop; verify no horizontal overflow, text truncation of critical values, navigation duplication, or status conveyed by color alone.

Implementation is an incremental follow-on to the existing Admin V3 plan. Audit the current PR head before edits and avoid repeating completed tasks. Tests must cover nav removal, token scoping, and responsive/accessibility regressions. No production deployment, migrations, or PR merge without separate release approval.
