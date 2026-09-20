# Mini Shop — Design System

Source of truth for the visual language across the buyer storefront (`/s/<slug>`) and the
seller admin console (`/admin`). Grounded in the current implementation
(`src/index.css`, `src/shared/lib/brand.ts`, `src/features/*/components/` + `src/shared/ui/`) plus the reference mockup that
prompted this doc (`docs/design/` is not used — this repo keeps design docs at `design/`,
parallel to `PROJECT.md`).

Read `CLAUDE.md` and `PROJECT.md` first if you haven't — this file assumes that context
(data-layer switch, shop-slug tenancy, plan gating) and does not repeat it.

> **Status note:** the reference mockup shows some screens and admin nav items that do not
> exist in the codebase yet (marked **Proposed** below). This doc records the target design
> language for all of them, but treat the "Proposed" items as backlog, not shipped behavior —
> check `src/features/*/pages/` and `src/features/admin/components/AdminLayout.tsx` before assuming a screen exists.

---

## 1. Design principles

1. **TikTok in-app WebView first.** No native app chrome, no assumption of persistent storage
   (see `shopContext.ts`) or a reliable file picker (`uploadSlip()` is a no-op — see
   `supabase/README.md`). Every screen must work one-handed, on a mid-range Android, inside a
   host app's embedded browser.
2. **Localized copy, English code.** Buyer storefront copy remains Burmese-first. Seller-facing screens follow their recorded product decision; the Admin analytics dashboard is English-only per D50. (`.my` in `index.css` remains available where Burmese script is used.)
   Mockups and design docs may use English placeholders for speed. Shipped UI must follow the language decision recorded for that surface. See `orderStatus.ts` for canonical status labels; do not invent parallel status semantics.
3. **Product-neutral chrome, tenant-specific storefront.** `src/shared/lib/brand.ts` names the SaaS
   product itself (fallback logo/name for the demo shop and admin chrome); a real tenant's
   storefront shows the seller's own shop name/logo via `resolveShop()`, not these constants.
   Never hardcode "Mini Shop" branding inside a tenant-facing storefront component.
4. **Plan gating hides, never deletes.** Anything gated by `usePlan()` /
   `<PlanGate>` must degrade to an upsell, not a dead end — a downgraded shop's data must
   still exist and reappear on upgrade (`CLAUDE.md` "Plan gating" section).
5. **Mobile-first, then scale up.** Build the 375–414px layout first; treat tablet/desktop as
   a progressive enhancement of the same component, not a separate design.

---

## 2. Design tokens (current implementation)

Defined in `src/index.css` under `@theme` (Tailwind v4, no `tailwind.config.js`). Token
*names* are inherited from an earlier maroon theme this app was cloned from — only the
*values* changed, so components never needed a class rewrite. Keep that naming stable; add
new roles rather than repurposing `brand`/`cream`/`gold`/`ink` for something unrelated.

| Role | Token | Value | Use |
|---|---|---|---|
| Brand (primary) | `--color-brand-500` | `#fe2c55` | Primary CTA, active nav, price accents |
| Brand range | `--color-brand-{50…900}` | pink/magenta ramp | Hover/active/disabled states, badges |
| Surface | `--color-cream-{50,100,200}` | cool porcelain whites | Page background, card fills, dividers |
| Accent | `--color-gold-{400,500,600}` | cyan (`#25f4ee` at 500) | Secondary accents, COD status badge |
| Text (primary) | `--color-ink` | `#1c2033` | Body text, headings |
| Text (muted) | `--color-ink-soft` | `#5b6178` | Secondary text, placeholders, cancelled state |

Typography:

| Role | Token | Stack |
|---|---|---|
| Display | `--font-display` | Space Grotesk → Padauk → system-ui |
| Myanmar body | `--font-myanmar` | Padauk → Noto Sans Myanmar → system-ui (`body` default) |
| Latin body | `--font-sans` | Inter → Padauk → system-ui |

Shared interaction patterns already in `index.css`: `.card-lift` (hover translate + shadow,
used by `ProductCard`), `.fade-up` (mount-in animation), `.no-scrollbar` (horizontal
carousels). Reuse these utility classes before adding new ones.

---

### Admin analytics surface

The seller dashboard uses a mobile-first analytics treatment: pale cool-gray canvas, white cards,
pink/cyan/violet/orange semantic icon chips, large compact metrics, one simple 7-day trend chart,
and bottom navigation on narrow screens. This is intentionally denser and more app-like than the
buyer storefront. Keep one-handed touch targets at 44px+, avoid decorative motion, and keep charts
secondary to actionable order/stock lists. Admin analytics dashboard copy is English-only (D50). Shipping is intentionally absent from the redesigned admin navigation.

## 3. Screen inventory

### 3.1 Storefront (buyer-facing, mounted under both `/*` demo and `/s/:slug/*` — see
`CLAUDE.md` "Shop slug" section for why routes are relative)

