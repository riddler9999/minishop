import {useState} from 'react';
import {NavLink, Outlet, Link} from 'react-router-dom';
import {Bell, Home, LogOut, Menu, Package, Settings, ShoppingBag, Store, X} from 'lucide-react';
import {useAdminAuth} from '@/features/auth/adminAuth';
import {usePlan} from '@/features/billing/plan';
import {APP_INITIAL, APP_NAME, shopInitial} from '@/shared/lib/brand';
import {PlanBadge} from '@/features/billing/PlanGate';
import {cx} from '@/shared/lib/format';
import {useModalA11y} from '@/shared/hooks/useModalA11y';

interface NavEntry {
  to: string;
  end: boolean;
  label: string;
  icon: React.ComponentType<{className?: string}>;
}

const NAV: NavEntry[] = [
  {to: '/admin', end: true, label: 'Home', icon: Home},
  {to: '/admin/products', end: false, label: 'Products', icon: Package},
  {to: '/admin/orders', end: false, label: 'Orders', icon: ShoppingBag},
  {to: '/admin/settings', end: false, label: 'Settings', icon: Settings},
];

function MobileNav() {
  return (
    <nav aria-label="Admin navigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-2 backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-4">
        {NAV.map((entry) => {
          const Icon = entry.icon;
          return (
            <NavLink key={entry.to} to={entry.to} end={entry.end} className={({isActive}) => cx('flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-semibold transition', isActive ? 'text-pink-500' : 'text-slate-500 hover:text-slate-900')}>
              <Icon className="h-[22px] w-[22px]" />
              {entry.label}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

function DesktopNav() {
  return (
    <nav className="space-y-1.5">
      {NAV.map((entry) => {
        const Icon = entry.icon;
        return (
          <NavLink key={entry.to} to={entry.to} end={entry.end} className={({isActive}) => cx('flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition', isActive ? 'bg-pink-50 text-pink-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950')}>
            <Icon className="h-[18px] w-[18px]" />
            {entry.label}
          </NavLink>
        );
      })}
    </nav>
  );
}

function Sidebar() {
  const {signOut} = useAdminAuth();
  const {shop} = usePlan();
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-1">
        <div className="grid h-11 w-11 place-items-center rounded-[16px] bg-pink-500 font-black text-white shadow-sm">{shopInitial(shop?.name)}</div>
        <div className="min-w-0">
          <div className="flex items-center gap-2"><span className="truncate text-base font-black text-slate-950">{shop?.name ?? APP_NAME}</span><PlanBadge /></div>
          <span className="text-xs text-slate-500">Seller Console</span>
        </div>
      </div>
      <div className="mt-8 flex-1"><DesktopNav /></div>
      <div className="space-y-1 border-t border-slate-200 pt-3">
        <Link to="/" className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"><Store className="h-[18px] w-[18px]" />View store</Link>
        <button onClick={() => void signOut()} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"><LogOut className="h-[18px] w-[18px]" />Sign out</button>
      </div>
    </div>
  );
}

function MobileDrawer({onClose}: {onClose: () => void}) {
  const panelRef = useModalA11y<HTMLDivElement>(onClose);
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button type="button" aria-label="Close navigation" className="absolute inset-0 bg-slate-950/35" onClick={onClose} />
      <div ref={panelRef} role="dialog" aria-modal="true" aria-label="Navigation" tabIndex={-1} className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-white p-4 outline-none shadow-2xl">
        <div className="mb-4 flex justify-end"><button onClick={onClose} aria-label="Close navigation" className="grid h-11 w-11 place-items-center rounded-2xl text-slate-600 hover:bg-slate-50"><X className="h-5 w-5" /></button></div>
        <Sidebar />
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const {shop} = usePlan();
  return (
    <div className="min-h-screen bg-[#f7f9fc] text-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white p-5 lg:block"><Sidebar /></aside>
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-[#f7f9fc]/95 px-4 py-3 backdrop-blur lg:ml-64">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <button onClick={() => setMobileOpen(true)} aria-label="Open navigation" className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-slate-700 shadow-sm lg:hidden"><Menu className="h-5 w-5" /></button>
          <div className="hidden items-center gap-3 lg:flex">
            <div className="grid h-10 w-10 place-items-center rounded-[14px] bg-pink-500 font-black text-white">{APP_INITIAL}</div>
            <div><p className="text-sm font-black text-slate-950">minishop</p><p className="text-[11px] text-slate-500">Seller Console</p></div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span aria-label="Notifications" className="relative grid h-11 w-11 place-items-center rounded-2xl bg-white text-slate-700 shadow-sm"><Bell className="h-5 w-5" /><span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-pink-500" /></span>
            <div className="flex h-11 items-center gap-2 rounded-2xl bg-white px-2.5 shadow-sm">
              {shop?.logoUrl ? <img src={shop.logoUrl} alt="" className="h-8 w-8 rounded-xl object-cover" /> : <div className="grid h-8 w-8 place-items-center rounded-xl bg-cyan-50 text-sm font-black text-cyan-600">{shopInitial(shop?.name)}</div>}
              <span className="hidden max-w-[140px] truncate text-sm font-semibold text-slate-800 sm:block">{shop?.name ?? APP_NAME}</span>
            </div>
          </div>
        </div>
      </header>
      {mobileOpen && <MobileDrawer onClose={() => setMobileOpen(false)} />}
      <main className="lg:pl-64"><div className="mx-auto max-w-5xl px-4 py-5 sm:px-5 lg:py-7"><Outlet /></div></main>
      <MobileNav />
    </div>
  );
}
