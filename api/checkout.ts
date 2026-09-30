import {createClient} from '@supabase/supabase-js';
import {mapDbError} from '../src/domain/dbError.js';
import {supabaseEnv} from './_env.js';
import {sendJson} from './_http.js';
import {clean} from './_validation.js';
import {normalizeCheckoutInput, normalizeCheckoutQuoteInput} from './checkout-input.js';
import {forwardedClientIp} from './_client-ip.js';
import {BUYER_LEGACY_RELATIONS, BUYER_SAFE_RELATIONS, isMissingBuyerProjection, type BuyerRelations} from './_buyer-relations.js';

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
      global: {headers: {'x-forwarded-for': forwardedClientIp(req)}},
    });

    if (req.method === 'GET') {
      const slug = clean(req.query?.slug, 100);
      if (!slug) return sendJson(res, 400, {error: 'Missing shop'});
      let buyerRelations: BuyerRelations = BUYER_SAFE_RELATIONS;
      let shopResult = await sb
        .from(buyerRelations.shops)
        .select('id,default_delivery_fee,delivery_service,origin_region,origin_township')
        .eq('slug', slug)
        .maybeSingle();
      if (isMissingBuyerProjection(shopResult.error)) {
        buyerRelations = BUYER_LEGACY_RELATIONS;
        shopResult = await sb
          .from(buyerRelations.shops)
          .select('id,default_delivery_fee,delivery_service,origin_region,origin_township')
          .eq('slug', slug)
          .eq('is_active', true)
          .maybeSingle();
      }
      const {data: shop} = shopResult;
      if (!shop) return sendJson(res, 404, {error: 'Shop not found'});

      let accountsQuery: any = sb.from(buyerRelations.paymentAccounts).select('provider,account_name,phone').eq('shop_id', shop.id);
      if (buyerRelations === BUYER_LEGACY_RELATIONS) accountsQuery = accountsQuery.eq('is_active', true);
      const [{data: accounts, error: ae}, {data: zones, error: ze}] = await Promise.all([
        accountsQuery,
        sb.from(buyerRelations.shippingZones).select('region,township,fee').eq('shop_id', shop.id),
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

    if (req.method === 'POST' && req.body?.action === 'quote') {
      const input = normalizeCheckoutQuoteInput(req.body);
      if (!input) return sendJson(res, 400, {error: 'Invalid quote payload'});

      const {data, error} = await sb.rpc('quote_order', {
        p_shop_slug: input.slug,
        p_region: input.region,
        p_township: input.township,
        p_items: input.items,
      });
      if (error) {
        return sendJson(
          res,
          400,
          {error: mapDbError(error.message, 'ပို့ဆောင်ခနှင့် စုစုပေါင်းဈေးနှုန်း တွက်ချက်၍မရပါ။')},
        );
      }
      return sendJson(res, 200, {quote: data});
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
        p_expected_item_total: input.expectedItemTotal,
        p_expected_delivery_fee: input.expectedDeliveryFee,
        p_idempotency_key: input.idempotencyKey,
      });

      if (error) {
        const message = String(error.message);
        if (message.includes('quote_stale')) {
          const {data: freshQuote, error: quoteError} = await sb.rpc('quote_order', {
            p_shop_slug: input.slug,
            p_region: input.customer.region,
            p_township: input.customer.township,
            p_items: input.items,
          });
          return sendJson(res, 409, {
            code: 'quote_stale',
            error: 'ဈေးနှုန်း သို့မဟုတ် ပို့ဆောင်ခ ပြောင်းလဲသွားပါပြီ။ စုစုပေါင်းအသစ်ကို စစ်ပြီး ထပ်အတည်ပြုပါ။',
            freshQuote: quoteError ? null : freshQuote,
          });
        }

        const status = message.includes('rate_limit_exceeded') ? 429 : 400;
        return sendJson(
          res,
          status,
          {error: mapDbError(message, 'Order တင်၍မရပါ — ပြန်လည်ကြိုးစားပါ။')},
        );
      }

      const order = data as Record<string, unknown> | null;
      if (order?.order_no) {
        const eventKey = `order-created:${input.slug}:${String(order.order_no)}`;
        const notice = await sb.rpc('enqueue_notification', {
          p_event_key: eventKey,
          p_event_type: 'order_created',
          p_recipient: input.customer.phone,
          p_payload: {
            order_no: order.order_no,
            grand_total: order.grand_total,
            status: order.status,
          },
        });
        if (notice.error) {
          return sendJson(res, 503, {
            error: 'Order was created but notification tracking could not be recorded. Please keep your order number.',
            order,
          });
        }
      }
      return sendJson(res, 200, {order: data});
    }

    return sendJson(res, 405, {error: 'Method not allowed'});
  };
}

export default createCheckoutHandler();
