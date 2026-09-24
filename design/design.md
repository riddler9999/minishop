# MiniShop MM — Brand & Design System

> **Status: CONFIRMED — Brand Foundation v1**
>
> Brand: **MiniShop MM**  
> Tagline: **One Place to Sell Everywhere.**  
> Positioning: **Myanmar-first social commerce platform**

This document is the source of truth for the MiniShop MM brand identity and product visual language. It governs the MiniShop platform surfaces (marketing, authentication, onboarding, seller admin, pricing and MiniShop-owned communication) while preserving tenant ownership of public storefront branding.

Read `CLAUDE.md` and `PROJECT.md` for product architecture, tenancy, plan gating, security and implementation decisions. Product truth always wins over decorative design.

---

## 1. Brand foundation

### 1.1 Core promise

MiniShop MM gives a seller **one place to manage a shop and sell to customers coming from the places/channels where the seller already has an audience**.

The brand idea is intentionally broader than a single social network.

**Primary tagline**

> **One Place to Sell Everywhere.**

The tagline is a brand promise, not a claim that MiniShop currently performs native catalog/order synchronization with every social network. Marketing copy must describe actual integrations accurately.

### 1.2 Positioning

**Category:** Social commerce platform  
**Primary market:** Myanmar sellers and SMEs  
**Primary value:** One manageable online shop that can be shared across social channels  
**Experience goal:** Make running a real online store feel simple, approachable and credible.

### 1.3 Personality

MiniShop MM is:

- **Simple** — understandable without ecommerce or technical expertise.
- **Friendly** — approachable, human and practical.
- **Confident** — clear hierarchy and decisive actions without visual noise.
- **Trustworthy** — commerce, payment and order surfaces prioritize clarity over decoration.
- **Local-first** — Myanmar language and real local selling behavior are first-class concerns.
- **Merchant-first** — MiniShop frames the seller; it does not compete with the seller's brand.

Avoid a fashion-only, beauty-only, childish, crypto, neon-tech or generic enterprise-SaaS identity.

---

## 2. Brand architecture

MiniShop has two deliberately separate visual layers.

### 2.1 MiniShop platform brand

Use the MiniShop MM identity strongly on:

- marketing / landing pages
- login and signup
- seller onboarding
- seller admin console
- pricing / plan surfaces
- MiniShop-owned social media and campaigns
- transactional/product communication where MiniShop is the sender

### 2.2 Merchant storefront brand

Public tenant storefronts (`/s/:slug/...`) belong visually to the merchant.

A real tenant storefront should prioritize:

- seller shop name
- seller logo
- seller-selected accent/theme
- seller product imagery
- seller-selected storefront typography where supported

Do **not** force MiniShop Pink or the MiniShop wordmark into tenant components unless a product requirement explicitly calls for platform attribution.

**Principle:**

> **MiniShop owns the platform. The seller owns the storefront.**

The demo storefront may use MiniShop fallback identity, but that must not become a tenant-branding dependency.

---

## 3. Logo & wordmark

### 3.1 Primary identity

Primary written brand name:

> **MiniShop MM**

Preferred visual treatment is a friendly, bold wordmark with `Mini` emphasized in MiniShop Pink, `Shop` in MiniShop Ink, and `MM` in MiniShop Pink when rendered on a light neutral surface.

The wordmark should feel compact, modern and approachable. Avoid literal shopping-cart, shopping-bag and generic storefront clip-art as the primary logo.

### 3.2 App / social mark

Use a compact lowercase **`m`** monogram as the standalone mark.

Primary applications:

- favicon
- social profile avatar
- app/PWA icon
- small admin identity mark
- compact watermark where appropriate

The mark uses a rounded-square container and simple geometric lowercase `m` construction. At very small sizes, clarity beats detail.

### 3.3 Logo variants

Required variants:

1. Full-color wordmark on light surface
2. White/reversed wordmark on MiniShop Pink
3. White/reversed wordmark on MiniShop Ink
4. MiniShop Pink `m` mark on light surface
5. White `m` mark on MiniShop Pink
6. Single-color monochrome version for constrained production

### 3.4 Tagline lockup

The tagline may appear below the wordmark when space permits:

