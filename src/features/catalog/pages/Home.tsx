import {useEffect, useState} from 'react';
import {ArrowRight, ClipboardList, PackageCheck, ShieldCheck} from 'lucide-react';
import {api} from '@/data/dataSource';
import type {Product} from '@/domain/product';
import {getCachedShopInfo} from '@/features/tenancy/shopResolver';
import ProductCard, {ProductCardSkeleton} from '@/features/catalog/components/ProductCard';
import {ShopLink, useShopNavigate, useShopSlugParam} from '@/features/tenancy/ShopLink';
import {SearchBox} from '@/shared/ui/Layout';

function Hero({product}: {product: Product | null}) {
  const shop = getCachedShopInfo();
  const image = product?.image ?? product?.images[0] ?? null;

  return (
    <section className="bg-white px-4 pb-5 pt-5 sm:px-8 sm:pb-8 lg:pt-8">
      <div className="mx-auto grid min-h-[440px] max-w-7xl overflow-hidden rounded-[28px] bg-[#fff0f6] sm:rounded-[36px] lg:grid-cols-2 lg:min-h-[520px]">
        <div className="relative z-10 flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-14 lg:py-16">
          <p className="text-sm font-semibold text-[#e11d48]">{shop?.name ?? 'သင့်ဆိုင်'}</p>
          <h1 className="mt-4 max-w-xl text-4xl font-bold leading-[1.08] tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
            ကိုယ်နှစ်သက်မယ့် ဖက်ရှင်ကို ရှာဖွေလိုက်ပါ။
          </h1>
          <p className="mt-5 max-w-md text-sm leading-6 text-slate-600 sm:text-base">
            ဒီဆိုင်ရဲ့ နောက်ဆုံးရောက် ဖက်ရှင်ပစ္စည်းတွေကို တစ်နေရာတည်းမှာ လွယ်လွယ်ကူကူ ကြည့်နိုင်ပါတယ်။
          </p>
          <ShopLink
            to="/products"
            className="mt-7 inline-flex min-h-12 w-fit items-center gap-2 rounded-full bg-[#e11d48] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#be123c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e11d48] focus-visible:ring-offset-2">
            ပစ္စည်းများကြည့်ရန် <ArrowRight className="h-4 w-4" />
          </ShopLink>
        </div>

        <div className="relative min-h-[320px] overflow-hidden sm:min-h-[380px] lg:min-h-[520px]">
          {image ? (
            <img src={image} alt={product?.name ?? 'ဖက်ရှင်ပစ္စည်း'} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#fbcfe8] via-[#f9a8d4] to-[#fff0f6]">
              {shop?.logoUrl ? <img src={shop.logoUrl} alt={`${shop.name} ဆိုင်အမှတ်တံဆိပ်`} className="h-28 w-28 rounded-full bg-white object-contain p-3 shadow-xl" /> : null}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}

function ProductSearch() {
  const navigate = useShopNavigate();

  return (
    <section className="bg-white px-4 py-3 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <SearchBox defaultValue="" onSubmit={(query) => navigate(query ? `/products?q=${encodeURIComponent(query)}` : '/products')} />
      </div>
    </section>
  );
}

function CategoryRail({categories}: {categories: string[]}) {
  if (categories.length === 0) return null;

  return (
    <section className="bg-white px-4 py-5 sm:px-8">
      <div className="no-scrollbar mx-auto flex max-w-7xl gap-2 overflow-x-auto pb-1">
        <ShopLink to="/products" className="shrink-0 rounded-full border border-[#e11d48] bg-[#e11d48] px-4 py-2 text-sm font-medium text-white">
          အားလုံး
        </ShopLink>
        {categories.map((category) => (
          <ShopLink
            key={category}
            to={`/products?category=${encodeURIComponent(category)}`}
            className="shrink-0 rounded-full border border-[#f3d6e2] bg-[#fff7fa] px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-[#f9a8d4]">
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
            <h2 className="text-2xl font-bold tracking-[-0.03em] text-slate-950 sm:text-3xl">အသစ်ရောက် ပစ္စည်းများ</h2>
            <p className="mt-1 text-sm text-slate-500">ဆိုင်မှာ လက်ရှိရရှိနိုင်တဲ့ နောက်ဆုံးပေါ်ပစ္စည်းများ။</p>
          </div>
          <ShopLink to="/products" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-[#e11d48]">
            အားလုံးကြည့်ရန် <ArrowRight className="h-4 w-4" />
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
            ဒီဆိုင်မှာ ပစ္စည်းမတင်ရသေးပါ။
          </div>
        )}
      </div>
    </section>
  );
}

function Promo({product}: {product: Product | null}) {
  if (!product) return null;

  const image = product.image ?? product.images[0] ?? null;

  return (
    <section className="bg-white px-4 py-5 sm:px-8 sm:py-8">
      <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[28px] bg-[#fff0f6] sm:grid-cols-[1fr_220px]">
        <div className="flex flex-col justify-center px-6 py-8 sm:px-10 sm:py-10">
          <p className="text-sm font-semibold text-[#e11d48]">အထူးဈေးနှုန်း</p>
          <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-slate-950 sm:text-3xl">{product.name}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">အထူးဈေးနှုန်းနဲ့ ရရှိနေတဲ့ ပစ္စည်းကို အခုပဲကြည့်ပါ။</p>
          <ShopLink to={`/products/${product.id}`} className="mt-5 inline-flex min-h-12 w-fit items-center gap-2 rounded-full bg-[#e11d48] px-6 py-3 text-sm font-semibold text-white hover:bg-[#be123c]">
            အသေးစိတ်ကြည့်ရန် <ArrowRight className="h-4 w-4" />
          </ShopLink>
        </div>
        {image ? <img src={image} alt={product.name} className="h-56 w-full object-cover sm:h-full" /> : null}
      </div>
    </section>
  );
}

function ServiceStrip() {
  const services = [
    {title: 'လွယ်ကူစွာ ဝယ်ယူနိုင်ခြင်း', icon: PackageCheck, to: '/products'},
    {title: 'လုံခြုံသော ငွေချေမှု', icon: ShieldCheck, to: '/cart'},
    {title: 'အော်ဒါအခြေအနေစစ်ရန်', icon: ClipboardList, to: '/orders'},
  ];

  return (
    <section className="border-t border-slate-100 bg-white px-4 py-8 sm:px-8">
      <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {services.map(({title, icon: Icon, to}) => (
          <ShopLink key={title} to={to} className="flex min-h-14 items-center justify-center gap-3 px-4 py-5 text-sm font-medium text-slate-700 transition hover:bg-[#fff7fa] hover:text-[#e11d48]">
            <Icon className="h-5 w-5 text-[#e11d48]" strokeWidth={1.7} />
            {title}
          </ShopLink>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [error, setError] = useState('');
  const slug = useShopSlugParam();

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
  const promotion = visibleProducts.find((product) => product.isPromotion) ?? null;

  return (
    <div className="bg-white">
      <Hero product={visibleProducts[0] ?? null} />
      <ProductSearch />
      <CategoryRail categories={categories} />
      <ProductSection products={visibleProducts} loading={products === null && !error} error={error} />
      <Promo product={promotion} />
      <ServiceStrip />
    </div>
  );
}
