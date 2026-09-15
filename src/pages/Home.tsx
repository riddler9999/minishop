import {useEffect, useState} from 'react';
import {ArrowRight, MoreHorizontal} from 'lucide-react';
import {api, getCachedShopInfo, type Product} from '../lib/store';
import ProductCard, {ProductCardSkeleton} from '../components/ProductCard';
import {ShopLink, useShopSlugParam} from '../components/ShopLink';

function Hero({product}: {product?: Product}) {
  const shop = getCachedShopInfo();

  return (
    <section className="mx-auto max-w-7xl px-4 pt-4 sm:pt-6">
      <div className="relative min-h-[330px] overflow-hidden rounded-[28px] bg-neutral-900 sm:min-h-[420px] lg:min-h-[500px]">
        {product?.image ? (
          <img
            src={product.image}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#ebe4db] via-[#d9d1c7] to-[#a99b8b]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/72 to-white/5 sm:from-white/92 sm:via-white/55 sm:to-transparent" />

        <div className="fade-up relative z-10 flex min-h-[330px] max-w-xl flex-col justify-center px-7 py-10 sm:min-h-[420px] sm:px-12 lg:min-h-[500px] lg:px-16">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-black/55">
            {shop ? 'ရွေးချယ်ထားသော ပစ္စည်းများ' : 'Mini Shop Demo'}
          </p>
          <h1 className="font-display text-[40px] font-semibold leading-[0.98] tracking-[-0.04em] text-black sm:text-6xl lg:text-7xl">
            {shop?.name ?? 'နေ့တိုင်း ပိုကောင်းတဲ့ ရွေးချယ်မှု'}
          </h1>
          <p className="my mt-5 max-w-md text-sm leading-7 text-black/65 sm:text-base">
            {shop
              ? 'လိုချင်တဲ့ပစ္စည်းကို ရွေးပါ၊ စျေးခြင်းထဲထည့်ပါ၊ ပြီးရင် အလွယ်တကူ မှာယူနိုင်ပါတယ်။'
              : 'လှပပြီး အသုံးဝင်တဲ့ နေ့စဉ်သုံးပစ္စည်းတွေကို တစ်နေရာတည်းမှာ လွယ်လွယ်ကူကူ ရွေးချယ်ဝယ်ယူပါ။'}
          </p>
          <div className="mt-7">
            <ShopLink
              to="/products"
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800">
              ပစ္စည်းများ ကြည့်မယ် <ArrowRight className="h-4 w-4" />
            </ShopLink>
          </div>
        </div>

        <div className="absolute bottom-5 right-6 z-10 hidden items-center gap-2 rounded-full bg-white/85 px-3 py-1.5 text-xs font-medium text-black backdrop-blur sm:flex">
          01 <span className="text-black/35">/</span> 03
        </div>
      </div>
    </section>
  );
}

function CategoryStrip({categories, groups}: {categories: string[]; groups: {category: string; products: Product[]}[]}) {
  if (!categories.length) return null;

  const imageFor = (category: string) => groups.find((g) => g.category === category)?.products[0]?.image ?? null;

  return (
    <section className="mx-auto max-w-7xl px-4 pt-5 sm:pt-7">
      <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2 sm:gap-6">
        {categories.slice(0, 7).map((category) => {
          const image = imageFor(category);
          return (
            <ShopLink
              key={category}
              to={`/products?category=${encodeURIComponent(category)}`}
              className="group flex w-[72px] shrink-0 flex-col items-center gap-2 text-center sm:w-[88px]">
              <span className="relative grid h-[68px] w-[68px] overflow-hidden rounded-full bg-[#f4f4f2] ring-1 ring-black/[0.05] transition group-hover:ring-black/20 sm:h-20 sm:w-20">
                {image ? (
                  <img src={image} alt="" loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                ) : (
                  <span className="grid h-full w-full place-items-center font-display text-xl font-semibold text-black/70">
                    {category.trim().charAt(0).toUpperCase()}
                  </span>
                )}
              </span>
              <span className="my w-full truncate text-[11px] font-medium text-black/75 sm:text-xs">{category}</span>
            </ShopLink>
          );
        })}

        <ShopLink to="/products" className="group flex w-[72px] shrink-0 flex-col items-center gap-2 text-center sm:w-[88px]">
          <span className="grid h-[68px] w-[68px] place-items-center rounded-full bg-[#f4f4f2] text-black/55 ring-1 ring-black/[0.05] transition group-hover:bg-black group-hover:text-white sm:h-20 sm:w-20">
            <MoreHorizontal className="h-6 w-6" />
          </span>
          <span className="my w-full truncate text-[11px] font-medium text-black/75 sm:text-xs">အားလုံး</span>
        </ShopLink>
      </div>
    </section>
  );
}

function SectionHeader({title, to}: {title: string; to?: string}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3 sm:mb-5">
      <h2 className="font-display text-2xl font-semibold tracking-[-0.03em] text-black sm:text-3xl">{title}</h2>
      {to && (
        <ShopLink to={to} className="inline-flex min-h-11 items-center gap-1.5 px-1 text-xs font-medium text-black/65 transition hover:text-black sm:text-sm">
          အားလုံး <ArrowRight className="h-4 w-4" />
        </ShopLink>
      )}
    </div>
  );
}

function NewDrop({products, loading}: {products: Product[]; loading: boolean}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      <SectionHeader title="အသစ်ရောက်" to="/products" />
      <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 sm:gap-4">
        {loading
          ? Array.from({length: 4}).map((_, i) => (
              <div key={i} className="w-[72%] max-w-[280px] shrink-0 snap-start sm:w-[240px]">
                <ProductCardSkeleton compact />
              </div>
            ))
          : products.map((product) => (
              <div key={product.id} className="w-[72%] max-w-[280px] shrink-0 snap-start sm:w-[240px] lg:w-[260px]">
                <ProductCard product={product} variant="compact" />
              </div>
            ))}
      </div>
    </section>
  );
}

