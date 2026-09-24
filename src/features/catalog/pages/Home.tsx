import {useEffect, useState} from 'react';
import {ArrowRight, Headphones, Search, ShieldCheck, Shirt, ShoppingBag, SlidersHorizontal, Sparkles, Tags, Truck} from 'lucide-react';
import {api} from '@/data/dataSource';
import type {Product} from '@/domain/product';
import type {StorefrontTheme} from '@/domain/theme';
import {getCachedShopInfo, getStorefrontTheme} from '@/features/tenancy/shopResolver';
import ProductCard, {ProductCardSkeleton} from '@/features/catalog/components/ProductCard';
import {ShopLink, useShopNavigate, useShopSlugParam} from '@/features/tenancy/ShopLink';
import {useDemoStore} from '@/features/demo/DemoStoreContext';

function SearchStrip() {
  const nav = useShopNavigate();
  const [value, setValue] = useState('');
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        nav(`/products${value.trim() ? `?q=${encodeURIComponent(value.trim())}` : ''}`);
      }}
      className="hidden bg-white px-4 pb-4 pt-1 md:block md:px-8">
      <div className="mx-auto flex max-w-7xl items-center gap-3 rounded-[20px] bg-[#f7f6f8] px-5 py-3.5 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.03)]">
        <Search className="h-5 w-5 shrink-0 text-slate-500" strokeWidth={1.8} aria-hidden="true" />
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="အင်္ကျီ၊ အိတ်၊ Accessories ရှာရန်…"
          aria-label="ပစ္စည်းရှာရန်"
          className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
        />
        <button type="submit" className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:text-[#e11d48]">
          ရှာမယ်
        </button>
      </div>
    </form>
  );
}

