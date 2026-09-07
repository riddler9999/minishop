// ---- Seller's own shop — lookup + onboarding creation -----------------------
// Split out from src/lib/backend.ts (the storefront/admin data layer) because
// this is needed one step earlier: BEFORE a shop row exists at all, to decide
// whether a freshly-authenticated seller should land on the onboarding form or
// the dashboard (see App.tsx's RequireAdmin and pages/admin/Onboarding.tsx).
// backend.ts's resolveOwnShopId() intentionally throws when there's no shop
// yet — useful once you already know one should exist, wrong for this check.

import {requireSupabase} from './supabase';

export interface OwnShop {
  id: string;
  slug: string;
  name: string;
}

/** Null means this user hasn't created a shop yet — not an error. */
export async function getOwnShop(userId: string): Promise<OwnShop | null> {
  const sb = requireSupabase();
  const {data, error} = await sb
    .from('shops')
    .select('id, slug, name')
    .eq('owner_id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export interface CreateShopInput {
  name: string;
  slug: string;
  phone: string;
  defaultDeliveryFee: number;
}

export async function createOwnShop(userId: string, input: CreateShopInput): Promise<OwnShop> {
  const sb = requireSupabase();
  const {data, error} = await sb
    .from('shops')
    .insert({
      owner_id: userId,
      name: input.name.trim(),
      slug: input.slug.trim(),
      phone: input.phone.trim() || null,
      default_delivery_fee: input.defaultDeliveryFee,
    })
    .select('id, slug, name')
    .single();
  if (error) {
    // 23505 = unique_violation (slug already taken).
    if (error.code === '23505') {
      throw new Error('ဤ link (slug) ကို အသုံးပြုပြီးသားဖြစ်ပါသည် — တခြား link ရွေးပါ။');
    }
    if (error.message.includes('shops_slug_format')) {
      throw new Error(
        'Link format မှားနေပါသည် — အင်္ဂလိပ်စာလုံးအသေး/နံပါတ်/(-) ဖြင့်၊ ၃ လုံးအထက် ဖြစ်ရပါမည်။',
      );
    }
    throw new Error(error.message);
  }
  return data;
}