> **One Place to Sell Everywhere.**

Do not force the tagline into small navigation headers, favicons, avatars or compact mobile app bars.

### 3.5 Clear space and minimum size

Use the `m` mark's internal stem width as the conceptual clear-space unit `x`. Keep at least `1x` clear space around the logo lockup.

Guidance:

- standalone digital mark: minimum ~16 px only when visually tested
- full wordmark: target minimum ~80 px width
- tagline lockup: use only where the tagline remains comfortably readable

Never stretch, skew, outline, rotate, recolor arbitrarily or add effects to the logo.

---

## 4. Color system

### 4.1 Core brand colors

| Role | Name | Value | Use |
|---|---|---:|---|
| Primary | MiniShop Pink | `#EC1F62` | Logo accent, primary CTA, selected states, key brand moments |
| Ink | MiniShop Ink | `#0F1D31` | Headings, high-emphasis text, dark brand surfaces |
| Muted | Slate | `#6E788A` | Secondary text, metadata, placeholders |
| Border | Silver | `#D7DEE9` | Dividers, input/card borders |
| Canvas | Canvas | `#F7F9FC` | Application background |
| Surface | White | `#FFFFFF` | Cards, forms, overlays |
| Brand Soft | Pink Soft | `#FFF1F6` | Selected/brand-tinted surfaces; use sparingly |

### 4.2 Pink ramp

Use the existing semantic `brand` ramp as the implementation family, converging around:

| Token | Value |
|---|---:|
| `brand-50` | `#FFF1F6` |
| `brand-100` | `#FFE1EC` |
| `brand-200` | `#FFC2D6` |
| `brand-300` | `#FF91B5` |
| `brand-400` | `#F9578D` |
| `brand-500` | `#EC1F62` |
| `brand-600` | `#D61251` |
| `brand-700` | `#AD0F40` |
| `brand-800` | `#7F1035` |
| `brand-900` | `#4D0A22` |

### 4.3 Semantic colors

Semantic colors are functional, not additional brand signatures.

- **Success:** green
- **Warning:** amber/orange
- **Error:** red
- **Info:** blue

Never use color alone to communicate status. Pair color with text and/or iconography.

### 4.4 Color behavior

MiniShop Pink is a **brand signal**, not the page environment.

Good uses:

- primary action
- selected navigation state
- key brand mark
- promotional emphasis
- important commerce highlight

Avoid:

- making every card pink
- large pink application backgrounds without purpose
- pink body copy
- decorative pink competing with product imagery
- combining MiniShop Pink with cyan in a way that imitates another social platform's identity

---

## 5. Typography

### 5.1 Platform typography

MiniShop platform UI uses a neutral, highly readable sans-serif system.

**Latin:** `Inter`  
**Myanmar:** `Noto Sans Myanmar` with appropriate system fallbacks

Recommended platform stack:

```css
--font-sans: 'Inter', 'Noto Sans Myanmar', 'Myanmar Text', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-myanmar: 'Noto Sans Myanmar', 'Myanmar Text', system-ui, sans-serif;
--font-display: var(--font-sans);
```

### 5.2 Weight hierarchy

- Regular — 400
- Medium — 500
- Semibold — 600
- Bold — 700

Prefer weight, size and whitespace over decorative type effects.

### 5.3 Myanmar typography

Myanmar copy must remain comfortably readable on mid-range Android devices and embedded WebViews.

- allow more line-height than Latin text
- avoid excessively tight tracking
- avoid all-caps-style visual treatments for Myanmar
- test real Burmese copy, not only English placeholders
- do not sacrifice readability to match Latin line boxes exactly

### 5.4 Merchant theme typography

Merchant storefront typography is independent from the MiniShop platform identity.

Existing/potential curated storefront pairings such as Boutique, Classic and Minimal may use display faces such as Calistoga or Cormorant. Those fonts must not redefine the MiniShop platform brand.

---

## 6. Graphic language — Shop Blocks

The recurring MiniShop graphic idea is **Shop Blocks**.

Concept:

> Small products and commerce blocks come together into one shop, then connect outward to the places where customers already are.

### 6.1 Building blocks

Use:

