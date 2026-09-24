// ---- BILLING: current-month usage + live order entitlements -----------------
// getUsage() reads the analytics billable-usage view/RPC (0003). getEntitlement()
// reads the current entitlement counters (0016) — the quota + purchased
// balance that actually gate order placement. Frontend plan gating lives in
// plan.tsx; this module only reports numbers.

import {requireSupabase} from '@/core/supabase/client';
import type {ShopPlan, ShopUsage, UsageTier} from '@/domain/shop';
import {normalizePlan} from '@/domain/plan';
import {resolveEntitlementView, type EntitlementState, type EntitlementView} from '@/domain/entitlement';

export interface ShopEntitlement extends EntitlementView {
  cycleStart: string | null;
  cycleEnd: string | null;
  pendingPlan: string | null;
}

export const billingApi = {
  // ---- monthly usage (valid created orders; cancellation/rejection does not refund) ---
  async getUsage(): Promise<{usage: ShopUsage}> {
    const sb = requireSupabase();
    const {data, error} = await sb.rpc('current_shop_usage');
    if (error) throw new Error(error.message);
    if (!data) throw new Error('ဤအကောင့်တွင် ဆိုင် မရှိသေးပါ။');
    const r = data as {
      shop_id: string;
      plan: string;
      month: string;
      billable_orders: number;
      tier: string;
    };
    return {
      usage: {
        shopId: r.shop_id,
        plan: (r.plan as ShopPlan) ?? 'free_trial',
        month: r.month,
        billableOrders: r.billable_orders,
        tier: r.tier as UsageTier,
      },
    };
  },

  // ---- live order entitlements (quota + permanent purchased balance) ---------
  // The single source of truth the seller UI shows for "how many orders can I
  // still take". Derived through domain/entitlement.ts so the displayed numbers
  // match exactly what place_order() enforces.
  async getEntitlement(): Promise<{entitlement: ShopEntitlement}> {
    const sb = requireSupabase();
    const {data, error} = await sb.rpc('current_shop_entitlement');
    if (error) throw new Error(error.message);
    if (!data) throw new Error('ဤအကောင့်တွင် ဆိုင် မရှိသေးပါ။');
    const r = data as {
      shop_id: string;
      plan: string;
      active: boolean;
      monthly_quota: number;
      monthly_used: number;
      purchased_balance: number;
      cycle_start: string | null;
      cycle_end: string | null;
      pending_plan: string | null;
    };
    const state: EntitlementState = {
      plan: normalizePlan(r.plan),
      active: Boolean(r.active),
      monthlyQuota: r.monthly_quota ?? 0,
      monthlyUsed: r.monthly_used ?? 0,
      purchasedBalance: r.purchased_balance ?? 0,
      cycleEnd: r.cycle_end,
    };
    return {
      entitlement: {
        ...resolveEntitlementView(state),
        cycleStart: r.cycle_start,
        cycleEnd: r.cycle_end,
        pendingPlan: r.pending_plan,
      },
    };
  },
};
