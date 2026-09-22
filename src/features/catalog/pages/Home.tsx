import {useEffect, useState} from 'react';
import {ArrowRight, Shirt, ShoppingBag, Sparkles, Tags} from 'lucide-react';
import {api} from '@/data/dataSource';
import type {Product} from '@/domain/product';
import type {StorefrontTheme} from '@/domain/theme';
import {getCachedShopInfo, getStorefrontTheme} from '@/features/tenancy/shopResolver';
import ProductCard, {ProductCardSkeleton} from '@/features/catalog/components/ProductCard';
import {ShopLink, useShopSlugParam} from '@/features/tenancy/ShopLink';

function Hero({product, theme}: {product: Product | null; theme: StorefrontTheme}) {
  const shop = getCachedShopInfo();
  const accent = theme.accentColor;
  const image = theme.home.heroImageUrl ?? product?.image ?? product?.images[0] ?? null;
  return (
    <section className="bg-white px-4 pb-5 pt-5 sm:px-8 sm:pb-8 lg:pt-8">
      <div className="mx-auto grid min-h-[440px] max-w-7xl overflow-hidden rounded-[28px] bg-[#fff0f6] sm:rounded-[36px] lg:min-h-[520px] lg:grid-cols-2">
        <div className="relative z-10 flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-14 lg:py-16">
          <p className="text-sm font-semibold" style={{color: accent}}>{shop?.name ?? 'သင့်ဆိုင်'}</p>
          <h1 className="font-display mt-4 max-w-xl text-4xl font-bold leading-[1.08] tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">{theme.home.heroHeadline}</h1>
          {theme.home.heroSubtext && <p className="mt-5 max-w-md text-sm leading-6 text-slate-600 sm:text-base">{theme.home.heroSubtext}</p>}
          <ShopLink to="/products" style={{backgroundColor: accent}} className="mt-7 inline-flex min-h-12 w-fit items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2">{theme.home.heroCtaLabel} <ArrowRight className="h-4 w-4" /></ShopLink>
        </div>
        <div className="relative min-h-[320px] overflow-hidden sm:min-h-[380px] lg:min-h-[520px]">
          {image ? <img src={image} alt={product?.name ?? 'ဖက်ရှင်ပစ္စည်း'} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#fbcfe8] via-[#f9a8d4] to-[#fff0f6]">{shop?.logoUrl ? <img src={shop.logoUrl} alt={`${shop.name} ဆိုင်အမှတ်တံဆိပ်`} className="h-28 w-28 rounded-full bg-white object-contain p-3 shadow-xl" /> : null}</div>}
          <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent" aria-hidden="true" />
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
    <section className="bg-white px-4 py-5 sm:px-8">
      <div className="no-scrollbar mx-auto flex max-w-7xl gap-3 overflow-x-auto pb-2">
        {categories.map((category) => {
          const Icon = categoryIcon(category);
          return (
            <ShopLink key={category} to={`/products?category=${encodeURIComponent(category)}`} className="group flex min-w-[76px] shrink-0 flex-col items-center gap-2 text-center text-xs font-medium text-slate-600">
              <span className="grid h-14 w-14 place-items-center rounded-2xl border border-rose-100 bg-[#fff7fa] shadow-[0_5px_18px_rgba(190,24,93,0.07)] transition group-hover:-translate-y-0.5 group-hover:border-rose-200 group-hover:bg-[#fff0f6]" style={{color: accent}}><Icon className="h-6 w-6" strokeWidth={1.6} /></span>
              <span className="max-w-[84px] truncate">{category}</span>
            </ShopLink>
          );
        })}
      </div>
    </section>
  );
}

function ProductSection({products, loading, error, theme}: {products: Product[]; loading: boolean; error: string; theme: StorefrontTheme}) {
  return (
    <section className="bg-white px-4 py-9 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 sm:mb-8">
          <h2 className="font-display text-2xl font-bold tracking-[-0.03em] text-slate-950 sm:text-3xl">{theme.home.featuredTitle}</h2>
          {theme.home.featuredSubtitle && <p className="mt-1 text-sm text-slate-500">{theme.home.featuredSubtitle}</p>}
        </div>
        {error && <div className="mb-6 rounded-2xl border border-rose-100 bg-[#fff7fa] p-4 text-sm text-slate-700">{error}</div>}
        <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-5 lg:grid-cols-3 lg:gap-7">
          {loading ? Array.from({length: 6}).map((_, index) => <ProductCardSkeleton key={index} compact />) : products.slice(0, 6).map((product) => <ProductCard key={product.id} product={product} variant="compact" />)}
        </div>
        {!loading && !error && products.length > 0 && (
          <div className="mt-9 flex justify-center">
            <ShopLink to="/products" style={{color: theme.accentColor, borderColor: theme.accentColor}} className="inline-flex min-h-11 items-center gap-2 rounded-full border bg-white px-5 py-2.5 text-sm font-semibold shadow-sm transition hover:bg-[#fff7fa]">အားလုံးကြည့်ရန် <ArrowRight className="h-4 w-4" /></ShopLink>
          </div>
        )}
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
      {theme.home.heroEnabled && <Hero product={visibleProducts[0] ?? null} theme={theme} />}
      {theme.home.categoriesEnabled && <CategoryRail categories={categories} accent={theme.accentColor} />}
      <ProductSection products={visibleProducts} loading={products === null && !error} error={error} theme={theme} />
    </div>
  );
}
