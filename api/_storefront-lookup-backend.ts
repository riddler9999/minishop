import {createClient} from '@supabase/supabase-js';

type LookupArgs = {
  slug: string;
  orderNo: string;
  phone: string;
  clientIp: string;
};

export async function lookupOrderBackend(args: LookupArgs) {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return {configured: false as const, data: null, error: null};

  const sb = createClient(url, key, {
    auth: {persistSession: false, autoRefreshToken: false},
    global: {headers: {'x-forwarded-for': args.clientIp}},
  });
  const result = await sb.rpc('lookup_order', {
    p_shop_slug: args.slug,
    p_order_no: args.orderNo,
    p_phone: args.phone,
  });
  return {configured: true as const, ...result};
}
