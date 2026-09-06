// ---- Shop-scoped navigation primitives -------------------------------------
// Storefront pages/components reuse the same <Link>/navigate targets from
// different route depths (e.g. ProductCard renders on `/`, `/products`, and
// `/s/:slug/products/:id`), so route-relative links can't be used — the same
// string would resolve differently per context. Instead these prepend the
// current shop base via shopHref(), which is depth-independent.
//
// Use for IN-APP storefront paths only (absolute, starting with `/`). Do NOT
// use for real site-root links such as the admin console.
import {useCallback} from 'react';
import {Link, useNavigate, useParams, type LinkProps, type NavigateOptions} from 'react-router-dom';
import {shopHref} from '../lib/shopContext';

type ShopLinkProps = Omit<LinkProps, 'to'> & {to: string};

export function ShopLink({to, ...rest}: ShopLinkProps) {
  return <Link to={shopHref(to)} {...rest} />;
}

/** Like useNavigate(), but shop-scoped for string paths. `nav(-1)` etc. still
 *  use the plain useNavigate() — this is only for absolute in-app paths. */
export function useShopNavigate() {
  const nav = useNavigate();
  return useCallback((to: string, opts?: NavigateOptions) => nav(shopHref(to), opts), [nav]);
}

/**
 * Reactive read of the current shop slug from the route (`/s/:slug`). Unlike
 * `getShopSlug()` (a plain module getter in lib/shopContext), this re-runs
 * effects when the URL slug changes, so buyer pages can put it in a fetch
 * effect's dependency array to re-query on client-side navigation between shops.
 * Returns `null` on the slug-less root storefront. Lives here (with the other
 * route-derived hooks) rather than in lib/shopContext, which stays importable by
 * the non-React data layer (backend.ts).
 */
export function useShopSlugParam(): string | null {
  return useParams<{slug?: string}>().slug ?? null;
}
