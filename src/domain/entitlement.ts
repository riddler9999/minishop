// ---- DOMAIN: order entitlements (quota + purchased balance) ------------------
// Pure leaf (domain layer): the ONE authoritative definition of the pricing V1
// entitlement math — how many billable orders a shop may still place, in what
// order they are consumed, and whether add-ons apply. The DB RPC
// `place_order()` (migration 0016) mirrors THIS math exactly; the SQL and this
// module must never diverge (tests/entitlement.test.ts guards the rules).
//
// FOUR concepts are kept deliberately separate and are NEVER collapsed into a
// single "orders remaining" number, because they expire differently:
//   1. subscription state  — plan + whether a paid subscription is active
//   2. monthly quota        — resets on renewal (free trial: a LIFETIME cap that
//                             never resets)
//   3. purchased balance    — permanent Extra Orders; never expires, survives
//                             renewal/upgrade/downgrade/cancellation
//   4. (payments + ledger live in the data layer / DB, not here)

import type {Plan} from './plan';

// Local paid-tier check (kept inline rather than importing the value from
// plan.ts so this leaf stays a pure, self-contained domain module — matches how
// the other domain leaves avoid cross-module value imports).
function isPaidPlan(plan: Plan): boolean {
  return plan === 'starter' || plan === 'business';
}

// Monthly order allotment per plan. Free trial's number is a LIFETIME cap
// (quota never resets); the paid plans' numbers reset each prepaid cycle.
export const PLAN_MONTHLY_QUOTA: Record<Plan, number> = {
  free_trial: 20,
  starter: 60,
  business: 150,
};

// Free-trial product ceiling, enforced server-side (11th product is blocked).
export const FREE_TRIAL_PRODUCT_LIMIT = 10;

// ---- Extra Orders (add-on) --------------------------------------------------
// Flat price, no volume discount. Purchased quantity NEVER expires and can only
// be CONSUMED while a paid subscription is active (never on free trial).
export const EXTRA_ORDER_UNIT_PRICE_KS = 500;
export const EXTRA_ORDER_PRESETS = [1, 5, 10, 20, 30, 50] as const;

/** Cost of an Extra Orders pack — strictly linear (no discount). */
export function extraOrdersPriceKs(qty: number): number {
  return Math.max(0, Math.floor(qty)) * EXTRA_ORDER_UNIT_PRICE_KS;
}

/** Only paid, active plans may buy/consume Extra Orders (never free trial). */
export function canBuyExtraOrders(plan: Plan): boolean {
  return isPaidPlan(plan);
}

// ---- The live entitlement counters for one shop -----------------------------
// The mutable state the DB stores per shop (table `shop_entitlements`). Read by
// the seller UI; written only by the DB (order consumption + owner credit RPCs).
export interface EntitlementState {
  plan: Plan;
  /** Paid subscription active. Free trial is always "active" for its own quota. */
  active: boolean;
  /** Order cap for the current cycle (free trial: the lifetime cap). */
  monthlyQuota: number;
  /** Orders consumed this cycle (free trial: consumed over the lifetime). */
  monthlyUsed: number;
  /** Permanent Extra Orders remaining. Never expires. */
  purchasedBalance: number;
  cycleEnd?: string | null;
}

// Which bucket a new billable order draws from. Monthly quota is ALWAYS consumed
// before the purchased balance; a null result means the order must be BLOCKED.
export type ConsumeSource = 'monthly' | 'purchased' | null;

/**
 * The single consumption rule, mirrored verbatim in `place_order()` (0013):
 *   - an inactive (cancelled/lapsed) paid subscription consumes NOTHING
 *   - otherwise the monthly quota is drawn down FIRST
 *   - only once the monthly quota is exhausted is the purchased balance used,
 *     and only for a plan that may hold one (never free trial)
 */
function entitlementIsActive(s: EntitlementState): boolean {
  if (!s.active) return false;
  if (!isPaidPlan(s.plan)) return true;
  if (s.cycleEnd === undefined) return true;
  if (s.cycleEnd === null) return false;
  const end = Date.parse(s.cycleEnd);
  return Number.isFinite(end) && end > Date.now();
}

export function chooseConsumeSource(s: EntitlementState): ConsumeSource {
  if (!entitlementIsActive(s)) return null;
  if (s.monthlyUsed < s.monthlyQuota) return 'monthly';
  if (canBuyExtraOrders(s.plan) && s.purchasedBalance > 0) return 'purchased';
  return null;
}

// ---- A derived, display-ready view ------------------------------------------
export interface EntitlementView {
  plan: Plan;
  active: boolean;
  monthlyQuota: number;
  monthlyUsed: number;
  monthlyRemaining: number;
  purchasedBalance: number;
  /** Everything the shop can still place right now. */
  totalRemaining: number;
  canPlaceOrder: boolean;
  canBuyExtraOrders: boolean;
  /** Free trial's monthly cap is a lifetime cap that never resets. */
  quotaIsLifetime: boolean;
}

export function resolveEntitlementView(s: EntitlementState): EntitlementView {
  const monthlyRemaining = Math.max(0, s.monthlyQuota - s.monthlyUsed);
  const purchasedUsable = canBuyExtraOrders(s.plan) ? s.purchasedBalance : 0;
  const effectiveActive = entitlementIsActive(s);
  const totalRemaining = effectiveActive ? monthlyRemaining + purchasedUsable : 0;
  return {
    plan: s.plan,
    active: effectiveActive,
    monthlyQuota: s.monthlyQuota,
    monthlyUsed: s.monthlyUsed,
    monthlyRemaining,
    purchasedBalance: s.purchasedBalance,
    totalRemaining,
    canPlaceOrder: chooseConsumeSource(s) !== null,
    canBuyExtraOrders: canBuyExtraOrders(s.plan) && effectiveActive,
    quotaIsLifetime: s.plan === 'free_trial',
  };
}
