// ---- CATALOG: seller-facing writes ------------------------------------------
// Product CRUD for the admin console, scoped to the signed-in seller's own shop
// (RLS enforces the same boundary server-side). Composed into `adminApi`.

import {requireSupabase} from '@/core/supabase/client';
import {mapDbError} from '@/domain/dbError';
import type {TablesInsert, TablesUpdate} from '@/core/supabase/database.types';
import type {Product, ProductCreateInput, ProductPatch} from '@/domain/product';
import {resolveOwnShopId} from '@/features/tenancy/ownShop';
import {mapProduct} from './mappers';

export const catalogAdminApi = {
  async listProducts(): Promise<{products: Product[]}> {
    const shopId = await resolveOwnShopId();
    const sb = requireSupabase();
    const {data, error} = await sb
      .from('products')
      .select('*')
      .eq('shop_id', shopId)
      .order('arrival_date', {ascending: false, nullsFirst: false});
    if (error) throw new Error(error.message);
    return {products: (data ?? []).map(mapProduct)};
  },

  async updateProduct(id: string, patch: ProductPatch): Promise<{product: Product}> {
    const shopId = await resolveOwnShopId();
    const sb = requireSupabase();
    const dbPatch: TablesUpdate<'products'> = {};
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.itemCode !== undefined) dbPatch.item_code = patch.itemCode;
    if (patch.category !== undefined) dbPatch.category = patch.category;
    if (patch.color !== undefined) dbPatch.color = patch.color;
    if (patch.size !== undefined) dbPatch.size = patch.size;
    if (patch.price !== undefined) dbPatch.price = patch.price;
    if (patch.promoPrice !== undefined) dbPatch.promo_price = patch.promoPrice;
    if (patch.isPromotion !== undefined) dbPatch.is_promotion = patch.isPromotion;
    if (patch.stock !== undefined) dbPatch.stock = patch.stock;
    if (patch.status !== undefined) dbPatch.status = patch.status;
    if (patch.images !== undefined) dbPatch.images = patch.images;
    if (patch.description !== undefined) dbPatch.description = patch.description;
    if (patch.arrivalDate !== undefined) dbPatch.arrival_date = patch.arrivalDate;

    const {data, error} = await sb
      .from('products')
      .update(dbPatch)
      .eq('id', id)
      .eq('shop_id', shopId)
      .select()
      .maybeSingle();
    // DB errors are mapped at this boundary. Basic promotion editing is a core
    // selling capability under ADR 0002 and is not Business-gated.
    if (error || !data) throw new Error(mapDbError(error?.message, 'ပစ္စည်း ရှာမတွေ့ပါ'));
    return {product: mapProduct(data)};
  },

  async createProduct(input: ProductCreateInput): Promise<{product: Product}> {
    const shopId = await resolveOwnShopId();
    const sb = requireSupabase();
    const promoPrice = input.promoPrice ?? null;
    const row: TablesInsert<'products'> = {
      shop_id: shopId,
      name: input.name,
      price: input.price,
      item_code: input.itemCode ?? null,
      category: input.category ?? null,
      color: input.color ?? null,
      size: input.size ?? null,
      promo_price: promoPrice,
      is_promotion: (input.isPromotion ?? false) && promoPrice != null,
      stock: input.stock ?? 0,
      status: input.status ?? 'active',
      images: input.images ?? [],
      description: input.description ?? '',
      arrival_date: input.arrivalDate ?? null,
    };
    const {data, error} = await sb.from('products').insert(row).select().maybeSingle();
    if (error || !data) throw new Error(mapDbError(error?.message, 'ပစ္စည်း ဖန်တီး၍မရပါ။'));
    return {product: mapProduct(data)};
  },

  // Demo-only affordance (clears the localStorage override layer) — no
  // equivalent on live shop data. See the file header.
  async resetProducts(): Promise<{ok: true}> {
    throw new Error('Live ဆိုင်တွင် reset လုပ်ခွင့်မရှိပါ — ပစ္စည်းတစ်ခုစီကို ကိုယ်တိုင် ပြင်ပေးပါ။');
  },
};
