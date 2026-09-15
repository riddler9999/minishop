import {useEffect, useState} from 'react';
import {NavLink, useLocation} from 'react-router-dom';
import {ClipboardList, Gem, Menu, Search, ShoppingBag, X} from 'lucide-react';
import {useCart} from '../lib/cart';
import {cx} from '../lib/format';
import {shopHref} from '../lib/shopContext';
import {getCachedShopInfo} from '../lib/store';
import {APP_NAME} from '../lib/brand';
import {ShopLink} from './ShopLink';
import CartDrawer from './CartDrawer';

function Brand() {
  const shop = getCachedShopInfo();
  const name = shop?.name ?? APP_NAME;

  return (
    <ShopLink to="/" className="flex min-w-0 flex-col items-center justify-center text-center">
      <span className="mb-0.5 text-[#b47c24]" aria-hidden="true">
        <Gem className="h-5 w-5" strokeWidth={1.4} />
      </span>
      <span className="max-w-[180px] truncate font-display text-[20px] font-normal uppercase leading-none tracking-[0.2em] text-[#3a2618] sm:max-w-[260px] sm:text-[24px]">
        {name}
      </span>
      <span className="mt-1 hidden text-[8px] font-semibold uppercase tracking-[0.34em] text-[#a46d20] sm:block sm:text-[9px]">
        Fine Jewelry
      </span>
    </ShopLink>
  );
}

const DRAWER_NAV = [
  {to: '/', label: 'Home'},
  {to: '/products', label: 'Collections'},
  {to: '/orders', label: 'Order Lookup'},
];

const BOTTOM_NAV = [
  {to: '/products', label: 'Shop', icon: Gem, end: false},
  {to: '/cart', label: 'Cart', icon: ShoppingBag, end: false},
  {to: '/orders', label: 'Orders', icon: ClipboardList, end: false},
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
    <div className="flex min-h-screen flex-col bg-[#fffdf9] pb-[74px] md:pb-0">
      <header className="sticky top-0 z-40 border-b border-[#e9dfd1] bg-[#fffdf9]/95 backdrop-blur-xl">
        <div className="mx-auto grid h-[82px] max-w-[1440px] grid-cols-[48px_1fr_48px] items-center px-3 sm:h-[96px] sm:grid-cols-[170px_1fr_220px] sm:px-6 lg:px-8">
          <div className="flex items-center justify-start">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="grid h-11 w-11 place-items-center rounded-full text-[#261a12] transition hover:bg-[#f3eadf]">
              <Menu className="h-7 w-7" strokeWidth={1.5} />
            </button>
          </div>

          <Brand />

          <div className="flex items-center justify-end gap-1.5 sm:gap-2">
            <ShopLink
              to="/products"
              aria-label="Search products"
              className="hidden h-11 w-11 place-items-center rounded-full text-[#271b12] transition hover:bg-[#f3eadf] sm:grid">
              <Search className="h-[22px] w-[22px]" strokeWidth={1.7} />
            </ShopLink>

            <button
              type="button"
              onClick={openDrawer}
              aria-label="Open cart"
              className="relative grid h-11 w-11 place-items-center rounded-full text-[#271b12] transition hover:bg-[#f3eadf]">
              <ShoppingBag className="h-[22px] w-[22px]" strokeWidth={1.7} />
              {count > 0 && (
                <span className="absolute right-0 top-0 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#b47c24] px-1 font-sans text-[10px] font-bold text-white ring-2 ring-[#fffdf9]">
                  {count}
                </span>
              )}
            </button>

            <ShopLink
              to="/products"
              className="jewel-cta hidden min-h-11 items-center rounded-full px-5 py-2.5 text-sm font-semibold sm:inline-flex">
              Shop Collection
            </ShopLink>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-[#e3d5c1] bg-[#1d130c] text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-8 text-center sm:flex-row sm:px-8 sm:text-left">
          <div>
            <p className="font-display text-xl font-normal uppercase tracking-[0.12em]">{shopName}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.22em] text-[#d7b678]">Fine Jewelry</p>
          </div>
          <div className="flex items-center gap-5 text-sm text-white/65">
            <ShopLink to="/products" className="hover:text-white">Collections</ShopLink>
            <ShopLink to="/orders" className="hover:text-white">Order Lookup</ShopLink>
          </div>
          <p className="text-xs text-white/45">© {new Date().getFullYear()} {shopName}</p>
        </div>
      </footer>

      <CartDrawer />

      {menuOpen && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Store menu">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="relative flex h-full w-[84%] max-w-[390px] flex-col bg-[#fffdf9] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e4d8c7] pb-5">
              <div>
                <p className="font-display text-2xl uppercase tracking-[0.12em] text-[#342216]">{shopName}</p>
                <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.28em] text-[#a46d20]">Fine Jewelry</p>
              </div>
              <button
                type="button"
                aria-label="Close menu"
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
                  className="border-b border-[#eee4d7] py-5 font-display text-3xl font-normal text-[#2a1b12] transition hover:pl-1 hover:text-[#9d6b21]">
                  {item.label}
                </ShopLink>
              ))}
            </nav>

            <div className="mt-auto border-t border-[#e4d8c7] pt-6">
              <p className="text-xs leading-5 text-[#766b60]">Curated jewellery for celebrations, milestones and everyday elegance.</p>
              <ShopLink to="/products" className="jewel-cta mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold">
                Explore Collections
              </ShopLink>
            </div>
          </aside>
        </div>
      )}

      <nav
        aria-label="Store navigation"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-[#dfd3c2] bg-[#fffdf9]/97 shadow-[0_-8px_30px_rgba(69,45,22,0.06)] backdrop-blur-xl md:hidden"
        style={{paddingBottom: 'env(safe-area-inset-bottom)'}}>
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
                  'relative flex min-h-[68px] flex-col items-center justify-center gap-1 border-[#e4d8c7] text-[11px] font-medium transition',
                  index < BOTTOM_NAV.length - 1 ? 'border-r' : '',
                  isActive ? 'text-[#8e601f]' : 'text-[#3d332b]',
                )
              }>
              <span className="relative">
                <Icon className="h-[24px] w-[24px]" strokeWidth={1.6} />
                {isCart && count > 0 && (
                  <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#b47c24] px-1 text-[9px] font-bold text-white ring-2 ring-[#fffdf9]">
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
      className="flex min-h-12 items-center gap-2 rounded-full border border-[#ded0bd] bg-white px-4 shadow-sm transition focus-within:border-[#b8832f]">
      <Search className="h-4 w-4 text-[#826e58]" />
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search jewellery…"
        className="w-full bg-transparent text-sm text-[#2b2119] outline-none placeholder:text-[#9d9185]"
      />
    </form>
  );
}
