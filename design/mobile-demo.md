# MiniShop — Mobile One Demo Store

Status: isolated full buyer-store demo. It does not replace the production tenant storefront or any existing demo.

## Route inventory

- `/mobile-store-demo` — Home
- `/mobile-store-demo/products` — Product listing, category filters and search
- `/mobile-store-demo/products/:id` — Product detail
- `/mobile-store-demo/cart` — Cart
- `/mobile-store-demo/checkout` — Checkout
- `/mobile-store-demo/order/:orderId` — Order success
- `/mobile-store-demo/orders` — Order tracking
- `/mobile-store-demo/shipping-policy` — Shipping Policy
- `/mobile-store-demo/refund-policy` — Refund Policy
- `/mobile-store-demo/privacy-policy` — Privacy Policy
- `/mobile-store-demo/terms-of-service` — Terms of Service

## Isolation contract

The Mobile One demo is isolated from `/demo/*`, `/fashion-demo/*`, `/furniture-demo/*`, and real tenant routes under `/s/:slug/*`.

It clears the active tenant slug, uses static mobile-product fixtures, uses `CartProvider storageScope="mobile-demo"`, stores demo orders only under `minishop:mobile-demo:orders:v1`, and does not call production order APIs or write Supabase.

## Visual direction

Primary reference: the attached premium consumer electronics mobile-store screenshot.

The reference contributes the following design language without copying its device-frame presentation:

- strong product photography as the visual anchor
- clean mobile-first hierarchy
- soft rounded product surfaces
- sparse controls with obvious touch targets
- large premium merchandising statements
- full buyer-journey consistency

Mobile One intentionally diverges from the purple reference color palette. The approved theme is premium matte black:

- canvas: #0a0a0b
- surface: #141416
- elevated surface: #1a1a1d
- primary text: #f5f5f6
- secondary text: #a8a8ad
- border: #2a2a2e
- primary action: #f5f5f6 with near-black text

Photography carries most of the visual weight. Shadows are restrained. Borders, spacing, typography and contrast define hierarchy.

## UX contract

The demo is mobile-first for 375–414 px widths, with responsive tablet/desktop expansion.

- No horizontal page overflow.
- Interactive targets are at least 44 px.
- Category and Best Selling rails are horizontally scrollable on mobile.
- Product list uses responsive 2-column mobile grid.
- Product detail includes image gallery, variant metadata, quantity, Add to Cart, Buy Now and Best Selling rail.
- Checkout validates receiver name, Myanmar phone and address.
- Empty cart and failed order lookup have explicit recovery actions.
- Mobile bottom navigation is safe-area aware.
- Buttons and forms use visible focus states.

## Demo merchandising

The catalog contains 12 believable Myanmar-market items across iPhone, Samsung Galaxy, Audio, Wearables and Accessories.

Featured IDs:
- mobile-1
- mobile-3
- mobile-5
- mobile-7
- mobile-9
- mobile-12

Best Selling IDs:
- mobile-1
- mobile-3
- mobile-5
- mobile-2
- mobile-12
- mobile-9
