# MiniShop Store Builder Design Contract

**Status:** Durable implementation contract  
**Source of truth:** `docs/superpowers/specs/2026-09-26-minishop-store-builder-design.md`  
**Applies to:** MiniShop-owned seller admin, Themes, and Store Builder surfaces

## 1. Design ownership

MiniShop owns platform chrome; the seller owns storefront presentation.

- Admin/editor chrome uses the existing MiniShop platform tokens and neutral commerce-workspace styling.
- Storefront preview is theme-driven and must not inherit admin visual choices that alter buyer rendering.
- Reuse existing shared tokens, focus primitives, spacing, icon family, and modal/drawer behavior before adding one-off values.
- Do not introduce a new design dependency for Store Builder V1.

## 2. Admin information architecture

Desktop seller navigation is:

1. Home
2. Orders
3. Products
   - All Products
   - Categories
   - Inventory
4. Online Store
   - Themes
   - Navigation
   - Store Settings
5. Marketing
6. Analytics
7. Shipping
8. Settings

The current `AdminLayout` remains the platform chrome ownership seam. Tasks may refactor its navigation structure, but must not create a competing admin shell.

Home is an operational workspace, not a chart-first dashboard. Prioritize shop setup/store health, orders needing action, inventory warnings, quick actions, and a concise business summary. Detailed analytics belongs under Analytics.

## 3. Themes

`Online Store → Themes` is the primary storefront-building entry.

The screen must show:

- Current Published theme prominently.
- `Customize` as the primary action.
- Available theme families below.
- Alternate theme selection creates/opens a Draft only; buyer traffic continues to see Published until explicit Publish.

Canonical theme families remain:

- Clean & Minimal
- Street & Bold
- Soft & Elegant
- Grid & Catalog
- Dark Modern

Theme families are aesthetic systems, never product-niche templates.

## 4. Desktop Store Builder

At desktop widths the editor is a three-pane split view:

- Left: Section Tree
- Center: live storefront preview
- Right: Inspector

The persistent editor top bar provides:

- Exit
- Template selector
- Undo / Redo
- Desktop / Mobile preview switch
- Preview
- Draft save state
- Publish

The preview consumes the real catalog-owned storefront renderer. The editor may add selection affordances around that renderer but must not maintain a second storefront implementation.

### Pane behavior

- Section Tree and Inspector are fixed editor chrome; the center preview owns the flexible remaining width.
- Side panes may scroll independently from preview content.
- The center surface must not force the application viewport to overflow horizontally.
- Long Burmese labels wrap; they must not expand pane width.
- Pane controls retain a minimum 44×44 px interactive target where applicable.

## 5. Selection contract

Every editable section has an explicit stable section ID.

- Selecting a Section Tree row selects the same preview region and opens its Inspector.
- Selecting an editable preview region selects the corresponding tree row and opens its Inspector.
- Selection is ID-based, not array-index-based.
- Reorder must preserve section IDs.
- Removing a selected section clears or deterministically moves selection to a safe neighbor.
- Required platform commerce UI is not represented as a removable seller section.

## 6. Section controls

Eligible sections may expose:

- drag reorder
- show / hide
- edit
- remove

A control is shown only when the domain registry capability allows it.

Protected commerce content must not expose destructive controls. Product Detail Buy Now is platform-required and may never be hidden, removed, or disabled.

## 7. Inspector

The Inspector edits typed section settings. Raw JSON editing is not part of V1.

Organize controls by the smallest useful groups:

- Content
- Style
- Layout
- Product source, where supported

Use explicit labels and inline validation. Seller copy defaults to natural Burmese. Internal schema names such as `productIds`, `draft_revision`, or `schemaVersion` are never shown as UI copy.

## 8. Draft save and conflict states

The editor visibly represents exactly these persistence states:

- **Saving…** — a Draft request is in flight.
- **Saved** — the latest local committed state matches the server revision.
- **Changes not saved — Retry** — persistence failed; local edits remain intact and Retry is available.
- **Conflict / stale Draft** — server rejected an older expected revision; do not silently retry as last-write-wins.

