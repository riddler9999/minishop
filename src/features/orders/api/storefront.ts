// ---- ORDERS: buyer order lookup ---------------------------------------------
// Wraps `lookup_order()`, which requires (shop_slug, order_no, phone) together —
// a phone number alone would let anyone enumerate a buyer's order history.

import {requireSupabase} from '@/core/supabase/client';
import {mapDbError} from '@/domain/dbError';
import type {TrackedOrder} from '@/domain/order';
import {getShopSlug} from '@/features/tenancy/shopContext';

export const orderLookupApi = {
  // `orderNo` is required in practice — see the file header. Optional only to
  // keep the call signature compatible with the demo API's single-arg shape.
  async ordersByPhone(phone: string, orderNo?: string): Promise<{orders: TrackedOrder[]}> {
    if (!orderNo) {
      throw new Error(
        'ဤဆိုင်တွင် ဖုန်းနံပါတ်တစ်ခုတည်းဖြင့် Order ရှာ၍မရပါ — Order နံပါတ်လည်း လိုအပ်ပါသည်။',
      );
    }
    const slug = getShopSlug();
    if (!slug) throw new Error('ဆိုင် အချက်အလက် မတွေ့ပါ။');

    const sb = requireSupabase();
    const {data, error} = await sb.rpc('lookup_order', {
      p_shop_slug: slug,
      p_order_no: orderNo,
      p_phone: phone,
    });
    if (error) throw new Error(mapDbError(error.message, 'Order ရှာမတွေ့ပါ။'));

    const o = data as {
      order_no: string;
      status: string;
      payment_method: string;
      item_total: number;
      delivery_fee: number;
      grand_total: number;
      created_at: string;
      items: {name: string; price: number; qty: number}[];
    };
    const tracked: TrackedOrder = {
      order_id: o.order_no,
      items: o.items,
      item_total: o.item_total,
      delivery_fee: o.delivery_fee,
      grand_total: o.grand_total,
      payment_method: o.payment_method,
      status: o.status,
      slip_url: null,
      created_at: o.created_at,
    };
    return {orders: [tracked]};
  },
};
