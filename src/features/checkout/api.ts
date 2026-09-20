// ---- CHECKOUT: payment options, delivery fees, order placement --------------
// `createOrder` is the only anonymous WRITE path in the product: it calls the
// SECURITY DEFINER `place_order()` RPC, which re-prices every line server-side,
// so prices sent from this client are advisory only. See supabase/README.md.

import {requireSupabase} from '@/core/supabase/client';
import {mapDbError} from '@/domain/dbError';
import type {OrderResult} from '@/domain/order';
import type {MerchantAccount} from '@/domain/shop';
import {getShopSlug} from '@/features/tenancy/shopContext';
import {resolveShop} from '@/features/tenancy/shopResolver';


export const checkoutApi = {
  async merchantAccounts(): Promise<{accounts: MerchantAccount[]}> {
    const shop = await resolveShop();
    const sb = requireSupabase();
    const {data, error} = await sb
      .from('payment_accounts')
      .select('*')
      .eq('shop_id', shop.id)
      .eq('is_active', true);
    if (error) throw new Error(error.message);
    return {
      accounts: (data ?? []).map((r) => ({
        provider: r.provider as 'kpay' | 'wave',
        label: r.provider === 'kpay' ? 'KBZPay' : 'WavePay',
        accountName: r.account_name,
        phone: r.phone,
        tail: '',
      })),
    };
  },

  // Public read of the shop's delivery-fee zones + default fee, so the storefront
  // can SHOW the same fee place_order() will CHARGE (zone match by region+township,
  // else the shop default). Anon read allowed by the shipping_zones RLS.
  async shippingConfig(): Promise<{zones: {region: string; township: string; fee: number}[]; defaultFee: number}> {
    const shop = await resolveShop();
    const sb = requireSupabase();
    const {data, error} = await sb
      .from('shipping_zones')
      .select('region, township, fee')
      .eq('shop_id', shop.id);
    if (error) throw new Error(error.message);
    return {zones: data ?? [], defaultFee: shop.defaultDeliveryFee};
  },

  async createOrder(body: unknown): Promise<OrderResult> {
    const slug = getShopSlug();
    if (!slug) throw new Error('ဆိုင် အချက်အလက် မတွေ့ပါ။');
    await resolveShop(); // validates the shop exists/active before the RPC call

    const b = body as {
      customer: {name: string; phone: string; street: string; region: string; township: string};
      items: {id: string; qty: number}[];
      paymentMethod: 'cod' | 'kpay' | 'wave';
      shippingFee: number;
      paymentRefTail?: string;
    };

    const sb = requireSupabase();
    const {data, error} = await sb.rpc('place_order', {
      p_shop_slug: slug,
      p_customer_name: b.customer.name,
      p_customer_phone: b.customer.phone,
      p_street: b.customer.street,
      p_region: b.customer.region,
      p_township: b.customer.township,
      p_payment_method: b.paymentMethod,
      p_payment_ref_tail: b.paymentRefTail ?? '',
      p_items: b.items.map((i) => ({product_id: i.id, qty: i.qty})),
    });
    if (error) throw new Error(mapDbError(error.message, 'Order တင်၍မရပါ — ပြန်လည်ကြိုးစားပါ။'));

    const r = data as {
      order_no: string;
      item_total: number;
      delivery_fee: number;
      grand_total: number;
      payment_method: 'cod' | 'kpay' | 'wave';
      amount_now: number;
    };
    return {
      orderId: r.order_no,
      itemTotal: r.item_total,
      deliveryFee: r.delivery_fee,
      grandTotal: r.grand_total,
      amountNow: r.amount_now,
      paymentMethod: r.payment_method,
    };
  },

  // No-op — see the file header (D6: slip upload dropped for MVP).
  async uploadSlip(_orderId: string, _imageBase64: string, _filename?: string): Promise<{ok: boolean; slipUrl: string}> {
    return {ok: true, slipUrl: ''};
  },
};
