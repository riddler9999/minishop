// ---- CATALOG: buyer-facing queries ------------------------------------------
// Read-only product access for the storefront, always scoped to the resolved
// tenant. Composed into the storefront `api` by src/data/liveApi.ts.

import {requireSupabase} from '@/core/supabase/client';
import type {Product} from '@/domain/product';
import {resolveShop} from '@/features/tenancy/shopResolver';
import {escapeOrFilter, mapProduct} from './mappers';

export const catalogStorefrontApi = {
  async products(
    opts: {
      scope?: 'active' | 'all';
      featured?: boolean;
      category?: string;
      q?: string;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<{products: Product[]; total: number}> {
    const shop = await resolveShop();
    const sb = requireSupabase();
    let query = sb.from('products').select('*', {count: 'exact'}).eq('shop_id', shop.id);
    if (opts.scope !== 'all') query = query.eq('status', 'active');
    if (opts.featured) query = query.eq('is_promotion', true);
    if (opts.category) query = query.eq('category', opts.category);
    if (opts.q) {
      const q = escapeOrFilter(opts.q);
      query = query.or(`name.ilike.%${q}%,category.ilike.%${q}%,color.ilike.%${q}%`);
    }
    query = query.order('arrival_date', {ascending: false, nullsFirst: false});
    const offset = opts.offset ?? 0;
    if (opts.limit != null) query = query.range(offset, offset + opts.limit - 1);

    const {data, error, count} = await query;
    if (error) throw new Error(error.message);
    return {products: (data ?? []).map(mapProduct), total: count ?? data?.length ?? 0};
  },

  async product(id: string): Promise<{product: Product}> {
    const shop = await resolveShop();
    const sb = requireSupabase();
    const {data, error} = await sb
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('shop_id', shop.id)
      .eq('status', 'active')
      .maybeSingle();
    if (error || !data) throw new Error('ပစ္စည်း ရှာမတွေ့ပါ');
    return {product: mapProduct(data)};
  },

  async categories(): Promise<{categories: string[]}> {
    const shop = await resolveShop();
    const sb = requireSupabase();
    const {data, error} = await sb
      .from('products')
      .select('category')
      .eq('shop_id', shop.id)
      .eq('status', 'active')
      .not('category', 'is', null);
    if (error) throw new Error(error.message);
    return {categories: Array.from(new Set((data ?? []).map((r) => r.category).filter(Boolean) as string[]))};
  },
};
