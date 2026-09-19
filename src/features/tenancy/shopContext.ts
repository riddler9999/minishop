// ---- Shop context for the Supabase-backed data layer ------------------------
// Every table in supabase/migrations/0001_init_saas.sql is scoped by shop_id,
// and RLS lets `anon` read many shops' active rows at once — so each feature's
// data module needs to know WHICH shop's slug to query. `/s/<slug>` routing
// supplies it: @/app/routes/ShopRoute.tsx calls setShopSlug() during render,
// and this module holds it as a settable module value (not React state, not
// storage — TikTok's in-app WebView storage is ephemeral).
//
// Deliberately NOT defaulted from an env var: leaving it unset means
// @/data/dataSource.ts keeps the zero-backend demo (@/data/demo/demoApi.ts)
// active on the slug-less root route even once Supabase env vars are
// configured, so configuring Supabase alone can't change what `/` serves.

let shopSlug: string | null = null;

/** Called by `/s/<slug>` routing once it exists, with the slug from the URL. */
export function setShopSlug(slug: string | null): void {
  shopSlug = slug;
}

export function getShopSlug(): string | null {
  return shopSlug;
}

/**
 * Prefix an in-app storefront path with the current shop's `/s/<slug>` base so
 * links/navigation stay inside the shop across reloads (WebView storage is
 * ephemeral — the slug must live in the URL, not storage). When no shop slug is
 * set (the root demo storefront), the path is returned unchanged.
 *
 * `path` is treated as an opaque string, so query strings and hashes
 * (e.g. `/products?category=x`) pass through untouched. Pass absolute in-app
 * paths beginning with `/`; real site-root links (e.g. admin `/`) must NOT go
 * through here.
 */
export function shopHref(path: string): string {
  const slug = getShopSlug();
  if (!slug) return path;
  // Avoid a trailing slash for the shop home ('/') — the canonical shop URL is
  // `/s/<slug>` (no trailing slash), and `NavLink end` active-matching is
  // exact, so `/s/<slug>/` would never match the address-bar `/s/<slug>`.
  return path === '/' ? `/s/${slug}` : `/s/${slug}${path}`;
}
