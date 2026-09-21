import {createClient} from '@supabase/supabase-js';
import {supabaseEnv} from './_env.js';
import {sendJson} from './_http.js';

export default async function handler(req: any, res: any) {
  const started = Date.now();
  if (req.method !== 'GET') return sendJson(res, 405, {error: 'Method not allowed'});
  const env = supabaseEnv();
  if (!env) return sendJson(res, 503, {status: 'degraded', database: false, latencyMs: Date.now() - started});
  try {
    const sb = createClient(env.url, env.key, {auth: {persistSession: false, autoRefreshToken: false}});
    const {error} = await sb.from('shops').select('id').limit(1);
    if (error) throw error;
    return sendJson(res, 200, {status: 'ok', database: true, latencyMs: Date.now() - started});
  } catch {
    return sendJson(res, 503, {status: 'degraded', database: false, latencyMs: Date.now() - started});
  }
}
