import {createClient} from '@supabase/supabase-js';
import {mapProductRow} from './_map.js';
import {sendJson} from './_http.js';

const MAX_MEDIA_BYTES = 5 * 1024 * 1024;
const PUBLIC_PRODUCT_COLUMNS = 'id,shop_id,item_code,name,description,category,color,price,promo_price,is_promotion,stock,status,image_url,arrival_date,expiry_date';

function media(url: string | null) {
  if (!url) return null;
  const m = url.match(/\/storage\/v1\/object\/public\/(product-images|shop-logos)\/(.+)$/);
  return m ? `/api/storefront/${m[1]}/${m[2]}` : url;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return sendJson(res, 405, {error: 'Method not allowed'});
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return sendJson(res, 503, {error: 'Backend unavailable'});
  const mediaBucket = String(req.query?.mediaBucket || '');
  const mediaPath = String(req.query?.mediaPath || '');
  if (mediaBucket || mediaPath) {
    if (!['product-images', 'shop-logos'].includes(mediaBucket) || !mediaPath) return res.status(404).end();
    const safePath = mediaPath.split('/').filter(Boolean).map((part: string) => encodeURIComponent(part)).join('/');
    const upstream = await fetch(`${url}/storage/v1/object/public/${encodeURIComponent(mediaBucket)}/${safePath}`);
    if (!upstream.ok) return res.status(upstream.status).end();
    const contentLength = Number(upstream.headers.get('content-length') || '0');
    if (Number.isFinite(contentLength) && contentLength > MAX_MEDIA_BYTES) return res.status(413).end();
    const type = upstream.headers.get('content-type');
    if (type && !type.startsWith('image/')) return res.status(415).end();
    if (type) res.setHeader('Content-Type', type);
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800');
    if (req.method === 'HEAD') return res.status(200).end();
    const body = Buffer.from(await upstream.arrayBuffer());
    if (body.byteLength > MAX_MEDIA_BYTES) return res.status(413).end();
    return res.status(200).send(body);
  }
  if (req.method === 'HEAD') return res.status(404).end();
  const slug = String(req.query?.slug || '').trim();
  if (!slug) return sendJson(res, 400, {error: 'Missing shop slug'});
  const sb = createClient(url, key, {auth: {persistSession: false, autoRefreshToken: false}});
  const {data: shop, error: shopError} = await sb.from('shops').select('id,name,logo_url,default_delivery_fee').eq('slug', slug).eq('is_active', true).maybeSingle();
  if (shopError || !shop) return sendJson(res, 404, {error: 'Shop not found'});
  const action = String(req.query?.action || 'shop');
  if (action === 'shop') return sendJson(res, 200, {shop: {id: shop.id, name: shop.name, logoUrl: media(shop.logo_url), defaultDeliveryFee: shop.default_delivery_fee}}, true);
  if (action === 'categories') {
    const {data, error} = await sb.from('products').select('category').eq('shop_id', shop.id).eq('status', 'active').not('category', 'is', null);
    if (error) return sendJson(res, 502, {error: 'Catalog unavailable'});
    return sendJson(res, 200, {categories: Array.from(new Set((data || []).map((r: any) => r.category).filter(Boolean)))}, true);
  }
  if (action === 'product') {
    const id = String(req.query?.id || '');
    const {data, error} = await sb.from('products').select(PUBLIC_PRODUCT_COLUMNS).eq('id', id).eq('shop_id', shop.id).eq('status', 'active').maybeSingle();
    if (error || !data) return sendJson(res, 404, {error: 'Product not found'});
    return sendJson(res, 200, {product: mapProductRow(data)}, true);
  }
  if (action === 'products') {
    let q = sb.from('products').select(PUBLIC_PRODUCT_COLUMNS, {count: 'exact'}).eq('shop_id', shop.id).eq('status', 'active');
    if (req.query?.featured === 'true') q = q.eq('is_promotion', true);
    if (req.query?.category) q = q.eq('category', String(req.query.category));
    const search = String(req.query?.q || '').trim().replace(/[\\,()]/g, '\\$&');
    if (search) q = q.or(`name.ilike.%${search}%,category.ilike.%${search}%,color.ilike.%${search}%`);
    q = q.order('arrival_date', {ascending: false, nullsFirst: false});
    const offset = Math.max(0, Number(req.query?.offset || 0));
    const limitRaw = Number(req.query?.limit);
    if (Number.isFinite(limitRaw) && limitRaw > 0) q = q.range(offset, offset + Math.min(limitRaw, 100) - 1);
    const {data, error, count} = await q;
    if (error) return sendJson(res, 502, {error: 'Catalog unavailable'});
    return sendJson(res, 200, {products: (data || []).map(mapProductRow), total: count ?? data?.length ?? 0}, true);
  }
  return sendJson(res, 400, {error: 'Unknown action'});
}
