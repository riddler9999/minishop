// ---- Plan feature gating (Starter vs Business) ------------------------------
// The commercial packaging layer. Two sellable tiers gate which seller-console
// and storefront capabilities are available. This is a FRONTEND gating layer:
// it decides what UI to render, not what the database allows — RLS is unchanged
// and remains the real security boundary.
//
// PLAN SOURCE (forward-compatible):
//   1. `shop.plan` — the `shops.plan` column (migration 0003), selected by
//      getOwnShop() (see sellerShop.ts). Defaults to 'free_trial' for new shops
//      at the DB level, so this wins for every real shop today.
//   2. `VITE_DEFAULT_PLAN` env — only reached when `shop.plan` is null/absent
//      (a shop fetched before 0003 shipped, or no shop context at all).
//   3. Hard default `'free_trial'` — missing or malformed configuration must never\n//      unlock paid features.
//
// Plan is deliberately NOT settable from the seller UI: a seller must not be
// able to unlock Business by clicking a toggle. Changing a live shop's plan is
// an owner/billing action (a future Backend concern), so this module only READS
// the plan.

import {createContext, useContext, useEffect, useMemo, useState} from 'react';
import type {ReactNode} from 'react';
import {getOwnShop, type OwnShop} from '@/features/shop/sellerShop';
import {normalizePlan, resolvePlanValue, type Plan} from '@/domain/plan';

export {normalizePlan};
export type {Plan};

// Pricing V1 feature decisions:
//   - Township shipping is now a CORE feature for every plan (no `advancedShipping`
//     gate any more), so it is intentionally absent from this interface.
//   - Payment verification (last-5 matching) is NOT a plan differentiator — it is
//     available on every plan.
//   - The remaining Business-only gates are the genuinely advanced operational
//     features that were already implemented.
export interface PlanFeatures {
  /** Promotion pricing on products + the storefront "featured" carousel. */
  promotions: boolean;
  /** Last-5-digit payment-verification workflow in order management. */
  paymentVerification: boolean;
  /** Analytics/KPI depth on the dashboard (low stock, revenue breakdown). */
  advancedDashboard: boolean;
  /** Storefront theme editor (Store Design). Available on every plan. */
  storeDesign: boolean;
  /** Shop logo + extended branding in settings. */
  branding: boolean;
  /** Integration-ready hooks surface (webhooks/exports placeholder). */
  integrations: boolean;
}

// Free trial and Starter share the same core feature set. Store Design is core
// on every plan; logo/extended branding remains Business-only. They still differ
// in order quota and Extra-Orders eligibility (see domain/entitlement.ts).
const CORE: PlanFeatures = {
  promotions: false,
  paymentVerification: true,
  advancedDashboard: false,
  storeDesign: true,
  branding: false,
  integrations: false,
};

const BUSINESS: PlanFeatures = {
  promotions: true,
  paymentVerification: true,
  advancedDashboard: true,
  storeDesign: true,
  branding: true,
  integrations: true,
};

export const PLAN_FEATURES: Record<Plan, PlanFeatures> = {
  free_trial: CORE,
  starter: CORE,
  business: BUSINESS,
};

export const PLAN_LABEL: Record<Plan, string> = {
  free_trial: 'Free Trial',
  starter: 'Starter',
  business: 'Business',
};

/** Resolve the effective plan: shop column → env default → fail-closed free_trial. */
export function resolvePlan(shop?: Pick<OwnShop, 'plan'> | null): Plan {
  const fromEnv = import.meta.env.VITE_DEFAULT_PLAN as string | undefined;
  return resolvePlanValue(shop?.plan, fromEnv);
}

// ---- React context ----------------------------------------------------------
export type PlanLoadStatus = 'loading' | 'ready' | 'error';

interface PlanValue {
  status: PlanLoadStatus;
  loading: boolean;
  error: boolean;
  plan: Plan;
  features: PlanFeatures;
  shop: OwnShop | null;
  /** Re-fetch the shop (after a settings save changes name/logo/etc.) or retry a failed load. */
  refresh: () => void;
}

const PlanContext = createContext<PlanValue | null>(null);

/**
 * Provides the signed-in seller's plan + shop to the admin console. Mounted
 * INSIDE RequireAdmin (App.tsx), so by the time it loads a session and an
 * owned shop are already guaranteed — the shop fetch here just enriches with
 * branding fields and the plan.
 */
export function PlanProvider({userId, children}: {userId: string; children: ReactNode}) {
  const [status, setStatus] = useState<PlanLoadStatus>('loading');
  const [shop, setShop] = useState<OwnShop | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let alive = true;
    setStatus('loading');
    getOwnShop(userId)
      .then((s) => {
        if (!alive) return;
        setShop(s);
        setStatus('ready');
      })
      .catch(() => {
        if (!alive) return;
        setShop(null);
        setStatus('error');
      });
    return () => {
      alive = false;
    };
  }, [userId, nonce]);

  const value = useMemo<PlanValue>(() => {
    const plan = resolvePlan(shop);
    return {
      status,
      loading: status === 'loading',
      error: status === 'error',
      plan,
      features: PLAN_FEATURES[plan],
      shop,
      refresh: () => setNonce((n) => n + 1),
    };
  }, [status, shop]);

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan(): PlanValue {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan must be used inside <PlanProvider>');
  return ctx;
}
