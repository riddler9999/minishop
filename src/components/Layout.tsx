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
    <span className={cx(className, 'grid place-items-center bg-gradient-to-br from-brand-600 to-gold-500 font-display font-bold text-cream-50 shadow-sm')}>
      {shopInitial(name)}
    </span>
  );
}

function Brand() {
  // Real tenant → the seller's own shop name/logo; demo/root → the product brand.
  const shop = getCachedShopInfo();
  const name = shop?.name ?? APP_NAME;
  return (
    <ShopLink to="/" className="flex items-center gap-2.5 shrink-0">
      <LogoTile logoUrl={shop?.logoUrl ?? null} name={shop?.name} className="h-10 w-10 rounded-xl text-lg" />
      <span className="leading-tight">
        <span className="block font-display text-lg font-bold text-brand-800">{name}</span>
        <span className="block text-[11px] tracking-wide text-ink-soft">
          {shop ? 'Online Shop' : 'နမူနာ · Demo Shop'}
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

// Mobile tab bar (reference-style bottom nav): mirrors NAV plus a dedicated
// cart tab, since the in-app WebView leaves no room for a desktop-style top
// nav on small screens.
const BOTTOM_NAV = [
  {to: '/', label: 'ပင်မ', icon: HomeIcon, end: true},
  {to: '/products', label: 'ပစ္စည်း', icon: LayoutGrid, end: false},
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
    <div className="flex min-h-screen flex-col bg-cream-50 pb-16 md:pb-0">
      <header className="sticky top-0 z-40 border-b border-cream-200 bg-cream-50/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
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
                    isActive ? 'bg-brand-700 text-cream-100' : 'text-ink hover:bg-cream-200',
                  )
                }>
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <button
              onClick={openDrawer}
              aria-label="စျေးဝယ်ခြင်း"
              className="relative grid h-11 w-11 place-items-center rounded-full text-brand-800 hover:bg-cream-200">
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand-700 px-1 text-[11px] font-bold text-cream-50">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-16 border-t border-cream-200 bg-brand-900 text-cream-100">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5">
              <LogoTile logoUrl={shop?.logoUrl ?? null} name={shop?.name} className="h-10 w-10 rounded-xl text-lg" />
              <span className="font-display text-lg font-bold">{shopName}</span>
            </div>
            <p className="my mt-3 max-w-xs text-sm text-cream-200/80">
              {shop
                ? `${shopName} — online store။ ပစ္စည်းရွေး → စျေးဝယ်ခြင်းထည့် → မှာယူ၍ လွယ်ကူစွာ ဝယ်ယူနိုင်ပါသည်။`
                : 'သရုပ်ပြ (demo) e-commerce စတိုး — ပစ္စည်း/ဈေးနှုန်း အားလုံး နမူနာ data သာဖြစ်ပြီး အမှန်တကယ် ရောင်းချခြင်း မဟုတ်ပါ။'}
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gold-400">လင့်များ</h4>
            <ul className="my mt-3 space-y-2 text-sm text-cream-200/80">
              <li><ShopLink to="/products" className="hover:text-white">ပစ္စည်းအားလုံး</ShopLink></li>
              <li><ShopLink to="/cart" className="hover:text-white">စျေးဝယ်ခြင်း</ShopLink></li>
              <li><ShopLink to="/orders" className="hover:text-white">Order စစ်ဆေးရန်</ShopLink></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gold-400">မှာယူရလွယ်ကူသည်</h4>
            <p className="my mt-3 text-sm text-cream-200/80">
              ပစ္စည်းရွေး → စျေးဝယ်ခြင်းထည့် → အမည်/ဖုန်း/လိပ်စာဖြည့် → ငွေလွှဲ၍ နောက်ဆုံး ၅ လုံးဖြည့် → ပြီးပါပြီ။
            </p>
          </div>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-xs text-cream-200/60">
          © {new Date().getFullYear()} {shopName}
          {shop ? '' : ' · နမူနာအတွက်သာ'}
        </div>
      </footer>

      <CartDrawer />

      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-cream-200 bg-cream-50/95 backdrop-blur md:hidden"
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
                  'relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-semibold',
                  isActive ? 'text-brand-800' : 'text-ink-soft',
                )
              }>
              <span className="relative">
                <Icon className="h-5 w-5" />
                {isCart && count > 0 && (
                  <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand-700 px-1 text-[9px] font-bold text-cream-50">
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
      className="flex items-center gap-2 rounded-full border border-cream-200 bg-white px-4 py-2 shadow-sm focus-within:border-brand-400">
      <Search className="h-4 w-4 text-ink-soft" />
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        placeholder="ပစ္စည်း ရှာရန်…"
        className="my w-full bg-transparent text-sm outline-none placeholder:text-ink-soft"
      />
    </form>
  );
}
