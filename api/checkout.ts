import {createClient} from '@supabase/supabase-js';
import {mapDbError} from '../src/domain/dbError.ts';
import {supabaseEnv} from './_env.ts';
import {sendJson} from './_http.ts';
import {clean} from './_validation.ts';
import {normalizeCheckoutInput} from './checkout-input.ts';
import {forwardedClientIp} from './_client-ip.ts';

type CheckoutDeps = {
  createClient: typeof createClient;
  env: typeof supabaseEnv;
};

export function createCheckoutHandler(
  deps: CheckoutDeps = {createClient, env: supabaseEnv},
) {
  return async function handler(req: any, res: any) {
    const env = deps.env();
    if (!env) return sendJson(res, 503, {error: 'Backend unavailable'});
    const sb = deps.createClient(env.url, env.key, {
      auth: {persistSession: false, autoRefreshToken: false},
      // Preserve Vercel's requester IP across the server-to-Supabase hop so
      // private.enforce_rate_limit() keys by buyer instead of Vercel egress.
      global: {headers: {'x-forwarded-for': forwardedClientIp(req)}},
    });

    if (req.method === 'GET') {
      const slug = clean(req.query?.slug, 100);
      if (!slug) return sendJson(res, 400, {error: 'Missing shop'});
      const {data: shop} = await sb
        .from('shops')
        .select('id,default_delivery_fee,delivery_service,origin_region,origin_township')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();
      if (!shop) return sendJson(res, 404, {error: 'Shop not found'});

      const [{data: accounts, error: ae}, {data: zones, error: ze}] = await Promise.all([
        sb.from('payment_accounts').select('provider,account_name,phone').eq('shop_id', shop.id).eq('is_active', true),
        sb.from('shipping_zones').select('region,township,fee').eq('shop_id', shop.id),
      ]);
      if (ae || ze) return sendJson(res, 502, {error: 'Checkout configuration unavailable'});

      return sendJson(
        res,
        200,
        {
          accounts: (accounts || []).map((r: any) => ({
            provider: r.provider,
            label: r.provider === 'kpay' ? 'KBZPay' : 'WavePay',
            accountName: r.account_name,
            phone: r.phone,
            tail: '',
          })),
          zones: zones || [],
          defaultFee: shop.default_delivery_fee,
          deliveryService: shop.delivery_service,
          origin: {region: shop.origin_region, township: shop.origin_township},
        },
        true,
      );
    }

    if (req.method === 'POST') {
      const input = normalizeCheckoutInput(req.body);
      if (!input) {
        return sendJson(res, 400, {error: 'Invalid checkout payload'});
      }

      const {data, error} = await sb.rpc('place_order', {
        p_shop_slug: input.slug,
        p_customer_name: input.customer.name,
        p_customer_phone: input.customer.phone,
        p_street: input.customer.street,
        p_region: input.customer.region,
        p_township: input.customer.township,
        p_payment_method: input.paymentMethod,
        p_payment_ref_tail: input.paymentRefTail,
        p_items: input.items,
        p_idempotency_key: input.idempotencyKey,
      });

      if (error) {
        const status = String(error.message).includes('rate_limit_exceeded') ? 429 : 400;
        return sendJson(
          res,
          status,
          {error: mapDbError(error.message, 'Order တင်၍မရပါ — ပြန်လည်ကြိုးစားပါ။')},
        );
      }
      return sendJson(res, 200, {order: data});
    }

    return sendJson(res, 405, {error: 'Method not allowed'});
  };
}

export default createCheckoutHandler();
