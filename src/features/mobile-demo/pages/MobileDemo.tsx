import {useMemo, useState, type FormEvent, type ReactNode} from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Smartphone,
  CheckCircle2,
  Grid2X2,
  Heart,
  Home,
  Menu,
  Minus,
  PackageSearch,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import {Route, Routes, useLocation, useNavigate, useParams} from 'react-router-dom';
import type {Product} from '@/domain/product';
import {CartProvider, useCart} from '@/features/cart/state';
import {setShopSlug} from '@/features/tenancy/shopContext';
import {
  FURNITURE_BEST_SELLING_IDS,
  FURNITURE_CATEGORIES,
  FURNITURE_FEATURED_IDS,
  FURNITURE_PRODUCTS,
  mobileProduct,
} from '../data';
import {
  createMobileDemoOrder,
  findMobileDemoOrder,
  getMobileDemoOrder,
  type MobileDemoOrder,
} from '../orderStore';

const COLORS = {
  canvas: '#0a0a0b',
  surface: '#141416',
  ink: '#f5f5f6',
  muted: '#a8a8ad',
  border: '#2a2a2e',
  accent: '#d8d8dc',
  accentDark: '#ffffff',
  sage: '#8b8b91',
};

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1592286927505-1def25115558?auto=format&fit=crop&w=1800&q=90';

const formatMMK = (value: number) => `${new Intl.NumberFormat('en-US').format(value)} MMK`;

