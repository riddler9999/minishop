import {createClient} from '@supabase/supabase-js';
import {mapProductRow} from './_map.js';
import {sendJson} from './_http.js';
import {loadBuyerStoreDesign} from './_storefront-design.js';
import {normalizeProductSourceLimit} from './_storefront-product-source.js';
import {BUYER_LEGACY_RELATIONS, BUYER_SAFE_RELATIONS, isMissingBuyerProjection, type BuyerRelations} from './_buyer-relations.js';
import {MAX_PUBLIC_MEDIA_BYTES, allowedPublicImageContentType, isPublicMediaLengthAllowed} from './_public-media.js';

const PUBLIC_PRODUCT_COLUMNS = 'id,shop_id,name,description,category,color,size,price,promo_price,is_promotion,stock,status,images,arrival_date,created_at';
const PRODUCT_SOURCE_RULES = new Set(['new_arrivals', 'sale', 'category', 'best_selling']);
const MAX_MANUAL_PRODUCT_IDS = 24;

function media(url: string | null) {
  if (!url) return null;
  const m = url.match(/\/storage\/v1\/object\/public\/(product-images|shop-logos)\/(.+)$/);
  return m ? `/api/storefront/${m[1]}/${m[2]}` : url;
}

function productTimestamp(row: any): number {
  const raw = row?.created_at ?? row?.arrival_date;
  if (!raw) return 0;
  const parsed = Date.parse(String(raw));
  return Number.isFinite(parsed) ? parsed : 0;
}

function newestRowsFirst(a: any, b: any): number {
  const delta = productTimestamp(b) - productTimestamp(a);
  return delta || String(a.id).localeCompare(String(b.id));
}

