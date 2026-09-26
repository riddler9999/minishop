// ---- SHIPPING: per-township delivery-fee zones ------------------------------
// Seller-managed. The storefront reads these through checkoutApi.shippingConfig
// so the fee SHOWN at checkout is the fee place_order() will CHARGE.

import {requireSupabase} from '@/core/supabase/client';
import type {TablesInsert, TablesUpdate} from '@/core/supabase/database.types';
import type {ShippingZone, ShippingZoneInput, ShippingZonePatch} from '@/domain/shop';
import {resolveOwnShopId} from '@/features/tenancy/ownShop';
import {mapDbError} from '@/domain/dbError';

function mapShippingZone(row: {id: string; region: string; township: string; fee: number}): ShippingZone {
  return {id: row.id, region: row.region, township: row.township, fee: row.fee};
}


export const shippingAdminApi = {
  // ---- shipping zones (per-township delivery fee, owner-managed) -------------
  async listShippingZones(): Promise<{zones: ShippingZone[]}> {
    const shopId = await resolveOwnShopId();
    const sb = requireSupabase();
    const {data, error} = await sb
      .from('shipping_zones')
      .select('id, region, township, fee')
      .eq('shop_id', shopId)
      .order('region', {ascending: true})
      .order('township', {ascending: true});
    if (error) throw new Error(mapDbError(error.message));
    return {zones: (data ?? []).map(mapShippingZone)};
  },

  async createShippingZone(input: ShippingZoneInput): Promise<{zone: ShippingZone}> {
    const shopId = await resolveOwnShopId();
    const sb = requireSupabase();
    const row: TablesInsert<'shipping_zones'> = {
      shop_id: shopId,
      region: input.region,
      township: input.township,
      fee: input.fee,
    };
    const {data, error} = await sb.from('shipping_zones').insert(row).select('id, region, township, fee').maybeSingle();
    if (error || !data) {
      if (error?.code === '23505') throw new Error('ဒီဒေသ/မြို့နယ်အတွက် ပို့ခ ရှိပြီးသားပါ။');
      throw new Error(mapDbError(error?.message, 'ပို့ဆောင်ခ ဇုန် ဖန်တီး၍မရပါ။'));
    }
    return {zone: mapShippingZone(data)};
  },

  async updateShippingZone(id: string, patch: ShippingZonePatch): Promise<{zone: ShippingZone}> {
    const shopId = await resolveOwnShopId();
    const sb = requireSupabase();
    const dbPatch: TablesUpdate<'shipping_zones'> = {};
    if (patch.fee !== undefined) dbPatch.fee = patch.fee;
    const {data, error} = await sb
      .from('shipping_zones')
      .update(dbPatch)
      .eq('id', id)
      .eq('shop_id', shopId)
      .select('id, region, township, fee')
      .maybeSingle();
    if (error || !data) throw new Error(mapDbError(error?.message, 'ပို့ဆောင်ခ ဇုန် ရှာမတွေ့ပါ။'));
    return {zone: mapShippingZone(data)};
  },

  async deleteShippingZone(id: string): Promise<{ok: true}> {
    const shopId = await resolveOwnShopId();
    const sb = requireSupabase();
    const {data, error} = await sb
      .from('shipping_zones')
      .delete()
      .eq('id', id)
      .eq('shop_id', shopId)
      .select('id')
      .maybeSingle();
    if (error || !data) throw new Error(mapDbError(error?.message, 'ပို့ဆောင်ခ ဇုန် ရှာမတွေ့ပါ။'));
    return {ok: true};
  },
};
