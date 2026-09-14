import {useEffect, useRef, useState} from 'react';
import {ArrowRight, ChevronLeft, ChevronRight, Sparkles} from 'lucide-react';
import {api, getCachedShopInfo, type Product} from '../lib/store';
import ProductCard, {ProductCardSkeleton} from '../components/ProductCard';
import {ShopLink, useShopSlugParam} from '../components/ShopLink';

function Hero() {
  // Real tenant → the seller's own shop name + a neutral welcome; the "demo"
  // framing is shown only on the product's root demo storefront.
  const shop = getCachedShopInfo();
  return (
    <section className="relative overflow-hidden bg-brand-900">
      {/* Theme-native gradient hero (no external banner image). */}
      <div className="relative flex h-[60vw] max-h-[560px] min-h-[280px] w-full items-center justify-center bg-gradient-to-br from-brand-900 via-brand-700 to-gold-600">
        {/* Decorative aurora blobs */}
        <div className="pointer-events-none absolute -left-16 -top-16 h-72 w-72 rounded-full bg-gold-400/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-brand-400/30 blur-3xl" />

        <div className="fade-up relative z-10 mx-auto max-w-3xl px-6 text-center text-cream-50">
          <span className="inline-block rounded-full border border-cream-50/25 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-cream-50 backdrop-blur">
            {shop ? '🛍️ Online Shop' : '✨ DEMO STORE — နမူနာ စတိုး'}
          </span>
          <h1 className="mt-5 font-display text-4xl font-bold leading-tight sm:text-5xl">
            {shop?.name ?? 'Demo Fashion Store'}
          </h1>
          <p className="my mx-auto mt-4 max-w-xl text-sm text-cream-100/85 sm:text-base">
            {shop
              ? 'ပစ္စည်းများ ရွေးချယ်၍ လွယ်ကူစွာ မှာယူနိုင်ပါသည်။ KBZPay / WavePay / အိမ်အရောက်ငွေချေ (COD) ဖြင့် ဝယ်ယူနိုင်သည်။'
              : 'ဤစတိုးသည် သရုပ်ပြ (demo) e-commerce စတိုးဖြစ်သည်။ ပစ္စည်း၊ ဈေးနှုန်း၊ ငွေပေးချေမှုအားလုံး နမူနာ data များသာဖြစ်ပြီး အမှန်တကယ် အရောင်းအဝယ် မဟုတ်ပါ။'}
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <ShopLink
              to="/products"
              className="inline-flex items-center gap-2 rounded-full bg-cream-50 px-7 py-3 font-bold text-brand-800 shadow-lg transition hover:bg-white">
              ပစ္စည်းများ ကြည့်ရန် <ArrowRight className="h-4 w-4" />
            </ShopLink>
            <ShopLink
              to="/orders"
              className="inline-flex items-center gap-2 rounded-full border border-cream-50/40 px-7 py-3 font-semibold text-cream-50 transition hover:bg-white/10">
              Order စစ်ရန်
            </ShopLink>
          </div>
        </div>
        {/* Blend the bottom edge into the page background. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-cream-50 to-transparent" />
      </div>
    </section>
  );
}

function SectionHeader({title, sub, to}: {title: string; sub?: string; to?: string}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-3">
      <div>
        <h2 className="font-display text-2xl font-bold text-brand-800">{title}</h2>
        {sub && <p className="my mt-1 text-sm text-ink-soft">{sub}</p>}
      </div>
      {to && (
        <ShopLink to={to} className="inline-flex items-center gap-1 whitespace-nowrap text-sm font-semibold text-brand-700 hover:text-brand-900">
          အားလုံးကြည့် <ArrowRight className="h-4 w-4" />
        </ShopLink>
      )}
    </div>
  );
}

function FeaturedCarousel({products}: {products: Product[]}) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => ref.current?.scrollBy({left: dir * 260, behavior: 'smooth'});
  if (!products.length) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <h2 className="inline-flex items-center gap-2 font-display text-2xl font-bold text-brand-800">
            <Sparkles className="h-5 w-5 text-gold-500" /> အထူးရွေးချယ်ထားသော
          </h2>
          <p className="my mt-1 text-sm text-ink-soft">ဖက်ရှင်အသစ်များ</p>
        </div>
        <div className="hidden gap-2 sm:flex">
          <button onClick={() => scroll(-1)} className="grid h-9 w-9 place-items-center rounded-full border border-cream-200 bg-white text-brand-700 hover:bg-cream-100">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => scroll(1)} className="grid h-9 w-9 place-items-center rounded-full border border-cream-200 bg-white text-brand-700 hover:bg-cream-100">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div ref={ref} className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
        {products.map((p) => (
          <div key={p.id} className="w-[46%] shrink-0 snap-start sm:w-[240px]">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const [latest, setLatest] = useState<Product[] | null>(null);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [cats, setCats] = useState<{category: string; products: Product[]}[]>([]);
  const [err, setErr] = useState('');
  const slug = useShopSlugParam();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [{products}, feat] = await Promise.all([
          api.products({scope: 'active', limit: 10}),
          api.products({scope: 'active', featured: true, limit: 12}),
        ]);
        if (!alive) return;
        setLatest(products);
        // Fall back to newest active items when nothing is flagged as promotion.
        setFeatured(feat.products.length ? feat.products : products.slice(0, 8));
      } catch (e: any) {
        if (alive) setErr(e.message || 'ပစ္စည်းများ ဆွဲယူ၍မရပါ');
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  // Per-category sections.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const {categories} = await api.categories();
        const groups = await Promise.all(
          categories.map(async (c) => ({
            category: c,
            products: (await api.products({scope: 'active', category: c, limit: 4})).products,
          })),
        );
        if (alive) setCats(groups.filter((g) => g.products.length));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  return (
    <>
      <Hero />
      <FeaturedCarousel products={featured} />

      <section className="mx-auto max-w-6xl px-4 py-8">
        <SectionHeader title="နောက်ဆုံးရောက်ရှိ ပစ္စည်းများ" sub="အသစ်ဝင်ရောက်လာသော ပစ္စည်းများ" to="/products" />
        {err && (
          <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-700">{err}</div>
        )}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {latest === null
            ? Array.from({length: 6}).map((_, i) => <ProductCardSkeleton key={i} />)
            : latest.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
        {latest !== null && latest.length === 0 && !err && (
          <p className="my py-8 text-center text-ink-soft">ယခုအချိန်တွင် ပစ္စည်းမရှိသေးပါ။</p>
        )}
        <div className="mt-8 text-center">
          <ShopLink
            to="/products"
            className="inline-flex items-center gap-2 rounded-full border border-brand-700 px-6 py-3 font-semibold text-brand-700 transition hover:bg-brand-700 hover:text-cream-100">
            ပစ္စည်းများ အားလုံးကြည့်ရန် <ArrowRight className="h-4 w-4" />
          </ShopLink>
        </div>
      </section>

      {/* Sections by category */}
      {cats.map((c) => (
        <section key={c.category} className="mx-auto max-w-6xl px-4 py-8">
          <SectionHeader title={c.category} to={`/products?category=${encodeURIComponent(c.category)}`} />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {c.products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
