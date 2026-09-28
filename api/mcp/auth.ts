import {createClient, type SupabaseClient} from '@supabase/supabase-js';
import type {MiniShopCapability, SellerContext} from './contracts.ts';
import {MINI_SHOP_CAPABILITIES} from './contracts.ts';
import {McpError} from './errors.ts';

export interface AuthDeps {
  createAuthClient(): SupabaseClient;
  createSellerClient(token: string): SupabaseClient;
  capabilitiesForUser(userId: string, sellerClient: SupabaseClient): Promise<ReadonlySet<MiniShopCapability>>;
}

function bearerToken(req: any): string | null {
  const raw = String(req?.headers?.authorization ?? '').trim();
  const match = raw.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

function envValue(name: string, fallback: string): string | undefined {
  return process.env[name] || process.env[fallback];
}

function defaultDeps(): AuthDeps {
  const url = envValue('SUPABASE_URL', 'VITE_SUPABASE_URL');
  const anon = envValue('SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY');
  if (!url || !anon) {
    throw new McpError('INTERNAL_ERROR', 500, 'MiniShop MCP backend is not configured.');
  }
  return {
    createAuthClient() {
      return createClient(url, anon, {auth: {persistSession: false, autoRefreshToken: false}});
    },
    createSellerClient(token: string) {
      return createClient(url, anon, {
        auth: {persistSession: false, autoRefreshToken: false},
        global: {headers: {Authorization: `Bearer ${token}`}},
      });
    },
    async capabilitiesForUser() {
      // V1 trusted server policy: authenticated sellers receive the approved seller capability set.
      // The set is never accepted from request input. A grants table/claim can replace this policy
      // later without changing the external capability vocabulary.
      return new Set(MINI_SHOP_CAPABILITIES);
    },
  };
}

export async function authenticateSeller(
  req: any,
  deps: AuthDeps = defaultDeps(),
): Promise<{context: SellerContext; supabase: SupabaseClient}> {
  const token = bearerToken(req);
  if (!token) throw new McpError('AUTH_REQUIRED', 401, 'Authentication is required.');

  const auth = deps.createAuthClient();
  const {data, error} = await auth.auth.getUser(token);
  if (error || !data.user) {
    throw new McpError('TOKEN_EXPIRED', 401, 'Authentication is no longer valid.');
  }

  const sellerClient = deps.createSellerClient(token);
  const {data: shop, error: shopError} = await sellerClient
    .from('shops')
    .select('id')
    .eq('owner_id', data.user.id)
    .maybeSingle();

  if (shopError || !shop) {
    throw new McpError('SHOP_NOT_FOUND', 404, 'No MiniShop store is available for this seller.');
  }

  const capabilities = await deps.capabilitiesForUser(data.user.id, sellerClient);
  return {
    context: {userId: data.user.id, shopId: String(shop.id), capabilities},
    supabase: sellerClient,
  };
}
