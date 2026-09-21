// ---- CHECKOUT: buyer-facing payment, shipping and order placement ------------
import type {OrderResult} from '@/domain/order';
import type {MerchantAccount} from '@/domain/shop';
import {getShopSlug} from '@/features/tenancy/shopContext';
import {resolveShop} from '@/features/tenancy/shopResolver';

async function config() {
  const slug = getShopSlug();
  if (!slug) throw new Error('ဆိုင် အချက်အလက် မတွေ့ပါ။');
  const response = await fetch(`/api/checkout?slug=${encodeURIComponent(slug)}`);
  if (!response.ok) throw new Error('Checkout အချက်အလက် ရယူ၍မရပါ။');
  return response.json() as Promise<{accounts: MerchantAccount[]; zones: {region:string;township:string;fee:number}[]; defaultFee:number}>;
}

export const checkoutApi = {
  async merchantAccounts(): Promise<{accounts: MerchantAccount[]}> {
    const data = await config(); return {accounts: data.accounts};
  },
  async shippingConfig(): Promise<{zones: {region: string; township: string; fee: number}[]; defaultFee: number}> {
    const data = await config(); return {zones: data.zones, defaultFee: data.defaultFee};
  },
  async createOrder(body: unknown): Promise<OrderResult> {
    const slug = getShopSlug();
    if (!slug) throw new Error('ဆိုင် အချက်အလက် မတွေ့ပါ။');
    await resolveShop();
    const response = await fetch('/api/checkout', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({...body as object, slug})});
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Order တင်၍မရပါ — ပြန်လည်ကြိုးစားပါ။');
    const r = payload.order;
    return {orderId:r.order_no,itemTotal:r.item_total,deliveryFee:r.delivery_fee,grandTotal:r.grand_total,amountNow:r.amount_now,paymentMethod:r.payment_method};
  },
  async uploadSlip(_orderId: string, _imageBase64: string, _filename?: string): Promise<{ok: boolean; slipUrl: string}> { return {ok:true, slipUrl:''}; },
};
