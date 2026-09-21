import {createClient} from '@supabase/supabase-js';
import {supabaseEnv} from './_env.js';
import {sendJson} from './_http.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return sendJson(res, 405, {error: 'Method not allowed'});
  const env = supabaseEnv();
  if (!env) return sendJson(res, 503, {error: 'Backend unavailable'});
  const body = req.body || {};
  const sb = createClient(env.url, env.key, {auth: {persistSession: false, autoRefreshToken: false}});
  const {data, error} = await sb.rpc('place_order', body);
  if (error) return sendJson(res, 400, {error: error.message});
  return sendJson(res, 200, {order: data});
}
