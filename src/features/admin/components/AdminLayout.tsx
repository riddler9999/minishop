import {useState} from 'react';
import {Bell, LogOut, Menu, Store} from 'lucide-react';
import {Link, Outlet, useLocation} from 'react-router-dom';
import {useAdminAuth} from '@/features/auth/adminAuth';
import {usePlan} from '@/features/billing/plan';
import {shopInitial} from '@/shared/lib/brand';
import {PlanBadge} from '@/features/billing/PlanGate';
import AdminNav from './AdminNav';
import AdminMobileNav from './AdminMobileNav';

function Sidebar() {
  const {signOut} = useAdminAuth();
  const {shop} = usePlan();

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-[var(--admin-sidebar-hover)] bg-[var(--admin-sidebar)] p-4 text-white lg:flex lg:flex-col">
      <div className="flex items-center gap-3 border-b border-[var(--admin-sidebar-hover)] px-2 pb-4">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--admin-primary)] text-sm font-black text-white">
          {shopInitial(shop?.name)}
        </div>
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-sm font-bold">{shop?.name ?? 'MiniShop'}</span>
            <PlanBadge />
          </div>
          <span className="text-xs text-slate-400">Seller Admin</span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-4">
        <AdminNav />
      </div>

      <div className="space-y-1 border-t border-[var(--admin-sidebar-hover)] pt-4">
        <Link
          to={shop?.slug ? `/s/${shop.slug}` : '/demo'}
          className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white">
          <Store className="h-[18px] w-[18px]" />
          View store
        </Link>
        <button
          type="button"
          onClick={() => void signOut()}
          className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white">
          <LogOut className="h-[18px] w-[18px]" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const {shop} = usePlan();
  const {pathname} = useLocation();
  const inStoreBuilder = pathname === '/admin/online-store/themes/customize';

  if (inStoreBuilder) {
    return (
      <main className="min-h-dvh w-full overflow-x-hidden">
        <Outlet />
      </main>
    );
  }

  return (
    <div className="admin-shell min-h-dvh overflow-x-hidden bg-[var(--admin-canvas)] text-[var(--admin-text)]">
      <Sidebar />

      <header className="sticky top-0 z-30 border-b border-[var(--admin-border)] bg-white/95 backdrop-blur lg:ml-64">
        <div className="flex min-h-14 items-center gap-3 px-4 sm:px-5 lg:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
            aria-expanded={mobileOpen}
            className="grid h-11 w-11 place-items-center rounded-xl text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 lg:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-950">{shop?.name ?? 'MiniShop'}</p>
            <p className="hidden text-xs text-slate-500 sm:block">Seller Admin</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span aria-label="Notifications" className="grid h-11 w-11 place-items-center rounded-xl text-slate-600">
              <Bell className="h-5 w-5" />
            </span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-violet-50 text-sm font-bold text-violet-700">
              {shopInitial(shop?.name)}
            </div>
          </div>
        </div>
      </header>

      <AdminMobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <main className="min-w-0 lg:pl-64">
        <div className="mx-auto w-full max-w-[1440px] min-w-0 px-4 py-5 sm:px-5 lg:px-6 lg:py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