function Trending({products}: {products: Product[]}) {
  if (!products.length) return null;
  const items = products.slice(0, 3);

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:py-10">
      <SectionHeader title="လူကြိုက်များ" to="/products" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="col-span-2 min-h-[360px] sm:col-span-1 sm:row-span-2 sm:min-h-[540px]">
          <ProductCard product={items[0]} variant="feature" className="h-full" />
        </div>
        {items.slice(1).map((product) => (
          <div key={product.id} className="min-h-[220px] sm:min-h-[260px]">
            <ProductCard product={product} variant="feature" className="h-full" />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const [latest, setLatest] = useState<Product[] | null>(null);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [categoryNames, setCategoryNames] = useState<string[]>([]);
  const [groups, setGroups] = useState<{category: string; products: Product[]}[]>([]);
  const [err, setErr] = useState('');
  const slug = useShopSlugParam();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [{products}, feat] = await Promise.all([
          api.products({scope: 'active', limit: 12}),
          api.products({scope: 'active', featured: true, limit: 8}),
        ]);
        if (!alive) return;
        setLatest(products);
        setFeatured(feat.products.length ? feat.products : products.slice(0, 6));
      } catch (e: any) {
        if (alive) setErr(e.message || 'ပစ္စည်းများ ဆွဲယူ၍မရပါ');
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const {categories} = await api.categories();
        if (alive) setCategoryNames(categories);
        const result = await Promise.all(
          categories.slice(0, 7).map(async (category) => ({
            category,
            products: (await api.products({scope: 'active', category, limit: 1})).products,
          })),
        );
        if (alive) setGroups(result);
      } catch {
        /* Category shortcuts are non-critical. */
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  const heroProduct = featured[0] ?? latest?.[0];
  const forYou = latest ?? [];

  return (
    <div className="bg-white pb-4">
      <Hero product={heroProduct} />
      <CategoryStrip categories={categoryNames} groups={groups} />

      {err && (
        <div className="mx-auto mt-6 max-w-7xl px-4">
          <div className="rounded-2xl border border-black/10 bg-neutral-50 p-4 text-sm text-black/70">{err}</div>
        </div>
      )}

      <NewDrop products={(latest ?? []).slice(0, 8)} loading={latest === null && !err} />
      <Trending products={featured} />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
        <SectionHeader title="သင့်အတွက်" to="/products" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {latest === null && !err
            ? Array.from({length: 8}).map((_, i) => <ProductCardSkeleton key={i} compact />)
            : forYou.slice(0, 8).map((product) => <ProductCard key={product.id} product={product} variant="compact" />)}
        </div>
        {latest !== null && latest.length === 0 && !err && (
          <p className="my py-12 text-center text-sm text-black/50">ယခုအချိန်တွင် ပစ္စည်းမရှိသေးပါ။</p>
        )}
      </section>
    </div>
  );
}
