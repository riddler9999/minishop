// ---- CHECKOUT: buyer-facing payment, shipping and order placement ------------
import type {OrderResult} from '@/domain/order';
import type {MerchantAccount} from '@/domain/shop';
import {getShopSlug} from '@/features/tenancy/shopContext';
import {resolveShop} from '@/features/tenancy/shopResolver';

export interface CheckoutQuote {
  itemTotal: number;
  deliveryFee: number;
  grandTotal: number;
  deliveryService: string;
}

async function config() {
  const slug = getShopSlug();
  if (!slug) throw new Error('ဆိုင် အချက်အလက် မတွေ့ပါ။');
  const response = await fetch(`/api/checkout?slug=${encodeURIComponent(slug)}`);
  if (!response.ok) throw new Error('Checkout အချက်အလက် ရယူ၍မရပါ။');
  return response.json() as Promise<{accounts: MerchantAccount[]; zones: {region:string;township:string;fee:number}[]; defaultFee:number}>;
}

function mapQuote(q: any): CheckoutQuote {
  return {
    itemTotal: Number(q.item_total),
    deliveryFee: Number(q.delivery_fee),
    grandTotal: Number(q.grand_total),
    deliveryService: String(q.delivery_service || ''),
  };
}

export const checkoutApi = {
  async merchantAccounts(): Promise<{accounts: MerchantAccount[]}> {
    const data = await config(); return {accounts: data.accounts};
  },
  async shippingConfig(): Promise<{zones: {region: string; township: string; fee: number}[]; defaultFee: number}> {
    const data = await config(); return {zones: data.zones, defaultFee: data.defaultFee};
  },
  async quoteOrder(body: {region: string; township: string; items: {id: string; qty: number}[]}): Promise<CheckoutQuote> {
    const slug = getShopSlug();
    if (!slug) throw new Error('ဆိုင် အချက်အလက် မတွေ့ပါ။');
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({action: 'quote', slug, ...body}),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'ပို့ဆောင်ခနှင့် စုစုပေါင်းဈေးနှုန်း တွက်ချက်၍မရပါ။');
    return mapQuote(payload.quote);
  },
  async createOrder(body: unknown): Promise<OrderResult> {
    const slug = getShopSlug();
    if (!slug) throw new Error('ဆိုင် အချက်အလက် မတွေ့ပါ။');
    await resolveShop();
    const response = await fetch('/api/checkout', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({...body as object, slug})});
    const payload = await response.json();
    if (!response.ok) {
      const err = new Error(payload.error || 'Order တင်၍မရပါ — ပြန်လည်ကြိုးစားပါ။') as Error & {code?: string; freshQuote?: CheckoutQuote | null};
      err.code = payload.code;
      err.freshQuote = payload.freshQuote ? mapQuote(payload.freshQuote) : null;
      throw err;
    }
    const r = payload.order;
    return {orderId:r.order_no,itemTotal:r.item_total,deliveryFee:r.delivery_fee,grandTotal:r.grand_total,amountNow:r.amount_now,paymentMethod:r.payment_method};
  },
  async uploadSlip(_orderId: string, _imageBase64: string, _filename?: string): Promise<{ok: boolean; slipUrl: string}> { return {ok:true, slipUrl:''}; },
};
