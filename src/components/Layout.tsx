import {useEffect, useState} from 'react';
import {NavLink, useLocation} from 'react-router-dom';
import {ClipboardList, Home as HomeIcon, LayoutGrid, Search, ShoppingBag} from 'lucide-react';
import {useCart} from '../lib/cart';
import {cx} from '../lib/format';
import {shopHref} from '../lib/shopContext';
import {getCachedShopInfo} from '../lib/store';
import {APP_NAME, shopInitial} from '../lib/brand';
import {ShopLink} from './ShopLink';
import CartDrawer from './CartDrawer';

function LogoTile({logoUrl, name, className}: {logoUrl: string | null; name?: string | null; className: string}) {
  if (logoUrl) {
    return <img src={logoUrl} alt="" className={cx(className, 'object-cover')} loading="lazy" />;
  }
  return (
    <span className={cx(className, 'grid place-items-center bg-black font-display font-bold text-white shadow-sm')}>
      {shopInitial(name)}
    </span>
  );
}

function Brand() {
  const shop = getCachedShopInfo();
  const name = shop?.name ?? APP_NAME;
  return (
    <ShopLink to="/" className="flex min-w-0 items-center gap-2.5">
      <LogoTile logoUrl={shop?.logoUrl ?? null} name={shop?.name} className="h-10 w-10 shrink-0 rounded-xl text-base" />
      <span className="min-w-0 leading-tight">
        <span className="block truncate font-display text-[19px] font-semibold tracking-[-0.03em] text-black sm:text-xl">{name}</span>
        <span className="my mt-0.5 block truncate text-[10px] font-medium text-black/45 sm:text-[11px]">
          {shop ? 'အွန်လိုင်းဆိုင်' : 'နေ့တိုင်း ပိုကောင်းတဲ့ ရွေးချယ်မှု'}
        </span>
      </span>
    </ShopLink>
  );
}

const NAV = [
  {to: '/', label: 'ပင်မ'},
  {to: '/products', label: 'ပစ္စည်းများ'},
  {to: '/orders', label: 'Order စစ်ရန်'},
];

const BOTTOM_NAV = [
  {to: '/', label: 'ပင်မ', icon: HomeIcon, end: true},
  {to: '/products', label: 'ရှာဖွေ', icon: LayoutGrid, end: false},
  {to: '/cart', label: 'ခြင်း', icon: ShoppingBag, end: false},
  {to: '/orders', label: 'Order', icon: ClipboardList, end: false},
];

export default function Layout({children}: {children: React.ReactNode}) {
  const {count, openDrawer} = useCart();
  const {pathname} = useLocation();
  const shop = getCachedShopInfo();
  const shopName = shop?.name ?? APP_NAME;

  useEffect(() => {
    window.scrollTo({top: 0, behavior: 'instant' as ScrollBehavior});
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-white pb-[76px] md:pb-0">
      <header className="sticky top-0 z-40 border-b border-black/[0.05] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-3 px-4 sm:h-[76px]">
          <Brand />

          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={shopHref(n.to)}
                end={n.to === '/'}
                className={({isActive}) =>
                  cx(
                    'rounded-full px-4 py-2 text-sm font-semibold transition',
                    isActive ? 'bg-black text-white' : 'text-black/60 hover:bg-black/[0.04] hover:text-black',
                  )
                }>
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            <ShopLink
              to="/products"
              aria-label="ပစ္စည်း ရှာရန်"
              className="grid h-11 w-11 place-items-center rounded-full text-black transition hover:bg-black/[0.05]">
              <Search className="h-[21px] w-[21px]" />
            </ShopLink>
            <button
              onClick={openDrawer}
              aria-label="စျေးဝယ်ခြင်း"
              className="relative grid h-11 w-11 place-items-center rounded-full text-black transition hover:bg-black/[0.05]">
              <ShoppingBag className="h-[22px] w-[22px]" />
              {count > 0 && (
                <span className="absolute right-0 top-0 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#f43f5e] px-1 font-sans text-[10px] font-bold text-white ring-2 ring-white">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-16 hidden border-t border-black/[0.06] bg-[#111] text-white md:block">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5">
              <LogoTile logoUrl={shop?.logoUrl ?? null} name={shop?.name} className="h-10 w-10 rounded-xl border border-white/15 text-lg" />
              <span className="font-display text-lg font-semibold">{shopName}</span>
            </div>
            <p className="my mt-3 max-w-xs text-sm text-white/55">
              {shop
                ? `${shopName} — လိုချင်တဲ့ပစ္စည်းကို ရွေး၊ စျေးခြင်းထဲထည့်ပြီး အလွယ်တကူ မှာယူနိုင်ပါတယ်။`
                : 'မြန်မာဆိုင်ရှင်များအတွက် လွယ်ကူတဲ့ online storefront အတွေ့အကြုံ။'}
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white">လင့်များ</h4>
            <ul className="my mt-3 space-y-2 text-sm text-white/55">
              <li><ShopLink to="/products" className="hover:text-white">ပစ္စည်းအားလုံး</ShopLink></li>
              <li><ShopLink to="/cart" className="hover:text-white">စျေးဝယ်ခြင်း</ShopLink></li>
              <li><ShopLink to="/orders" className="hover:text-white">Order စစ်ဆေးရန်</ShopLink></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white">မှာယူရလွယ်ကူသည်</h4>
            <p className="my mt-3 text-sm text-white/55">
              ပစ္စည်းရွေး → စျေးခြင်းထည့် → အချက်အလက်ဖြည့် → ငွေပေးချေမှုရွေး → ပြီးပါပြီ။
            </p>
          </div>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-xs text-white/40">
          © {new Date().getFullYear()} {shopName}
          {shop ? '' : ' · နမူနာအတွက်သာ'}
        </div>
      </footer>

      <CartDrawer />

      <nav
        aria-label="Store navigation"
        className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-black/[0.06] bg-white/95 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] backdrop-blur-xl md:hidden"
        style={{paddingBottom: 'env(safe-area-inset-bottom)'}}>
        {BOTTOM_NAV.map((n) => {
          const Icon = n.icon;
          const isCart = n.to === '/cart';
          return (
            <NavLink
              key={n.to}
              to={shopHref(n.to)}
              end={n.end}
              className={({isActive}) =>
                cx(
                  'relative flex min-h-[64px] flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-semibold transition',
                  isActive ? 'text-black' : 'text-black/40',
                )
              }>
              <span className="relative">
                <Icon className="h-[22px] w-[22px]" strokeWidth={1.9} />
                {isCart && count > 0 && (
                  <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#f43f5e] px-1 font-sans text-[9px] font-bold text-white ring-2 ring-white">
                    {count}
                  </span>
                )}
              </span>
              {n.label}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}

export function SearchBox({defaultValue = '', onSubmit}: {defaultValue?: string; onSubmit: (q: string) => void}) {
  const [v, setV] = useState(defaultValue);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(v.trim());
      }}
      className="flex min-h-12 items-center gap-2 rounded-full border border-black/[0.08] bg-white px-4 shadow-sm transition focus-within:border-black/25">
      <Search className="h-4 w-4 text-black/45" />
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        placeholder="ပစ္စည်း ရှာရန်…"
        className="my w-full bg-transparent text-sm text-black outline-none placeholder:text-black/35"
      />
    </form>
  );
}
