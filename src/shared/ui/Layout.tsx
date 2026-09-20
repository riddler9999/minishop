import {useEffect, useState} from 'react';
import {NavLink, useLocation} from 'react-router-dom';
import {ClipboardList, Grid2X2, Menu, Search, ShoppingBag, X} from 'lucide-react';
import {useCart} from '@/features/cart/state';
import {cx} from '@/shared/lib/format';
import {shopHref} from '@/features/tenancy/shopContext';
import {getCachedShopInfo} from '@/features/tenancy/shopResolver';
import {APP_NAME} from '@/shared/lib/brand';
import {ShopLink} from '@/features/tenancy/ShopLink';
import CartDrawer from '@/features/cart/components/CartDrawer';

function Brand() {
  const shop = getCachedShopInfo();
  const name = shop?.name ?? APP_NAME;
  const logoUrl = shop?.logoUrl;

  return (
    <ShopLink to="/" className="flex min-w-0 max-w-full flex-col items-center justify-center overflow-hidden px-2 text-center">
      {logoUrl ? (
        <img src={logoUrl} alt="" className="mb-1 h-8 w-8 rounded-full object-cover ring-2 ring-[#fbcfe8]" />
      ) : (
        <ShoppingBag className="mb-1 h-5 w-5 text-[#e11d48]" strokeWidth={1.6} aria-hidden="true" />
      )}
      <span className="w-full max-w-[180px] truncate text-[18px] font-bold leading-none tracking-[-0.02em] text-slate-950 sm:max-w-[260px] sm:text-[22px]">
        {name}
      </span>
    </ShopLink>
  );
}

const DRAWER_NAV = [
  {to: '/', label: 'ပင်မစာမျက်နှာ'},
  {to: '/products', label: 'ပစ္စည်းများ'},
  {to: '/orders', label: 'အော်ဒါရှာရန်'},
];

const BOTTOM_NAV = [
  {to: '/products', label: 'ပစ္စည်း', icon: Grid2X2, end: false},
  {to: '/cart', label: 'ခြင်း', icon: ShoppingBag, end: false},
  {to: '/orders', label: 'အော်ဒါ', icon: ClipboardList, end: false},
];

