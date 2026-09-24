# MiniShop — Fashion Demo Store

Status: isolated full buyer-store demo. It does not replace or restyle the production storefront.

## Route inventory
- `/fashion-demo` — Home
- `/fashion-demo/products` — Product listing / category / search
- `/fashion-demo/products/:id` — Product Detail
- `/fashion-demo/cart` — Cart
- `/fashion-demo/checkout` — Checkout
- `/fashion-demo/order/:orderId` — Order Success
- `/fashion-demo/orders` — Order Tracking / Lookup
- `/fashion-demo/shipping-policy` — Shipping Policy
- `/fashion-demo/refund-policy` — Refund Policy
- `/fashion-demo/privacy-policy` — Privacy Policy
- `/fashion-demo/terms-of-service` — Terms of Service

The Fashion Demo clears the active tenant slug and uses the existing storefront data APIs, cart state, server-side shipping contract, order placement API, idempotency contract and secure order-lookup contract. Production routes under `/demo/*` and `/s/:slug/*` remain unchanged.

## Store experience
The demo includes a dedicated fashion header, mobile bottom navigation, desktop footer, mobile menu, search, horizontal category filters, responsive product listing, product detail, cart, isolated checkout, confirmation, order tracking, policy screens, loading states, empty states and error states.

## Visual system
- Canvas: `#fff9fb`
- Surface: `#ffffff`
- Primary: `#f43f70`
- Primary dark: `#c92b59`
- Blush: `#fff0f5`
- Ink: `#18131a`
- Muted: `#765b66`
- Spacing: 4 / 8 / 12 / 16 / 24 / 32
- Radius: 11 / 14 / 18 / 20 / 24 / 26
- Product cards: image-first, 2-column at 375–414px, subtle rose shadow
- Secondary CTA: outlined pink
- Primary CTA: solid pink
- Primary navigation/touch controls: 44px minimum where practical

## Responsive behavior
Home and product listing start at 2 columns on 375–414px, expand to 3 columns at small/tablet widths and 4 at large desktop widths. Product Detail becomes two columns at medium widths. Checkout becomes a content + sticky-summary layout at large widths. Mobile uses a persistent five-item navigation bar; desktop uses a restrained footer/navigation expansion.

## Figma
File: **MiniShop — Fashion Demo Store**

Created high-fidelity 390px frames for:
1. Home
2. Product Detail
3. Cart
4. Checkout

The file also contains a compact Fashion Demo design-system frame with primary/outline button components and a category-chip component. Home received a screenshot-based visual refinement pass. Further Figma read/screenshot QA is currently limited by the connected Starter-plan MCP quota, so no additional Figma screenshot claim should be made until that quota is available again.
