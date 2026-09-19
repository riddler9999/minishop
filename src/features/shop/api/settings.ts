// ---- SHOP: seller-editable settings -----------------------------------------
// `plan` is deliberately absent from the patch type: it is platform-managed and
// rejected by the DB (0007_production_hardening.sql) — a seller must never be
// able to self-upgrade.

import {requireSupabase} from '@/core/supabase/client';
import type {TablesUpdate} from '@/core/supabase/database.types';
import type {ShopPlan, ShopSettings, ShopSettingsPatch} from '@/domain/shop';
import {resolveOwnShopId} from '@/features/tenancy/ownShop';

export const shopSettingsApi = {
  // ---- shop settings (seller reads plan + edits own logo/name/phone/fee) -----
  async getShopSettings(): Promise<{shop: ShopSettings}> {
    const shopId = await resolveOwnShopId();
    const sb = requireSupabase();
    const {data, error} = await sb
      .from('shops')
      .select('id, slug, name, phone, logo_url, default_delivery_fee, plan, is_active')
      .eq('id', shopId)
      .maybeSingle();
    if (error || !data) throw new Error(error?.message || 'ဆိုင် ရှာမတွေ့ပါ။');
    return {
      shop: {
        id: data.id,
        slug: data.slug,
        name: data.name,
        phone: data.phone,
        logoUrl: data.logo_url,
        defaultDeliveryFee: data.default_delivery_fee,
        plan: (data.plan as ShopPlan) ?? 'starter',
        isActive: data.is_active,
      },
    };
  },

  // NOTE: `plan` is intentionally NOT patchable here — it is platform-set.
  async updateShopSettings(patch: ShopSettingsPatch): Promise<{ok: true}> {
    const shopId = await resolveOwnShopId();
    const sb = requireSupabase();
    const dbPatch: TablesUpdate<'shops'> = {};
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.phone !== undefined) dbPatch.phone = patch.phone;
    if (patch.logoUrl !== undefined) dbPatch.logo_url = patch.logoUrl;
    if (patch.defaultDeliveryFee !== undefined) dbPatch.default_delivery_fee = patch.defaultDeliveryFee;
    const {data, error} = await sb.from('shops').update(dbPatch).eq('id', shopId).select('id').maybeSingle();
    if (error || !data) throw new Error(error?.message || 'ဆိုင် အချက်အလက် သိမ်း၍မရပါ။');
    return {ok: true};
  },
};
