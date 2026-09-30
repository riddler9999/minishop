// ---- ORDERS: seller order management ----------------------------------------
// The admin console's order queue, scoped to the seller's own shop by RLS.

import {requireSupabase} from '@/core/supabase/client';
import type {AdminOrder} from '@/domain/order';
import {resolveOwnShopId} from '@/features/tenancy/ownShop';
import {mapDbError} from '@/domain/dbError';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

export type SellerPage = {limit:number; nextCursor:string|null; total:number};

function pageSize(input?: number): number {
  if (!Number.isFinite(input)) return DEFAULT_PAGE_SIZE;
  return Math.max(1, Math.min(MAX_PAGE_SIZE, Math.floor(input!)));
}

function encodeCursor(row:any): string | null {
  if (!row?.created_at) return null;
  return btoa(JSON.stringify({created_at:row.created_at, id:row.id}));
}

function decodeCursor(raw?: string | null): {created_at:string; id?:string} | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(atob(raw));
    return typeof parsed?.created_at === 'string' ? parsed : null;
  } catch {
    return null;
  }
}

export const orderAdminApi = {
  async listOrders(opts: {limit?: number; cursor?: string | null} = {}): Promise<{orders: AdminOrder[]; page: SellerPage}> {
    const shopId = await resolveOwnShopId();
    const sb = requireSupabase();
    const limit = pageSize(opts.limit);
    const cursor = decodeCursor(opts.cursor);

    let query = sb
      .from('orders')
      .select('*, order_items(name, unit_price, qty)', {count:'exact'})
      .eq('shop_id', shopId)
      .order('created_at', {ascending:false})
      .order('id', {ascending:false});
    if (cursor?.id) {
      query = query.or(`created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`);
    } else if (cursor) {
      query = query.lt('created_at', cursor.created_at);
    }
    const {data, error, count} = await query.limit(limit + 1);
    if (error) throw new Error(mapDbError(error.message));

    const rows = data ?? [];
    const visible = rows.slice(0, limit);
    const orders: AdminOrder[] = visible.map((o) => ({
      order_id: o.order_no,
      items: (o.order_items ?? []).map((it) => ({name: it.name, price: it.unit_price, qty: it.qty})),
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
      page:{limit, total:count ?? orders.length, nextCursor: rows.length > limit ? encodeCursor(visible.at(-1)) : null},
    };
  },

  async updateOrderStatus(orderId: string, status: string): Promise<{ok: true}> {
    const shopId = await resolveOwnShopId();
    const sb = requireSupabase();
    const {data, error} = await sb
      .from('orders')
      .update({status})
      .eq('order_no', orderId)
      .eq('shop_id', shopId)
      .select('id')
      .maybeSingle();
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
