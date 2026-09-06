import {useState} from 'react';
import {NavLink, Outlet, Link} from 'react-router-dom';
import {LayoutDashboard, Package, ShoppingCart, Truck, Store, LogOut, Menu, X} from 'lucide-react';
import {useAdminAuth} from '../lib/adminAuth';
import {cx} from '../lib/format';

const NAV = [
  {to: '/admin', end: true, label: 'ခြုံငုံ', icon: LayoutDashboard},
  {to: '/admin/products', end: false, label: 'ပစ္စည်းများ', icon: Package},
  {to: '/admin/orders', end: false, label: 'Order များ', icon: ShoppingCart},
  {to: '/admin/shipping', end: false, label: 'ပို့ဆောင်ခ ဇုန်', icon: Truck},
];

function NavItems({onNavigate}: {onNavigate?: () => void}) {
  return (
    <nav className="space-y-1">
      {NAV.map((n) => {
        const Icon = n.icon;
        return (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            onClick={onNavigate}
            className={({isActive}) =>
              cx(
                'my flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
                isActive
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-cream-200 hover:bg-white/10 hover:text-white',
              )
            }>
            <Icon className="h-[18px] w-[18px]" />
            {n.label}
          </NavLink>
        );
      })}
    </nav>
  );
}

function Sidebar({onNavigate}: {onNavigate?: () => void}) {
  const {signOut} = useAdminAuth();
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-2 py-1">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-gold-500 font-display text-lg font-bold text-white shadow-sm">
          T
        </span>
        <span className="leading-tight">
          <span className="block font-display text-base font-bold text-white">Admin Console</span>
          <span className="block text-[11px] tracking-wide text-cream-200/70">Mini TikTok Shop</span>
        </span>
      </div>

      <div className="mt-6 flex-1">
        <NavItems onNavigate={onNavigate} />
      </div>

      <div className="space-y-1 border-t border-white/10 pt-3">
        <Link
          to="/"
          onClick={onNavigate}
          className="my flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-cream-200 transition hover:bg-white/10 hover:text-white">
          <Store className="h-[18px] w-[18px]" />
          ဆိုင်ကို ကြည့်ရန်
        </Link>
        <button
          onClick={() => {
            void signOut();
            onNavigate?.();
          }}
          className="my flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-brand-200 transition hover:bg-brand-500/20 hover:text-white">
          <LogOut className="h-[18px] w-[18px]" />
          ထွက်ရန်
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-cream-100 text-ink">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-ink p-4 lg:flex">
        <Sidebar />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-cream-200 bg-ink px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-gold-500 font-display text-sm font-bold text-white">
            T
          </span>
          <span className="font-display text-sm font-bold text-white">Admin Console</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="menu"
          className="grid h-10 w-10 place-items-center rounded-lg text-white hover:bg-white/10">
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-ink p-4">
            <div className="mb-2 flex justify-end">
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="close"
                className="grid h-10 w-10 place-items-center rounded-lg text-white hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 lg:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
