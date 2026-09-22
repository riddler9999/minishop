// ---- DOMAIN: subscription plan (tier) ---------------------------------------
// Three sellable tiers. `free_trial` is the entry tier every new shop starts on
// (0 Ks, capped lifetime quota); `starter` and `business` are prepaid monthly
// plans. Plan is PLATFORM-managed and read-only to sellers (enforced in the DB
// by 0007/0013 triggers) — this module only classifies a raw value.

export type Plan = 'free_trial' | 'starter' | 'business';

export const PLANS: Plan[] = ['free_trial', 'starter', 'business'];

// A plan is only ever what the string says exactly. Anything unknown, missing or
// malformed must never unlock a HIGHER tier, so it fails closed to `free_trial`
// — the least-privileged tier (smallest quota, no paid features, no add-ons).
export function normalizePlan(raw?: string | null): Plan {
  const v = String(raw ?? '').trim().toLowerCase();
  if (v === 'business') return 'business';
  if (v === 'starter') return 'starter';
  return 'free_trial';
}

/** Resolve from the database first, then the deploy default, failing closed. */
export function resolvePlanValue(shopPlan?: string | null, envPlan?: string | null): Plan {
  return normalizePlan(shopPlan ?? envPlan ?? 'free_trial');
}

/** True only for the two prepaid paid tiers (free_trial is not paid). */
export function isPaidPlan(plan: Plan): boolean {
  return plan === 'starter' || plan === 'business';
}
