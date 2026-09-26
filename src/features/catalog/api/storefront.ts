// ---- CATALOG: buyer-facing queries ------------------------------------------
import type {Product} from '@/domain/product';
import type {StoreDesignDocument} from '@/domain/storeDesign';
import {normalizeStoreDesign} from '@/domain/storeDesign';
import {getShopSlug} from '@/features/tenancy/shopContext';

async function request(params: Record<string, string | number | boolean | undefined>) {
  const slug = getShopSlug();
  if (!slug) throw new Error('ဆိုင် အချက်အလက် မတွေ့ပါ။');
  const qs = new URLSearchParams({slug});
  for (const [key, value] of Object.entries(params)) if (value !== undefined) qs.set(key, String(value));
  const response = await fetch(`/api/storefront?${qs}`);
  if (!response.ok) throw new Error('ပစ္စည်းအချက်အလက် ရယူ၍မရပါ။');
  return response.json();
}

export const catalogStorefrontApi = {
  async products(opts: {scope?: 'active' | 'all'; featured?: boolean; category?: string; q?: string; limit?: number; offset?: number} = {}): Promise<{products: Product[]; total: number}> {
    return request({action: 'products', featured: opts.featured, category: opts.category, q: opts.q, limit: opts.limit, offset: opts.offset}) as Promise<{products: Product[]; total: number}>;
  },
  async product(id: string): Promise<{product: Product}> {
    return request({action: 'product', id}) as Promise<{product: Product}>;
  },
  async categories(): Promise<{categories: string[]}> {
    return request({action: 'categories'}) as Promise<{categories: string[]}>;
  },
  async loadPublishedStoreDesign(): Promise<StoreDesignDocument> {
    const response = await request({action: 'shop'}) as {shop?: {theme?: unknown}};
    return normalizeStoreDesign(response.shop?.theme);
  },
};
