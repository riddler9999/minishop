const ALLOWED_BUCKETS = new Set(['product-images', 'shop-logos']);

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return res.status(405).end();
  const base = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const raw = req.query?.path;
  const parts = Array.isArray(raw) ? raw : String(raw || '').split('/').filter(Boolean);
  const bucket = parts.shift();
  if (!base || !bucket || !ALLOWED_BUCKETS.has(bucket) || parts.length === 0) return res.status(404).end();
  const safePath = parts.map((p: string) => encodeURIComponent(p)).join('/');
  const upstream = await fetch(`${base}/storage/v1/object/public/${encodeURIComponent(bucket)}/${safePath}`);
  if (!upstream.ok) return res.status(upstream.status).end();
  const type = upstream.headers.get('content-type');
  if (type) res.setHeader('Content-Type', type);
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800');
  if (req.method === 'HEAD') return res.status(200).end();
  const body = Buffer.from(await upstream.arrayBuffer());
  return res.status(200).send(body);
}
