// ---- CATALOG: seller-facing writes ------------------------------------------
// Product CRUD for the admin console, scoped to the signed-in seller's own shop
// (RLS enforces the same boundary server-side). Composed into `adminApi`.

import {requireSupabase} from '@/core/supabase/client';
import {mapDbError} from '@/domain/dbError';
import type {TablesInsert, TablesUpdate} from '@/core/supabase/database.types';
import type {Product, ProductCreateInput, ProductPatch} from '@/domain/product';
import {resolveOwnShopId} from '@/features/tenancy/ownShop';
import {mapProduct} from './mappers';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

function pageSize(input?: number): number {
  if (!Number.isFinite(input)) return DEFAULT_PAGE_SIZE;
  return Math.max(1, Math.min(MAX_PAGE_SIZE, Math.floor(input!)));
}
function encodeCursor(row:any): string | null {
  if (!row?.arrival_date) return row?.id ? btoa(JSON.stringify({arrival_date:null,id:row.id})) : null;
  return btoa(JSON.stringify({arrival_date:row.arrival_date,id:row.id}));
}
function decodeCursor(raw?:string|null): {arrival_date:string|null;id:string}|null {
  if (!raw) return null;
  try {
    const p=JSON.parse(atob(raw));
    return typeof p?.id==='string' ? {arrival_date:typeof p.arrival_date==='string'?p.arrival_date:null,id:p.id}:null;
  } catch { return null; }
}

export const catalogAdminApi = {
  async listProducts(opts:{limit?:number;cursor?:string|null}={}): Promise<{products: Product[]; page:{limit:number;nextCursor:string|null;total:number}}> {
    const shopId = await resolveOwnShopId();
    const sb = requireSupabase();
    const limit=pageSize(opts.limit);
    const cursor=decodeCursor(opts.cursor);
    let query = sb
      .from('products')
      .select('*',{count:'exact'})
      .eq('shop_id', shopId)
      .order('arrival_date', {ascending: false, nullsFirst: false})
      .order('id',{ascending:false});
    if (cursor?.arrival_date) {
      query = query.or(
        `arrival_date.lt.${cursor.arrival_date},and(arrival_date.eq.${cursor.arrival_date},id.lt.${cursor.id}),arrival_date.is.null`,
      );
    } else if (cursor) {
      query = query.is('arrival_date', null).lt('id', cursor.id);
    }
    const {data,error,count}=await query.limit(limit+1);
    if (error) throw new Error(mapDbError(error.message));
    const rows=data??[];
    const visible=rows.slice(0,limit);
    return {
      products:visible.map(mapProduct),
      page:{limit,total:count??visible.length,nextCursor:rows.length>limit?encodeCursor(visible.at(-1)):null},
    };
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
    if (error || !data) throw new Error(mapDbError(error?.message, 'ပစ္စည်း ရှာမတွေ့ပါ'));
    return {product: mapProduct(data)};
  },

  async deleteProduct(id: string): Promise<{ok: true}> {
    const shopId = await resolveOwnShopId();
    const sb = requireSupabase();
    const {error} = await sb
      .from('products')
      .delete()
      .eq('id', id)
      .eq('shop_id', shopId);
    if (error) throw new Error(mapDbError(error.message, 'ပစ္စည်း ဖျက်၍မရပါ။'));
    return {ok: true};
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

  async resetProducts(): Promise<{ok: true}> {
    throw new Error('Live ဆိုင်တွင် reset လုပ်ခွင့်မရှိပါ — ပစ္စည်းတစ်ခုစီကို ကိုယ်တိုင် ပြင်ပေးပါ။');
  },
};
