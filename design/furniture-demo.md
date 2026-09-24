# MiniShop — Rangoon Furniture Demo Store

Status: isolated full buyer-store demo. It does not replace the production tenant storefront or the existing Fashion Demo.

## Route inventory

- `/furniture-demo` — Home
- `/furniture-demo/products` — Product listing, category filters and search
- `/furniture-demo/products/:id` — Product detail
- `/furniture-demo/cart` — Cart
- `/furniture-demo/checkout` — Demo checkout
- `/furniture-demo/order/:orderId` — Demo order success
- `/furniture-demo/orders` — Demo order lookup
- `/furniture-demo/shipping-policy` — Shipping Policy
- `/furniture-demo/refund-policy` — Refund Policy
- `/furniture-demo/privacy-policy` — Privacy Policy
- `/furniture-demo/terms-of-service` — Terms of Service

The Furniture Demo is intentionally isolated from `/demo/*`, `/fashion-demo/*` and real tenant routes under `/s/:slug/*`. It clears the active tenant slug, uses its own static furniture catalog, its own scoped cart storage, and a demo-only local order store.

## Visual direction

The visual source of truth is the approved Rangoon Furniture mobile Home reference from the design session: no device mockup, warm neutral canvas, image-first furniture merchandising, restrained brown accent, generous whitespace and very little decorative chrome.

North Star: a calm Pinterest-style furniture catalog that feels editorial but remains a practical commerce UI.

### Palette

- Canvas: `#f7f3ed`
- Surface: `#fffdf9`
- Ink: `#171a18`
- Muted: `#6f706b`
- Border: `#e8e1d8`
- Accent: `#a66b3f`
- Accent dark: `#7f4f2d`
- Sage support: `#7d8874`

### Shape and density

- Inputs/search: 14–18px radius
- Product cards: 20px radius
- Hero / major panels: 24–28px radius
- Primary commerce buttons: 14–16px radius
- Category imagery: compact square tiles with 20px radius
- Mobile product grid: two columns
- Tablet: three columns
- Large desktop: four columns

Avoid glossy gradients, purple/pink MiniShop platform styling, stacked cards inside cards, heavy shadows, and oversized UI chrome. Product photography should carry most of the visual weight.

## Currency and copy

Furniture prices are whole-kyat MMK and are rendered explicitly as `680,000 MMK`, never with a dollar sign or `K` prefix.

The demo brand is **Rangoon Furniture**. English is used for this demo's UI labels while product and commerce behavior remains Myanmar-market oriented.

## Demo data and safety

This route is a demonstration only:

- Product images use externally hosted Unsplash references.
- Demo orders are stored only in browser local storage.
- Demo order lookup requires both order number and phone number.
- The route does not call production order APIs and does not write to Supabase.
- No real payment is captured.
- Production tenant storefront behavior, billing, RLS and checkout contracts remain unchanged.

## Accessibility and responsive contract

- 44px minimum primary touch targets.
- Native button/link semantics for actions/navigation.
- Visible focus states.
- Search includes an explicit clear action when non-empty.
- Checkout uses `noValidate` and app-owned inline validation.
- Textareas use `resize: none`.
- Mobile bottom navigation is persistent; desktop uses the restrained footer.
- Content must remain usable at 375–414px widths without horizontal page scrolling.
