import {mapDbError} from '../src/domain/dbError.js';
import {sendJson} from './_http.js';
import {forwardedClientIp} from './_client-ip.js';
import {lookupOrderBackend} from './_storefront-lookup-backend.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return sendJson(res, 405, {error: 'Method not allowed'});
  const slug = String(req.query?.slug || '').trim();
  const orderNo = String(req.query?.orderNo || '').trim();
  const phone = String(req.query?.phone || '').trim();
  if (!slug || !orderNo || !phone) {
    return sendJson(res, 400, {error: 'Missing lookup fields'});
  }

  const backend = await lookupOrderBackend({
    slug,
    orderNo,
    phone,
    clientIp: forwardedClientIp(req),
  });
  if (!backend.configured) return sendJson(res, 503, {error: 'Backend unavailable'});
  const {data, error} = backend;

  if (error) {
    if (String(error.message).includes('rate_limit_exceeded')) {
      return sendJson(res, 429, {error: mapDbError(error.message)});
    }
    return sendJson(res, 502, {error: 'Order lookup unavailable'});
  }

  const lookupError =
    data && typeof data === 'object' && !Array.isArray(data)
      ? String((data as Record<string, unknown>).error ?? '')
      : '';
  if (lookupError === 'invalid_lookup') {
    return sendJson(res, 400, {error: mapDbError(lookupError)});
  }
  if (lookupError === 'order_not_found') {
    return sendJson(res, 404, {error: mapDbError(lookupError)});
  }

  return sendJson(res, 200, {order: data}, false);
}
