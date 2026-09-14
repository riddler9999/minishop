# Theme: Bold

**Status:** proposed — no `--theme-bold-*` tokens exist in `src/index.css` yet. This is a
dark, high-contrast variant of the *same* brand palette as Minimal (§ `minimal.md`), not a
different brand identity — the pink stays the pink.

## Palette (proposed)

| Role | Suggested token | Value | Note |
|---|---|---|---|
| Background | `--color-ink` (reused) | `#1c2033` | Reuse the existing dark ink token as the surface, don't invent a new near-black. |
| Surface / card | new `--color-ink-800`-style step | ~`#262b42` | One step lighter than background for card separation; needs a real ramp step added to `@theme`, not eyeballed per-component. |
| Primary / CTA | `--color-brand-500` (unchanged) | `#fe2c55` | Same pink as Minimal — brand consistency across themes matters more than novelty. |
| Accent | `--color-gold-500` (unchanged) | `#25f4ee` | Reads well on dark backgrounds without adjustment. |
| Text | `--color-cream-50` (inverted) | `#f6f7fb` | Light text on dark surface — the Minimal background color becomes the Bold text color. |
| Text muted | lighten `--color-ink-soft` | ~`#9aa0b8` | `ink-soft` as-is is too dark to read on an `ink` background; needs its own lightened variant, not a straight reuse. |

## Typography

Same Space Grotesk / Padauk stack as Minimal. Do not swap fonts per theme — only palette
changes; keeping typography fixed is what makes theme-switching a frontend-only, low-risk
feature (same reasoning as plan gating: it changes *appearance*, not *structure*).

## Tone

High contrast, editorial, "night mode retail" — trend/streetwear, electronics, gadgets.
Photography should be shot or cropped for a dark background (a product photo with a white
seamless background will look like a cutout mistake here — flag this as a content
requirement for sellers who pick this theme, not just a CSS swap).

## Accessibility note

Verify every text/background pair against WCAG 2.2 AA (4.5:1 body text, 3:1 large
text/UI) once real values are chosen — dark themes are where contrast regressions are easiest
to miss, per `design/design.md` §6.

## Reference

Mockup: "Trendy Products For You" hero, black background, light heading text, pink "Shop
Now" button.
