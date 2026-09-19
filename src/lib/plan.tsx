// ---- Plan feature gating (Starter vs Business) ------------------------------
// The commercial packaging layer. Two sellable tiers gate which seller-console
// and storefront capabilities are available. This is a FRONTEND gating layer:
// it decides what UI to render, not what the database allows — RLS is unchanged
// and remains the real security boundary.
//
// PLAN SOURCE (forward-compatible):
//   1. `shop.plan` — the `shops.plan` column (migration 0003), selected by
//      getOwnShop() (see sellerShop.ts). Defaults to 'starter' for every shop
//      at the DB level, so this wins for every real shop today.
//   2. `VITE_DEFAULT_PLAN` env — only reached when `shop.plan` is null/absent
//      (a shop fetched before 0003 shipped, or no shop context at all).
//   3. Hard default `'starter'` — missing or malformed configuration must never\n//      unlock paid features.
//
// Plan is deliberately NOT settable from the seller UI: a seller must not be
// able to unlock Business by clicking a toggle. Changing a live shop's plan is
// an owner/billing action (a future Backend concern), so this module only READS
// the plan.

import {createContext, useContext, useEffect, useMemo, useState} from 'react';
import type {ReactNode} from 'react';
import {getOwnShop, type OwnShop} from './sellerShop';
import {normalizePlan, resolvePlanValue, type Plan} from './planRules';

export {normalizePlan};
export type {Plan};

export interface PlanFeatures {
  /** Promotion pricing on products + the storefront "featured" carousel. */
  promotions: boolean;
  /** Per-township shipping zones (beyond the single default delivery fee). */
  advancedShipping: boolean;
  /** Last-5-digit payment-verification workflow in order management. */
  paymentVerification: boolean;
  /** Analytics/KPI depth on the dashboard (low stock, revenue breakdown). */
  advancedDashboard: boolean;
  /** Shop logo + extended branding in settings. */
  branding: boolean;
  /** Integration-ready hooks surface (webhooks/exports placeholder). */
  integrations: boolean;
}

const STARTER: PlanFeatures = {
  promotions: false,
  advancedShipping: false,
  paymentVerification: false,
  advancedDashboard: false,
  branding: false,
  integrations: false,
};

const BUSINESS: PlanFeatures = {
  promotions: true,
  advancedShipping: true,
  paymentVerification: true,
  advancedDashboard: true,
  branding: true,
  integrations: true,
};

export const PLAN_FEATURES: Record<Plan, PlanFeatures> = {
  starter: STARTER,
  business: BUSINESS,
};

export const PLAN_LABEL: Record<Plan, string> = {
  starter: 'Starter',
  business: 'Business',
};

/** Resolve the effective plan: shop column → env default → fail-closed starter. */
export function resolvePlan(shop?: Pick<OwnShop, 'plan'> | null): Plan {
  const fromEnv = import.meta.env.VITE_DEFAULT_PLAN as string | undefined;
  return resolvePlanValue(shop?.plan, fromEnv);
}

// ---- React context ----------------------------------------------------------
interface PlanValue {
  loading: boolean;
  plan: Plan;
  features: PlanFeatures;
  shop: OwnShop | null;
  /** Re-fetch the shop (after a settings save changes name/logo/etc.). */
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
  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState<OwnShop | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getOwnShop(userId)
      .then((s) => alive && setShop(s))
      .catch(() => alive && setShop(null))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [userId, nonce]);

  const value = useMemo<PlanValue>(() => {
    const plan = resolvePlan(shop);
    return {
      loading,
      plan,
      features: PLAN_FEATURES[plan],
      shop,
      refresh: () => setNonce((n) => n + 1),
    };
  }, [loading, shop]);

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan(): PlanValue {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan must be used inside <PlanProvider>');
  return ctx;
}
