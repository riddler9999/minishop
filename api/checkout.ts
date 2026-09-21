import {createClient} from '@supabase/supabase-js';
import {mapDbError} from '../src/domain/dbError.js';
import {supabaseEnv} from './_env.js';
import {sendJson} from './_http.js';
import {rateLimit} from './_rate-limit.js';
import {clean} from './_validation.js';

export default async function handler(req: any, res: any) {
  const env = supabaseEnv();
  if (!env) return sendJson(res, 503, {error: 'Backend unavailable'});
  const sb = createClient(env.url, env.key, {auth: {persistSession: false, autoRefreshToken: false}});
  if (req.method === 'GET') {
    const slug = clean(req.query?.slug, 100);
    if (!slug) return sendJson(res, 400, {error: 'Missing shop'});
    const {data: shop} = await sb.from('shops').select('id,default_delivery_fee').eq('slug', slug).eq('is_active', true).maybeSingle();
    if (!shop) return sendJson(res, 404, {error: 'Shop not found'});
    const [{data: accounts, error: ae}, {data: zones, error: ze}] = await Promise.all([
      sb.from('payment_accounts').select('provider,account_name,phone').eq('shop_id', shop.id).eq('is_active', true),
      sb.from('shipping_zones').select('region,township,fee').eq('shop_id', shop.id),
    ]);
    if (ae || ze) return sendJson(res, 502, {error: 'Checkout configuration unavailable'});
    return sendJson(res, 200, {accounts: (accounts || []).map((r: any) => ({provider:r.provider,label:r.provider==='kpay'?'KBZPay':'WavePay',accountName:r.account_name,phone:r.phone,tail:''})), zones: zones || [], defaultFee: shop.default_delivery_fee}, true);
  }
  if (req.method === 'POST') {
    if (!rateLimit(req, 10)) return sendJson(res, 429, {error: mapDbError('rate_limit_exceeded')});
    const b = req.body || {};
    const slug = clean(b.slug, 100);
    const customer = {
      name: clean(b.customer?.name, 120), phone: clean(b.customer?.phone, 30),
      street: clean(b.customer?.street, 300), region: clean(b.customer?.region, 100), township: clean(b.customer?.township, 100),
    };
    const paymentMethod = clean(b.paymentMethod, 30);
    const paymentRefTail = clean(b.paymentRefTail, 20);
    const rawItems = Array.isArray(b.items) ? b.items.slice(0, 100) : [];
    const items = rawItems.map((i: any) => ({product_id: clean(i?.id, 100), qty: Math.min(Math.max(Math.floor(Number(i?.qty) || 0), 0), 100)})).filter((i: any) => i.product_id && i.qty > 0);
    if (!slug || !customer.name || !customer.phone || !customer.street || !customer.region || !customer.township || !paymentMethod || items.length === 0) {
      return sendJson(res, 400, {error: 'Invalid checkout payload'});
    }
    const {data, error} = await sb.rpc('place_order', {
      p_shop_slug: slug, p_customer_name: customer.name, p_customer_phone: customer.phone,
      p_street: customer.street, p_region: customer.region, p_township: customer.township,
      p_payment_method: paymentMethod, p_payment_ref_tail: paymentRefTail,
      p_items: items,
    });
    if (error) return sendJson(res, 400, {error: mapDbError(error.message, 'Order တင်၍မရပါ — ပြန်လည်ကြိုးစားပါ။')});
    return sendJson(res, 200, {order: data});
  }
  return sendJson(res, 405, {error: 'Method not allowed'});
}
