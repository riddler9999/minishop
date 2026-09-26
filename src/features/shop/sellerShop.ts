// ---- Seller's own shop — lookup + onboarding creation -----------------------
// Kept apart from this feature's api/ modules because it is needed one step
// earlier: BEFORE a shop row exists at all, to decide whether a freshly-
// authenticated seller should land on the onboarding form or the dashboard
// (see @/app/routes/RequireAdmin.tsx and @/features/auth/pages/Onboarding.tsx).
// @/features/tenancy/ownShop.ts's resolveOwnShopId() intentionally throws when
// there's no shop yet — right once you know one should exist, wrong here.

import {requireSupabase} from '@/core/supabase/client';
import type {TablesUpdate} from '@/core/supabase/database.types';
import {mapDbError, mapUpdateOwnShopError} from '@/domain/dbError';
import {recoverCreateShopError} from '@/domain/shopAccess';

export interface OwnShop {
  id: string;
  slug: string;
  name: string;
  phone: string | null;
  logoUrl: string | null;
  defaultDeliveryFee: number;
  originRegion: string | null;
  originTownship: string | null;
  deliveryService: 'ninjavan' | 'custom';
  // Per-tenant plan, from the `shops.plan` column added in migration 0003.
  // Selected below → plan.tsx's resolvePlan() gates features per-tenant.
  plan?: string | null;
}

type ShopRow = {
  id: string;
  slug: string;
  name: string;
  phone: string | null;
  logo_url: string | null;
  default_delivery_fee: number;
  origin_region: string | null;
  origin_township: string | null;
  delivery_service: 'ninjavan' | 'custom';
  plan: string | null;
};

function mapOwnShop(r: ShopRow): OwnShop {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    phone: r.phone,
    logoUrl: r.logo_url,
    defaultDeliveryFee: r.default_delivery_fee,
    originRegion: r.origin_region,
    originTownship: r.origin_township,
    deliveryService: r.delivery_service,
    plan: r.plan,
  };
}

// Columns fetched for the seller's own shop. `plan` (migration 0003) makes the
// frontend gating layer (plan.tsx) per-tenant.
const OWN_SHOP_COLUMNS = 'id, slug, name, phone, logo_url, default_delivery_fee, origin_region, origin_township, delivery_service, plan';

/** Null means this user hasn't created a shop yet — not an error. */
export async function getOwnShop(userId: string): Promise<OwnShop | null> {
  const sb = requireSupabase();
  const {data, error} = await sb
    .from('shops')
    .select(OWN_SHOP_COLUMNS)
    .eq('owner_id', userId)
    .maybeSingle();
  if (error) throw new Error(mapDbError(error.message, 'ဆိုင် အချက်အလက် ရယူ၍မရပါ။'));
  return data ? mapOwnShop(data as ShopRow) : null;
}

export interface UpdateShopInput {
  name?: string;
  phone?: string | null;
  logoUrl?: string | null;
  defaultDeliveryFee?: number;
  originRegion?: string | null;
  originTownship?: string | null;
  deliveryService?: 'ninjavan' | 'custom';
}

/**
 * Update the seller's own shop branding/settings. RLS (`shops_owner_all`)
 * confines the write to the row this user owns; the `owner_id` filter is a
 * belt-and-suspenders match. Slug is intentionally NOT editable here — it is
 * the permanent public `/s/:slug` address and changing it would break every
 * link a seller has already shared.
 */
export async function updateOwnShop(userId: string, input: UpdateShopInput): Promise<OwnShop> {
  const sb = requireSupabase();
  const patch: TablesUpdate<'shops'> = {};
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.phone !== undefined) patch.phone = input.phone?.trim() || null;
  if (input.logoUrl !== undefined) patch.logo_url = input.logoUrl?.trim() || null;
  if (input.defaultDeliveryFee !== undefined) patch.default_delivery_fee = input.defaultDeliveryFee;
  if (input.originRegion !== undefined) patch.origin_region = input.originRegion?.trim() || null;
  if (input.originTownship !== undefined) patch.origin_township = input.originTownship?.trim() || null;
  if (input.deliveryService !== undefined) patch.delivery_service = input.deliveryService;

  const {data, error} = await sb
    .from('shops')
    .update(patch)
    .eq('owner_id', userId)
    .select(OWN_SHOP_COLUMNS)
    .maybeSingle();
  // This is the write path the Settings page actually uses. The shops trigger
  // (0007) raises plan_is_platform_managed / owner_is_platform_managed /
  // business_plan_required (e.g. a logo change after a Business→Starter
  // downgrade) — map those to Burmese instead of leaking the raw code.
  if (error || !data) throw new Error(mapUpdateOwnShopError(error?.message));
  return mapOwnShop(data as ShopRow);
}

export interface CreateShopInput {
  name: string;
  slug: string;
  phone: string;
  defaultDeliveryFee: number;
  originRegion: string;
  originTownship: string;
  deliveryService: 'ninjavan' | 'custom';
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
      origin_region: input.originRegion.trim(),
      origin_township: input.originTownship.trim(),
      delivery_service: input.deliveryService,
    })
    .select(OWN_SHOP_COLUMNS)
    .single();
  if (error) {
    // A unique violation here means either the slug is taken or this owner
    // already has a shop; recoverCreateShopError() disambiguates by looking up
    // the owner's own shop and recovers to it idempotently. See its doc + D49.
    return recoverCreateShopError(error, () => getOwnShop(userId));
  }
  return mapOwnShop(data as ShopRow);
}
