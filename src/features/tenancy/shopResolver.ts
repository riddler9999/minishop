// ---- TENANCY: shop (tenant) resolution --------------------------------------
// Resolves the slug held by shopContext.ts into the tenant's public branding,
// and caches it per session so a revisit costs no round trip. This is the only
// module allowed to answer "which shop is this request for?".

import {requireSupabase} from '@/core/supabase/client';
import type {ShopInfo} from '@/domain/shop';
import {getShopSlug} from './shopContext';

export type {ShopInfo};

let cachedShop: {slug: string; info: ShopInfo} | null = null;

// True when `slug` is already resolved+cached this session, so ShopRoute can
// skip its 'checking' loading state (and the remount it causes) on a revisit.
export function isShopCached(slug: string): boolean {
  return cachedShop?.slug === slug;
}

/**
 * The currently-resolved shop's public branding, or null on the demo/root
 * storefront. Read synchronously by the storefront <Layout> so a real tenant's
 * chrome shows the SELLER's name/logo — not the product's demo brand. Populated
 * as a side effect of resolveShop(), which every storefront page already awaits
 * before its first render, so by the time the header paints for a real shop
 * this is set; the demo shop leaves it null and falls back to APP_NAME.
 */
export function getCachedShopInfo(): ShopInfo | null {
  return cachedShop && cachedShop.slug === getShopSlug() ? cachedShop.info : null;
}

// Exported so App.tsx's ShopRoute can reuse the SAME cached existence check the
// storefront `api` performs — a confirmed shop is then a cache hit for the
// page-level queries that follow, not a second round trip.
export async function resolveShop(): Promise<ShopInfo> {
  const slug = getShopSlug();
  if (!slug) throw new Error('ဆိုင် အချက်အလက် မတွေ့ပါ — link မှားနေနိုင်ပါသည်။');
  if (cachedShop && cachedShop.slug === slug) return cachedShop.info;

  const sb = requireSupabase();
  const {data, error} = await sb
    .from('shops')
    .select('id, name, logo_url, default_delivery_fee')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();
  if (error || !data) throw new Error('ဆိုင် ရှာမတွေ့ပါ။');

  const info: ShopInfo = {
    id: data.id,
    name: data.name,
    logoUrl: data.logo_url,
    defaultDeliveryFee: data.default_delivery_fee,
  };
  cachedShop = {slug, info};
  return info;
}