- rounded product-card rectangles
- modular grids
- compact storefront/shop forms
- subtle connecting paths
- product tiles
- UI fragments
- controlled circular social/channel nodes when context requires them

### 6.2 Composition

Preferred visual story:

**Products → One MiniShop → Customers / channels**

or

**Many selling touchpoints → One managed shop**

The composition should communicate centralization and distribution without implying unsupported native integrations.

### 6.3 Photography

When photography is used:

- prefer authentic seller/customer/product context
- keep backgrounds simple
- allow the product or person to remain the focal point
- use Pink/Ink framing elements rather than aggressive full-image color filters

### 6.4 Social platform logos

Third-party social logos are contextual channel indicators, not MiniShop brand assets.

- use official/recognizable treatments when permitted
- never combine them into the MiniShop logo
- never make another platform's color system the MiniShop palette
- do not imply an integration that the product does not actually provide

---

## 7. UI design tokens

MiniShop platform UI should feel clean, fast and quietly premium rather than decorative.

### 7.1 Spacing

Base unit: **4 px**

Primary spacing scale:

`4 / 8 / 12 / 16 / 24 / 32 / 48 / 64`

### 7.2 Radius

| Role | Radius |
|---|---:|
| Small controls/chips | `8px` |
| Inputs/buttons | `12px` |
| Cards | `16px` |
| Large panels/modals | `16–20px` |
| Pills | `999px` |

Do not make every element pill-shaped.

### 7.3 Borders

Default application border:

```css
border: 1px solid #D7DEE9;
```

Prefer borders and surface contrast before heavy shadows.

### 7.4 Shadows

Use restrained elevation:

- `sm` — controls / subtle lifted states
- `md` — floating cards / dropdowns
- `lg` — modal / drawer only when separation requires it

Avoid large diffuse fashion-style shadows in dense admin UI.

### 7.5 Buttons

**Primary** — MiniShop Pink fill, high-contrast text  
**Secondary** — white/neutral surface + border  
**Ghost** — transparent, used for low-priority actions  
**Danger** — semantic red; do not reuse brand pink as destructive color

Minimum touch target: **44 × 44 px**.

### 7.6 Inputs

- neutral white surface
- clear border
- visible focus state
- 12 px radius
- explicit labels where meaning is not obvious
- error text near the affected field

### 7.7 Icons

Use a consistent vector icon family such as the existing `lucide-react` system.

- outline icons by default
- consistent stroke weight
- never use emoji as structural/navigation icons
- icons support labels; they do not replace unclear language

### 7.8 Motion

Normal UI transitions: approximately **150–220 ms**.

Motion should explain state or hierarchy, not decorate routine commerce tasks. Respect `prefers-reduced-motion`.

---

## 8. Surface modes

### 8.1 Seller admin — Operate

The admin console is task-first.

Use:

- Canvas background
- white cards
- Ink headings
- Slate secondary copy
- Pink primary/selected states
- semantic colors only for semantic meaning
- compact metrics and actionable lists

Avoid fashion/editorial typography in the admin shell.

### 8.2 Authentication / onboarding — Persuade + Operate

These surfaces may carry stronger MiniShop branding than the admin dashboard, but form completion remains the priority.

Use the wordmark, Shop Blocks and Pink Soft surfaces strategically. Keep the primary path obvious.

### 8.3 Merchant storefront — Merchant-owned

Storefront design is theme-driven and merchant-first. MiniShop platform tokens must not silently override seller-selected theme choices.

The Fashion Demo is a **store theme/demo experience**, not the MiniShop platform identity.

---

## 9. Social media brand kit

MiniShop-owned social media uses the platform brand, not an individual merchant theme.

### 9.1 Required assets

- profile avatar — `m` mark
- Facebook/page cover
- square feed post
- portrait feed/post format
- TikTok/Reels cover
- feature announcement
- product update
- educational/knowledge post
- promotion / campaign template

### 9.2 Template grammar

Every template should be recognizable without requiring a giant logo.

Recurring ingredients:

- MiniShop Pink
- MiniShop Ink
- neutral Canvas/White
- bold Inter hierarchy
- Shop Blocks
- small `m` mark or wordmark
- generous whitespace

