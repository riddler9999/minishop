# MiniShop — Fashion Demo Store

Status: isolated demo experience. It does not replace the tenant storefront.

## Route
- `/fashion-demo` — Home
- `/fashion-demo/products/:id` — Product Detail
- `/fashion-demo/cart` — Cart
- `/fashion-demo/checkout` — Checkout

The demo clears the active shop slug and uses the existing storefront data source and cart/checkout business logic. Production routes under `/demo/*` and `/s/:slug/*` are unchanged.

## Visual system
- Canvas: `#fff9fb`
- Surface: `#ffffff`
- Primary: `#f43f70`
- Primary dark: `#c92b59`
- Blush: `#fff0f5`
- Ink: `#18131a`
- Muted: `#765b66`
- Spacing: 4 / 8 / 12 / 16 / 24 / 32
- Radius: 11 / 14 / 18 / 24 / 26
- Product cards: image-first, 2-column at 375–414px, subtle rose shadow
- Secondary CTA: outlined pink
- Primary CTA: solid pink
- Touch target baseline: 44px where controls are primary/navigation controls

## Responsive behavior
The home grid starts at 2 columns, expands to 3 at small/tablet widths and 4 at large desktop widths. Product detail moves to a two-column layout at medium widths. Checkout retains the production checkout behavior and responsive form layout while inheriting the Fashion Demo shell.

## Figma
File: **MiniShop — Fashion Demo Store**

High-fidelity frames:
1. Home — 390px
2. Product Detail — 390px
3. Cart — 390px
4. Checkout — 390px

The Figma file also contains a compact Fashion Demo design-system frame with primary/outline button components and category chip component.
