import {createClient} from '@supabase/supabase-js';
import {supabaseEnv} from './_env.js';
import {sendJson} from './_http.js';
import {rateLimit} from './_rate-limit.js';

export default async function handler(req: any, res: any) {
  const env = supabaseEnv();
  if (!env) return sendJson(res, 503, {error: 'Backend unavailable'});
  const sb = createClient(env.url, env.key, {auth: {persistSession: false, autoRefreshToken: false}});
  if (req.method === 'GET') {
    const slug = String(req.query?.slug || '');
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
    if (!rateLimit(req, 10)) return sendJson(res, 429, {error: 'Too many requests'});
    const b = req.body || {};
    const {data, error} = await sb.rpc('place_order', {
      p_shop_slug: b.slug, p_customer_name: b.customer?.name, p_customer_phone: b.customer?.phone,
      p_street: b.customer?.street, p_region: b.customer?.region, p_township: b.customer?.township,
      p_payment_method: b.paymentMethod, p_payment_ref_tail: b.paymentRefTail || '',
      p_items: Array.isArray(b.items) ? b.items.map((i: any) => ({product_id:i.id, qty:i.qty})) : [],
    });
    if (error) return sendJson(res, 400, {error: error.message});
    return sendJson(res, 200, {order: data});
  }
  return sendJson(res, 405, {error: 'Method not allowed'});
}
