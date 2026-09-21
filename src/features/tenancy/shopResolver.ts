// ---- TENANCY: shop (tenant) resolution --------------------------------------
import type {ShopInfo} from '@/domain/shop';
import {normalizeTheme, DEFAULT_THEME, type StorefrontTheme} from '@/domain/theme';
import {getShopSlug} from './shopContext';

export type {ShopInfo};
let cachedShop: {slug: string; info: ShopInfo} | null = null;

function firstPartyLogo(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/\/storage\/v1\/object\/public\/shop-logos\/(.+)$/);
  return match ? `/api/storefront/shop-logos/${match[1]}` : url;
}

// The hero image lives in the shop-logos bucket, so route it through the same
// first-party media proxy as the logo (raw Supabase Storage URLs are avoided on
// the storefront — see PR #43). Applied AFTER normalizeTheme so a bad value has
// already collapsed to null.
function firstPartyTheme(theme: StorefrontTheme): StorefrontTheme {
  if (!theme.home.heroImageUrl) return theme;
  return {...theme, home: {...theme.home, heroImageUrl: firstPartyLogo(theme.home.heroImageUrl)}};
}

export function isShopCached(slug: string): boolean { return cachedShop?.slug === slug; }
export function getCachedShopInfo(): ShopInfo | null { return cachedShop && cachedShop.slug === getShopSlug() ? cachedShop.info : null; }

/**
 * The active tenant's storefront theme, or DEFAULT_THEME when no tenant is
 * resolved yet (e.g. the slug-less demo storefront). Always returns a complete,
 * valid theme so storefront pages can read it unconditionally.
 */
export function getStorefrontTheme(): StorefrontTheme {
  return getCachedShopInfo()?.theme ?? DEFAULT_THEME;
}

// The gateway (api/storefront.ts, action=shop) returns the public shop fields
// plus the raw `theme` blob (or null before migration 0009). It does not echo
// the slug — the caller already knows it from the URL.
interface ShopPayload {
  id: string;
  name: string;
  logoUrl: string | null;
  defaultDeliveryFee: number;
  theme?: unknown;
}

export async function resolveShop(): Promise<ShopInfo> {
  const slug = getShopSlug();
  if (!slug) throw new Error('ဆိုင် အချက်အလက် မတွေ့ပါ — link မှားနေနိုင်ပါသည်။');
  if (cachedShop?.slug === slug) return cachedShop.info;
  const response = await fetch(`/api/storefront?action=shop&slug=${encodeURIComponent(slug)}`);
  if (!response.ok) throw new Error('ဆိုင် ရှာမတွေ့ပါ။');
  const {shop} = await response.json() as {shop: ShopPayload};
  const info: ShopInfo = {
    id: shop.id,
    slug,
    name: shop.name,
    logoUrl: firstPartyLogo(shop.logoUrl),
    defaultDeliveryFee: shop.defaultDeliveryFee,
    theme: firstPartyTheme(normalizeTheme(shop.theme)),
  };
  cachedShop = {slug, info};
  return info;
}
