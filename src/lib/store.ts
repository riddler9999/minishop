// ---- Data-layer switch -------------------------------------------------
// Single import point for STOREFRONT pages: `import {api} from '../lib/store'`
// instead of importing api.ts directly. The storefront `api` (below) is a
// reactive Proxy that resolves per call: the Supabase-backed layer (backend.ts)
// once BOTH the client is configured AND a shop slug is set — the slug comes
// from `/s/<slug>` routing calling setShopSlug() (App.tsx `ShopRoute` +
// shopContext.ts) — otherwise the zero-backend demo (api.ts). So configuring
// Supabase alone can't switch a slug-less surface (e.g. the root `/` demo) onto
// a backend that would throw for lack of shop context.
//
// `adminApi` is NOT gated here — it's re-exported straight from backend.ts.
// The admin console is a poor fit for the storefront's shop-slug gate: by the
// time any admin page renders, App.tsx's `RequireAdmin` has already proven a
// real Supabase session AND an owned shop exist (see adminAuth.tsx /
// sellerShop.ts) — a storefront slug has nothing to do with that, and an
// admin session can exist with no slug ever set. So there is nothing left to
// gate: `RequireAdmin` passing already implies Supabase is configured and
// usable, making backend.ts's `adminApi` unconditionally correct for admin
// pages. (Previously this file picked `adminApi` off the same
// `useLiveBackend` flag as the storefront `api` — wrong, since a signed-in
// seller with no storefront slug set would silently fall back to the
// localStorage demo admin API instead of their real shop data.)
//
// NOTE: buyer pages don't import from this module yet — they still read
// lib/api.ts directly. Switching them here (Milestone B, tracked in
// tasks/TASKS.md) is what puts the reactive `api` below on the live backend for
// real shop traffic. Routing + the reactive gate (Milestone A) are already in.

import {isSupabaseConfigured} from './supabase';
import {getShopSlug} from './shopContext';
import {api as demoApi} from './api';
import {api as liveApi, adminApi} from './backend';

/** True when the live Supabase storefront should serve — configured AND a shop
 *  slug is currently set. Evaluated on every call (NOT frozen at module load),
 *  so setShopSlug() from `/s/<slug>` routing takes effect without a reload, and
 *  client-side navigation between shops resolves the right backend each call. */
export function isLiveBackend(): boolean {
  return isSupabaseConfigured && getShopSlug() != null;
}

function resolveStorefrontApi(): typeof liveApi {
  // Narrow cast: demo `api` matches live `api` except ordersByPhone's optional
  // 2nd arg — a deliberate, documented divergence (see backend.ts header). The
  // Proxy below only forwards calls, so the runtime shapes are compatible.
  return isLiveBackend() ? liveApi : (demoApi as unknown as typeof liveApi);
}

/**
 * Reactive storefront data layer. Each property access dispatches to the
 * currently-active backend at call time, so it can't get frozen on the demo
 * before `/s/<slug>` routing sets a slug, and it re-resolves per call on SPA
 * navigation between shops.
 *
 * ⚠️ Do NOT place `api.<method>` in a React dependency array — the get trap
 * returns a fresh function each access, which would loop effects. Call the
 * method directly inside the effect/handler instead.
 *
 * The target is a bare `{}`, so the `ownKeys`/`getOwnPropertyDescriptor`/`has`
 * traps below forward enumeration to the active backend — without them
 * `Object.keys(api)`, `{...api}`, `for..in`, and `JSON.stringify(api)` would
 * silently see nothing. (getOwnPropertyDescriptor reports `configurable: true`
 * to satisfy the Proxy invariant for keys absent from the empty target.)
 */
export const api: typeof liveApi = new Proxy({} as typeof liveApi, {
  get(_target, prop) {
    const backend = resolveStorefrontApi();
    const value = backend[prop as keyof typeof liveApi];
    if (typeof value === 'function') {
      return (...args: unknown[]) => (value as (...a: unknown[]) => unknown).apply(backend, args);
    }
    return value;
  },
  has(_target, prop) {
    return prop in resolveStorefrontApi();
  },
  ownKeys() {
    return Reflect.ownKeys(resolveStorefrontApi());
  },
  getOwnPropertyDescriptor(_target, prop) {
    const desc = Reflect.getOwnPropertyDescriptor(resolveStorefrontApi(), prop);
    return desc && {...desc, configurable: true};
  },
});

export {adminApi};

// Public shop branding for the current tenant (null on the demo storefront) —
// resolved as a side effect of the storefront `api` calls above.
export {getCachedShopInfo} from './backend';
export type {ShopInfo} from './backend';

export type {
  AdminOrder,
  MerchantAccount,
  OrderResult,
  Product,
  ProductCreateInput,
  ProductPatch,
  TrackedOrder,
} from './api';
export type {ShippingZone, ShippingZoneInput, ShippingZonePatch} from './backend';