| Screen | Component | Status |
|---|---|---|
| Home | `src/features/catalog/pages/Home.tsx` | Shipped |
| Product listing | `src/features/catalog/pages/Products.tsx` | Shipped |
| Product detail | `src/features/catalog/pages/ProductDetail.tsx` | Shipped |
| Cart (drawer) | `src/features/cart/components/CartDrawer.tsx`, `src/features/cart/pages/Cart.tsx` | Shipped |
| Checkout | `src/features/checkout/pages/Checkout.tsx` | Shipped |
| Order success | `src/features/checkout/pages/OrderSuccess.tsx` | Shipped |
| Order lookup (order no. + phone) | `src/features/orders/pages/OrderLookup.tsx` | Shipped |
| Explore / video feed | — | **Proposed.** Buyers are anonymous with no session (§ "Security model" in `CLAUDE.md`) — a persistent "For You" feed needs either a stateless per-visit ranking or a rethink of that constraint. Needs a decision entry in `PROJECT.md` before building. |
| "My Orders" (list view) | — | **Proposed, and in tension with the security model.** `lookup_order()` requires `(shop_slug, order_no, phone)` together *by design*, specifically to stop buyer order-history enumeration (`CLAUDE.md`). A "My Orders" list implies a persistent identity the anonymous-buyer model doesn't have today. Do not build this as a simple list without re-reading that constraint and getting an explicit decision — it's the kind of change that needs a `PROJECT.md` entry (would be D34+), not a silent addition. |

### 3.2 Admin console (`/admin/*`, real Supabase auth required — no offline fallback)

| Screen | Component | Status |
|---|---|---|
| Overview / dashboard | `src/features/admin/pages/Dashboard.tsx` | Shipped |
| Products | `src/features/catalog/pages/AdminProducts.tsx` | Shipped |
| Orders (list + detail, payment verification) | `src/features/orders/pages/AdminOrders.tsx` | Shipped |
| Shipping zones | `src/features/shipping/pages/AdminShipping.tsx` | Shipped (Business plan / advanced-shipping gated; intentionally not linked from redesigned admin navigation per D50) |
| Settings | `src/features/shop/pages/Settings.tsx` | Shipped |
| Login / Onboarding | `src/features/auth/pages/Login.tsx`, `Onboarding.tsx` | Shipped |
| Customers (dedicated list) | — | **Proposed.** Not in `AdminLayout`'s nav today. |
| Marketing | — | **Proposed.** Not in `AdminLayout`'s nav today. |

Current redesigned admin nav (`src/features/admin/components/AdminLayout.tsx`, English labels per D50): Home · Products · Orders · Settings. Shipping is intentionally not linked from this navigation. New nav items must follow the screen-specific language decision, use one `lucide-react` icon, and preserve applicable plan gating.

Payment verification (Orders detail: payment slip view, Verify/Reject) must stay aligned
with the manual-verification model in `CLAUDE.md` — last-5-digits matching, no slip upload
pipeline. Don't design a screen that implies automatic payment confirmation.

---

## 4. Store themes

The public storefront (`Home`, `Products`, `ProductDetail`, `Cart`, `Checkout`) currently
ships one fixed visual theme — the pink/porcelain/cyan tokens in §2. A seller-selectable
**store theme** (so a food seller doesn't look like a fashion seller) is a **proposed**
feature; per-theme specs live in `design/themes/`:

- `design/themes/minimal.md` — Minimal (Default): the current pink/porcelain look.
- `design/themes/bold.md` — Bold: dark/high-contrast variant of the same brand palette.
- `design/themes/classic-shop.md` — Classic Shop: warm, food/grocery-oriented palette.

If this gets built, follow the existing `shop.plan` pattern (`CLAUDE.md` "Plan gating"
section) rather than inventing a new mechanism: a `shop.theme` DB column, resolved
frontend-only (RLS unaffected), defaulting to Minimal. That needs its own migration +
`database.types.ts` regen + a `PROJECT.md` decision entry — out of scope for this doc, which
only records the target visual language.

---

## 5. Component patterns to reuse

- `ProductCard` (`src/features/catalog/components/ProductCard.tsx`) — the only place that should render a
  product tile; don't hand-roll another one. Navigates via `<ShopLink>`, never a bare
  react-router `Link` (`CLAUDE.md` "Shop slug" section explains why relative links break here).
- `CartDrawer` — slide-over cart, not a route change; keep cart mutations optimistic against
  `src/features/cart/state.tsx`.
- `AdminLayout` — the only admin chrome; nav array at the top of the file is the single
  source of truth for admin nav items and their icons.
- `PlanGate` — wrap any Business-only admin feature in this rather than branching on
  `usePlan()` ad hoc, so upsell copy stays consistent.
- Status badges — always read color/label from `orderStatus.ts`'s `ORDER_STATUS` /
  `statusMeta()`, never hardcode a status string or color class inline.

---

## 6. Accessibility

- Contrast: brand-500 (`#fe2c55`) on `cream-50`/white passes AA for large text/UI components;
  verify body-text-sized usage against WCAG 2.2 AA (4.5:1) before shipping, especially for the
  Bold (dark) theme's text-on-dark combinations.
- Touch targets: minimum 44×44px, per the mobile-first / one-handed-WebView principle above —
  this matters more here than on a general website since there is no mouse fallback.
  `useModalA11y.ts` already handles focus trapping for modals/drawers — reuse it for any new
  overlay rather than re-implementing focus management.
- Reduced motion: respect `prefers-reduced-motion` for `.fade-up`/`.card-lift`-style
  animations before adding a new motion-heavy pattern.

This repo also vendors third-party UI/UX and accessibility skills for Claude Code sessions
(see `.claude/skills/` and `.claude/settings.json`) — load them when doing real design work
on these screens rather than re-deriving guidelines from scratch.
