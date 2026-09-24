# Storefront Aesthetic Themes

> Status: confirmed storefront theme taxonomy

MiniShop storefront themes are categorized by **design aesthetic and layout vibe**, not by product niche. A theme must never imply that a seller needs a specific theme because of what they sell.

The five supported theme families are intentionally visually distinct across shell, hero, category navigation, product grid/card density, catalog and product-detail presentation.

## 1. Clean & Minimal

**ID:** `clean-minimal`

- Visual: black/white, large whitespace, restrained borders, product-first imagery
- Layout: editorial split hero, simple text category navigation, spacious 2-column mobile product grid
- Card language: borderless/flat, minimal metadata, compact utility action
- Intent: quiet premium presentation without tying the store to a niche

## 2. Street & Bold

**ID:** `street-bold`

- Visual: high contrast black + acid yellow canvas + orange accent
- Layout: full-bleed poster hero, oversized type, chunky category controls
- Card language: hard borders, square imagery, offset shadow, bold CTA
- Intent: energetic and attention-first, not “streetwear only”

## 3. Soft & Elegant

**ID:** `soft-elegant`

- Visual: cream/blush surfaces, muted rose accent, softer typography
- Layout: centered/boutique composition, rounded hero and cards, calmer rhythm
- Card language: large radius, subtle elevation, soft metadata hierarchy
- Intent: refined and premium without assuming beauty/fashion merchandise

## 4. Grid & Catalog

**ID:** `grid-catalog`

- Visual: utility white/blue, compact spacing, high information density
- Layout: search-led utility header, dense 3-column mobile / 5–6-column wide grid
- Card language: compact square image, small metadata, fast add action
- Intent: rapid scanning for stores with many SKUs

## 5. Dark Modern

**ID:** `dark-modern`

- Visual: full dark canvas, graphite surfaces, luminous mint accent
- Layout: glass/tech hero, dark shell, high-contrast product detail
- Card language: dark panels, glow-like accent treatment, compact modern controls
- Intent: modern/technical/premium mood without restricting the seller's category

## Implementation contract

- `StorefrontTheme.presetId` is the persisted selector in `shops.theme`.
- `THEME_PRESETS` is the canonical registry.
- `getThemeVisual()` exposes non-persisted visual/layout metadata.
- Theme selection must change layout composition, not only colors.
- Existing seller overrides (hero image, copy, accent color, typography) remain editable.
- Public storefronts must apply the selected theme through Home, catalog, product detail, cart drawer, checkout, order confirmation, order tracking and shell.
- Transactional semantics stay stable: success/error/status colors preserve their meaning even when the surrounding shape, surface, border, density and CTA treatment follow the theme.
- Store Design live preview must show the actual selected layout family, including checkout.
- Do not create product-niche-labelled themes.

## Legacy compatibility

Old preset IDs are normalized safely:

| Legacy | New |
| --- | --- |
| `minimal` | `clean-minimal` |
| `fashion` | `soft-elegant` |
| `dark-luxury` | `dark-modern` |
| `fresh-market` | `grid-catalog` |
| `modern-shop` | `street-bold` |

No database migration is required for this compatibility layer.
