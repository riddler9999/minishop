// ---- ROUTE GUARD: admin console ---------------------------------------------
import {useEffect, useState} from 'react';
import {Navigate, useLocation} from 'react-router-dom';
import {useAdminAuth} from '@/features/auth/adminAuth';
import {resolveSellerGate} from '@/features/billing/application';

// Route guard for the admin console: requires a real Supabase session AND an
// onboarded shop (a `shops` row owned by that session's user). A session with a
// shop renders the console; a session without one is routed by the paid-
// onboarding gate — /admin/onboarding once the plan application is APPROVED,
// otherwise /admin/subscribe (buy a plan / wait for approval). See
// resolveSellerGate() + resolveOnboardingGate().
export default function RequireAdmin({children}: {children: React.ReactNode}) {
  const {loading: authLoading, session, user} = useAdminAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [gate, setGate] = useState<'subscribe' | 'onboarding' | 'admin'>('subscribe');
  // A failed lookup is NOT the same as "no shop": treat a resolved gate as
  // authoritative, but a thrown error (network/RLS) as a retryable state, never
  // a redirect — otherwise a transient blip bounces an onboarded seller out of
  // the console as if their shop vanished.
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
    resolveSellerGate(user.id)
      .then((result) => {
        if (!alive) return;
        if (result.status === 'error') setLoadError(true);
        else setGate(result.gate);
      })
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
  if (gate === 'onboarding') {
    return <Navigate to="/admin/onboarding" replace />;
  }
  if (gate === 'subscribe') {
    return <Navigate to="/admin/subscribe" replace />;
  }
  return <>{children}</>;
}