function MobileHeader() {
  const nav = useNavigate();
  const {count} = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-[#ebe4dc] bg-[#141416]/95 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-4 sm:px-6">
        <button
          type="button"
          onClick={() => nav('/mobile-demo')}
          className="group flex min-h-11 items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d8d8dc] focus-visible:ring-offset-2"
          aria-label="Mobile One home">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#f1e7dc] text-[#f5f5f6] transition group-hover:bg-[#eadbcb]">
            <Smartphone className="h-5 w-5" strokeWidth={1.7} />
          </span>
          <span>
            <span className="block text-[22px] font-black leading-none tracking-[-0.045em] text-[#f5f5f6]">Mobile One</span>
            <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.34em] text-[#9b9ba1]">Mobile</span>
          </span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => nav('/mobile-demo/products')}
            className="grid h-11 w-11 place-items-center rounded-full text-[#292b29] transition hover:bg-[#202024] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d8d8dc]"
            aria-label="Search mobile">
            <Search className="h-[21px] w-[21px]" strokeWidth={1.8} />
          </button>
          <button
            type="button"
            onClick={() => nav('/mobile-demo/cart')}
            className="relative grid h-11 w-11 place-items-center rounded-full text-[#292b29] transition hover:bg-[#202024] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d8d8dc]"
            aria-label={`Open cart, ${count} item${count === 1 ? '' : 's'}`}>
            <ShoppingBag className="h-[21px] w-[21px]" strokeWidth={1.8} />
            {count > 0 && (
              <span className="absolute right-0 top-0 grid h-5 min-w-5 place-items-center rounded-full bg-[#d8d8dc] px-1 text-[10px] font-bold text-black">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

function MobileShell({children}: {children: ReactNode}) {
  const nav = useNavigate();
  const {pathname} = useLocation();
  const {count} = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  const active = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

  return (
    <div className="min-h-screen bg-[#0a0a0b] pb-[76px] text-[#f5f5f6] md:pb-0">
      <MobileHeader />
      {children}

      <footer className="mt-10 hidden border-t border-[#28282c] bg-[#101012] md:block">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <p className="text-xl font-black tracking-[-0.04em]">Mobile One</p>
            <p className="mt-2 max-w-sm text-sm leading-6 text-[#a8a8ad]">
              Modern mobile for calm, practical homes in Yangon. Demo storefront powered by MiniShop MM.
            </p>
          </div>
          <div className="text-sm">
            <p className="font-bold">Shop</p>
            <div className="mt-3 grid gap-2 text-[#a8a8ad]">
              <button type="button" onClick={() => nav('/mobile-demo/products')} className="w-fit hover:text-[#d8d8dc]">All Mobile</button>
              <button type="button" onClick={() => nav('/mobile-demo/orders')} className="w-fit hover:text-[#d8d8dc]">Track Order</button>
            </div>
          </div>
          <div className="text-sm">
            <p className="font-bold">Info</p>
            <div className="mt-3 grid gap-2 text-[#a8a8ad]">
              <button type="button" onClick={() => nav('/mobile-demo/shipping-policy')} className="w-fit hover:text-[#d8d8dc]">Shipping Policy</button>
              <button type="button" onClick={() => nav('/mobile-demo/refund-policy')} className="w-fit hover:text-[#d8d8dc]">Refund Policy</button>
              <button type="button" onClick={() => nav('/mobile-demo/privacy-policy')} className="w-fit hover:text-[#d8d8dc]">Privacy Policy</button>
            </div>
          </div>
        </div>
      </footer>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid h-[76px] grid-cols-5 border-t border-[#28282c] bg-[#141416]/98 px-1 pb-[max(6px,env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden"
        aria-label="Mobile One demo mobile navigation">
        <button type="button" onClick={() => nav('/mobile-demo')} className={`flex flex-col items-center justify-center gap-1 text-[10px] font-semibold ${pathname === '/mobile-demo' ? 'text-[#f5f5f6]' : 'text-[#9b9ba1]'}`}>
          <Home className="h-5 w-5" strokeWidth={1.8} /><span>Home</span>
        </button>
        <button type="button" onClick={() => nav('/mobile-demo/products')} className={`flex flex-col items-center justify-center gap-1 text-[10px] font-semibold ${active('/mobile-demo/products') ? 'text-[#f5f5f6]' : 'text-[#9b9ba1]'}`}>
          <Grid2X2 className="h-5 w-5" strokeWidth={1.8} /><span>Shop</span>
        </button>
        <button type="button" onClick={() => nav('/mobile-demo/cart')} className={`relative flex flex-col items-center justify-center gap-1 text-[10px] font-semibold ${active('/mobile-demo/cart') ? 'text-[#f5f5f6]' : 'text-[#9b9ba1]'}`}>
          <ShoppingBag className="h-5 w-5" strokeWidth={1.8} /><span>Cart</span>
          {count > 0 && <span className="absolute right-[22%] top-0 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-[#d8d8dc] px-1 text-[9px] font-bold text-black">{count}</span>}
        </button>
        <button type="button" onClick={() => nav('/mobile-demo/orders')} className={`flex flex-col items-center justify-center gap-1 text-[10px] font-semibold ${active('/mobile-demo/orders') ? 'text-[#f5f5f6]' : 'text-[#9b9ba1]'}`}>
          <PackageSearch className="h-5 w-5" strokeWidth={1.8} /><span>Orders</span>
        </button>
        <button type="button" onClick={() => setMenuOpen(true)} className="flex flex-col items-center justify-center gap-1 text-[10px] font-semibold text-[#9b9ba1]">
          <Menu className="h-5 w-5" strokeWidth={1.8} /><span>Menu</span>
        </button>
      </nav>

      {menuOpen && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Mobile One menu">
          <button type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)} className="absolute inset-0 bg-black/35 backdrop-blur-[2px]" />
          <aside className="relative flex h-full w-[84%] max-w-[360px] flex-col bg-[#141416] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2a2a2e] pb-5">
              <div><p className="text-xl font-black tracking-[-0.04em]">Mobile One</p><p className="mt-1 text-xs text-[#f5f5f6]">Premium Mobile & Gadgets</p></div>
              <button type="button" onClick={() => setMenuOpen(false)} className="grid h-11 w-11 place-items-center rounded-full bg-[#202024]" aria-label="Close menu"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-5 flex flex-col">
              {[
                ['/mobile-demo', 'Home'],
                ['/mobile-demo/products', 'Shop All'],
                ['/mobile-demo/orders', 'Track Order'],
                ['/mobile-demo/shipping-policy', 'Shipping Policy'],
                ['/mobile-demo/refund-policy', 'Refund Policy'],
                ['/mobile-demo/privacy-policy', 'Privacy Policy'],
                ['/mobile-demo/terms-of-service', 'Terms of Service'],
              ].map(([to, label]) => (
                <button
                  type="button"
                  key={to}
                  onClick={() => { setMenuOpen(false); nav(to); }}
                  className="min-h-12 border-b border-[#2c2c31] text-left text-sm font-semibold text-[#373936] transition hover:text-[#f5f5f6]">
                  {label}
                </button>
              ))}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function SearchField({
  value,
  onChange,
  placeholder = 'Search iPhone, Galaxy and gadgets...',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex min-h-[52px] items-center gap-3 rounded-[18px] border border-[#2a2a2e] bg-[#141416] px-4 shadow-[0_4px_18px_rgba(76,59,43,0.04)] focus-within:border-[#b47d55] focus-within:ring-2 focus-within:ring-[#d8d8dc]/10">
      <Search className="h-5 w-5 shrink-0 text-[#9b9ba1]" strokeWidth={1.7} />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label="Search mobile"
        className="min-w-0 flex-1 bg-transparent text-sm text-[#f5f5f6] outline-none placeholder:text-[#9a9891]"
      />
      {value && (
        <button type="button" onClick={() => onChange('')} className="grid h-10 w-10 place-items-center rounded-full text-[#9b9ba1] hover:bg-[#202024]" aria-label="Clear search">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function ProductCard({product}: {product: Product}) {
  const nav = useNavigate();
  const {add} = useCart();
  const [favorite, setFavorite] = useState(false);
  const price = product.isPromotion && product.promoPrice ? product.promoPrice : product.price;
  const oldPrice = product.isPromotion && product.promoPrice ? product.price : null;

  return (
    <article className="min-w-0 overflow-hidden rounded-[20px] border border-[#2c2c31] bg-[#141416]">
      <button
        type="button"
        onClick={() => nav(`/mobile-demo/products/${encodeURIComponent(product.id)}`)}
        className="relative block w-full overflow-hidden bg-[#1a1a1d] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#d8d8dc]">
        <div className="aspect-[1.04] w-full overflow-hidden">
          <img src={product.image ?? ''} alt={product.name} loading="lazy" className="h-full w-full object-cover transition duration-300 hover:scale-[1.025]" />
        </div>
        {oldPrice && <span className="absolute left-2.5 top-2.5 rounded-full bg-[#d8d8dc] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-black">Sale</span>}
        <button
          type="button"
          onClick={(event) => { event.stopPropagation(); setFavorite((value) => !value); }}
          className={`absolute right-2.5 top-2.5 grid h-9 w-9 place-items-center rounded-full bg-[#17171a]/94 shadow-sm transition ${favorite ? 'text-[#f5f5f6]' : 'text-[#f3f3f5]'}`}
          aria-label={favorite ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          aria-pressed={favorite}>
          <Heart className="h-4 w-4" strokeWidth={1.8} fill={favorite ? 'currentColor' : 'none'} />
        </button>
      </button>
      <div className="p-3.5">
        <button type="button" onClick={() => nav(`/mobile-demo/products/${encodeURIComponent(product.id)}`)} className="line-clamp-2 min-h-[40px] text-left text-[13px] font-bold leading-5 text-[#1d201e] sm:text-sm">
          {product.name}
        </button>
        <p className="mt-1 text-[11px] text-[#9b9ba1]">{product.color}</p>
        <div className="mt-2 flex items-end justify-between gap-2">
          <div>
            <p className="text-sm font-black text-[#f5f5f6]">{formatMMK(price)}</p>
            {oldPrice && <p className="text-[10px] text-[#74747a] line-through">{formatMMK(oldPrice)}</p>}
          </div>
          <button
            type="button"
            disabled={!product.inStock}
            onClick={() => add(product)}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#d8d8dc] text-black transition hover:bg-[#d0d0d4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d8d8dc] focus-visible:ring-offset-2 disabled:bg-[#44444a]"
            aria-label={`Add ${product.name} to cart`}>
            <ShoppingBag className="h-4 w-4" strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </article>
  );
}

function MobileHome() {
  const nav = useNavigate();
  const [query, setQuery] = useState('');
  const featured = FURNITURE_FEATURED_IDS
    .map((id) => FURNITURE_PRODUCTS.find((product) => product.id === id))
    .filter((product): product is Product => Boolean(product));

  const categoryImages = useMemo(() => {
    const map = new Map<string, string>();
    for (const category of FURNITURE_CATEGORIES) {
      const image = FURNITURE_PRODUCTS.find((product) => product.category === category)?.image;
      if (image) map.set(category, image);
    }
    return map;
  }, []);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const q = query.trim();
    nav(q ? `/mobile-demo/products?q=${encodeURIComponent(q)}` : '/mobile-demo/products');
  };

  return (
    <MobileShell>
      <main className="mx-auto max-w-6xl px-4 pb-10 pt-4 sm:px-6 sm:pt-6">
        <form onSubmit={submitSearch}>
          <SearchField value={query} onChange={setQuery} />
        </form>

        <section className="relative mt-4 min-h-[330px] overflow-hidden rounded-[28px] bg-[#171719] sm:min-h-[420px]">
          <img src={HERO_IMAGE} alt="" className="absolute inset-0 h-full w-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0e0e10]/98 via-[#0e0e10]/88 to-[#0e0e10]/5 sm:via-[#0e0e10]/72]" />
          <div className="relative z-10 flex min-h-[330px] max-w-[73%] flex-col justify-center px-6 py-8 sm:min-h-[420px] sm:max-w-[52%] sm:px-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#b8b8bd]">Special Offer</p>
            <h1 className="mt-3 text-[35px] font-black leading-[0.99] tracking-[-0.055em] text-[#f5f5f6] sm:text-5xl">
              Own the<br />Next Upgrade
            </h1>
            <p className="mt-4 text-sm font-medium leading-6 text-[#c9c9ce] sm:text-base">Flagship phones, audio and gadgets for everyday life.</p>
            <button
              type="button"
              onClick={() => nav('/mobile-demo/products')}
              className="mt-5 inline-flex min-h-12 w-fit items-center gap-3 rounded-full bg-[#f5f5f6] px-5 text-sm font-bold text-[#0a0a0b] transition hover:bg-[#ffffff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5f5f6] focus-visible:ring-offset-2">
              Shop Now <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="absolute bottom-4 left-6 z-10 flex gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#d8d8dc]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#17171a]/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#17171a]/70" />
          </div>
        </section>

        <section className="mt-7">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-[25px] font-black tracking-[-0.04em]">Categories</h2>
            <button type="button" onClick={() => nav('/mobile-demo/products')} className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-[#a8a8ad] hover:text-[#f5f5f6]">See all <ArrowRight className="h-4 w-4" /></button>
          </div>
          <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto pb-1">
            {FURNITURE_CATEGORIES.slice(0, 5).map((category) => (
              <button
                type="button"
                key={category}
                onClick={() => nav(`/mobile-demo/products?category=${encodeURIComponent(category)}`)}
                className="w-[104px] shrink-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d8d8dc] focus-visible:ring-offset-2">
                <span className="block aspect-square overflow-hidden rounded-[20px] bg-[#ece7df]">
                  <img src={categoryImages.get(category) ?? HERO_IMAGE} alt="" className="h-full w-full object-cover" />
                </span>
                <span className="mt-2 block text-center text-xs font-semibold text-[#4c4e4b]">{category}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-7">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-[25px] font-black tracking-[-0.04em]">Featured</h2>
            <button type="button" onClick={() => nav('/mobile-demo/products')} className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-[#a8a8ad] hover:text-[#f5f5f6]">See all <ArrowRight className="h-4 w-4" /></button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
            {featured.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        </section>
      </main>
    </MobileShell>
  );
}

function MobileProducts() {
  const location = useLocation();
  const nav = useNavigate();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const [query, setQuery] = useState(params.get('q') ?? '');
  const category = params.get('category') ?? 'All';

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FURNITURE_PRODUCTS.filter((product) => {
      const categoryOk = category === 'All' || product.category === category;
      const queryOk = !q || `${product.name} ${product.category ?? ''} ${product.color ?? ''}`.toLowerCase().includes(q);
      return categoryOk && queryOk;
    });
  }, [category, query]);

  const setCategory = (next: string) => {
    const nextParams = new URLSearchParams(location.search);
    if (next === 'All') nextParams.delete('category');
    else nextParams.set('category', next);
    const qs = nextParams.toString();
    nav(qs ? `/mobile-demo/products?${qs}` : '/mobile-demo/products');
  };

  return (
    <MobileShell>
      <main className="mx-auto max-w-6xl px-4 pb-12 pt-5 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#f5f5f6]">Mobile One</p><h1 className="mt-1 text-3xl font-black tracking-[-0.05em]">Shop Mobile & Gadgets</h1></div>
          <span className="text-xs font-medium text-[#9b9ba1]">{visible.length} items</span>
        </div>

        <div className="mt-5"><SearchField value={query} onChange={setQuery} placeholder="Search sofa, chair, table..." /></div>

        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
          {['All', ...FURNITURE_CATEGORIES].map((item) => (
            <button
              type="button"
              key={item}
              onClick={() => setCategory(item)}
              className={`min-h-10 shrink-0 rounded-full border px-4 text-[11px] font-semibold transition ${category === item ? 'border-[#d8d8dc] bg-[#d8d8dc] text-black' : 'border-[#e2d9cf] bg-[#141416] text-[#615f5a] hover:border-[#b98b69]'}`}>
              {item}
            </button>
          ))}
        </div>

        {visible.length > 0 ? (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
            {visible.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : (
          <div className="mt-6 rounded-[22px] border border-[#2a2a2e] bg-[#141416] px-6 py-14 text-center">
            <Smartphone className="mx-auto h-7 w-7 text-[#f5f5f6]" />
            <p className="mt-3 text-sm font-semibold">No mobile found.</p>
            <p className="mt-1 text-xs text-[#9b9ba1]">Try another category or clear your search.</p>
            <button type="button" onClick={() => {setQuery(''); nav('/mobile-demo/products');}} className="mt-4 min-h-11 rounded-full bg-[#f5f5f6] px-5 text-xs font-bold text-black">Clear filters</button>
          </div>
        )}
      </main>
    </MobileShell>
  );
}

function MobileProductDetail() {
  const {id} = useParams();
  const nav = useNavigate();
  const {add} = useCart();
  const product = mobileProduct(id);
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [favorite, setFavorite] = useState(false);

  if (!product) {
    return (
      <MobileShell>
        <main className="mx-auto max-w-xl px-4 py-20 text-center">
          <Smartphone className="mx-auto h-8 w-8 text-[#f5f5f6]" />
          <h1 className="mt-4 text-xl font-black">Mobile not found</h1>
          <button type="button" onClick={() => nav('/mobile-demo/products')} className="mt-5 min-h-11 rounded-full bg-[#f5f5f6] px-5 text-sm font-bold text-[#0a0a0b]">Back to shop</button>
        </main>
      </MobileShell>
    );
  }

  const price = product.isPromotion && product.promoPrice ? product.promoPrice : product.price;
  const oldPrice = product.isPromotion && product.promoPrice ? product.price : null;
  const images = product.images?.length ? product.images : product.image ? [product.image] : [];
  const bestSelling = FURNITURE_BEST_SELLING_IDS
    .filter((productId) => productId !== product.id)
    .map((productId) => FURNITURE_PRODUCTS.find((item) => item.id === productId))
    .filter((item): item is Product => Boolean(item));

  const addCurrent = () => add(product, qty);

  return (
    <MobileShell>
      <main className="mx-auto max-w-6xl px-4 pb-12 pt-4 sm:px-6">
        <button type="button" onClick={() => nav(-1)} className="mb-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#66655f] hover:text-[#f5f5f6]">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="grid gap-6 md:grid-cols-2 md:gap-9">
          <div>
            <div className="relative aspect-[1.02] overflow-hidden rounded-[26px] bg-[#ebe5de]">
              {images[activeImage] && <img src={images[activeImage]} alt={product.name} className="h-full w-full object-cover" />}
              <button
                type="button"
                onClick={() => setFavorite((value) => !value)}
                className={`absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full bg-[#17171a]/94 shadow-sm transition ${favorite ? 'text-[#f5f5f6]' : 'text-[#f3f3f5]'}`}
                aria-label={favorite ? 'Remove from wishlist' : 'Add to wishlist'}
                aria-pressed={favorite}>
                <Heart className="h-5 w-5" strokeWidth={1.8} fill={favorite ? 'currentColor' : 'none'} />
              </button>
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-2">
                {images.map((src, index) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    className={`h-16 w-16 overflow-hidden rounded-2xl border-2 ${index === activeImage ? 'border-[#d8d8dc]' : 'border-transparent'}`}>
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="md:pt-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#f5f5f6]">{product.category}</p>
            <h1 className="mt-3 text-[32px] font-black leading-[1.05] tracking-[-0.05em] sm:text-4xl">{product.name}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-2xl font-black">{formatMMK(price)}</span>
              {oldPrice && <span className="text-sm text-[#74747a] line-through">{formatMMK(oldPrice)}</span>}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-2xl border border-[#2d2d31] bg-[#141416] p-3"><span className="block text-[#9b9ba1]">Color</span><strong className="mt-1 block">{product.color}</strong></div>
              <div className="rounded-2xl border border-[#2d2d31] bg-[#141416] p-3"><span className="block text-[#9b9ba1]">Size</span><strong className="mt-1 block">{product.size}</strong></div>
            </div>
            {product.description && <p className="mt-5 text-sm leading-7 text-[#b4b4b8]">{product.description}</p>}
            <div className="mt-5 flex items-center justify-between rounded-2xl border border-[#2d2d31] bg-[#141416] p-3">
              <span className="text-xs font-semibold text-[#66655f]">Quantity</span>
              <div className="inline-flex items-center rounded-full border border-[#34343a]">
                <button type="button" onClick={() => setQty((value) => Math.max(1, value - 1))} className="grid h-10 w-10 place-items-center" aria-label="Decrease quantity"><Minus className="h-4 w-4" /></button>
                <span className="w-8 text-center text-sm font-bold">{qty}</span>
                <button type="button" onClick={() => setQty((value) => Math.min(product.stock, value + 1))} className="grid h-10 w-10 place-items-center" aria-label="Increase quantity"><Plus className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <button type="button" onClick={addCurrent} className="min-h-[52px] rounded-[15px] border border-[#d8d8dc] bg-transparent px-5 text-sm font-bold text-[#8c572f] transition hover:bg-[#f1e7dc]">Add to Cart</button>
              <button type="button" onClick={() => {addCurrent(); nav('/mobile-demo/checkout');}} className="min-h-[52px] rounded-[15px] bg-[#f5f5f6] px-5 text-sm font-bold text-[#0a0a0b] transition hover:bg-[#ffffff]">Buy Now</button>
            </div>
            <div className="mt-5 flex items-center gap-2 text-xs text-[#a8a8ad]"><Truck className="h-4 w-4 text-[#7d8874]" /> Yangon delivery from 15,000 MMK · free over 2,000,000 MMK</div>
          </div>
        </div>

        <section className="mt-10 border-t border-[#28282c] pt-7">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#f5f5f6]">Popular Picks</p>
              <h2 className="mt-1 text-[25px] font-black tracking-[-0.04em]">Best Selling</h2>
            </div>
            <button type="button" onClick={() => nav('/mobile-demo/products')} className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-[#a8a8ad] hover:text-[#f5f5f6]">
              See all <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="no-scrollbar -mx-4 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
            {bestSelling.map((item) => {
              const itemPrice = item.isPromotion && item.promoPrice ? item.promoPrice : item.price;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => nav(`/mobile-demo/products/${encodeURIComponent(item.id)}`)}
                  className="w-[70%] max-w-[260px] shrink-0 snap-start overflow-hidden rounded-[20px] border border-[#2c2c31] bg-[#141416] text-left transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d8d8dc] focus-visible:ring-offset-2 sm:w-[240px]">
                  <div className="aspect-[1.18] overflow-hidden bg-[#1a1a1d]">
                    {item.image && <img src={item.image} alt={item.name} loading="lazy" className="h-full w-full object-cover transition duration-300 hover:scale-[1.025]" />}
                  </div>
                  <div className="p-3.5">
                    <p className="line-clamp-1 text-sm font-bold">{item.name}</p>
                    <p className="mt-1 text-[11px] text-[#9b9ba1]">{item.category}</p>
                    <p className="mt-2 text-sm font-black">{formatMMK(itemPrice)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </main>
    </MobileShell>
  );
}

function MobileCart() {
  const nav = useNavigate();
  const {items, subtotal, setQty, remove} = useCart();

  return (
    <MobileShell>
      <main className="mx-auto max-w-3xl px-4 pb-12 pt-5 sm:px-6">
        <h1 className="text-3xl font-black tracking-[-0.05em]">Your Cart</h1>
        <p className="mt-1 text-sm text-[#9b9ba1]">{items.length} item{items.length === 1 ? '' : 's'}</p>

        {items.length === 0 ? (
          <div className="mt-7 rounded-[24px] border border-[#2a2a2e] bg-[#141416] px-6 py-16 text-center">
            <ShoppingBag className="mx-auto h-8 w-8 text-[#f5f5f6]" />
            <p className="mt-4 text-sm font-semibold">Your cart is empty.</p>
            <p className="mt-1 text-xs text-[#9b9ba1]">Choose the phone or gadget that fits your day.</p>
            <button type="button" onClick={() => nav('/mobile-demo/products')} className="mt-5 min-h-11 rounded-full bg-[#f5f5f6] px-6 text-sm font-bold text-black">Browse Products</button>
          </div>
        ) : (
          <>
            <div className="mt-5 space-y-3">
              {items.map((item) => (
                <article key={item.id} className="flex gap-3 rounded-[20px] border border-[#2a2a2e] bg-[#141416] p-3">
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-[16px] bg-[#1a1a1d]">
                    {item.image && <img src={item.image} alt={item.name} className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start gap-2">
                      <p className="line-clamp-2 flex-1 text-sm font-bold leading-5">{item.name}</p>
                      <button type="button" onClick={() => remove(item.id)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#9b9ba1] hover:bg-[#202024] hover:text-[#8c572f]" aria-label={`Remove ${item.name}`}><Trash2 className="h-4 w-4" /></button>
                    </div>
                    <p className="mt-1 text-sm font-black">{formatMMK(item.price)}</p>
                    <div className="mt-auto inline-flex w-fit items-center rounded-full border border-[#34343a]">
                      <button type="button" onClick={() => item.qty === 1 ? remove(item.id) : setQty(item.id, item.qty - 1)} className="grid h-9 w-9 place-items-center" aria-label="Decrease quantity"><Minus className="h-3.5 w-3.5" /></button>
                      <span className="w-7 text-center text-xs font-bold">{item.qty}</span>
                      <button type="button" onClick={() => setQty(item.id, item.qty + 1)} className="grid h-9 w-9 place-items-center" aria-label="Increase quantity"><Plus className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <section className="mt-5 rounded-[20px] border border-[#2a2a2e] bg-[#141416] p-4">
              <div className="flex items-center justify-between text-sm text-[#a8a8ad]"><span>Subtotal</span><strong className="text-[#f5f5f6]">{formatMMK(subtotal)}</strong></div>
              <p className="mt-2 text-[11px] leading-5 text-[#9b9ba1]">Shipping is calculated at checkout. Orders over 2,000,000 MMK receive free demo delivery.</p>
            </section>
            <button type="button" onClick={() => nav('/mobile-demo/checkout')} className="mt-4 min-h-14 w-full rounded-[16px] bg-[#f5f5f6] px-5 text-sm font-black text-[#0a0b0c] transition hover:bg-[#ffffff]">
              Continue to Checkout
            </button>
          </>
        )}
      </main>
    </MobileShell>
  );
}

function MobileCheckout() {
  const nav = useNavigate();
  const {items, subtotal, clear} = useCart();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'kpay'>('cod');
  const [error, setError] = useState('');
  const shippingFee = subtotal >= 2_000_000 ? 0 : 15_000;

  if (!items.length) {
    return (
      <MobileShell>
        <main className="mx-auto max-w-xl px-4 py-20 text-center">
          <ShoppingBag className="mx-auto h-8 w-8 text-[#f5f5f6]" />
          <p className="mt-4 text-sm font-semibold">Your cart is empty.</p>
          <button type="button" onClick={() => nav('/mobile-demo/products')} className="mt-5 min-h-11 rounded-full bg-[#f5f5f6] px-6 text-sm font-bold text-black">Browse Products</button>
        </main>
      </MobileShell>
    );
  }

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!name.trim() || !/^09\d{7,9}$/.test(phone.replace(/[\s-]/g, '')) || !address.trim()) {
      setError('Please enter receiver name, a valid Myanmar phone number, and delivery address.');
      return;
    }

    const order = createMobileDemoOrder({
      customerName: name.trim(),
      phone: phone.replace(/[\s-]/g, ''),
      address: address.trim(),
      note: note.trim(),
      paymentMethod,
      items,
      subtotal,
    });
    clear();
    nav(`/mobile-demo/order/${encodeURIComponent(order.orderNo)}`, {state: {order}});
  };

  return (
    <MobileShell>
      <main className="mx-auto grid max-w-5xl gap-6 px-4 pb-12 pt-5 sm:px-6 lg:grid-cols-[1fr_360px]">
        <form onSubmit={submit} noValidate className="rounded-[24px] border border-[#2a2a2e] bg-[#141416] p-5 sm:p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#f5f5f6]">Delivery Details</p>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.05em]">Complete Your Order</h1>
          <div className="mt-6 grid gap-4">
            <label className="grid gap-1.5 text-xs font-semibold">Receiver name
              <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" className="min-h-12 rounded-[14px] border border-[#34343a] bg-[#17171a] px-4 text-sm outline-none focus:border-[#d8d8dc] focus:ring-2 focus:ring-[#d8d8dc]/10" />
            </label>
            <label className="grid gap-1.5 text-xs font-semibold">Phone number
              <input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" autoComplete="tel" placeholder="09xxxxxxxxx" className="min-h-12 rounded-[14px] border border-[#34343a] bg-[#17171a] px-4 text-sm outline-none focus:border-[#d8d8dc] focus:ring-2 focus:ring-[#d8d8dc]/10" />
            </label>
            <label className="grid gap-1.5 text-xs font-semibold">Yangon delivery address
              <textarea value={address} onChange={(event) => setAddress(event.target.value)} autoComplete="street-address" rows={3} className="resize-none rounded-[14px] border border-[#34343a] bg-[#17171a] px-4 py-3 text-sm outline-none focus:border-[#d8d8dc] focus:ring-2 focus:ring-[#d8d8dc]/10" />
            </label>
            <label className="grid gap-1.5 text-xs font-semibold">Order note <span className="font-normal text-[#9b9ba1]">(optional)</span>
              <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={2} className="resize-none rounded-[14px] border border-[#34343a] bg-[#17171a] px-4 py-3 text-sm outline-none focus:border-[#d8d8dc] focus:ring-2 focus:ring-[#d8d8dc]/10" />
            </label>
          </div>

          <fieldset className="mt-6">
            <legend className="text-xs font-bold">Payment method</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {[
                ['cod', 'Cash on Delivery', 'Pay when mobile arrives.'],
                ['kpay', 'KBZPay', 'Demo mobile-payment option.'],
              ].map(([value, label, description]) => (
                <label key={value} className={`cursor-pointer rounded-[16px] border p-4 focus-within:ring-2 focus-within:ring-[#d8d8dc] focus-within:ring-offset-2 ${paymentMethod === value ? 'border-[#d8d8dc] bg-[#202024]' : 'border-[#303034] bg-[#17171a]'}`}>
                  <input type="radio" name="payment" value={value} checked={paymentMethod === value} onChange={() => setPaymentMethod(value as 'cod' | 'kpay')} className="sr-only" />
                  <span className="block text-sm font-bold">{label}</span>
                  <span className="mt-1 block text-[11px] leading-5 text-[#9b9ba1]">{description}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {error && <div role="alert" className="mt-5 rounded-[14px] border border-red-950/60 bg-red-950/20 px-4 py-3 text-xs leading-5 text-red-300">{error}</div>}

          <button type="submit" className="mt-6 min-h-14 w-full rounded-[16px] bg-[#f5f5f6] px-5 text-sm font-black text-[#0a0b0c] transition hover:bg-[#ffffff]">Place Demo Order</button>
        </form>

        <aside className="h-fit rounded-[24px] border border-[#2a2a2e] bg-[#141416] p-5 lg:sticky lg:top-[92px]">
          <h2 className="text-lg font-black tracking-[-0.03em]">Order Summary</h2>
          <div className="mt-4 space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[12px] bg-[#1a1a1d]">{item.image && <img src={item.image} alt="" className="h-full w-full object-cover" />}</div>
                <div className="min-w-0 flex-1"><p className="line-clamp-2 text-xs font-semibold">{item.name}</p><p className="mt-1 text-[11px] text-[#9b9ba1]">Qty {item.qty}</p></div>
                <span className="text-xs font-bold">{formatMMK(item.price * item.qty)}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 space-y-2 border-t border-[#2a2a2e] pt-4 text-sm">
            <div className="flex justify-between text-[#a8a8ad]"><span>Subtotal</span><span>{formatMMK(subtotal)}</span></div>
            <div className="flex justify-between text-[#a8a8ad]"><span>Delivery</span><span>{shippingFee === 0 ? 'Free' : formatMMK(shippingFee)}</span></div>
            <div className="flex justify-between border-t border-[#2a2a2e] pt-3 text-base font-black"><span>Total</span><span>{formatMMK(subtotal + shippingFee)}</span></div>
          </div>
        </aside>
      </main>
    </MobileShell>
  );
}

function MobileOrderSuccess() {
  const {orderId} = useParams();
  const location = useLocation();
  const nav = useNavigate();
  const stateOrder = (location.state as {order?: MobileDemoOrder} | null)?.order;
  const order = stateOrder ?? getMobileDemoOrder(orderId);

  if (!order) {
    return <MobileShell><main className="mx-auto max-w-xl px-4 py-20 text-center"><p className="text-sm text-[#a8a8ad]">Order details are unavailable.</p><button type="button" onClick={() => nav('/mobile-demo/orders')} className="mt-5 min-h-11 rounded-full bg-[#f5f5f6] px-6 text-sm font-bold text-black">Track Order</button></main></MobileShell>;
  }

  return (
    <MobileShell>
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <section className="rounded-[26px] border border-[#2a2a2e] bg-[#141416] p-6 text-center sm:p-8">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#242428] text-[#d8d8dc]"><CheckCircle2 className="h-7 w-7" /></span>
          <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.24em] text-[#f5f5f6]">Order Received</p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.05em]">Thank you, {order.customerName}.</h1>
          <p className="mt-3 text-sm leading-6 text-[#a8a8ad]">This is a demo order. Keep the order number and phone number to test order tracking.</p>
          <div className="mt-6 rounded-[18px] bg-[#0e0e10] px-4 py-5">
            <span className="text-[11px] text-[#9b9ba1]">Order number</span>
            <strong className="mt-1 block text-xl tracking-[0.04em]">{order.orderNo}</strong>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-[#2a2a2e] pt-4 text-sm"><span className="text-[#a8a8ad]">Total</span><strong>{formatMMK(order.total)}</strong></div>
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => nav(`/mobile-demo/orders?orderNo=${encodeURIComponent(order.orderNo)}&phone=${encodeURIComponent(order.phone)}`)} className="min-h-12 rounded-[14px] border border-[#d8d8dc] text-sm font-bold text-[#8c572f]">Track Order</button>
            <button type="button" onClick={() => nav('/mobile-demo/products')} className="min-h-12 rounded-[14px] bg-[#f5f5f6] text-sm font-bold text-black">Continue Shopping</button>
          </div>
        </section>
      </main>
    </MobileShell>
  );
}

function MobileOrders() {
  const location = useLocation();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const [orderNo, setOrderNo] = useState(params.get('orderNo') ?? '');
  const [phone, setPhone] = useState(params.get('phone') ?? '');
  const [result, setResult] = useState<MobileDemoOrder | null>(null);
  const [error, setError] = useState('');

  const lookup = (event: FormEvent) => {
    event.preventDefault();
    setError('');
    const found = findMobileDemoOrder(orderNo, phone);
    if (!found) {
      setResult(null);
      setError('Order not found. Check both your order number and phone number.');
      return;
    }
    setResult(found);
  };

  return (
    <MobileShell>
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <div className="rounded-[24px] border border-[#2a2a2e] bg-[#141416] p-5 sm:p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#f5f5f6]">Order Tracking</p>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.05em]">Find Your Order</h1>
          <p className="mt-2 text-sm leading-6 text-[#a8a8ad]">Use both the order number and phone number from checkout.</p>
          <form onSubmit={lookup} noValidate className="mt-6 grid gap-4">
            <label className="grid gap-1.5 text-xs font-semibold">Order number
              <input value={orderNo} onChange={(event) => setOrderNo(event.target.value)} placeholder="MO-12345678" className="min-h-12 rounded-[14px] border border-[#34343a] bg-[#17171a] px-4 text-sm uppercase outline-none focus:border-[#d8d8dc] focus:ring-2 focus:ring-[#d8d8dc]/10" />
            </label>
            <label className="grid gap-1.5 text-xs font-semibold">Phone number
              <input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" placeholder="09xxxxxxxxx" className="min-h-12 rounded-[14px] border border-[#34343a] bg-[#17171a] px-4 text-sm outline-none focus:border-[#d8d8dc] focus:ring-2 focus:ring-[#d8d8dc]/10" />
            </label>
            <button type="submit" className="min-h-12 rounded-[14px] bg-[#f5f5f6] text-sm font-bold text-black">Find Order</button>
          </form>
          {error && <div role="alert" className="mt-4 rounded-[14px] border border-red-950/60 bg-red-950/20 px-4 py-3 text-xs text-red-300">{error}</div>}
        </div>

        {result && (
          <section className="mt-4 rounded-[24px] border border-[#303036] bg-[#121214] p-5">
            <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#242428] text-[#d8d8dc]"><Truck className="h-5 w-5" /></span><div><p className="text-xs text-[#a8a8ad]">Demo status</p><p className="font-bold">Order confirmed · Preparing delivery</p></div></div>
            <div className="mt-4 grid gap-2 border-t border-[#2c2c30] pt-4 text-sm">
              <div className="flex justify-between gap-4"><span className="text-[#a8a8ad]">Order</span><strong>{result.orderNo}</strong></div>
              <div className="flex justify-between gap-4"><span className="text-[#a8a8ad]">Total</span><strong>{formatMMK(result.total)}</strong></div>
              <div className="flex justify-between gap-4"><span className="text-[#a8a8ad]">Delivery</span><strong className="text-right">{result.address}</strong></div>
            </div>
          </section>
        )}
      </main>
    </MobileShell>
  );
}

function MobilePolicy({title}: {title: string}) {
  const copy: Record<string, {lead: string; sections: {heading: string; body: string}[]}> = {
    'Shipping Policy': {
      lead: 'Demo delivery information for Mobile One orders in Yangon.',
      sections: [
        {heading: 'Delivery area', body: 'This demo assumes Yangon delivery. Standard demo delivery is 5,000 MMK and becomes free when the order subtotal reaches 2,000,000 MMK.'},
        {heading: 'Delivery timing', body: 'Smartphones and gadgets should be sealed, verified and packed securely. A real merchant should confirm stock and delivery timing before dispatch.'},
      ],
    },
    'Refund Policy': {
      lead: 'A simple demo policy for smartphone and gadget returns.',
      sections: [
        {heading: 'Damage on arrival', body: 'Inspect the box, seal and device condition during delivery and report visible damage immediately.'},
        {heading: 'Change of mind', body: 'This demo does not process real refunds. A production mobile retailer should publish item-specific return eligibility, collection fees and opened-box and activation exclusions.'},
      ],
    },
    'Privacy Policy': {
      lead: 'This demo keeps order information only in your browser local storage.',
      sections: [
        {heading: 'Demo data', body: 'Name, phone, address and demo orders are stored locally in this browser for the order-tracking demonstration. They are not sent to a backend by this mobile demo.'},
        {heading: 'Production note', body: 'A real storefront must use the platform privacy policy and production data-handling contract rather than this demo-only local storage behavior.'},
      ],
    },
    'Terms of Service': {
      lead: 'Mobile One is a demonstration storefront inside MiniShop MM.',
      sections: [
        {heading: 'No real purchase', body: 'Products, prices, availability, payments and orders on this route are sample content. Placing a demo order does not create a real commercial transaction.'},
        {heading: 'Purpose', body: 'The demo exists to show a complete mobile-shopping experience and can be replaced with a real merchant catalog and production checkout when configured.'},
      ],
    },
  };

  const policy = copy[title] ?? copy['Terms of Service'];

  return (
    <MobileShell>
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="rounded-[24px] border border-[#2a2a2e] bg-[#141416] p-6 sm:p-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#f5f5f6]">Mobile One</p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.05em]">{title}</h1>
          <p className="mt-3 text-sm leading-7 text-[#a8a8ad]">{policy.lead}</p>
          <div className="mt-7 space-y-6">
            {policy.sections.map((section) => <section key={section.heading}><h2 className="text-base font-black">{section.heading}</h2><p className="mt-2 text-sm leading-7 text-[#66655f]">{section.body}</p></section>)}
          </div>
        </div>
      </main>
    </MobileShell>
  );
}

function MobileRoutes() {
  setShopSlug(null);

  return (
    <Routes>
      <Route index element={<MobileHome />} />
      <Route path="products" element={<MobileProducts />} />
      <Route path="products/:id" element={<MobileProductDetail />} />
      <Route path="cart" element={<MobileCart />} />
      <Route path="checkout" element={<MobileCheckout />} />
      <Route path="order/:orderId" element={<MobileOrderSuccess />} />
      <Route path="orders" element={<MobileOrders />} />
      <Route path="shipping-policy" element={<MobilePolicy title="Shipping Policy" />} />
      <Route path="refund-policy" element={<MobilePolicy title="Refund Policy" />} />
      <Route path="privacy-policy" element={<MobilePolicy title="Privacy Policy" />} />
      <Route path="terms-of-service" element={<MobilePolicy title="Terms of Service" />} />
      <Route path="*" element={<MobileHome />} />
    </Routes>
  );
}

export default function MobileDemo() {
  return (
    <CartProvider storageScope="mobile-demo">
      <MobileRoutes />
    </CartProvider>
  );
}

export const FURNITURE_DEMO_COLORS = COLORS;
