// ---- ORDERS: seller order management ----------------------------------------
// The admin console's order queue, scoped to the seller's own shop by RLS.

import {requireSupabase} from '@/core/supabase/client';
import type {AdminOrder} from '@/domain/order';
import {resolveOwnShopId} from '@/features/tenancy/ownShop';
import {mapDbError} from '@/domain/dbError';
import {boundedPageSize, decodePageCursor, encodePageCursor, isIsoTimestamp, isSafeCursorId} from '@/shared/lib/keysetPagination';

export type SellerPage = {limit:number; nextCursor:string|null; total:number};
type OrderCursor = {created_at:string; id:string};

function decodeCursor(raw?: string | null): OrderCursor | null {
  return decodePageCursor<OrderCursor>(
    raw,
    (value): value is OrderCursor => {
      const candidate = value as Partial<OrderCursor> | null;
      return !!candidate && isIsoTimestamp(candidate.created_at) && isSafeCursorId(candidate.id);
    },
  );
}

async function listOrderPage(opts: {limit?: number; cursor?: string | null}) {
  const shopId = await resolveOwnShopId();
  const sb = requireSupabase();
  const limit = boundedPageSize(opts.limit);
  const cursor = decodeCursor(opts.cursor);

  let query = sb
    .from('orders')
    .select('*, order_items(name, unit_price, qty, variant_id, variant_name, variant_sku)', {count:'exact'})
    .eq('shop_id', shopId)
    .order('created_at', {ascending:false})
    .order('id', {ascending:false});
  if (cursor?.id) {
    query = query.or(`created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`);
  }
  const {data, error, count} = await query.limit(limit + 1);
  if (error) throw new Error(mapDbError(error.message));

  const rows = data ?? [];
  const visible = rows.slice(0, limit);
  const orders: AdminOrder[] = visible.map((o) => ({
    order_id: o.order_no,
    items: (o.order_items ?? []).map((it) => ({
      name: it.name,
      price: it.unit_price,
      qty: it.qty,
      variantId: it.variant_id,
      variantName: it.variant_name,
      variantSku: it.variant_sku,
    })),
    item_total: o.item_total,
    delivery_fee: o.delivery_fee,
    grand_total: o.grand_total,
    payment_method: o.payment_method,
    status: o.status,
    slip_url: null,
    created_at: o.created_at,
    customer_name: o.customer_name,
    customer_phone: o.customer_phone,
    customer_address: o.customer_address ?? undefined,
    paymentRefTail: o.payment_ref_tail ?? null,
    phone_key: o.customer_phone.replace(/\D/g, ''),
  }));
  return {
    orders,
    page:{
      limit,
      total:count ?? orders.length,
      nextCursor: rows.length > limit && visible.at(-1)
        ? encodePageCursor({created_at: visible.at(-1)!.created_at, id: visible.at(-1)!.id})
        : null,
    },
  };
}

export const orderAdminApi = {
  async listOrders(opts?: {limit?: number; cursor?: string | null}): Promise<{orders: AdminOrder[]; page: SellerPage}> {
    if (opts) return listOrderPage(opts);

    const orders: AdminOrder[] = [];
    let cursor: string | null = null;
    let total = 0;
    for (let page = 0; page < 50; page += 1) {
      const result = await listOrderPage({limit:100, cursor});
      orders.push(...result.orders);
      total = result.page.total;
      cursor = result.page.nextCursor;
      if (!cursor) return {orders, page:{limit:orders.length, total, nextCursor:null}};
    }
    throw new Error('Order history is too large for this summary view. Open Orders to page through all records.');
  },

  async updateOrderStatus(orderId: string, status: string): Promise<{ok: true}> {
    const shopId = await resolveOwnShopId();
    const sb = requireSupabase();
    const {data, error} = await (sb as any).rpc('update_order_status_and_notify', {
      p_order_no: orderId,
      p_shop_id: shopId,
      p_status: status,
    });
    if (error || !data) throw new Error('Order ရှာမတွေ့ပါ');
    return {ok: true};
  },

  async deleteOrder(orderId: string): Promise<{ok: true}> {
    const shopId = await resolveOwnShopId();
    const sb = requireSupabase();
    const {data, error} = await sb
      .from('orders')
      .delete()
      .eq('order_no', orderId)
      .eq('shop_id', shopId)
      .select('id')
      .maybeSingle();
    if (error || !data) throw new Error('Order ရှာမတွေ့ပါ');
    return {ok: true};
  },
};