function Hero({product, theme}: {product: Product | null; theme: StorefrontTheme}) {
  const shop = getCachedShopInfo();
  const accent = theme.accentColor;
  const image = theme.home.heroImageUrl ?? product?.image ?? product?.images[0] ?? null;

  return (
    <section className="bg-white px-3 pb-4 md:px-8 md:pb-6">
      <div className="relative mx-auto min-h-[360px] max-w-7xl overflow-hidden rounded-[26px] bg-[#fbd7e3] md:min-h-[330px]">
        {image ? (
          <img src={image} alt={product?.name ?? 'ဖက်ရှင်ပစ္စည်း'} className="absolute inset-0 h-full w-full object-cover object-center" />
        ) : (
          <div className="absolute inset-0 bg-[#fbd7e3]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#fff6fa]/95 via-[#fff6fa]/76 to-transparent md:from-[#fff6fa]/92 md:via-[#fff6fa]/55" aria-hidden="true" />
        <div className="relative z-10 flex min-h-[360px] max-w-[68%] flex-col justify-center px-6 py-8 md:min-h-[330px] md:max-w-[52%] md:px-10">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.28em] text-[#e11d48]">NEW COLLECTION</p>
          <h1 className="mt-3 text-[34px] font-black leading-[1.04] tracking-[-0.04em] text-slate-950 md:text-5xl">
            {theme.home.heroHeadline}
          </h1>
          {theme.home.heroSubtext && <p className="mt-3 max-w-md text-sm leading-6 text-slate-600 md:text-base">{theme.home.heroSubtext}</p>}
          <ShopLink
            to="/products"
            className="mt-6 inline-flex min-h-11 w-fit items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(225,29,72,0.24)] transition hover:-translate-y-0.5"
            style={{backgroundColor: accent}}>
            {theme.home.heroCtaLabel} <ArrowRight className="h-4 w-4" />
          </ShopLink>
          <p className="mt-5 text-[10px] font-semibold text-slate-500">{shop?.name ?? 'သင့်ဆိုင်'} · Wear Your Story</p>
        </div>
      </div>
    </section>
  );
}

function categoryIcon(category: string) {
  const value = category.toLowerCase();
  if (value.includes('အင်္ကျီ') || value.includes('shirt') || value.includes('top')) return Shirt;
  if (value.includes('bag') || value.includes('အိတ်')) return ShoppingBag;
  if (value.includes('sale') || value.includes('promo')) return Tags;
  return Sparkles;
}

function CategoryRail({categories, accent}: {categories: string[]; accent: string}) {
  if (categories.length === 0) return null;
  return (
    <section className="bg-white px-3 py-3 md:px-8 md:py-5">
      <div className="mx-auto max-w-7xl">
        <div className="mb-3 flex items-center justify-between md:mb-4">
          <h2 className="text-lg font-black tracking-[-0.02em] text-slate-950 md:text-2xl">Shop by Category</h2>
          <ShopLink to="/products" className="inline-flex items-center gap-1 text-xs font-bold text-[#e11d48] md:text-sm">
            See All <ArrowRight className="h-3.5 w-3.5" />
          </ShopLink>
        </div>
        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2 md:gap-4">
          {categories.map((category, index) => {
            const Icon = categoryIcon(category);
            const backgrounds = ['#ffe7ef', '#eef4ff', '#fff0e6', '#fff6df', '#f1edff', '#eaf8f3'];
            return (
              <ShopLink key={category} to={`/products?category=${encodeURIComponent(category)}`} className="group flex min-w-[70px] shrink-0 flex-col items-center gap-2 text-center text-[11px] font-semibold text-slate-700 md:min-w-[88px] md:text-xs">
                <span
                  className="grid h-14 w-14 place-items-center rounded-full shadow-[0_8px_22px_rgba(31,41,55,0.07)] transition group-hover:-translate-y-0.5 md:h-16 md:w-16"
                  style={{color: accent, backgroundColor: backgrounds[index % backgrounds.length]}}>
                  <Icon className="h-6 w-6" strokeWidth={1.8} />
                </span>
                <span className="max-w-[86px] truncate">{category}</span>
              </ShopLink>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ProductSection({products, loading, error, theme}: {products: Product[]; loading: boolean; error: string; theme: StorefrontTheme}) {
  return (
    <section className="bg-white px-3 py-5 md:px-8 md:py-7">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex items-center justify-between md:mb-5">
          <div>
            <h2 className="text-xl font-black tracking-[-0.025em] text-slate-950 md:text-2xl">{theme.home.featuredTitle}</h2>
            {theme.home.featuredSubtitle && <p className="mt-1 hidden text-sm text-slate-500 md:block">{theme.home.featuredSubtitle}</p>}
          </div>
          <ShopLink to="/products" className="inline-flex min-h-10 items-center gap-1 text-xs font-bold text-[#e11d48] md:text-sm">
            See All <ArrowRight className="h-3.5 w-3.5" />
          </ShopLink>
        </div>
        {error && <div className="mb-5 rounded-2xl border border-rose-100 bg-[#fff7fa] p-4 text-sm text-slate-700">{error}</div>}
        <div className="grid grid-cols-3 gap-x-2.5 gap-y-5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
          {loading
            ? Array.from({length: 6}).map((_, index) => <ProductCardSkeleton key={index} compact />)
            : products.slice(0, 8).map((product) => <ProductCard key={product.id} product={product} variant="compact" />)}
        </div>
        {!loading && !error && products.length === 0 && <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">ဒီဆိုင်မှာ ပစ္စည်းမတင်ရသေးပါ။</div>}
      </div>
    </section>
  );
}

function LifestyleBanner() {
  return (
    <section className="bg-white px-3 py-3 md:px-8 md:py-5">
      <div className="mx-auto flex max-w-7xl items-center justify-between overflow-hidden rounded-[24px] bg-[#fde8ef] px-6 py-7 md:px-10 md:py-10">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#e11d48]">Special Offer</p>
          <h2 className="mt-1 text-2xl font-black leading-tight text-slate-950 md:text-4xl">Style Your Everyday</h2>
          <p className="mt-1 text-sm text-slate-600">Comfortable. Trendy. You.</p>
          <ShopLink to="/products" className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-full bg-[#e11d48] px-5 py-2.5 text-sm font-bold text-white">
            Explore More <ArrowRight className="h-4 w-4" />
          </ShopLink>
        </div>
        <div className="hidden max-w-[220px] text-right md:block">
          <p className="text-2xl font-black leading-tight text-[#be123c]">Good Clothes.<br />Good Mood.</p>
          <p className="mt-2 text-xs font-semibold text-slate-500">Made for everyday style.</p>
        </div>
      </div>
    </section>
  );
}

function Benefits() {
  const items = [
    {icon: Truck, title: 'Fast Delivery', sub: 'Across Myanmar'},
    {icon: ShieldCheck, title: 'Safe Payment', sub: 'Secure & Trusted'},
    {icon: Headphones, title: 'Friendly Support', sub: 'We’re always here'},
  ];
  return (
    <section className="bg-white px-3 pb-8 pt-4 md:px-8 md:pb-10">
      <div className="mx-auto grid max-w-7xl grid-cols-3 gap-2.5 md:gap-4">
        {items.map(({icon: Icon, title, sub}) => (
          <div key={title} className="flex min-h-[120px] flex-col items-center justify-center rounded-[22px] bg-[#fff9fb] px-3 py-5 text-center shadow-[0_8px_26px_rgba(88,52,64,0.05)]">
            <Icon className="h-6 w-6 text-[#e11d48]" strokeWidth={1.8} />
            <b className="mt-2 text-[11px] text-slate-950 md:text-sm">{title}</b>
            <span className="mt-1 text-[9px] text-slate-500 md:text-xs">{sub}</span>
          </div>
        ))}
      </div>
    </section>
  );
}


function DemoReferenceHome({products, categories, loading, error}: {products: Product[]; categories: string[]; loading: boolean; error: string}) {
  const nav = useShopNavigate();
  const [query, setQuery] = useState('');
  const visibleCategories = categories.slice(0, 3);
  const featured = products.slice(0, 4);

  return (
    <div className="min-h-screen bg-[#eee6ff] px-3 pb-28 pt-3 sm:px-5 md:px-8 md:pt-6">
      <section className="mx-auto max-w-[430px] md:max-w-5xl">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            nav(`/products${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`);
          }}
          className="flex items-center gap-3 px-1">
          <div className="flex min-h-12 flex-1 items-center gap-3 rounded-full bg-white/95 px-4 shadow-[0_10px_28px_rgba(72,35,122,0.10)]">
            <Search className="h-5 w-5 shrink-0 text-[#34204f]" strokeWidth={2.2} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="ပစ္စည်းရှာရန်"
              placeholder="Search"
              className="min-w-0 flex-1 bg-transparent text-[13px] font-medium text-[#2b1a47] outline-none placeholder:text-[#7e7192]"
            />
          </div>
          <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-[radial-gradient(circle_at_35%_25%,#a78bfa_0%,#6d28d9_48%,#3b176c_100%)] text-sm font-black text-white shadow-[0_10px_28px_rgba(76,29,149,0.26)] ring-2 ring-white/60">
            M
          </div>
        </form>

        <div className="mt-4 overflow-hidden rounded-[30px] bg-[#f8f3ff] px-4 pb-6 pt-5 shadow-[0_22px_52px_rgba(72,35,122,0.11)] sm:px-5 md:px-7">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-[43px] font-black leading-[0.92] tracking-[-0.055em] text-[#21133f] sm:text-[48px]">New<br />arrivals</h1>
            <button type="button" aria-label="Filter products" className="mt-1 grid h-10 w-10 place-items-center rounded-full text-[#49365f] transition hover:bg-white/80">
              <SlidersHorizontal className="h-5 w-5" strokeWidth={1.8} />
            </button>
          </div>

          <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto pb-1">
            <ShopLink to="/products" className="shrink-0 rounded-full bg-[#42146f] px-6 py-2.5 text-xs font-bold text-white shadow-[0_8px_18px_rgba(66,20,111,0.18)]">All</ShopLink>
            {visibleCategories.map((category) => (
              <ShopLink key={category} to={`/products?category=${encodeURIComponent(category)}`} className="shrink-0 rounded-full border border-[#baa7da] bg-white/55 px-5 py-2.5 text-xs font-semibold text-[#49365f]">
                {category}
              </ShopLink>
            ))}
          </div>

          {error && <div className="mt-5 rounded-2xl border border-[#dacaf5] bg-white/80 p-4 text-sm text-[#4d3a68]">{error}</div>}

          <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4">
            {loading
              ? Array.from({length: 4}).map((_, index) => <ProductCardSkeleton key={index} compact />)
              : featured.map((product) => <ProductCard key={product.id} product={product} variant="demo-purple" />)}
          </div>

          {!loading && !error && products.length === 0 && (
            <div className="mt-5 rounded-2xl border border-[#dacaf5] bg-white/70 px-5 py-10 text-center text-sm text-[#6d5b82]">ဒီဆိုင်မှာ ပစ္စည်းမတင်ရသေးပါ။</div>
          )}

          <ShopLink
            to="/products"
            className="mx-auto mt-6 flex min-h-12 w-fit items-center gap-3 rounded-full bg-[#3a1268] px-7 py-3 text-sm font-bold text-white shadow-[0_12px_28px_rgba(58,18,104,0.24)]">
            <ShoppingBag className="h-4 w-4" />
            View all products
          </ShopLink>
        </div>
      </section>
    </div>
  );
}

export default function Home() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [error, setError] = useState('');
  const slug = useShopSlugParam();
  const theme = getStorefrontTheme();
  const isDemo = useDemoStore();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [{products: nextProducts}, {categories: nextCategories}] = await Promise.all([
          api.products({scope: 'active', limit: 12}),
          api.categories(),
        ]);
        if (alive) {
          setProducts(nextProducts);
          setCategories(nextCategories);
        }
      } catch (e: any) {
        if (alive) setError(e.message || 'ပစ္စည်းများကို ယခုလောလောဆယ် ဆွဲယူ၍မရပါ။');
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  const visibleProducts = products ?? [];
  if (isDemo) {
    return <DemoReferenceHome products={visibleProducts} categories={categories} loading={products === null && !error} error={error} />;
  }

  return (
    <div className="bg-white">
      <SearchStrip />
      {theme.home.heroEnabled && <Hero product={visibleProducts[0] ?? null} theme={theme} />}
      {theme.home.categoriesEnabled && <CategoryRail categories={categories} accent={theme.accentColor} />}
      <ProductSection products={visibleProducts} loading={products === null && !error} error={error} theme={theme} />
      <LifestyleBanner />
      <Benefits />
    </div>
  );
}
