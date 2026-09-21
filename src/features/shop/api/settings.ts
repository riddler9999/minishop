// ---- SHOP: seller-editable settings -----------------------------------------
// `plan` is deliberately absent from the patch type: it is platform-managed and
// rejected by the DB (0007_production_hardening.sql) — a seller must never be
// able to self-upgrade.

import {requireSupabase} from '@/core/supabase/client';
import {mapDbError} from '@/domain/dbError';
import type {Json, TablesUpdate} from '@/core/supabase/database.types';
import type {ShopPlan, ShopSettings, ShopSettingsPatch} from '@/domain/shop';
import {normalizeTheme, type StorefrontTheme} from '@/domain/theme';
import {resolveOwnShopId} from '@/features/tenancy/ownShop';

// Raised when the seller edits Store Design before migration 0009 has been
// applied (the `theme` column doesn't exist yet). Detected from the Postgres
// error text so the UI can show a clear "not enabled yet" message instead of a
// raw column error. Kept narrow: only a missing `theme` column matches.
function isThemeColumnMissing(message?: string | null): boolean {
  if (!message) return false;
  const m = message.toLowerCase();
  return m.includes('theme') && (m.includes('does not exist') || m.includes('column') || m.includes('schema cache'));
}
const THEME_UNAVAILABLE = 'Store Design ကို အသုံးပြုရန် database migration (0009) apply လုပ်ရန် လိုအပ်ပါသည်။';

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
    // The shops trigger raises plan_is_platform_managed / owner_is_platform_managed /
    // business_plan_required (0007) — surface those as Burmese, not raw codes.
    if (error || !data) throw new Error(mapDbError(error?.message, 'ဆိုင် အချက်အလက် သိမ်း၍မရပါ။'));
    return {ok: true};
  },

  // ---- Store Design (storefront theme) --------------------------------------
  // Cosmetic storefront customization (see domain/theme.ts). `supported` reports
  // whether the `theme` column exists yet (migration 0009): when it doesn't, the
  // read still succeeds with the default theme so the editor can render, and the
  // UI shows a "migration pending" banner instead of an error.
  async getShopTheme(): Promise<{theme: StorefrontTheme; supported: boolean}> {
    const shopId = await resolveOwnShopId();
    const sb = requireSupabase();
    const {data, error} = await sb.from('shops').select('theme').eq('id', shopId).maybeSingle();
    if (error) {
      if (isThemeColumnMissing(error.message)) return {theme: normalizeTheme(null), supported: false};
      throw new Error(mapDbError(error.message, 'Store Design ဆွဲယူ၍မရပါ။'));
    }
    return {theme: normalizeTheme((data as {theme?: Json} | null)?.theme ?? null), supported: true};
  },

  // Persist the whole theme blob. It is re-normalized on write so only a valid,
  // bounded shape ever reaches the DB. Owner-scoped by RLS; `plan`/`owner`/`logo`
  // are untouched here so the 0007 trigger never fires on a theme save.
  async updateShopTheme(theme: StorefrontTheme): Promise<{ok: true}> {
    const shopId = await resolveOwnShopId();
    const sb = requireSupabase();
    const patch: TablesUpdate<'shops'> = {theme: normalizeTheme(theme) as unknown as Json};
    const {data, error} = await sb.from('shops').update(patch).eq('id', shopId).select('id').maybeSingle();
    if (error || !data) {
      if (isThemeColumnMissing(error?.message)) throw new Error(THEME_UNAVAILABLE);
      throw new Error(mapDbError(error?.message, 'Store Design သိမ်း၍မရပါ။'));
    }
    return {ok: true};
  },
};
