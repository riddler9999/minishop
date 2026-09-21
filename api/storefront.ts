import {createClient} from '@supabase/supabase-js';

function json(res: any, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', status === 200 ? 'public, s-maxage=30, stale-while-revalidate=300' : 'no-store');
  res.end(JSON.stringify(body));
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return json(res, 405, {error: 'Method not allowed'});
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return json(res, 503, {error: 'Backend unavailable'});

  const slug = String(req.query?.slug || '').trim();
  if (!slug) return json(res, 400, {error: 'Missing shop slug'});
  const sb = createClient(url, key, {auth: {persistSession: false, autoRefreshToken: false}});

  const {data: shop, error: shopError} = await sb.from('shops')
    .select('id,name,logo_url,default_delivery_fee')
    .eq('slug', slug).eq('is_active', true).maybeSingle();
  if (shopError || !shop) return json(res, 404, {error: 'Shop not found'});

  const action = String(req.query?.action || 'shop');
  if (action === 'shop') return json(res, 200, {shop: {id: shop.id, name: shop.name, logoUrl: shop.logo_url, defaultDeliveryFee: shop.default_delivery_fee}});

  if (action === 'categories') {
    const {data, error} = await sb.from('products').select('category').eq('shop_id', shop.id).eq('status', 'active').not('category', 'is', null);
    if (error) return json(res, 502, {error: 'Catalog unavailable'});
    return json(res, 200, {categories: Array.from(new Set((data || []).map((r: any) => r.category).filter(Boolean)))});
  }

  if (action === 'product') {
    const id = String(req.query?.id || '');
    const {data, error} = await sb.from('products').select('*').eq('id', id).eq('shop_id', shop.id).eq('status', 'active').maybeSingle();
    if (error || !data) return json(res, 404, {error: 'Product not found'});
    return json(res, 200, {product: data});
  }

  if (action === 'products') {
    let q = sb.from('products').select('*', {count: 'exact'}).eq('shop_id', shop.id).eq('status', 'active');
    if (req.query?.featured === 'true') q = q.eq('is_promotion', true);
    if (req.query?.category) q = q.eq('category', String(req.query.category));
    const search = String(req.query?.q || '').trim().replace(/[\\,()]/g, '\\$&');
    if (search) q = q.or(`name.ilike.%${search}%,category.ilike.%${search}%,color.ilike.%${search}%`);
    q = q.order('arrival_date', {ascending: false, nullsFirst: false});
    const offset = Math.max(0, Number(req.query?.offset || 0));
    const limitRaw = Number(req.query?.limit);
    if (Number.isFinite(limitRaw) && limitRaw > 0) q = q.range(offset, offset + Math.min(limitRaw, 100) - 1);
    const {data, error, count} = await q;
    if (error) return json(res, 502, {error: 'Catalog unavailable'});
    return json(res, 200, {products: data || [], total: count ?? data?.length ?? 0});
  }

  return json(res, 400, {error: 'Unknown action'});
}
