// ---- ORDERS: buyer order lookup ---------------------------------------------
import type {TrackedOrder} from '@/domain/order';
import {getShopSlug} from '@/features/tenancy/shopContext';

export const orderLookupApi = {
  async ordersByPhone(phone: string, orderNo?: string): Promise<{orders: TrackedOrder[]}> {
    if (!orderNo) throw new Error('ဤဆိုင်တွင် ဖုန်းနံပါတ်တစ်ခုတည်းဖြင့် Order ရှာ၍မရပါ — Order နံပါတ်လည်း လိုအပ်ပါသည်။');
    const slug = getShopSlug();
    if (!slug) throw new Error('ဆိုင် အချက်အလက် မတွေ့ပါ။');
    const qs = new URLSearchParams({slug, orderNo, phone});
    const response = await fetch(`/api/storefront-orders?${qs}`);
    if (!response.ok) throw new Error('Order ရှာမတွေ့ပါ။');
    const {order: o} = await response.json();
    const tracked: TrackedOrder = {
      order_id: o.order_no, items: o.items, item_total: o.item_total,
      delivery_fee: o.delivery_fee, grand_total: o.grand_total,
      payment_method: o.payment_method, status: o.status, slip_url: null,
      created_at: o.created_at,
    };
    return {orders: [tracked]};
  },
};
