// ---- Product-neutral branding -----------------------------------------------
// Single source of truth for the app's own (SaaS product) name, used on the
// demo storefront and the seller console chrome. Deliberately channel-neutral —
// this storefront is sold to ANY Myanmar seller (TikTok, Facebook, Telegram,
// Viber, a printed QR…), not a TikTok-only tool. A real tenant's storefront
// shows the SELLER's own shop name/logo instead (see resolveShop() in
// backend.ts and the storefront <Layout>); these constants are the fallback for
// the root demo shop and the seller-facing admin console.

export const APP_NAME = 'Mini Shop';
export const APP_TAGLINE = 'Myanmar Online Shop';

// Short initial used by the square logo tiles when no shop logo is available.
export const APP_INITIAL = 'M';

/** First grapheme of a shop name, for the fallback logo tile. ASCII-uppercased
 *  so Latin names look right; Myanmar/other scripts pass through unchanged. */
export function shopInitial(name?: string | null): string {
  const ch = (name ?? '').trim().charAt(0);
  return ch ? ch.toUpperCase() : APP_INITIAL;
}