export default function Layout({children}: {children: React.ReactNode}) {
  const {count, openDrawer} = useCart();
  const {pathname} = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const shop = getCachedShopInfo();
  const shopName = shop?.name ?? APP_NAME;

  useEffect(() => {
    setMenuOpen(false);
    window.scrollTo({top: 0, behavior: 'instant' as ScrollBehavior});
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-white pb-[calc(68px+env(safe-area-inset-bottom))] md:pb-0">
      <header className="sticky top-0 z-40 border-b border-rose-100 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto grid h-[82px] w-full max-w-[1440px] grid-cols-[48px_minmax(0,1fr)_48px] items-center gap-2 px-3 sm:h-[96px] sm:grid-cols-[112px_minmax(0,1fr)_112px] sm:px-6 lg:grid-cols-[180px_minmax(0,1fr)_180px] lg:px-8">
          <div className="flex items-center justify-start">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="မီနူးဖွင့်ရန်"
              className="grid h-11 w-11 place-items-center rounded-full text-[#261a12] transition hover:bg-[#f3eadf]">
              <Menu className="h-7 w-7" strokeWidth={1.5} />
            </button>
          </div>

          <Brand />

          <div className="flex min-w-0 items-center justify-end gap-1.5 sm:gap-2">
            <ShopLink
              to="/products"
              aria-label="ပစ္စည်းရှာရန်"
              className="hidden h-11 w-11 place-items-center rounded-full text-[#271b12] transition hover:bg-[#f3eadf] sm:grid">
              <Search className="h-[22px] w-[22px]" strokeWidth={1.7} />
            </ShopLink>

            <button
              type="button"
              onClick={openDrawer}
              aria-label="ဈေးခြင်းဖွင့်ရန်"
              className="relative grid h-11 w-11 place-items-center rounded-full text-[#271b12] transition hover:bg-[#f3eadf]">
              <ShoppingBag className="h-[22px] w-[22px]" strokeWidth={1.7} />
              {count > 0 && (
                <span className="absolute right-0 top-0 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#e11d48] px-1 font-sans text-[10px] font-bold text-white ring-2 ring-white">
                  {count}
                </span>
              )}
            </button>

            <ShopLink
              to="/products"
              className="hidden min-h-11 items-center rounded-full bg-[#e11d48] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#be123c] lg:inline-flex">
              ပစ္စည်းများကြည့်ရန်
            </ShopLink>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-rose-100 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-8 text-center sm:flex-row sm:px-8 sm:text-left">
          <div>
            <p className="text-xl font-bold">{shopName}</p>
            <p className="mt-1 text-xs text-rose-200">အွန်လိုင်းဖက်ရှင်ဆိုင်</p>
          </div>
          <div className="flex items-center gap-5 text-sm text-white/65">
            <ShopLink to="/products" className="hover:text-white">ပစ္စည်းများ</ShopLink>
            <ShopLink to="/orders" className="hover:text-white">အော်ဒါရှာရန်</ShopLink>
          </div>
          <p className="text-xs text-white/45">© {new Date().getFullYear()} {shopName}</p>
        </div>
      </footer>

      <CartDrawer />

      {menuOpen && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="ဆိုင်မီနူး">
          <button
            type="button"
            aria-label="မီနူးပိတ်ရန်"
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="relative flex h-full w-[84%] max-w-[390px] flex-col bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-rose-100 pb-5">
              <div>
                <p className="text-2xl font-bold text-slate-950">{shopName}</p>
                <p className="mt-1 text-xs font-medium text-[#e11d48]">အွန်လိုင်းဖက်ရှင်ဆိုင်</p>
              </div>
              <button
                type="button"
                aria-label="မီနူးပိတ်ရန်"
                onClick={() => setMenuOpen(false)}
                className="grid h-11 w-11 place-items-center rounded-full hover:bg-[#f3eadf]">
                <X className="h-6 w-6" />
              </button>
            </div>

            <nav className="mt-7 flex flex-col">
              {DRAWER_NAV.map((item) => (
                <ShopLink
                  key={item.to}
                  to={item.to}
                  className="border-b border-rose-100 py-5 text-2xl font-semibold text-slate-900 transition hover:pl-1 hover:text-[#e11d48]">
                  {item.label}
                </ShopLink>
              ))}
            </nav>

            <div className="mt-auto border-t border-rose-100 pt-6">
              <p className="text-xs leading-5 text-slate-500">ဆိုင်မှာရှိတဲ့ ဖက်ရှင်ပစ္စည်းအားလုံးကို တစ်နေရာတည်းမှာ ရွေးချယ်ဝယ်ယူနိုင်ပါတယ်။</p>
              <ShopLink to="/products" className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#e11d48] px-5 py-3 text-sm font-semibold text-white hover:bg-[#be123c]">
                ပစ္စည်းများကြည့်ရန်
              </ShopLink>
            </div>
          </aside>
        </div>
      )}

      <nav
        aria-label="ဆိုင်လမ်းညွှန်"
        className="fixed inset-x-0 bottom-0 z-40 grid h-[calc(68px+env(safe-area-inset-bottom))] grid-cols-3 grid-rows-1 border-t border-rose-100 bg-white/97 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(190,24,93,0.06)] backdrop-blur-xl md:hidden">
        {BOTTOM_NAV.map((item, index) => {
          const Icon = item.icon;
          const isCart = item.to === '/cart';
          return (
            <NavLink
              key={item.to}
              to={shopHref(item.to)}
              end={item.end}
              className={({isActive}) =>
                cx(
                  'relative flex h-[68px] min-w-0 flex-col items-center justify-center gap-1 border-rose-100 px-1 text-center text-[11px] font-medium leading-none transition',
                  index < BOTTOM_NAV.length - 1 ? 'border-r' : '',
                  isActive ? 'text-[#e11d48]' : 'text-slate-600',
                )
              }>
              <span className="relative">
                <Icon className="h-[24px] w-[24px]" strokeWidth={1.6} />
                {isCart && count > 0 && (
                  <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#e11d48] px-1 text-[9px] font-bold text-white ring-2 ring-white">
                    {count}
                  </span>
                )}
              </span>
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}

export function SearchBox({defaultValue = '', onSubmit}: {defaultValue?: string; onSubmit: (q: string) => void}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(value.trim());
      }}
      className="flex min-h-12 items-center gap-2 rounded-full border border-rose-200 bg-white px-4 shadow-sm transition focus-within:border-[#e11d48]">
      <Search className="h-4 w-4 text-[#e11d48]" />
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="ပစ္စည်းရှာရန်…"
        className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
      />
    </form>
  );
}
