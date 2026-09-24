import {useEffect, useState} from 'react';
import {Search, ShoppingBag, SlidersHorizontal} from 'lucide-react';
import {api} from '@/data/dataSource';
import type {Product} from '@/domain/product';
import {getStorefrontTheme} from '@/features/tenancy/shopResolver';
import ProductCard, {ProductCardSkeleton} from '@/features/catalog/components/ProductCard';
import AestheticHome from '@/features/catalog/components/AestheticHome';
import {ShopLink, useShopNavigate, useShopSlugParam} from '@/features/tenancy/ShopLink';
import {useDemoStore} from '@/features/demo/DemoStoreContext';

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

        <div className="mt-4 overflow-hidden rounded-[26px] border border-white/60 bg-white shadow-[0_18px_42px_rgba(72,35,122,0.12)]">
          <img
            src="/demo/file_00000000f99481f9acca9a032cd86775.png"
            alt="MiniShop Fashion Demo Store banner"
            className="block h-auto w-full object-cover"
          />
        </div>

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
    <AestheticHome
      products={visibleProducts}
      categories={categories}
      loading={products === null && !error}
      error={error}
      theme={theme}
    />
  );
}
