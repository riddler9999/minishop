// ---- TENANCY: shop (tenant) resolution --------------------------------------
import type {ShopInfo} from '@/domain/shop';
import {getShopSlug} from './shopContext';

export type {ShopInfo};
let cachedShop: {slug: string; info: ShopInfo} | null = null;

export function isShopCached(slug: string): boolean { return cachedShop?.slug === slug; }
export function getCachedShopInfo(): ShopInfo | null { return cachedShop && cachedShop.slug === getShopSlug() ? cachedShop.info : null; }

export async function resolveShop(): Promise<ShopInfo> {
  const slug = getShopSlug();
  if (!slug) throw new Error('ဆိုင် အချက်အလက် မတွေ့ပါ — link မှားနေနိုင်ပါသည်။');
  if (cachedShop?.slug === slug) return cachedShop.info;
  const response = await fetch(`/api/storefront?action=shop&slug=${encodeURIComponent(slug)}`);
  if (!response.ok) throw new Error('ဆိုင် ရှာမတွေ့ပါ။');
  const {shop} = await response.json() as {shop: ShopInfo};
  cachedShop = {slug, info: shop};
  return shop;
}
