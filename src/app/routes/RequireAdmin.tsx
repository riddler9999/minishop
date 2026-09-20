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

  useEffect(() => {
    if (!user) {
      setChecking(false);
      return;
    }
    let alive = true;
    setChecking(true);
    getOwnShop(user.id)
      .then((shop) => alive && setHasShop(Boolean(shop)))
      .catch(() => alive && setHasShop(false))
      .finally(() => alive && setChecking(false));
    return () => {
      alive = false;
    };
  }, [user]);

  if (authLoading || (session && checking)) {
    return <div className="grid min-h-screen place-items-center bg-ink text-sm text-cream-200">Loading…</div>;
  }
  if (!session) {
    return <Navigate to="/admin/login" replace state={{from: location.pathname}} />;
  }
  if (!hasShop) {
    return <Navigate to="/admin/onboarding" replace />;
  }
  return <>{children}</>;
}