### 9.3 Content hierarchy

Typical social card:

1. short headline
2. one visual idea
3. optional one-line support
4. restrained brand mark
5. CTA only when needed

Avoid filling posts with UI screenshots, social logos and marketing copy simultaneously.

### 9.4 Suggested campaign language

The master tagline remains:

> **One Place to Sell Everywhere.**

Supporting messages may express product value without replacing the master tagline, for example:

- Manage your shop in one place.
- Products. Customers. Orders. One place.
- Turn social attention into real orders.
- Build your online shop once and share it where your customers are.

Any feature-specific statement must match current product capability.

---

## 10. Accessibility & responsive rules

- Design mobile-first from approximately 375–414 px.
- Minimum interactive target: 44 × 44 px.
- Verify normal-size text contrast to WCAG 2.2 AA (4.5:1 minimum where applicable).
- Never communicate state using color alone.
- Maintain visible keyboard focus states.
- Reuse existing modal/drawer focus management rather than creating parallel behavior.
- Respect `prefers-reduced-motion`.
- Test Burmese copy for wrapping and vertical rhythm.
- Treat mid-range Android and embedded social WebViews as first-class environments.

---

## 11. Existing component rules

These architecture constraints remain in force:

- `ProductCard` is the shared product-tile implementation; do not create competing product cards without a deliberate architecture decision.
- Storefront navigation must preserve shop-slug routing and use the existing shop-aware navigation mechanism.
- `CartDrawer` remains the shared cart drawer behavior unless the product architecture changes explicitly.
- `AdminLayout` remains the admin chrome source of truth.
- `PlanGate` remains the standard plan-gating surface.
- Order status labels/colors come from the canonical order-status domain mapping rather than per-screen hardcoding.

Design changes must not weaken routing, RLS, authorization, plan gating, validation, payment semantics or other product contracts documented elsewhere.

---

## 12. Implementation migration note

This document defines the **confirmed target brand system**. Existing code may still contain earlier visual decisions.

Known migration work includes:

1. reconcile legacy/documented color values with the confirmed MiniShop Pink `#EC1F62`
2. separate MiniShop platform typography from merchant storefront font pairings
3. replace temporary initial/square identity treatments with approved logo assets once production logo files exist
4. migrate misleading legacy semantic token names (`cream`, `gold`) toward clearer roles only through a safe compatibility plan — do not break existing components merely to rename tokens
5. ensure Fashion Demo styling stays isolated from production tenant storefronts and platform chrome
6. audit MiniShop-owned surfaces for Pink overuse and accessibility

Do not treat this document update alone as evidence that those code migrations are complete.

---

## 13. Brand checklist

Before shipping a new MiniShop-owned surface, verify:

- [ ] Is this a MiniShop platform surface or a merchant-owned storefront?
- [ ] Is MiniShop MM naming used consistently where platform branding is appropriate?
- [ ] Is the tagline exactly `One Place to Sell Everywhere.` when the master tagline is shown?
- [ ] Is MiniShop Pink used as a signal rather than flooding the UI?
- [ ] Does platform typography use neutral sans-serif rather than a merchant/fashion display face?
- [ ] Does the design use the approved spacing/radius/icon language?
- [ ] Are third-party social logos contextual rather than part of the MiniShop logo?
- [ ] Are integration/feature claims factually supported?
- [ ] Does Burmese copy remain readable and natural?
- [ ] Are touch targets, contrast, focus and reduced motion handled?
- [ ] Does the seller's storefront remain visually owned by the seller?

---

## 14. Confirmed identity summary

**Brand:** MiniShop MM  
**Tagline:** One Place to Sell Everywhere.  
**Category:** Myanmar-first social commerce platform  
**Personality:** Simple · Friendly · Confident · Trustworthy · Local-first · Merchant-first  
**Primary:** MiniShop Pink `#EC1F62`  
**Ink:** `#0F1D31`  
**Platform type:** Inter + Noto Sans Myanmar  
**Graphic language:** Shop Blocks  
**UI:** Neutral canvas + white surfaces + restrained pink + semantic status colors  
**Core principle:** **MiniShop owns the platform. The seller owns the storefront.**
