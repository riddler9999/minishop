// ---- CATALOG: buyer-facing queries ------------------------------------------
import type {Product} from '@/domain/product';
import {getShopSlug} from '@/features/tenancy/shopContext';
import {mapProduct, type ProductRow} from './mappers';

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
    const data = await request({action: 'products', featured: opts.featured, category: opts.category, q: opts.q, limit: opts.limit, offset: opts.offset}) as {products: ProductRow[]; total: number};
    return {products: data.products.map(mapProduct), total: data.total};
  },
  async product(id: string): Promise<{product: Product}> {
    const data = await request({action: 'product', id}) as {product: ProductRow};
    return {product: mapProduct(data.product)};
  },
  async categories(): Promise<{categories: string[]}> {
    return request({action: 'categories'}) as Promise<{categories: string[]}>;
  },
};