Conflict UI must explain that the design changed elsewhere and provide a deliberate reload/recovery path. Publish is never implied by save.

## 9. Publish behavior

Publish is an explicit primary action and never an autosave side effect.

- Publish acts on the server-validated Draft revision.
- A nearly blank Home may show an advisory warning.
- A true commerce invariant failure blocks Publish.
- Publish failure leaves current Published unchanged and keeps Draft available for correction.
- Theme change remains Draft-only until Publish succeeds.

## 10. Mobile Store Builder

Do not compress the desktop three-pane editor into a narrow viewport.

At mobile widths:

- Preview is the primary surface.
- Section Tree opens as a modal navigation drawer.
- Inspector opens as a bottom sheet/drawer.
- Tapping an editable preview region selects it and opens the relevant editing surface.
- Publish and current save state remain reachable without switching to desktop.
- Closing drawer/sheet returns focus to the control that opened it whenever practicable.
- Escape/backdrop/explicit close behavior follows existing accessible modal primitives.

## 11. Responsive acceptance rules

Store Builder must be checked at **375 px, 390 px, and 414 px** viewport widths.

At each width:

- no document-level horizontal overflow
- no clipped Publish action
- no unreachable save status
- no permanently off-screen close control
- Burmese text wraps without forcing fixed-width expansion
- preview remains usable independently from overlay editor chrome

Desktop acceptance also includes a normal laptop viewport and a wide desktop viewport.

## 12. Accessibility

- Visible `:focus-visible` indication on all keyboard-operable editor controls.
- Minimum 44×44 px touch target for primary mobile controls.
- Normal text contrast targets WCAG 2.2 AA.
- Do not communicate Saving, Saved, Error, Conflict, selected, hidden, or published state with color alone.
- Drawers, sheets, dialogs, and popovers have an accessible name and predictable focus behavior.
- Reorder has a keyboard-accessible alternative; drag-only interaction is insufficient.
- Respect `prefers-reduced-motion`.
- Avoid tight Myanmar line-height and tracking.

## 13. Token and component policy

Reuse first:

- MiniShop platform color/token system from existing shared styles and brand guidance.
- Existing Lucide icon family.
- Existing format/class helpers.
- Existing focus/modal/drawer primitives.
- Existing `ProductCard`, shop-aware navigation, and catalog commerce components in storefront rendering.

Do not create a second ProductCard, cart implementation, admin shell, or storefront renderer for the editor.

New one-off values are allowed only when no existing semantic token/component fits and the value is local to editor layout mechanics.

## 14. Storefront isolation

Admin/editor visual changes must not redesign live tenant storefronts outside the Store Design contract.

- Buyer storefront styling is driven by normalized Published Store Design.
- Editor preview styling is driven by normalized Draft Store Design.
- Both use the same catalog-owned renderer.
- Existing checkout/order/tracking structures remain platform-controlled.
- Store Design must not weaken tenant routing, RLS, plan rules, pricing, inventory, order creation, checkout, or payment semantics.

## 15. Copy rules

Seller-facing editor/admin copy defaults to Burmese unless an existing approved product decision explicitly uses another language.

Copy characteristics:

- short
- action-oriented
- non-technical
- explicit about Draft vs Published
- explicit when an action is destructive or affects the live store

Do not expose implementation terminology when a seller-oriented phrase exists.

## 16. Verification checklist

Before Store Builder UI work is considered complete:

- Admin IA matches this contract.
- Themes clearly distinguishes Published from Draft.
- Desktop split view behaves as specified.
- Section Tree ↔ preview selection is synchronized by ID.
- Inspector is typed and contains no raw JSON editor.
- Saving / Saved / Retry / Conflict are visible states.
- Publish remains explicit.
- Mobile uses preview-first drawer/sheet behavior.
- Keyboard/focus behavior is verified.
- 375/390/414 px have no horizontal overflow.
- Preview and buyer storefront converge on the same renderer.
- Buy Now remains functional even with malformed design input.
