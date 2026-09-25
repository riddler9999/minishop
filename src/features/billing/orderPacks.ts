// ---- Extra Orders (add-on) purchase submission -------------------------------
// Post-onboarding manual-payment flow, mirroring the plan-application flow: the
// seller transfers 500 Ks/order to the platform, uploads a screenshot, and
// submits a purchase request. The platform owner credits it from the Supabase
// dashboard via admin_credit_order_pack() (SECURITY DEFINER) — there is no
// in-app super-admin surface, matching the manual last-5 MVP philosophy.
//
// Kept at the feature top level (not under api/) so the Extra Orders page can
// import it directly, like Subscribe imports application.ts. Reaches Supabase
// directly (admin-side concern, never a storefront read).

import {requireSupabase} from '@/core/supabase/client';
import type {TablesInsert} from '@/core/supabase/database.types';
import {mapDbError} from '@/domain/dbError';
import {extraOrdersPriceKs} from '@/domain/entitlement';
import type {SubscriptionPaymentMethod} from '@/domain/subscription';
import {resolveOwnShopId} from '@/features/tenancy/ownShop';
export interface OrderPackPurchase {
  id: string;
  shopId: string;
  qty: number;
  amount: number;
  paymentMethod: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

type PurchaseRow = {
  id: string;
  shop_id: string;
  qty: number;
  amount: number;
  payment_method: string;
  status: string;
  created_at: string;
};

function normalizeStatus(raw: string): OrderPackPurchase['status'] {
  return raw === 'approved' || raw === 'rejected' ? raw : 'pending';
}

function mapPurchase(r: PurchaseRow): OrderPackPurchase {
  return {
    id: r.id,
    shopId: r.shop_id,
    qty: r.qty,
    amount: r.amount,
    paymentMethod: r.payment_method,
    status: normalizeStatus(r.status),
    createdAt: r.created_at,
  };
}

/** The seller's recent Extra-Orders purchase requests (newest first). */
export async function listOrderPackPurchases(): Promise<OrderPackPurchase[]> {
  const shopId = await resolveOwnShopId();
  const sb = requireSupabase();
  const {data, error} = await sb
    .from('order_pack_purchases')
    .select('id, shop_id, qty, amount, payment_method, status, created_at')
    .eq('shop_id', shopId)
    .order('created_at', {ascending: false})
    .limit(20);
  if (error) throw new Error(mapDbError(error.message));
  return (data ?? []).map((r) => mapPurchase(r as PurchaseRow));
}

export interface SubmitOrderPackInput {
  userId: string;
  qty: number;
  paymentMethod: SubscriptionPaymentMethod;
  paymentRefTail: string | null;
  screenshotPath: string;
}

/**
 * Submit an Extra-Orders purchase request. The `amount` is derived from the
 * flat unit price (never trusted from the client for enforcement — the owner
 * verifies the real transfer against the screenshot). The DB trigger
 * (protect_order_pack_purchase, 0016) blocks the insert with
 * `extra_orders_not_available` when the shop is not on a paid plan.
 */
export async function submitOrderPackPurchase(input: SubmitOrderPackInput): Promise<OrderPackPurchase> {
  const shopId = await resolveOwnShopId();
  const sb = requireSupabase();
  const row: TablesInsert<'order_pack_purchases'> = {
    shop_id: shopId,
    qty: input.qty,
    amount: extraOrdersPriceKs(input.qty),
    payment_method: input.paymentMethod,
    payment_ref_tail: input.paymentRefTail,
    screenshot_path: input.screenshotPath,
    status: 'pending',
  };
  const {data, error} = await sb
    .from('order_pack_purchases')
    .insert(row)
    .select('id, shop_id, qty, amount, payment_method, status, created_at')
    .single();
  if (error || !data) throw new Error(mapDbError(error?.message, 'Extra Orders ဝယ်ယူမှု တင်သွင်း၍မရပါ — ပြန်ကြိုးစားပါ။'));
  return mapPurchase(data as PurchaseRow);
}
