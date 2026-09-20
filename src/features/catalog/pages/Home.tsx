import {useEffect, useState} from 'react';
import {ArrowRight, Headphones, PackageCheck, Search, ShieldCheck, Sparkles} from 'lucide-react';
import {api} from '@/data/dataSource';
import type {Product} from '@/domain/product';
import {getCachedShopInfo} from '@/features/tenancy/shopResolver';
import ProductCard, {ProductCardSkeleton} from '@/features/catalog/components/ProductCard';
import {ShopLink, useShopSlugParam} from '@/features/tenancy/ShopLink';

const categories = ['New In', 'Tops', 'Dresses', 'Bottoms', 'Sets', 'Accessories'];

function Hero() {
  const shop = getCachedShopInfo();

  return (
    <section className="bg-white px-4 pb-5 pt-5 sm:px-8 sm:pb-8 lg:pt-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[28px] bg-[#fff0f6] sm:rounded-[36px]">
        <div className="grid min-h-[420px] items-center lg:grid-cols-2 lg:min-h-[520px]">
          <div className="relative z-10 px-6 py-12 sm:px-10 lg:px-14 lg:py-16">
            <p className="text-sm font-semibold text-[#e11d48]">{shop?.name ?? 'Your Shop'}</p>
            <h1 className="mt-4 max-w-xl text-4xl font-bold leading-[1.05] tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
              Find your next favorite look.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-6 text-slate-600 sm:text-base">
              Browse the latest styles from this shop in one simple place.
            </p>
            <ShopLink
              to="/products"
              className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#e11d48] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#be123c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e11d48] focus-visible:ring-offset-2">
              Shop Now <ArrowRight className="h-4 w-4" />
            </ShopLink>
          </div>

          <div className="relative hidden h-full min-h-[420px] overflow-hidden lg:block" aria-hidden="true">
            <div className="absolute -right-12 top-10 h-72 w-72 rounded-full bg-[#fbcfe8]" />
            <div className="absolute bottom-8 right-24 h-56 w-44 rotate-6 rounded-[40px] bg-white shadow-[0_24px_80px_rgba(190,24,93,0.12)]" />
            <div className="absolute bottom-16 right-48 h-72 w-52 -rotate-6 rounded-[44px] bg-[#f9a8d4] shadow-[0_24px_80px_rgba(190,24,93,0.12)]" />
            <Sparkles className="absolute right-16 top-20 h-8 w-8 text-[#e11d48]" strokeWidth={1.5} />
          </div>
        </div>
      </div>
    </section>
  );
}

function SearchBar() {
  return (
    <section className="bg-white px-4 py-3 sm:px-8">
      <ShopLink
        to="/products"
        aria-label="Browse and search products"
        className="mx-auto flex min-h-12 max-w-7xl items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 text-sm text-slate-500 transition hover:border-[#f9a8d4] hover:bg-[#fff7fa]">
        <Search className="h-4 w-4" />
        Search products
      </ShopLink>
    </section>
  );
}

function CategoryRail() {
  return (
    <section className="bg-white px-4 py-5 sm:px-8">
      <div className="no-scrollbar mx-auto flex max-w-7xl gap-2 overflow-x-auto pb-1">
        {categories.map((category, index) => (
          <ShopLink
            key={category}
            to="/products"
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${
              index === 0
                ? 'border-[#e11d48] bg-[#e11d48] text-white'
                : 'border-[#f3d6e2] bg-[#fff7fa] text-slate-700 hover:border-[#f9a8d4]'
            }`}>
            {category}
          </ShopLink>
        ))}
      </div>
    </section>
  );
}

function ProductSection({products, loading, error}: {products: Product[]; loading: boolean; error: string}) {
  return (
    <section className="bg-white px-4 py-9 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-[-0.03em] text-slate-950 sm:text-3xl">New Arrivals</h2>
            <p className="mt-1 text-sm text-slate-500">Fresh picks from the shop.</p>
          </div>
          <ShopLink to="/products" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-[#e11d48]">
            View All <ArrowRight className="h-4 w-4" />
          </ShopLink>
        </div>

        {error && <div className="mb-6 rounded-2xl border border-rose-100 bg-[#fff7fa] p-4 text-sm text-slate-700">{error}</div>}

        <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
          {loading
            ? Array.from({length: 8}).map((_, index) => <ProductCardSkeleton key={index} compact />)
            : products.slice(0, 8).map((product) => <ProductCard key={product.id} product={product} variant="compact" />)}
        </div>

        {!loading && !error && products.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
            This shop has not added products yet.
          </div>
        )}
      </div>
    </section>
  );
}

function Promo() {
  return (
    <section className="bg-white px-4 py-5 sm:px-8 sm:py-8">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 overflow-hidden rounded-[28px] bg-[#fff0f6] px-6 py-8 sm:flex-row sm:items-center sm:px-10 sm:py-10">
        <div>
          <h2 className="text-2xl font-bold tracking-[-0.03em] text-slate-950 sm:text-3xl">More styles, one easy shop.</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">Explore everything currently available from this store.</p>
        </div>
        <ShopLink to="/products" className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full bg-[#e11d48] px-6 py-3 text-sm font-semibold text-white hover:bg-[#be123c]">
          Browse All <ArrowRight className="h-4 w-4" />
        </ShopLink>
      </div>
    </section>
  );
}

function ServiceStrip() {
  const services = [
    {title: 'Easy Shopping', icon: PackageCheck},
    {title: 'Secure Checkout', icon: ShieldCheck},
    {title: 'Need Help?', icon: Headphones},
  ];

  return (
    <section className="border-t border-slate-100 bg-white px-4 py-8 sm:px-8">
      <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {services.map(({title, icon: Icon}) => (
          <div key={title} className="flex items-center justify-center gap-3 px-4 py-5 text-sm font-medium text-slate-700">
            <Icon className="h-5 w-5 text-[#e11d48]" strokeWidth={1.7} />
            {title}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState('');
  const slug = useShopSlugParam();

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const {products: nextProducts} = await api.products({scope: 'active', limit: 12});
        if (alive) setProducts(nextProducts);
      } catch (e: any) {
        if (alive) setError(e.message || 'We could not load products right now.');
      }
    })();

    return () => {
      alive = false;
    };
  }, [slug]);

  return (
    <div className="bg-white">
      <Hero />
      <SearchBar />
      <CategoryRail />
      <ProductSection products={products ?? []} loading={products === null && !error} error={error} />
      <Promo />
      <ServiceStrip />
    </div>
  );
}
