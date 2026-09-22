// ---- SUBSCRIPTION / PAID-ONBOARDING GATE ------------------------------------
// Pure leaf (domain layer): types, prices, payment info and the routing decision
// for the paid-onboarding gate. No React, no I/O — matches the plan.ts /
// orderStatus.ts pattern. The data fetch lives in features/billing/application.ts
// and the route guards (RequireAdmin, Onboarding, Subscribe) branch on the
// OnboardingGate this module derives.

import type {Plan} from '@/domain/plan';

// ---- Pricing (Ks) -----------------------------------------------------------
// Prepaid MONTHLY plan prices (pricing V1). Single source of truth for the
// plan-selection UI and the informational `amount` stored on the application
// (the owner still verifies the real transfer against the screenshot — the
// amount is never a security check). Free trial is 0 Ks (no payment).
export const PLAN_PRICE_KS: Record<Plan, number> = {
  free_trial: 0,
  starter: 30000,
  business: 60000,
};

// The plan a seller can self-select without any payment or manual approval.
// Every other plan goes through the transfer + proof + owner-approval flow.
export const FREE_TRIAL_PLAN: Plan = 'free_trial';

// ---- Payment methods accepted for the plan purchase -------------------------
// Distinct from the buyer order flow's methods (cod/kpay/wave): this is the
// seller paying the PLATFORM for their plan. Kept in sync with the
// `payment_method` CHECK in migration 0010_shop_application_gate.sql.
export type SubscriptionPaymentMethod = 'kpay' | 'wave' | 'aya';

export const SUBSCRIPTION_PAYMENT_METHODS: SubscriptionPaymentMethod[] = ['kpay', 'wave', 'aya'];

export const PAYMENT_METHOD_LABEL: Record<SubscriptionPaymentMethod, string> = {
  kpay: 'KBZPay',
  wave: 'WavePay',
  aya: 'AYA Pay',
};

// Where the seller sends the plan payment. Operator-managed constant (the
// platform owner's collection account), shown on the payment-instructions step.
export const PLATFORM_PAYMENT_RECIPIENT = {
  name: 'MOE HTET KYAW',
  phone: '09969222535',
} as const;

// ---- Application status + gate ----------------------------------------------
// 'none' = the seller has not applied yet (no shop_applications row).
export type ApplicationStatus = 'none' | 'pending' | 'approved' | 'rejected';

// Where a seller belongs right now, given whether they own a shop and the state
// of their application. Ordered: an existing shop always wins (they are past the
// gate); an approved application (but no shop yet) means create the shop; every
// other state (none / pending / rejected) routes to the subscribe screen, which
// shows the right sub-state (buy / waiting / rejected+resubmit).
export type OnboardingGate = 'subscribe' | 'onboarding' | 'admin';

export function resolveOnboardingGate(input: {
  hasShop: boolean;
  applicationStatus: ApplicationStatus;
}): OnboardingGate {
  if (input.hasShop) return 'admin';
  if (input.applicationStatus === 'approved') return 'onboarding';
  return 'subscribe';
}
