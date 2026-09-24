import {ArrowRight, Search} from 'lucide-react';
import type {Product} from '@/domain/product';
import type {StorefrontTheme, ThemePresetId} from '@/domain/theme';
import ProductCard, {ProductCardSkeleton} from '@/features/catalog/components/ProductCard';
import {ShopLink, useShopNavigate} from '@/features/tenancy/ShopLink';

interface Props {
  products: Product[];
  categories: string[];
  loading: boolean;
  error: string;
  theme: StorefrontTheme;
}

const CARD_VARIANT: Record<ThemePresetId, 'clean-minimal' | 'street-bold' | 'soft-elegant' | 'grid-catalog' | 'dark-modern'> = {
  'clean-minimal': 'clean-minimal',
  'street-bold': 'street-bold',
  'soft-elegant': 'soft-elegant',
  'grid-catalog': 'grid-catalog',
  'dark-modern': 'dark-modern',
};

function ProductState({products, loading, error, theme, gridClass}: Props & {gridClass: string}) {
  const variant = CARD_VARIANT[theme.presetId];
  return (
    <>
      {error && <div className="mb-5 border border-current/20 bg-current/5 p-4 text-sm">{error}</div>}
      <div className={gridClass}>
        {loading
          ? Array.from({length: 8}).map((_, index) => <ProductCardSkeleton key={index} compact />)
          : products.slice(0, 10).map((product) => <ProductCard key={product.id} product={product} variant={variant} />)}
      </div>
      {!loading && !error && products.length === 0 && <div className="py-14 text-center text-sm opacity-60">ဒီဆိုင်မှာ ပစ္စည်းမတင်ရသေးပါ။</div>}
    </>
  );
}

function Minimal({products, categories, loading, error, theme}: Props) {
  const image = theme.home.heroImageUrl ?? products[0]?.image ?? products[0]?.images[0] ?? null;
  return (
    <div className="bg-white text-black">
      {theme.home.heroEnabled && (
        <section className="mx-auto grid max-w-[1440px] md:grid-cols-2">
          <div className="flex min-h-[420px] flex-col justify-center px-5 py-12 sm:px-8 lg:px-14">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-zinc-500">Selected collection</p>
            <h1 className="mt-5 max-w-xl text-4xl font-medium leading-[1.02] tracking-[-0.045em] sm:text-6xl">{theme.home.heroHeadline}</h1>
            {theme.home.heroSubtext && <p className="mt-5 max-w-lg text-sm leading-6 text-zinc-600 sm:text-base">{theme.home.heroSubtext}</p>}
            <ShopLink to="/products" className="mt-7 inline-flex min-h-11 w-fit items-center gap-2 border-b border-black text-sm font-semibold">
              {theme.home.heroCtaLabel}<ArrowRight className="h-4 w-4" />
            </ShopLink>
          </div>
          <div className="min-h-[420px] bg-zinc-100">
            {image ? <img src={image} alt="" className="h-full max-h-[620px] w-full object-cover" /> : null}
          </div>
        </section>
      )}
      {theme.home.categoriesEnabled && categories.length > 0 && (
        <nav className="mx-auto flex max-w-[1440px] gap-6 overflow-x-auto border-y border-zinc-200 px-5 py-4 text-xs font-medium sm:px-8">
          <ShopLink to="/products" className="shrink-0 text-black">All</ShopLink>
          {categories.map((category) => <ShopLink key={category} to={`/products?category=${encodeURIComponent(category)}`} className="shrink-0 text-zinc-500 hover:text-black">{category}</ShopLink>)}
        </nav>
      )}
      <section className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 lg:py-14">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div><h2 className="text-2xl font-medium tracking-[-0.03em] sm:text-3xl">{theme.home.featuredTitle}</h2>{theme.home.featuredSubtitle && <p className="mt-1 text-sm text-zinc-500">{theme.home.featuredSubtitle}</p>}</div>
          <ShopLink to="/products" className="text-xs font-semibold underline underline-offset-4">View all</ShopLink>
        </div>
        <ProductState products={products} categories={categories} loading={loading} error={error} theme={theme} gridClass="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-7" />
      </section>
    </div>
  );
}

