// ---- Plan feature gating (Starter vs Business) ------------------------------
// The commercial packaging layer. Two sellable tiers gate which seller-console
// and storefront capabilities are available. This is a FRONTEND gating layer:
// it decides what UI to render, not what the database allows — RLS is unchanged
// and remains the real security boundary.
//
// PLAN SOURCE (forward-compatible):
//   1. `shop.plan` — once the backend adds a `shops.plan` column and it flows
//      through getOwnShop() (see sellerShop.ts). Not a DB column yet.
//   2. `VITE_DEFAULT_PLAN` env — deploy-wide default until (1) exists.
//   3. Hard default `'business'` — so an existing single-seller deploy keeps
//      every feature it has today (no regression on upgrade).
//
// Plan is deliberately NOT settable from the seller UI: a seller must not be
// able to unlock Business by clicking a toggle. Changing a live shop's plan is
// an owner/billing action (a future Backend concern), so this module only READS
// the plan.

import {createContext, useContext, useEffect, useMemo, useState} from 'react';
import type {ReactNode} from 'react';
import {getOwnShop, type OwnShop} from './sellerShop';

export type Plan = 'starter' | 'business';

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

/** Normalize an arbitrary plan string (DB or env) to a known tier. */
export function normalizePlan(raw?: string | null): Plan {
  return String(raw ?? '').trim().toLowerCase() === 'starter' ? 'starter' : 'business';
}

/** Resolve the effective plan: shop column → env default → 'business'. */
export function resolvePlan(shop?: Pick<OwnShop, 'plan'> | null): Plan {
  const fromShop = shop?.plan;
  const fromEnv = import.meta.env.VITE_DEFAULT_PLAN as string | undefined;
  return normalizePlan(fromShop ?? fromEnv ?? 'business');
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
