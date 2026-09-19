// ---- BILLING: current-month billable usage ----------------------------------
// Reads the billable-usage view/RPC added in 0003_platform_plan_and_usage.sql.
// Frontend plan gating lives in plan.tsx; this module only reports numbers.

import {requireSupabase} from '@/core/supabase/client';
import type {ShopPlan, ShopUsage, UsageTier} from '@/domain/shop';

export const billingApi = {
  // ---- monthly usage (billable = confirmed, minus cancelled/test/duplicate) ---
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
        plan: (r.plan as ShopPlan) ?? 'starter',
        month: r.month,
        billableOrders: r.billable_orders,
        tier: r.tier as UsageTier,
      },
    };
  },
};