function Street({products, categories, loading, error, theme}: Props) {
  const image = theme.home.heroImageUrl ?? products[0]?.image ?? products[0]?.images[0] ?? null;
  return (
    <div className="min-h-screen bg-[#f2ff00] text-black">
      {theme.home.heroEnabled && (
        <section className="relative min-h-[520px] overflow-hidden border-b-4 border-black bg-black">
          {image && <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-55 grayscale-[20%]" />}
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/55 to-transparent" />
          <div className="relative mx-auto flex min-h-[520px] max-w-[1440px] flex-col justify-end px-4 pb-10 pt-24 sm:px-8 lg:px-12">
            <p className="w-fit border-2 border-white bg-[#ff4d00] px-3 py-1 text-xs font-black uppercase text-white">New drop</p>
            <h1 className="mt-4 max-w-4xl text-5xl font-black uppercase leading-[0.86] tracking-[-0.06em] text-white sm:text-7xl lg:text-8xl">{theme.home.heroHeadline}</h1>
            {theme.home.heroSubtext && <p className="mt-4 max-w-xl text-sm font-semibold text-white/80 sm:text-base">{theme.home.heroSubtext}</p>}
            <ShopLink to="/products" className="mt-7 inline-flex min-h-12 w-fit items-center gap-2 border-2 border-white bg-[#ff4d00] px-6 text-sm font-black uppercase text-white shadow-[6px_6px_0_#fff]">
              {theme.home.heroCtaLabel}<ArrowRight className="h-4 w-4" />
            </ShopLink>
          </div>
        </section>
      )}
      {theme.home.categoriesEnabled && categories.length > 0 && (
        <div className="border-b-4 border-black bg-[#f2ff00]">
          <div className="mx-auto flex max-w-[1440px] gap-2 overflow-x-auto px-4 py-4 sm:px-8">
            <ShopLink to="/products" className="shrink-0 border-2 border-black bg-black px-4 py-2 text-xs font-black uppercase text-white">All</ShopLink>
            {categories.map((category) => <ShopLink key={category} to={`/products?category=${encodeURIComponent(category)}`} className="shrink-0 border-2 border-black bg-[#f2ff00] px-4 py-2 text-xs font-black uppercase text-black">{category}</ShopLink>)}
          </div>
        </div>
      )}
      <section className="mx-auto max-w-[1440px] px-4 py-9 sm:px-8">
        <div className="mb-6 flex items-end justify-between border-b-4 border-black pb-3">
          <h2 className="text-3xl font-black uppercase tracking-[-0.05em] sm:text-5xl">{theme.home.featuredTitle}</h2>
          <ShopLink to="/products" className="text-xs font-black uppercase">See all →</ShopLink>
        </div>
        <ProductState products={products} categories={categories} loading={loading} error={error} theme={theme} gridClass="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6" />
      </section>
    </div>
  );
}

function Elegant({products, categories, loading, error, theme}: Props) {
  const image = theme.home.heroImageUrl ?? products[0]?.image ?? products[0]?.images[0] ?? null;
  return (
    <div className="min-h-screen bg-[#f8f1ec] text-[#4a3337]">
      {theme.home.heroEnabled && (
        <section className="px-4 pb-5 pt-6 sm:px-8 sm:pt-10">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-[36px] bg-[#fffaf7] shadow-[0_30px_80px_rgba(95,70,74,0.10)]">
            <div className="grid items-center md:grid-cols-[0.9fr_1.1fr]">
              <div className="px-6 py-12 text-center sm:px-10 md:text-left lg:px-14">
                <p className="font-display text-sm italic text-[#a8717d]">A softer storefront</p>
                <h1 className="font-display mt-3 text-4xl font-semibold leading-[1.03] tracking-[-0.035em] sm:text-5xl">{theme.home.heroHeadline}</h1>
                {theme.home.heroSubtext && <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-[#856f74] md:mx-0">{theme.home.heroSubtext}</p>}
                <ShopLink to="/products" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#b56b7a] px-6 text-sm font-semibold text-white">{theme.home.heroCtaLabel}<ArrowRight className="h-4 w-4" /></ShopLink>
              </div>
              <div className="m-4 min-h-[340px] overflow-hidden rounded-[28px] bg-[#eadbd5] md:min-h-[430px]">
                {image && <img src={image} alt="" className="h-full w-full object-cover" />}
              </div>
            </div>
          </div>
        </section>
      )}
      {theme.home.categoriesEnabled && categories.length > 0 && (
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-8">
          <div className="no-scrollbar flex justify-start gap-2 overflow-x-auto md:justify-center">
            {categories.map((category) => <ShopLink key={category} to={`/products?category=${encodeURIComponent(category)}`} className="shrink-0 rounded-full border border-[#decac5] bg-[#fffaf7] px-4 py-2 text-xs font-medium text-[#76565d]">{category}</ShopLink>)}
          </div>
        </div>
      )}
      <section className="mx-auto max-w-6xl px-4 pb-14 pt-5 sm:px-8">
        <div className="mb-7 text-center"><p className="font-display text-3xl font-semibold">{theme.home.featuredTitle}</p>{theme.home.featuredSubtitle && <p className="mx-auto mt-2 max-w-xl text-sm text-[#8a7378]">{theme.home.featuredSubtitle}</p>}</div>
        <ProductState products={products} categories={categories} loading={loading} error={error} theme={theme} gridClass="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4 lg:gap-6" />
      </section>
    </div>
  );
}

function Catalog({products, categories, loading, error, theme}: Props) {
  const nav = useShopNavigate();
  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[#111827]">
      <section className="border-b border-[#dbe2ea] bg-white px-3 py-4 sm:px-6">
        <div className="mx-auto max-w-[1440px]">
          <form onSubmit={(e) => {e.preventDefault(); const form=new FormData(e.currentTarget); const q=String(form.get('q') ?? '').trim(); nav(`/products${q ? `?q=${encodeURIComponent(q)}` : ''}`);}} className="flex items-center gap-2 rounded-lg border border-[#cfd8e3] bg-[#f8fafc] px-3 py-2.5">
            <Search className="h-4 w-4 text-[#0f6fff]" />
            <input name="q" aria-label="ပစ္စည်းရှာရန်" placeholder="ပစ္စည်းအမည် ရိုက်ရှာပါ…" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
            <button className="rounded-md bg-[#0f6fff] px-4 py-2 text-xs font-bold text-white">ရှာမယ်</button>
          </form>
          {theme.home.categoriesEnabled && categories.length > 0 && <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">{categories.map((category) => <ShopLink key={category} to={`/products?category=${encodeURIComponent(category)}`} className="shrink-0 rounded-md border border-[#dbe2ea] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#475467]">{category}</ShopLink>)}</div>}
        </div>
      </section>
      {theme.home.heroEnabled && (
        <section className="mx-auto max-w-[1440px] px-3 py-4 sm:px-6">
          <div className="grid gap-3 rounded-lg border border-[#dbe2ea] bg-white p-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div><p className="text-xs font-bold uppercase tracking-wide text-[#0f6fff]">Fast browse mode</p><h1 className="mt-1 text-2xl font-extrabold tracking-[-0.03em]">{theme.home.heroHeadline}</h1>{theme.home.heroSubtext && <p className="mt-1 text-sm text-[#667085]">{theme.home.heroSubtext}</p>}</div>
            <ShopLink to="/products" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#0f6fff] px-4 text-xs font-bold text-white">{theme.home.heroCtaLabel}<ArrowRight className="h-3.5 w-3.5" /></ShopLink>
          </div>
        </section>
      )}
      <section className="mx-auto max-w-[1440px] px-3 pb-12 pt-3 sm:px-6">
        <div className="mb-3 flex items-center justify-between"><div><h2 className="text-lg font-extrabold">{theme.home.featuredTitle}</h2><p className="text-xs text-[#667085]">{theme.home.featuredSubtitle}</p></div><span className="text-xs font-semibold text-[#667085]">{products.length} items</span></div>
        <ProductState products={products} categories={categories} loading={loading} error={error} theme={theme} gridClass="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-5 xl:grid-cols-6" />
      </section>
    </div>
  );
}

function Dark({products, categories, loading, error, theme}: Props) {
  const image = theme.home.heroImageUrl ?? products[0]?.image ?? products[0]?.images[0] ?? null;
  return (
    <div className="min-h-screen bg-[#09090b] text-[#f8fafc]">
      {theme.home.heroEnabled && (
        <section className="px-4 py-5 sm:px-8 sm:py-8">
          <div className="relative mx-auto min-h-[440px] max-w-[1400px] overflow-hidden rounded-[28px] border border-[#2a2a30] bg-[#111114]">
            {image && <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45" />}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,rgba(115,251,211,0.16),transparent_35%),linear-gradient(90deg,#09090b_5%,rgba(9,9,11,.82)_48%,rgba(9,9,11,.2))]" />
            <div className="relative flex min-h-[440px] max-w-2xl flex-col justify-center px-6 py-10 sm:px-10 lg:px-14">
              <span className="w-fit rounded-full border border-[#73fbd3]/40 bg-[#73fbd3]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#73fbd3]">Modern mode</span>
              <h1 className="mt-5 text-4xl font-black leading-[1] tracking-[-0.05em] sm:text-6xl">{theme.home.heroHeadline}</h1>
              {theme.home.heroSubtext && <p className="mt-4 max-w-xl text-sm leading-6 text-[#a1a1aa]">{theme.home.heroSubtext}</p>}
              <ShopLink to="/products" className="mt-7 inline-flex min-h-11 w-fit items-center gap-2 rounded-xl bg-[#73fbd3] px-5 text-sm font-black text-[#08110e] shadow-[0_0_36px_rgba(115,251,211,0.20)]">{theme.home.heroCtaLabel}<ArrowRight className="h-4 w-4" /></ShopLink>
            </div>
          </div>
        </section>
      )}
      {theme.home.categoriesEnabled && categories.length > 0 && <div className="mx-auto max-w-[1400px] px-4 sm:px-8"><div className="no-scrollbar flex gap-2 overflow-x-auto border-y border-[#242429] py-4">{categories.map((category) => <ShopLink key={category} to={`/products?category=${encodeURIComponent(category)}`} className="shrink-0 rounded-lg border border-[#2a2a30] bg-[#151518] px-4 py-2 text-xs font-semibold text-[#c9c9d0] hover:border-[#73fbd3]/50 hover:text-[#73fbd3]">{category}</ShopLink>)}</div></div>}
      <section className="mx-auto max-w-[1400px] px-4 py-9 sm:px-8">
        <div className="mb-6 flex items-end justify-between"><div><h2 className="text-2xl font-black tracking-[-0.035em] sm:text-3xl">{theme.home.featuredTitle}</h2>{theme.home.featuredSubtitle && <p className="mt-1 text-sm text-[#8f8f99]">{theme.home.featuredSubtitle}</p>}</div><ShopLink to="/products" className="inline-flex items-center gap-1 text-xs font-bold text-[#73fbd3]">View all<ArrowRight className="h-3.5 w-3.5" /></ShopLink></div>
        <ProductState products={products} categories={categories} loading={loading} error={error} theme={theme} gridClass="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5" />
      </section>
    </div>
  );
}

export default function AestheticHome(props: Props) {
  switch (props.theme.presetId) {
    case 'clean-minimal': return <Minimal {...props} />;
    case 'street-bold': return <Street {...props} />;
    case 'soft-elegant': return <Elegant {...props} />;
    case 'grid-catalog': return <Catalog {...props} />;
    case 'dark-modern': return <Dark {...props} />;
  }
}