function parseManualProductIds(raw: unknown): string[] {
  const values = Array.isArray(raw) ? raw : String(raw ?? '').split(',');
  return Array.from(new Set(values.map((value) => String(value).trim()).filter(Boolean))).slice(0, MAX_MANUAL_PRODUCT_IDS);
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
    if (!isPublicMediaLengthAllowed(upstream.headers.get('content-length'))) return res.status(413).end();
    const type = allowedPublicImageContentType(upstream.headers.get('content-type'));
    if (!type) return res.status(415).end();
    if (type) res.setHeader('Content-Type', type);
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800');
    if (req.method === 'HEAD') return res.status(200).end();
    const body = Buffer.from(await upstream.arrayBuffer());
    if (body.byteLength > MAX_PUBLIC_MEDIA_BYTES) return res.status(413).end();
    return res.status(200).send(body);
  }
  if (req.method === 'HEAD') return res.status(404).end();
  const slug = String(req.query?.slug || '').trim();
  if (!slug) return sendJson(res, 400, {error: 'Missing shop slug'});
  const sb = createClient(url, key, {auth: {persistSession: false, autoRefreshToken: false}});
  let buyerRelations: BuyerRelations = BUYER_SAFE_RELATIONS;
  let shopResult = await sb.from(buyerRelations.shops).select('id,name,logo_url,default_delivery_fee').eq('slug', slug).maybeSingle();
  if (isMissingBuyerProjection(shopResult.error)) {
    buyerRelations = BUYER_LEGACY_RELATIONS;
    shopResult = await sb.from(buyerRelations.shops).select('id,name,logo_url,default_delivery_fee').eq('slug', slug).eq('is_active', true).maybeSingle();
  }
  const {data: shop, error: shopError} = shopResult;
  if (shopError || !shop) return sendJson(res, 404, {error: 'Shop not found'});
  const action = String(req.query?.action || 'shop');
  if (action === 'store-design') {
    const design = await loadBuyerStoreDesign(sb as any, {shopId: shop.id, shopSlug: slug}, buyerRelations.shops);
    if (!design.ok) return sendJson(res, 502, {error: 'Store design unavailable'});
    return sendJson(res, 200, {document: design.document}, true);
  }
  if (action === 'shop') {
    let theme: unknown = null;
    const {data: themeRow, error: themeError} = await sb.from(buyerRelations.shops).select('theme').eq('id', shop.id).maybeSingle();
    if (!themeError && themeRow) theme = (themeRow as {theme?: unknown}).theme ?? null;
    return sendJson(res, 200, {shop: {id: shop.id, name: shop.name, logoUrl: media(shop.logo_url), defaultDeliveryFee: shop.default_delivery_fee, theme}}, true);
  }
  if (action === 'categories') {
    const {data, error} = await sb.from(buyerRelations.products).select('category').eq('shop_id', shop.id).eq('status', 'active').not('category', 'is', null);
    if (error) return sendJson(res, 502, {error: 'Catalog unavailable'});
    return sendJson(res, 200, {categories: Array.from(new Set((data || []).map((r: any) => r.category).filter(Boolean)))}, true);
  }
  if (action === 'product') {
    const id = String(req.query?.id || '');
    const {data, error} = await sb.from(buyerRelations.products).select(PUBLIC_PRODUCT_COLUMNS).eq('id', id).eq('shop_id', shop.id).eq('status', 'active').maybeSingle();
    if (error || !data) return sendJson(res, 404, {error: 'Product not found'});
    return sendJson(res, 200, {product: mapProductRow(data)}, true);
  }
  if (action === 'section-products') {
    const mode = String(req.query?.mode || 'dynamic');
    const limit = normalizeProductSourceLimit(req.query?.limit);

    if (mode === 'manual') {
      const ids = parseManualProductIds(req.query?.productIds);
      if (ids.length === 0) return sendJson(res, 200, {products: []}, true);
      const {data, error} = await sb.from(buyerRelations.products).select(PUBLIC_PRODUCT_COLUMNS).eq('shop_id', shop.id).eq('status', 'active').in('id', ids).limit(MAX_MANUAL_PRODUCT_IDS);
      if (error) return sendJson(res, 502, {error: 'Catalog unavailable'});
      const byId = new Map((data || []).map((row: any) => [String(row.id), row]));
      return sendJson(res, 200, {products: ids.flatMap((id) => byId.has(id) ? [mapProductRow(byId.get(id))] : [])}, true);
    }

    const rule = String(req.query?.rule || 'new_arrivals');
    if (!PRODUCT_SOURCE_RULES.has(rule)) return sendJson(res, 400, {error: 'Invalid product source'});

    if (rule === 'best_selling') {
      const {data: rankedRows, error: rankError} = await sb.rpc('load_best_selling_product_ids', {p_shop_slug: slug, p_limit: limit});
      if (rankError) return sendJson(res, 502, {error: 'Catalog unavailable'});
      const rankedIds: string[] = (rankedRows || []).map((row: any) => String(row.product_id)).filter(Boolean).slice(0, limit);
      if (rankedIds.length === 0) return sendJson(res, 200, {products: []}, true);
      const {data: productRows, error: productError} = await sb.from(buyerRelations.products).select(PUBLIC_PRODUCT_COLUMNS).eq('shop_id', shop.id).eq('status', 'active').in('id', rankedIds).limit(limit);
      if (productError) return sendJson(res, 502, {error: 'Catalog unavailable'});
      const byId = new Map((productRows || []).map((row: any) => [String(row.id), row]));
      return sendJson(res, 200, {products: rankedIds.flatMap((id: string) => byId.has(id) ? [mapProductRow(byId.get(id))] : [])}, true);
    }

    let sourceQuery = sb.from(buyerRelations.products).select(PUBLIC_PRODUCT_COLUMNS).eq('shop_id', shop.id).eq('status', 'active');
    if (rule === 'sale') sourceQuery = sourceQuery.eq('is_promotion', true).not('promo_price', 'is', null).gt('promo_price', 0);
    if (rule === 'category') {
      const category = String(req.query?.category || '').trim();
      if (!category) return sendJson(res, 200, {products: []}, true);
      sourceQuery = sourceQuery.eq('category', category);
    }
    const {data, error} = await sourceQuery.order('created_at', {ascending: false}).order('id', {ascending: true}).limit(limit);
    if (error) return sendJson(res, 502, {error: 'Catalog unavailable'});
    return sendJson(res, 200, {products: (data || []).sort(newestRowsFirst).map(mapProductRow)}, true);
  }
  if (action === 'products') {
    let q = sb.from(buyerRelations.products).select(PUBLIC_PRODUCT_COLUMNS, {count: 'exact'}).eq('shop_id', shop.id).eq('status', 'active');
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
