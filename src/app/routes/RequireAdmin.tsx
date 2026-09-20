// ---- ROUTE GUARD: admin console ---------------------------------------------
import {useEffect, useState} from 'react';
import {Navigate, useLocation} from 'react-router-dom';
import {useAdminAuth} from '@/features/auth/adminAuth';
import {getOwnShop} from '@/features/shop/sellerShop';

// Route guard for the admin console: requires a real Supabase session AND an
// onboarded shop (a `shops` row owned by that session's user). A session
// without a shop yet is sent to /admin/onboarding rather than the dashboard.
export default function RequireAdmin({children}: {children: React.ReactNode}) {
  const {loading: authLoading, session, user} = useAdminAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [hasShop, setHasShop] = useState(false);
  // A failed lookup is NOT the same as "no shop": treat null (genuinely no
  // shop) as onboarding, but a thrown error (network/RLS) as a retryable state,
  // never a redirect — otherwise a transient blip bounces an onboarded seller
  // into onboarding as if their shop vanished.
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!user) {
      setChecking(false);
      return;
    }
    let alive = true;
    setChecking(true);
    setLoadError(false);
    getOwnShop(user.id)
      .then((shop) => alive && setHasShop(Boolean(shop)))
      .catch(() => alive && setLoadError(true))
      .finally(() => alive && setChecking(false));
    return () => {
      alive = false;
    };
  }, [user, retry]);

  if (authLoading || (session && checking)) {
    return <div className="grid min-h-screen place-items-center bg-ink text-sm text-cream-200">Loading…</div>;
  }
  if (!session) {
    return <Navigate to="/admin/login" replace state={{from: location.pathname}} />;
  }
  if (loadError) {
    return (
      <div className="grid min-h-screen place-items-center bg-ink px-4 text-center">
        <div className="max-w-sm">
          <p className="my text-sm text-cream-200">ဆိုင် အချက်အလက် ရယူ၍ မရသေးပါ — ကွန်ရက် ပြန်စစ်ပြီး ထပ်ကြိုးစားပါ။</p>
          <button
            onClick={() => setRetry((n) => n + 1)}
            className="my mt-4 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600">
            ထပ်ကြိုးစားရန်
          </button>
        </div>
      </div>
    );
  }
  if (!hasShop) {
    return <Navigate to="/admin/onboarding" replace />;
  }
  return <>{children}</>;
}
