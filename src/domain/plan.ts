export type Plan = 'starter' | 'business';

/** Unknown, missing, or malformed values must never unlock paid features. */
export function normalizePlan(raw?: string | null): Plan {
  return String(raw ?? '').trim().toLowerCase() === 'business' ? 'business' : 'starter';
}

/** Resolve from the database first, then the deploy default, failing closed. */
export function resolvePlanValue(shopPlan?: string | null, envPlan?: string | null): Plan {
  return normalizePlan(shopPlan ?? envPlan ?? 'starter');
}
