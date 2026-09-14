# Theme: Classic Shop

**Status:** proposed — no tokens exist in `src/index.css` yet, and unlike Bold, this one
*does* change the accent hue (green instead of pink), which is a bigger decision: it breaks
the "brand pink is constant across themes" rule the other two follow. Confirm with the
product owner before implementing — this may need its own `PROJECT.md` decision entry,
since it affects how "the brand" reads across a seller's screenshots/marketing.

## Palette (proposed)

| Role | Suggested token | Value (approx., from mockup) | Note |
|---|---|---|---|
| Background | new `--color-classic-cream-*` | warm tan/cream, e.g. `#f4ead9` | Warmer than Minimal's cool porcelain (`cream-50` is slate-tinted; this needs its own warm ramp). |
| Primary / CTA | new `--color-classic-accent-*` | green, e.g. `#3f7d4a` | Deliberately **not** `--color-brand-500` — food/grocery convention (green = fresh) overrides brand-pink consistency here. This is the exception to Bold's rule; call it out explicitly wherever themes are implemented so it isn't "fixed" as a bug later. |
| Text | new dark warm neutral | e.g. `#2c2419` | Warmer than `--color-ink` (`#1c2033` has a blue cast) — keep the two from being reused interchangeably. |

## Typography

Same Space Grotesk / Padauk stack — see Bold's note on why typography stays fixed across
themes.

## Tone

Warm, appetite-appealing, food/grocery/home-goods. Rounded corners and softer shadows read
better here than the sharp geometric feel Minimal/Bold share; if a shared component
(`ProductCard`'s `.card-lift`) can't flex enough to fit this tone via tokens alone, that's a
sign the component needs a theme-aware variant, not that this theme should compromise its
identity to fit the existing component.

## Reference

Mockup: "Good Food Better Life" hero, warm cream background, green "Shop Now" button.
