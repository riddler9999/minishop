import {createClient} from '@supabase/supabase-js';
import {supabaseEnv} from '../server/_env.js';
import {sendJson} from '../server/_http.js';
import {BUYER_LEGACY_RELATIONS, BUYER_SAFE_RELATIONS, isMissingBuyerProjection} from '../server/_buyer-relations.js';

export default async function handler(req: any, res: any) {
  const started = Date.now();
  if (req.method !== 'GET') return sendJson(res, 405, {error: 'Method not allowed'});
  const env = supabaseEnv();
  if (!env) return sendJson(res, 503, {status: 'degraded', database: false, latencyMs: Date.now() - started});
  try {
    const sb = createClient(env.url, env.key, {auth: {persistSession: false, autoRefreshToken: false}});
    let result = await sb.from(BUYER_SAFE_RELATIONS.shops).select('id').limit(1);
    if (isMissingBuyerProjection(result.error)) {
      result = await sb.from(BUYER_LEGACY_RELATIONS.shops).select('id').limit(1);
    }
    if (result.error) throw result.error;
    return sendJson(res, 200, {status: 'ok', database: true, latencyMs: Date.now() - started});
  } catch {
    return sendJson(res, 503, {status: 'degraded', database: false, latencyMs: Date.now() - started});
  }
}
