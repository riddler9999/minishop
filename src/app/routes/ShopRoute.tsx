// ---- ROUTE: multi-tenant storefront entry -----------------------------------
import {useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';
import {isSupabaseConfigured} from '@/core/supabase/client';
import {isValidSlug} from '@/domain/slug';
import {setShopSlug} from '@/features/tenancy/shopContext';
import {isShopCached, resolveShop} from '@/features/tenancy/shopResolver';
import Layout from '@/shared/ui/Layout';
import NotFound from '@/shared/ui/NotFound';
import Storefront from './Storefront';

// The active shop slug is set during RENDER (not in an effect) at each
// storefront entry: `ShopRoute` sets the URL's slug, `RootStorefront` clears it.
// Two reasons this is render-phase, not effect-based:
//  1. Descendant pages' first data-fetch effects must see the slug already set
//     (effects fire child→parent, so a parent effect would run too late).
//  2. setShopSlug is idempotent (same value every render), so StrictMode's
//     double-render is harmless. We deliberately do NOT reset via an effect
//     cleanup: StrictMode double-invokes effect setup/cleanup on mount, which
//     would clear the slug back to null right after mounting a valid shop. The
//     symmetric "each entry sets its own value in render" approach avoids that —
//     leaving one storefront branch for another always re-runs the new branch's
//     render, which sets the correct value.

function ShopChecking() {
  return (
    <Layout>
      <div className="grid min-h-[50vh] place-items-center text-sm text-ink-soft">ဆိုင် ရှာဖွေနေသည်…</div>
    </Layout>
  );
}

function ShopUnavailable() {
  return (
    <div className="grid min-h-screen place-items-center bg-cream-50 px-6 text-center">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">ဆိုင်စနစ် ခေတ္တအသုံးပြု၍မရပါ</h1>
        <p className="my mt-2 text-sm text-ink-soft">ခဏအကြာ ပြန်စမ်းပါ။ ဆိုင်ရှင်ထံ ဆက်သွယ်နိုင်ပါသည်။</p>
      </div>
    </div>
  );
}

// Multi-tenant storefront entry: `/s/:slug/*`. The slug (the WebView-safe source
// of truth — survives reloads, unlike storage) scopes the Supabase-backed data
// layer (@/data/dataSource.ts) to this shop.
//
// Beyond Milestone A's format check, this confirms the shop actually EXISTS
// (active row in the DB) before mounting the storefront, so a well-formed slug
// for a missing/inactive shop shows a 404 instead of every page erroring on its
// first query. The lookup runs ONLY when it can matter — `isLiveBackend()`
// (Supabase configured AND slug set); with Supabase unconfigured it's always
// 'ok' with zero lookup, and the root demo never enters this component at all.
export default function ShopRoute() {
  const {slug} = useParams<{slug: string}>();
  const valid = isValidSlug(slug);

  setShopSlug(valid ? slug : null);

  const [shopState, setShopState] = useState<'checking' | 'ok' | 'missing'>(() =>
    valid && isSupabaseConfigured && !isShopCached(slug!) ? 'checking' : 'ok',
  );

  useEffect(() => {
    // No lookup needed: bad format, demo/unconfigured, or already-cached shop —
    // skipping the 'checking' flip on a cache hit avoids a needless Storefront
    // remount/flicker when a buyer revisits a shop this session.
    if (!valid || !isSupabaseConfigured) return;
    if (isShopCached(slug!)) {
      setShopState('ok');
      return;
    }
    let alive = true;
    setShopState('checking');
    resolveShop()
      .then(() => alive && setShopState('ok'))
      .catch(() => alive && setShopState('missing'));
    return () => {
      alive = false;
    };
  }, [slug, valid]);

  // Bad slug format → bare 404 (no shop chrome — not even confirmed shop-shaped).
  if (!valid) return <NotFound />;
  if (!isSupabaseConfigured) return <ShopUnavailable />;
  if (shopState === 'checking') return <ShopChecking />;
  // Confirmed-missing shop → 404 with app chrome (Layout fetches nothing per-shop).
  if (shopState === 'missing') {
    return (
      <Layout>
        <NotFound />
      </Layout>
    );
  }
  return <Storefront />;
}

// Root (slug-less) storefront: the demo shop. Clears any slug a previous
// in-app navigation may have set, so root pages never resolve against a stale
// shop's live backend.
export function RootStorefront() {
  setShopSlug(null);
  return <Storefront />;
}
