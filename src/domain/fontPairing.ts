// ---- DOMAIN: storefront font pairing (Store Design typography) -------------
// A curated, closed set of Latin display/body font stacks a seller can pick for
// their storefront. Deliberately NOT free-text (no arbitrary font name or URL
// from a seller) — that would mean loading attacker-chosen remote stylesheets.
// Each stack keeps the existing Myanmar fallback chain first-in-fallback after
// the Latin face, so Burmese glyphs (the majority of buyer-facing copy) always
// render via Pyidaungsu/Noto Sans Myanmar regardless of pairing; only Latin
// characters (prices, English labels, brand names) pick up the chosen face.

export type FontPairingId = 'boutique' | 'classic' | 'minimal';

export interface FontPairingDef {
  id: FontPairingId;
  label: string;
  sampleText: string;
  /** `font-family` value for headings (the `font-display` utility). */
  display: string;
  /** `font-family` value for body copy (the `font-sans` utility). */
  body: string;
  /** Google Fonts CSS href, or `null` when the pairing needs no webfont. */
  googleFontsHref: string | null;
}

const MYANMAR_FALLBACK = "'Pyidaungsu', 'Noto Sans Myanmar', 'Myanmar Text'";

export const FONT_PAIRINGS: Record<FontPairingId, FontPairingDef> = {
  boutique: {
    id: 'boutique',
    label: 'Boutique',
    sampleText: 'Aa — ဖက်ရှင်ဆိုင်',
    display: `'Calistoga', ${MYANMAR_FALLBACK}, Georgia, serif`,
    body: `'Inter', ${MYANMAR_FALLBACK}, system-ui, -apple-system, sans-serif`,
    googleFontsHref:
      'https://fonts.googleapis.com/css2?family=Calistoga&family=Inter:wght@400;500;600;700&display=swap',
  },
  classic: {
    id: 'classic',
    label: 'Classic',
    sampleText: 'Aa — ဖက်ရှင်ဆိုင်',
    display: `'Cormorant', ${MYANMAR_FALLBACK}, Georgia, serif`,
    body: `'Montserrat', ${MYANMAR_FALLBACK}, system-ui, -apple-system, sans-serif`,
    googleFontsHref:
      'https://fonts.googleapis.com/css2?family=Cormorant:wght@500;600;700&family=Montserrat:wght@400;500;600;700&display=swap',
  },
  minimal: {
    id: 'minimal',
    label: 'Minimal',
    sampleText: 'Aa — ဖက်ရှင်ဆိုင်',
    display: `${MYANMAR_FALLBACK}, system-ui, -apple-system, sans-serif`,
    body: `${MYANMAR_FALLBACK}, system-ui, -apple-system, sans-serif`,
    googleFontsHref: null,
  },
};

export const DEFAULT_FONT_PAIRING: FontPairingId = 'boutique';

export const FONT_PAIRING_IDS = Object.keys(FONT_PAIRINGS) as FontPairingId[];

export function isFontPairingId(v: unknown): v is FontPairingId {
  return typeof v === 'string' && v in FONT_PAIRINGS;
}
