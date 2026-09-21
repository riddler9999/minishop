import {createClient} from '@supabase/supabase-js';
import {supabaseEnv} from './_env.js';
import {sendJson} from './_http.js';
import {rateLimit} from './_rate-limit.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return sendJson(res, 405, {error: 'Method not allowed'});
  if (!rateLimit(req, 20)) return sendJson(res, 429, {error: 'Too many requests'});
  const env = supabaseEnv();
  if (!env) return sendJson(res, 503, {error: 'Backend unavailable'});
  const slug = String(req.query?.slug || '').trim();
  const orderNo = String(req.query?.orderNo || '').trim();
  const phone = String(req.query?.phone || '').trim();
  if (!slug || !orderNo || !phone) return sendJson(res, 400, {error: 'Missing lookup fields'});
  const sb = createClient(env.url, env.key, {auth: {persistSession: false, autoRefreshToken: false}});
  const {data, error} = await sb.rpc('lookup_order', {p_shop_slug: slug, p_order_no: orderNo, p_phone: phone});
  if (error) return sendJson(res, 502, {error: 'Order lookup unavailable'});
  return sendJson(res, 200, {order: data}, false);
}
