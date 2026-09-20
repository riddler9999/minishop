// ---- ORDERS: seller order management ----------------------------------------
// The admin console's order queue, scoped to the seller's own shop by RLS.

import {requireSupabase} from '@/core/supabase/client';
import type {AdminOrder} from '@/domain/order';
import {resolveOwnShopId} from '@/features/tenancy/ownShop';

export const orderAdminApi = {
  async listOrders(): Promise<{orders: AdminOrder[]}> {
    const shopId = await resolveOwnShopId();
    const sb = requireSupabase();
    const {data, error} = await sb
      .from('orders')
      .select('*, order_items(name, unit_price, qty)')
      .eq('shop_id', shopId)
      .order('created_at', {ascending: false});
    if (error) throw new Error(error.message);

    const orders: AdminOrder[] = (data ?? []).map((o) => ({
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
    return {orders};
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
