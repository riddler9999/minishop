// ---- TENANCY: the signed-in seller's own shop -------------------------------
// Admin-side counterpart to shopResolver.ts: resolves the shop by owner_id
// (enforced by RLS) rather than by URL slug. Every admin write scopes to it.

import {requireSupabase} from '@/core/supabase/client';

// The signed-in seller's own shop (owner_id = auth.uid(), enforced by RLS).
// NOTE: cached per browser session, not per user — fine for the current
// one-seller-per-browser admin console; revisit if that ever changes.
let cachedOwnerShopId: string | null = null;

export async function resolveOwnShopId(): Promise<string> {
  if (cachedOwnerShopId) return cachedOwnerShopId;
  const sb = requireSupabase();
  const {data: auth} = await sb.auth.getUser();
  if (!auth.user) throw new Error('Login လိုအပ်ပါသည်။');

  const {data, error} = await sb.from('shops').select('id').eq('owner_id', auth.user.id).maybeSingle();
  if (error || !data) throw new Error('ဤအကောင့်တွင် ဆိုင် မရှိသေးပါ။');

  cachedOwnerShopId = data.id;
  return cachedOwnerShopId;
}
