import {useEffect, useState} from 'react';
import {Grid2X2, Home, Menu, PackageSearch, Search, ShoppingBag, X} from 'lucide-react';
import {useLocation} from 'react-router-dom';
import {useCart} from '@/features/cart/state';
import {api} from '@/data/dataSource';
import {FONT_PAIRINGS} from '@/domain/fontPairing';
import {getCachedShopInfo, getStorefrontTheme} from '@/features/tenancy/shopResolver';
import {APP_NAME} from '@/shared/lib/brand';
import {ShopLink} from '@/features/tenancy/ShopLink';
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
  const isDemo = !shop;
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
    <div className={`flex min-h-screen flex-col overflow-x-clip pb-[72px] md:pb-0 ${isDemo ? 'bg-[#eee6ff]' : 'bg-white'}`} style={fontPairingStyle(theme.fontPairing)}>
      <AnnouncementBar />
      <header className={`sticky top-0 z-40 backdrop-blur-xl ${isDemo ? 'border-b border-white/35 bg-[#eee6ff]/92' : 'border-b border-rose-100/70 bg-white/95'}`}>
        <div className="mx-auto flex h-[78px] w-full max-w-[1440px] items-center gap-3 px-4 sm:h-[88px] sm:px-6 lg:px-8">
          <Brand />
          <div className="ml-auto flex min-w-0 items-center justify-end gap-1.5 sm:gap-2">
            <ShopLink to="/products" aria-label="ပစ္စည်းရှာရန်" className={`grid h-11 w-11 place-items-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 ${isDemo ? 'text-[#2f1b4e] hover:bg-white/70 focus-visible:ring-[#6d28d9]' : 'text-slate-900 hover:bg-[#fff0f5] focus-visible:ring-[#e11d48]'}`}>
              <Search className="h-[22px] w-[22px]" strokeWidth={1.8} />
            </ShopLink>
            <button type="button" onClick={openDrawer} aria-label="ဈေးခြင်းဖွင့်ရန်" className={`relative grid h-11 w-11 place-items-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 ${isDemo ? 'text-[#2f1b4e] hover:bg-white/70 focus-visible:ring-[#6d28d9]' : 'text-slate-900 hover:bg-[#fff0f5] focus-visible:ring-[#e11d48]'}`}>
              <ShoppingBag className="h-[22px] w-[22px]" strokeWidth={1.8} />
              {count > 0 && <span className="absolute right-0 top-0 grid h-[19px] min-w-[19px] place-items-center rounded-full bg-[#ff3b72] px-1 font-sans text-[10px] font-bold text-white ring-2 ring-white">{count}</span>}
            </button>
            <button type="button" onClick={() => setMenuOpen(true)} aria-label="မီနူးဖွင့်ရန်" className="grid h-11 w-11 place-items-center rounded-full text-slate-900 transition hover:bg-[#fff0f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e11d48]">
              <Menu className="h-[22px] w-[22px]" strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="hidden border-t border-rose-100 bg-slate-950 text-white md:block">
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
      </footer>

      <nav className={`fixed inset-x-0 bottom-0 z-40 grid h-[72px] grid-cols-5 px-1 pb-[max(6px,env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden ${isDemo ? 'border-t border-white/60 bg-[#fbf8ff]/96 shadow-[0_-14px_36px_rgba(76,29,149,0.12)]' : 'border-t border-rose-100 bg-white/98 shadow-[0_-10px_30px_rgba(88,52,64,0.08)]'}`} aria-label="Mobile navigation">
        <ShopLink to="/" className={`flex flex-col items-center justify-center gap-1 text-[10px] font-semibold ${active('/') ? (isDemo ? 'text-[#6d28d9]' : 'text-[#e11d48]') : 'text-slate-500'}`}>
          <Home className="h-5 w-5" /><span>Home</span>
        </ShopLink>
        <ShopLink to="/products" className={`flex flex-col items-center justify-center gap-1 text-[10px] font-semibold ${active('/products') ? (isDemo ? 'text-[#6d28d9]' : 'text-[#e11d48]') : 'text-slate-500'}`}>
          <Grid2X2 className="h-5 w-5" /><span>Categories</span>
        </ShopLink>
        <button type="button" onClick={openDrawer} className="relative flex flex-col items-center justify-center gap-1 text-[10px] font-semibold text-slate-500">
          <ShoppingBag className="h-5 w-5" /><span>Cart</span>
          {count > 0 && <span className="absolute right-[24%] top-0 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-[#ff3b72] px-1 text-[9px] font-bold text-white">{count}</span>}
        </button>
        <ShopLink to="/orders" className={`flex flex-col items-center justify-center gap-1 text-[10px] font-semibold ${active('/orders') ? (isDemo ? 'text-[#6d28d9]' : 'text-[#e11d48]') : 'text-slate-500'}`}>
          <PackageSearch className="h-5 w-5" /><span>Orders</span>
        </ShopLink>
        <button type="button" onClick={() => setMenuOpen(true)} className="flex flex-col items-center justify-center gap-1 text-[10px] font-semibold text-slate-500">
          <Menu className="h-5 w-5" /><span>Menu</span>
        </button>
      </nav>

      <CartDrawer />

      {menuOpen && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="ဆိုင်မီနူး">
          <button type="button" aria-label="မီနူးပိတ်ရန်" className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={() => setMenuOpen(false)} />
          <aside className="relative flex h-full w-[84%] max-w-[390px] flex-col bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-rose-100 pb-5">
              <div><p className="text-2xl font-bold text-slate-950">{shopName}</p><p className="mt-1 text-xs font-medium text-[#e11d48]">အွန်လိုင်းဖက်ရှင်ဆိုင်</p></div>
              <button type="button" aria-label="မီနူးပိတ်ရန်" onClick={() => setMenuOpen(false)} className="grid h-11 w-11 place-items-center rounded-full hover:bg-[#fff0f5]"><X className="h-6 w-6" /></button>
            </div>
            <nav className="mt-7 flex flex-col">
              <ShopLink to="/" className="border-b border-rose-100 py-4 text-base font-semibold text-slate-900 transition hover:text-[#e11d48]">
                ပင်မ
              </ShopLink>
              {categories.map((category) => (
                <ShopLink
                  key={category}
                  to={`/products?category=${encodeURIComponent(category)}`}
                  className="border-b border-rose-100 py-4 text-base font-semibold text-slate-900 transition hover:text-[#e11d48]">
                  {category}
                </ShopLink>
              ))}
              {DRAWER_NAV.slice(1).map((item) => (
                <ShopLink key={item.to} to={item.to} className="border-b border-rose-100 py-4 text-base font-semibold text-slate-900 transition hover:text-[#e11d48]">
                  {item.label}
                </ShopLink>
              ))}
            </nav>
            <div className="mt-auto border-t border-rose-100 pt-6">
              {drawerFooterAction ?? (
                <ShopLink to="/orders" className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#e11d48] px-5 py-3 text-sm font-semibold text-white hover:bg-[#be123c]">
                  အော်ဒါစစ်ရန်
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
  return (
    <form onSubmit={(event) => {event.preventDefault(); onSubmit(value.trim());}} className="flex min-h-12 items-center gap-2 rounded-full border border-rose-200 bg-white px-4 shadow-sm transition focus-within:border-[#e11d48]">
      <Search className="h-4 w-4 text-[#e11d48]" />
      <input value={value} onChange={(event) => setValue(event.target.value)} placeholder="ပစ္စည်းရှာရန်…" className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400" />
    </form>
  );
}
