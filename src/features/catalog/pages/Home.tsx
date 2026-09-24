import {useEffect, useState} from 'react';
import {ArrowRight, Search, Shirt, ShoppingBag, Sparkles, Tags} from 'lucide-react';
import {api} from '@/data/dataSource';
import type {Product} from '@/domain/product';
import type {StorefrontTheme} from '@/domain/theme';
import {getCachedShopInfo, getStorefrontTheme} from '@/features/tenancy/shopResolver';
import ProductCard, {ProductCardSkeleton} from '@/features/catalog/components/ProductCard';
import {ShopLink, useShopNavigate, useShopSlugParam} from '@/features/tenancy/ShopLink';

function SearchStrip() {
  const nav = useShopNavigate();
  const [value, setValue] = useState('');
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        nav(`/products${value.trim() ? `?q=${encodeURIComponent(value.trim())}` : ''}`);
      }}
      className="bg-white px-4 pb-4 sm:px-8">
      <div className="mx-auto flex max-w-7xl items-center gap-3 rounded-[18px] bg-[#f7f7f9] px-4 py-3 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.03)]">
        <Search className="h-5 w-5 shrink-0 text-slate-400" strokeWidth={1.8} aria-hidden="true" />
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="ဘာရှာချင်လဲ..."
          aria-label="ပစ္စည်းရှာရန်"
          className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
        />
        {value && (
          <button
            type="button"
            onClick={() => setValue('')}
            className="min-h-10 rounded-full px-3 text-xs font-semibold text-slate-500 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e11d48]">
            ရှင်းမည်
          </button>
        )}
      </div>
    </form>
  );
}

function Hero({product, theme}: {product: Product | null; theme: StorefrontTheme}) {
  const shop = getCachedShopInfo();
  const accent = theme.accentColor;
  const image = theme.home.heroImageUrl ?? product?.image ?? product?.images[0] ?? null;
  return (
    <section className="bg-white px-4 pb-5 sm:px-8 sm:pb-8">
      <div className="relative mx-auto min-h-[220px] max-w-7xl overflow-hidden rounded-[28px] bg-[#ffdbe7] sm:min-h-[300px]">
        {image ? (
          <img src={image} alt={product?.name ?? 'ဖက်ရှင်ပစ္စည်း'} className="absolute inset-0 h-full w-full object-cover object-center" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#ffdce8] via-[#ffc8d9] to-[#f7b1c8]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#8d2342]/55 via-[#8d2342]/15 to-transparent" aria-hidden="true" />
        <div className="relative z-10 flex min-h-[220px] max-w-[78%] flex-col justify-center px-5 py-8 text-white sm:min-h-[300px] sm:max-w-[54%] sm:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/85">{shop?.name ?? 'သင့်ဆိုင်'}</p>
          <h1 className="mt-2 text-2xl font-bold leading-tight sm:text-4xl">{theme.home.heroHeadline}</h1>
          {theme.home.heroSubtext && <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/85 sm:text-sm">{theme.home.heroSubtext}</p>}
          <ShopLink
            to="/products"
            className="mt-5 inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold shadow-lg transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
            style={{color: accent}}>
            {theme.home.heroCtaLabel} <ArrowRight className="h-4 w-4" />
          </ShopLink>
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
    <section className="bg-white px-4 py-2 sm:px-8">
      <div className="no-scrollbar mx-auto flex max-w-7xl gap-3 overflow-x-auto pb-2">
        {categories.map((category, index) => {
          const Icon = categoryIcon(category);
          const backgrounds = ['#ffe8ef', '#eef4ff', '#fff0e6', '#fff6df', '#f1edff', '#eaf8f3'];
          return (
            <ShopLink key={category} to={`/products?category=${encodeURIComponent(category)}`} className="group flex min-w-[70px] shrink-0 flex-col items-center gap-2 text-center text-[11px] font-semibold text-slate-700">
              <span
                className="grid h-14 w-14 place-items-center rounded-full shadow-[0_8px_22px_rgba(31,41,55,0.08)] transition group-hover:-translate-y-0.5"
                style={{color: accent, backgroundColor: backgrounds[index % backgrounds.length]}}>
                <Icon className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <span className="max-w-[76px] truncate">{category}</span>
            </ShopLink>
          );
        })}
      </div>
    </section>
  );
}

function ProductSection({products, loading, error, theme}: {products: Product[]; loading: boolean; error: string; theme: StorefrontTheme}) {
  return (
    <section className="bg-white px-4 py-7 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-[-0.02em] text-slate-950 sm:text-2xl">{theme.home.featuredTitle}</h2>
            {theme.home.featuredSubtitle && <p className="mt-1 text-xs text-slate-500 sm:text-sm">{theme.home.featuredSubtitle}</p>}
          </div>
          <ShopLink to="/products" style={{color: theme.accentColor}} className="inline-flex min-h-10 shrink-0 items-center gap-1 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e11d48]">
            အားလုံးကြည့်ရန် <ArrowRight className="h-3.5 w-3.5" />
          </ShopLink>
        </div>
        {error && <div className="mb-6 rounded-2xl border border-rose-100 bg-[#fff7fa] p-4 text-sm text-slate-700">{error}</div>}
        <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 lg:gap-6">
          {loading ? Array.from({length: 6}).map((_, index) => <ProductCardSkeleton key={index} compact />) : products.slice(0, 6).map((product) => <ProductCard key={product.id} product={product} variant="compact" />)}
        </div>
        {!loading && !error && products.length === 0 && <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">ဒီဆိုင်မှာ ပစ္စည်းမတင်ရသေးပါ။</div>}
      </div>
    </section>
  );
}

export default function Home() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [error, setError] = useState('');
  const slug = useShopSlugParam();
  const theme = getStorefrontTheme();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [{products: nextProducts}, {categories: nextCategories}] = await Promise.all([api.products({scope: 'active', limit: 12}), api.categories()]);
        if (alive) {setProducts(nextProducts); setCategories(nextCategories);}
      } catch (e: any) {
        if (alive) setError(e.message || 'ပစ္စည်းများကို ယခုလောလောဆယ် ဆွဲယူ၍မရပါ။');
      }
    })();
    return () => {alive = false;};
  }, [slug]);

  const visibleProducts = products ?? [];
  return (
    <div className="bg-white">
      <SearchStrip />
      {theme.home.heroEnabled && <Hero product={visibleProducts[0] ?? null} theme={theme} />}
      {theme.home.categoriesEnabled && <CategoryRail categories={categories} accent={theme.accentColor} />}
      <ProductSection products={visibleProducts} loading={products === null && !error} error={error} theme={theme} />
    </div>
  );
}
