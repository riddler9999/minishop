import {useEffect, useState} from 'react';
import {Grid2X2, Home, Menu, PackageSearch, Search, ShoppingBag, X} from 'lucide-react';
import {useLocation} from 'react-router-dom';
import {useCart} from '@/features/cart/state';
import {api} from '@/data/dataSource';
import {FONT_PAIRINGS} from '@/domain/fontPairing';
import {getCachedShopInfo, getStorefrontTheme} from '@/features/tenancy/shopResolver';
import {APP_NAME} from '@/shared/lib/brand';
import {ShopLink} from '@/features/tenancy/ShopLink';
import {useDemoStore} from '@/features/demo/DemoStoreContext';
import CartDrawer from '@/features/cart/components/CartDrawer';

function fontPairingStyle(fontPairing: keyof typeof FONT_PAIRINGS): React.CSSProperties {
  const pairing = FONT_PAIRINGS[fontPairing];
  return {
    ['--font-display' as string]: pairing.display,
    ['--font-sans' as string]: pairing.body,
    fontFamily: 'var(--font-sans)',
  };
}

function Brand() {
  const shop = getCachedShopInfo();
  const name = shop?.name ?? APP_NAME;
  const logoUrl = shop?.logoUrl;

  return (
    <ShopLink to="/" className="flex min-w-0 items-center gap-2 overflow-hidden">
      {logoUrl ? (
        <img src={logoUrl} alt="" className="h-10 w-10 shrink-0 rounded-2xl object-cover ring-2 ring-[#fbcfe8]" />
      ) : (
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border-2 border-[#e11d48] text-[#e11d48]">
          <ShoppingBag className="h-5 w-5" strokeWidth={1.8} />
        </span>
      )}
      <span className="min-w-0">
        <span className="font-display block truncate text-[20px] font-black leading-none tracking-[-0.03em] text-[#e11d48] sm:text-[24px]">{name}</span>
        <span className="mt-1 hidden text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400 sm:block">Wear Your Story</span>
      </span>
    </ShopLink>
  );
}

const DRAWER_NAV = [
  {to: '/', label: 'ပင်မ'},
  {to: '/shipping-policy', label: 'ပို့ဆောင်သည့်ပုံစံ'},
  {to: '/refund-policy', label: 'Refund Policy'},
];

function AnnouncementBar() {
  const theme = getStorefrontTheme();
  const {enabled, text} = theme.announcement;
  if (!enabled || !text.trim()) return null;
  return (
    <div style={{backgroundColor: theme.accentColor}} className="px-4 py-2 text-center text-xs font-semibold text-white sm:text-sm">
      {text}
    </div>
  );
}

export default function Layout({children, drawerFooterAction}: {children: React.ReactNode; drawerFooterAction?: React.ReactNode}) {
  const {count, openDrawer} = useCart();
  const {pathname} = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const shop = getCachedShopInfo();
  const shopName = shop?.name ?? APP_NAME;
  const theme = getStorefrontTheme();
  const isDemo = useDemoStore();

  useEffect(() => {
    setMenuOpen(false);
    window.scrollTo({top: 0, behavior: 'instant' as ScrollBehavior});
  }, [pathname]);

  useEffect(() => {
    let alive = true;
    api.categories().then((r) => {
      if (alive) setCategories(r.categories);
    }).catch(() => {
      if (alive) setCategories([]);
    });
    return () => {
      alive = false;
    };
  }, [shopName]);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  const active = (target: string) => target === '/' ? pathname.endsWith('/') : pathname.includes(target);

  return (
    <div data-demo-store={isDemo ? "" : undefined} className={`flex min-h-screen flex-col overflow-x-clip pb-[72px] md:pb-0 ${isDemo ? 'bg-[#fff1e6]' : 'bg-white'}`} style={fontPairingStyle(theme.fontPairing)}>
      <AnnouncementBar />
      {!isDemo && (
        <header className="sticky top-0 z-40 border-b border-rose-100/70 bg-white/95 backdrop-blur-xl">
          <div className="mx-auto flex h-[78px] w-full max-w-[1440px] items-center gap-3 px-4 sm:h-[88px] sm:px-6 lg:px-8">
            <Brand />
            <div className="ml-auto flex min-w-0 items-center justify-end gap-1.5 sm:gap-2">
              <ShopLink to="/products" aria-label="ပစ္စည်းရှာရန်" className="grid h-11 w-11 place-items-center rounded-full text-slate-900 transition hover:bg-[#fff0f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e11d48]">
                <Search className="h-[22px] w-[22px]" strokeWidth={1.8} />
              </ShopLink>
              <button type="button" onClick={openDrawer} aria-label="ဈေးခြင်းဖွင့်ရန်" className="relative grid h-11 w-11 place-items-center rounded-full text-slate-900 transition hover:bg-[#fff0f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e11d48]">
                <ShoppingBag className="h-[22px] w-[22px]" strokeWidth={1.8} />
                {count > 0 && <span className="absolute right-0 top-0 grid h-[19px] min-w-[19px] place-items-center rounded-full bg-[#ff3b72] px-1 font-sans text-[10px] font-bold text-white ring-2 ring-white">{count}</span>}
              </button>
              <button type="button" onClick={() => setMenuOpen(true)} aria-label="မီနူးဖွင့်ရန်" className="grid h-11 w-11 place-items-center rounded-full text-slate-900 transition hover:bg-[#fff0f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e11d48]">
                <Menu className="h-[22px] w-[22px]" strokeWidth={1.8} />
              </button>
            </div>
          </div>
        </header>
      )}

      <main className="flex-1">{children}</main>

      {!isDemo && <footer className="hidden border-t border-rose-100 bg-slate-950 text-white md:block">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-8 text-center sm:flex-row sm:px-8 sm:text-left">
          <div><p className="text-xl font-bold">{shopName}</p><p className="mt-1 text-xs text-rose-200">အွန်လိုင်းဖက်ရှင်ဆိုင်</p></div>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-white/65 sm:justify-start">
            <ShopLink to="/products" className="hover:text-white">ပစ္စည်းများ</ShopLink>
            <ShopLink to="/orders" className="hover:text-white">အော်ဒါရှာရန်</ShopLink>
            <ShopLink to="/privacy-policy" className="hover:text-white">Privacy Policy</ShopLink>
            <ShopLink to="/terms-of-service" className="hover:text-white">Terms of Service</ShopLink>
          </div>
          <p className="text-xs text-white/45">© {new Date().getFullYear()} {shopName}</p>
        </div>
      </footer>}

      {isDemo ? (
        <nav className="fixed inset-x-4 bottom-3 z-40 mx-auto grid h-[70px] max-w-[390px] grid-cols-3 rounded-[26px] border border-white/70 bg-[#fffaf5]/96 px-2 pb-[max(7px,env(safe-area-inset-bottom))] pt-2 shadow-[0_18px_48px_rgba(151,63,10,0.18)] backdrop-blur-xl md:hidden" aria-label="Mobile navigation">
          <ShopLink to="/" className={`flex flex-col items-center justify-center gap-1 text-[10px] font-semibold ${active('/') ? 'text-[#f05a00]' : 'text-[#80695b]'}`}>
            <span className={`grid h-8 w-8 place-items-center rounded-full ${active('/') ? 'bg-[#ffe3c7]' : ''}`}><Home className="h-[19px] w-[19px]" strokeWidth={2.1} /></span>
            <span>Home</span>
          </ShopLink>
          <ShopLink to="/products" className={`flex flex-col items-center justify-center gap-1 text-[10px] font-semibold ${active('/products') ? 'text-[#f05a00]' : 'text-[#80695b]'}`}>
            <span className={`grid h-8 w-8 place-items-center rounded-full ${active('/products') ? 'bg-[#ffe3c7]' : ''}`}><Grid2X2 className="h-[19px] w-[19px]" strokeWidth={2.1} /></span>
            <span>Catalog</span>
          </ShopLink>
          <ShopLink to="/cart" className={`relative flex flex-col items-center justify-center gap-1 text-[10px] font-semibold ${active('/cart') ? 'text-[#f05a00]' : 'text-[#80695b]'}`}>
            <span className={`relative grid h-8 w-8 place-items-center rounded-full ${active('/cart') ? 'bg-[#ffe3c7]' : ''}`}><ShoppingBag className="h-[20px] w-[20px]" strokeWidth={2.1} />
              {count > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#f05a00] px-1 text-[8px] font-bold text-white ring-2 ring-[#fffaf5]">{count}</span>}
            </span>
            <span>Bag</span>
          </ShopLink>
        </nav>
      ) : (
        <nav className="fixed inset-x-0 bottom-0 z-40 grid h-[72px] grid-cols-5 border-t border-rose-100 bg-white/98 px-1 pb-[max(6px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_30px_rgba(88,52,64,0.08)] backdrop-blur md:hidden" aria-label="Mobile navigation">
          <ShopLink to="/" className={`flex flex-col items-center justify-center gap-1 text-[10px] font-semibold ${active('/') ? 'text-[#e11d48]' : 'text-slate-500'}`}>
            <Home className="h-5 w-5" /><span>Home</span>
          </ShopLink>
          <ShopLink to="/products" className={`flex flex-col items-center justify-center gap-1 text-[10px] font-semibold ${active('/products') ? 'text-[#e11d48]' : 'text-slate-500'}`}>
            <Grid2X2 className="h-5 w-5" /><span>Categories</span>
          </ShopLink>
          <button type="button" onClick={openDrawer} className="relative flex flex-col items-center justify-center gap-1 text-[10px] font-semibold text-slate-500">
            <ShoppingBag className="h-5 w-5" /><span>Cart</span>
            {count > 0 && <span className="absolute right-[24%] top-0 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-[#ff3b72] px-1 text-[9px] font-bold text-white">{count}</span>}
          </button>
          <ShopLink to="/orders" className={`flex flex-col items-center justify-center gap-1 text-[10px] font-semibold ${active('/orders') ? 'text-[#e11d48]' : 'text-slate-500'}`}>
            <PackageSearch className="h-5 w-5" /><span>Orders</span>
          </ShopLink>
          <button type="button" onClick={() => setMenuOpen(true)} className="flex flex-col items-center justify-center gap-1 text-[10px] font-semibold text-slate-500">
            <Menu className="h-5 w-5" /><span>Menu</span>
          </button>
        </nav>
      )}

      <CartDrawer />

      {menuOpen && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="ဆိုင်မီနူး">
          <button type="button" aria-label="မီနူးပိတ်ရန်" className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={() => setMenuOpen(false)} />
          <aside className={isDemo ? "relative flex h-full w-[84%] max-w-[390px] flex-col bg-[#fffaf5] p-6 shadow-2xl" : "relative flex h-full w-[84%] max-w-[390px] flex-col bg-white p-6 shadow-2xl"}>
            <div className={isDemo ? "flex items-center justify-between border-b border-[#f3d5bd] pb-5" : "flex items-center justify-between border-b border-rose-100 pb-5"}>
              <div><p className={isDemo ? "font-serif text-2xl font-black tracking-[0.08em] text-[#25140b]" : "text-2xl font-bold text-slate-950"}>{isDemo ? 'SOLÉ' : shopName}</p><p className={isDemo ? "mt-1 text-xs font-medium text-[#f05a00]" : "mt-1 text-xs font-medium text-[#e11d48]"}>{isDemo ? 'Fine fragrance collection' : 'အွန်လိုင်းဖက်ရှင်ဆိုင်'}</p></div>
              <button type="button" aria-label="မီနူးပိတ်ရန်" onClick={() => setMenuOpen(false)} className={isDemo ? "grid h-11 w-11 place-items-center rounded-full text-[#6f5140] hover:bg-[#ffe3c7]" : "grid h-11 w-11 place-items-center rounded-full hover:bg-[#fff0f5]"}><X className="h-6 w-6" /></button>
            </div>
            <nav className="mt-7 flex flex-col">
              <ShopLink to="/" className={isDemo ? "border-b border-[#f3d5bd] py-4 text-base font-semibold text-[#25140b] transition hover:text-[#f05a00]" : "border-b border-rose-100 py-4 text-base font-semibold text-slate-900 transition hover:text-[#e11d48]"}>
                {isDemo ? 'Home' : 'ပင်မ'}
              </ShopLink>
              {categories.map((category) => (
                <ShopLink
                  key={category}
                  to={`/products?category=${encodeURIComponent(category)}`}
                  className={isDemo ? "border-b border-[#f3d5bd] py-4 text-base font-semibold text-[#25140b] transition hover:text-[#f05a00]" : "border-b border-rose-100 py-4 text-base font-semibold text-slate-900 transition hover:text-[#e11d48]"}>
                  {category}
                </ShopLink>
              ))}
              {DRAWER_NAV.slice(1).map((item) => (
                <ShopLink key={item.to} to={item.to} className={isDemo ? "border-b border-[#f3d5bd] py-4 text-base font-semibold text-[#25140b] transition hover:text-[#f05a00]" : "border-b border-rose-100 py-4 text-base font-semibold text-slate-900 transition hover:text-[#e11d48]"}>
                  {item.label}
                </ShopLink>
              ))}
            </nav>
            <div className={isDemo ? "mt-auto border-t border-[#f3d5bd] pt-6" : "mt-auto border-t border-rose-100 pt-6"}>
              {drawerFooterAction ?? (
                <ShopLink to="/orders" className={isDemo ? "inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#f05a00] px-5 py-3 text-sm font-semibold text-white hover:bg-[#d94700]" : "inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#e11d48] px-5 py-3 text-sm font-semibold text-white hover:bg-[#be123c]"}>
                  {isDemo ? 'Track order' : 'အော်ဒါစစ်ရန်'}
                </ShopLink>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

export function SearchBox({defaultValue = '', onSubmit}: {defaultValue?: string; onSubmit: (q: string) => void}) {
  const [value, setValue] = useState(defaultValue);
  const isDemo = useDemoStore();

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(value.trim());
      }}
      className={isDemo
        ? "flex min-h-12 items-center gap-2 rounded-full border border-[#f3c7a5] bg-white px-4 shadow-sm transition focus-within:border-[#f05a00]"
        : "flex min-h-12 items-center gap-2 rounded-full border border-rose-200 bg-white px-4 shadow-sm transition focus-within:border-[#e11d48]"}>
      <Search className={isDemo ? "h-4 w-4 text-[#f05a00]" : "h-4 w-4 text-[#e11d48]"} />
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={isDemo ? "Search fragrances…" : "ပစ္စည်းရှာရန်…"}
        className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
      />
    </form>
  );
}
