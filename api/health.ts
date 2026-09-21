import {createClient} from '@supabase/supabase-js';

export default async function handler(_req: any, res: any) {
  const started = Date.now();
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return res.status(503).json({status: 'degraded', database: false, latencyMs: Date.now() - started});
  try {
    const sb = createClient(url, key, {auth: {persistSession: false, autoRefreshToken: false}});
    const {error} = await sb.from('shops').select('id').limit(1);
    if (error) throw error;
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({status: 'ok', database: true, latencyMs: Date.now() - started});
  } catch {
    return res.status(503).json({status: 'degraded', database: false, latencyMs: Date.now() - started});
  }
}
