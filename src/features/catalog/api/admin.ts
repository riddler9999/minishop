// ---- CATALOG: seller-facing writes ------------------------------------------
// Product CRUD for the admin console, scoped to the signed-in seller's own shop
// (RLS enforces the same boundary server-side). Composed into `adminApi`.

import {requireSupabase} from '@/core/supabase/client';
import {mapDbError} from '@/domain/dbError';
import type {TablesInsert, TablesUpdate} from '@/core/supabase/database.types';
import type {Product, ProductCreateInput, ProductPatch} from '@/domain/product';
import {resolveOwnShopId} from '@/features/tenancy/ownShop';
import {mapProduct, encodeVariants} from './mappers';
import {boundedPageSize, decodePageCursor, encodePageCursor, isIsoTimestamp, isSafeCursorId} from '@/shared/lib/keysetPagination';

type ProductCursor = {arrival_date:string|null; id:string};

function decodeCursor(raw?:string|null): ProductCursor|null {
  return decodePageCursor<ProductCursor>(
    raw,
    (value): value is ProductCursor => {
      const candidate = value as Partial<ProductCursor> | null;
      return !!candidate
        && (candidate.arrival_date === null || isIsoTimestamp(candidate.arrival_date))
        && isSafeCursorId(candidate.id);
    },
  );
}

async function listProductPage(opts:{limit?:number;cursor?:string|null}) {
  const shopId = await resolveOwnShopId();
  const sb = requireSupabase();
  const limit=boundedPageSize(opts.limit);
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
    page:{
      limit,
      total:count??visible.length,
      nextCursor:rows.length>limit&&visible.at(-1)
        ? encodePageCursor({arrival_date:visible.at(-1)!.arrival_date,id:visible.at(-1)!.id})
        : null,
    },
  };
}

export const catalogAdminApi = {
  async listProducts(opts?:{limit?:number;cursor?:string|null}): Promise<{products: Product[]; page:{limit:number;nextCursor:string|null;total:number}}> {
    if (opts) return listProductPage(opts);

    const products: Product[] = [];
    let cursor: string | null = null;
    let total = 0;
    for (let page = 0; page < 5; page += 1) {
      const result = await listProductPage({limit:100,cursor});
      products.push(...result.products);
      total = result.page.total;
      cursor = result.page.nextCursor;
      if (!cursor) return {products,page:{limit:products.length,total,nextCursor:null}};
    }
    if (products.length < total) throw new Error('Catalog exceeds the supported 500-product plan limit.');
    return {products,page:{limit:products.length,total,nextCursor:null}};
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
    if (patch.description !== undefined || patch.variants !== undefined) {
      const desc = patch.description ?? '';
      dbPatch.description = encodeVariants(desc, patch.variants);
    }
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
      description: encodeVariants(input.description ?? '', input.variants),
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
