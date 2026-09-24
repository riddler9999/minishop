import {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {ArrowLeft, Check, ChevronLeft, ChevronRight, ImageOff, Minus, Plus, ShoppingBag} from 'lucide-react';
import {api} from '@/data/dataSource';
import type {Product} from '@/domain/product';
import {useCart} from '@/features/cart/state';
import {ks} from '@/shared/lib/format';
import ProductCard from '@/features/catalog/components/ProductCard';
import {getStorefrontTheme} from '@/features/tenancy/shopResolver';
import {getThemeVisual} from '@/domain/theme';
import {ShopLink, useShopNavigate, useShopSlugParam} from '@/features/tenancy/ShopLink';
import {useDemoStore} from '@/features/demo/DemoStoreContext';
import {DEMO_BEST_SELLING_IDS} from '@/features/demo/merchandising';

const COLOR_MAP: Record<string, string> = {
  'အဖြူ': '#ffffff', white: '#ffffff', 'အနက်': '#111111', black: '#111111', 'အနီ': '#ef4444', red: '#ef4444',
  'ပန်းရောင်': '#ec4899', pink: '#ec4899', 'အပြာ': '#3b82f6', blue: '#3b82f6', 'အစိမ်း': '#22c55e', green: '#22c55e',
  'အဝါ': '#eab308', yellow: '#eab308', 'ခရမ်း': '#a855f7', purple: '#a855f7', 'အညို': '#8b5e3c', brown: '#8b5e3c',
};

export default function ProductDetail() {
  const {id} = useParams();
  const nav = useNavigate();
  const shopNav = useShopNavigate();
  const slug = useShopSlugParam();
  const {add} = useCart();
  const theme = getStorefrontTheme();
  const isDemo = useDemoStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [err, setErr] = useState('');
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [related, setRelated] = useState<Product[]>([]);
  const [bestSelling, setBestSelling] = useState<Product[]>([]);

  useEffect(() => {
    let alive = true; setProduct(null); setErr(''); setActive(0); setQty(1);
    api.product(id!).then((r) => alive && setProduct(r.product)).catch((e) => alive && setErr(e.message || 'ပစ္စည်း ရှာမတွေ့ပါ'));
    return () => {alive = false;};
  }, [id, slug]);

  useEffect(() => {
    if (!product?.category) return;
    let alive = true; setRelated([]);
    api.products({scope: 'active', category: product.category, limit: 10}).then((r) => {if (alive) setRelated(r.products.filter((p) => p.id !== product.id).slice(0, 8));}).catch(() => {});
    return () => {alive = false;};
  }, [product?.id, product?.category]);

  useEffect(() => {
    if (!isDemo || !product) {
      setBestSelling([]);
      return;
    }
    let alive = true;
    setBestSelling([]);
    api.products({scope: 'active', limit: 100})
      .then((r) => {
        if (!alive) return;
        const byId = new Map(r.products.map((item) => [item.id, item]));
        setBestSelling(
          DEMO_BEST_SELLING_IDS
            .map((productId) => byId.get(productId))
            .filter((item): item is Product => Boolean(item) && item.id !== product.id),
        );
      })
      .catch(() => {
        if (alive) setBestSelling([]);
      });
    return () => {alive = false;};
  }, [isDemo, product?.id]);

  if (err) return <div className="mx-auto max-w-3xl px-4 py-16 text-center"><p className="my text-ink-soft">{err}</p><ShopLink to="/products" className="mt-4 inline-block font-semibold text-brand-700">← ပစ္စည်းများသို့</ShopLink></div>;
  if (!product) return <div className="mx-auto grid max-w-5xl gap-8 px-4 py-8 md:grid-cols-2"><div className="aspect-4/5 animate-pulse rounded-2xl bg-cream-100" /><div className="space-y-4"><div className="h-6 w-2/3 animate-pulse rounded bg-cream-100" /><div className="h-8 w-1/3 animate-pulse rounded bg-cream-100" /></div></div>;

  const price = product.isPromotion && product.promoPrice ? product.promoPrice : product.price;
  const hasPromo = product.isPromotion && product.promoPrice != null;
  const colorHex = product.color ? COLOR_MAP[product.color.trim().toLowerCase()] ?? '#d1d5db' : null;
  const doAdd = () => {add(product, qty); setAdded(true); setTimeout(() => setAdded(false), 1500);};
  const buyNow = () => {add(product, qty); shopNav('/checkout');};

  const visual = getThemeVisual(theme);

  if (isDemo) {
    const imageCount = product.images.length;
    const goPreviousImage = () => setActive((index) => (index - 1 + imageCount) % imageCount);
    const goNextImage = () => setActive((index) => (index + 1) % imageCount);

    return (
      <div className="min-h-screen bg-[#cdb7f7] pb-32">
        <div className="mx-auto max-w-[430px]">
          <div className="px-4 pt-4">
            <div className="mb-3">
              <button onClick={() => nav(-1)} aria-label="နောက်သို့" className="grid h-11 w-11 place-items-center rounded-full bg-white/78 text-[#2c1a48] shadow-[0_8px_22px_rgba(76,29,149,0.10)] backdrop-blur">
                <ArrowLeft className="h-5 w-5" />
              </button>
            </div>

            <div className="relative aspect-[4/5] overflow-hidden rounded-[34px] bg-[radial-gradient(circle_at_50%_45%,#eadfff_0%,#d8c8fa_56%,#c2aaf2_100%)] shadow-[0_20px_46px_rgba(76,29,149,0.12)]">
              {product.images[active] ? (
                <img
                  src={product.images[active]}
                  alt={`${product.name} — ပုံ ${active + 1}`}
                  className="h-full w-full object-contain p-2 drop-shadow-[0_24px_28px_rgba(76,29,149,0.16)]"
                />
              ) : (
                <div className="grid h-full w-full place-items-center text-[#6d28d9]"><ImageOff className="h-10 w-10" /></div>
              )}

              {imageCount > 1 && (
                <>
                  <button
                    type="button"
                    onClick={goPreviousImage}
                    aria-label="ယခင်ပုံ"
                    className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/88 text-[#3a1268] shadow-[0_8px_22px_rgba(76,29,149,0.18)] backdrop-blur">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={goNextImage}
                    aria-label="နောက်ပုံ"
                    className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/88 text-[#3a1268] shadow-[0_8px_22px_rgba(76,29,149,0.18)] backdrop-blur">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>

            {imageCount > 1 && (
              <div className="no-scrollbar flex justify-center gap-2 overflow-x-auto px-4 py-4">
                {product.images.map((im, i) => (
                  <button key={i} onClick={() => setActive(i)} className={`h-2.5 w-2.5 shrink-0 rounded-full transition ${i === active ? 'bg-[#6d28d9]' : 'bg-white/75'}`} aria-label={`ပုံ ${i + 1}`}>
                    <span className="sr-only">{im}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-t-[34px] bg-[#fbf8ff] px-5 pb-8 pt-6 shadow-[0_-18px_42px_rgba(76,29,149,0.10)]">
            <h1 className="font-display text-[30px] font-black leading-tight tracking-[-0.04em] text-[#21133f]">{product.name}</h1>

            <div className="mt-3 flex items-center gap-2">
              <span className="font-sans text-[29px] font-black tracking-[-0.03em] text-[#21133f]">{ks(price)}</span>
              {hasPromo && <span className="text-sm text-[#988ca7] line-through">{ks(product.price)}</span>}
            </div>

            <div className="mt-5">
              <p className="my mb-2 text-sm font-bold text-[#49365f]">အရေအတွက်</p>
              <div className="flex w-fit items-center rounded-[16px] border border-[#dfd1f5] bg-white">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="အရေအတွက်လျှော့ရန်" className="grid h-11 w-11 place-items-center text-[#6d28d9]"><Minus className="h-4 w-4" /></button>
                <span className="w-9 text-center text-sm font-bold text-[#2b1a47]">{qty}</span>
                <button onClick={() => setQty((q) => Math.min(Math.max(product.stock, 1), q + 1))} aria-label="အရေအတွက်တိုးရန်" className="grid h-11 w-11 place-items-center text-[#6d28d9]"><Plus className="h-4 w-4" /></button>
              </div>
            </div>

            {product.description && (
              <div className="mt-5">
                <h2 className="my text-sm font-bold text-[#49365f]">ပစ္စည်းအကြောင်း</h2>
                <p className="my mt-2 whitespace-pre-line text-sm leading-7 text-[#76698a]">{product.description}</p>
              </div>
            )}

            {(product.color || product.size) && (
              <div className="mt-5 flex flex-wrap items-center gap-3">
                {product.color && <span className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#f1e8ff] px-4 text-sm font-semibold text-[#49365f]"><span className="h-5 w-5 rounded-full border border-black/10" style={{backgroundColor: colorHex ?? '#d1d5db'}} />{product.color}</span>}
                {product.size && <span className="inline-flex min-h-11 items-center rounded-full bg-[#f1e8ff] px-4 text-sm font-semibold text-[#49365f]">Size · {product.size}</span>}
              </div>
            )}

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button disabled={!product.inStock} onClick={doAdd} className="inline-flex min-h-13 items-center justify-center gap-2 rounded-[18px] border border-[#6d28d9] bg-white px-4 py-3 text-sm font-bold text-[#6d28d9] transition hover:bg-[#f3ecff] disabled:opacity-50">
                {added ? <><Check className="h-4 w-4" /> Added</> : <><ShoppingBag className="h-4 w-4" /> Add to cart</>}
              </button>
              <button disabled={!product.inStock} onClick={buyNow} className="min-h-13 rounded-[18px] bg-[#6d28d9] px-4 py-3 text-sm font-bold text-white shadow-[0_12px_28px_rgba(109,40,217,0.30)] transition hover:bg-[#5b21b6] disabled:opacity-50">
                Buy now
              </button>
            </div>
          </div>

          {bestSelling.length > 0 && (
            <section className="px-4 pb-8 pt-7">
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl font-black tracking-[-0.035em] text-[#21133f]">Best Selling</h2>
                </div>
                <ShopLink to="/products" className="text-xs font-bold text-[#5b21b6]">အားလုံးကြည့်ရန်</ShopLink>
              </div>
              <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4">
                {bestSelling.map((p) => (
                  <ProductCard key={p.id} product={p} variant="demo-purple" className="w-[58vw] max-w-[230px] shrink-0 snap-start" />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    );
  }

  const detail = {
    'clean-minimal': {
      shell: 'mx-auto max-w-[1320px] px-4 pb-14 pt-6 sm:px-8 sm:pt-10',
      grid: 'grid gap-8 md:grid-cols-[1.15fr_0.85fr] md:gap-14',
      image: 'aspect-[4/5] overflow-hidden bg-[#f4f4f4]',
      title: 'text-black',
      priceBox: 'border-y border-zinc-200 bg-white',
      chip: 'border border-zinc-300 bg-white text-zinc-700 rounded-none',
      qty: 'border border-black bg-white rounded-none',
      related: 'text-black',
      secondary: 'border border-black bg-white text-black rounded-none',
      primary: 'bg-black text-white rounded-none',
    },
    'street-bold': {
      shell: 'mx-auto max-w-[1320px] px-4 pb-14 pt-6 sm:px-8 sm:pt-10',
      grid: 'grid gap-6 md:grid-cols-[0.9fr_1.1fr] md:gap-10',
      image: 'aspect-square overflow-hidden border-4 border-black bg-white shadow-[8px_8px_0_#111]',
      title: 'text-black uppercase',
      priceBox: 'border-4 border-black bg-[#f2ff00] shadow-[5px_5px_0_#111]',
      chip: 'border-2 border-black bg-white text-black rounded-none',
      qty: 'border-2 border-black bg-white rounded-none',
      related: 'text-black uppercase',
      secondary: 'border-2 border-black bg-white text-black rounded-none shadow-[4px_4px_0_#111]',
      primary: 'border-2 border-black bg-[#ff4d00] text-white rounded-none shadow-[4px_4px_0_#111]',
    },
    'soft-elegant': {
      shell: 'mx-auto max-w-6xl px-4 pb-14 pt-6 sm:px-8 sm:pt-10',
      grid: 'grid gap-7 md:grid-cols-2 md:gap-12',
      image: 'aspect-[4/5] overflow-hidden rounded-[34px] bg-[#eadbd5] shadow-[0_24px_60px_rgba(95,70,74,0.10)]',
      title: 'text-[#4a3337]',
      priceBox: 'rounded-2xl bg-[#fffaf7]',
      chip: 'border border-[#decac5] bg-[#fffaf7] text-[#76565d] rounded-full',
      qty: 'border border-[#decac5] bg-[#fffaf7] rounded-2xl',
      related: 'text-[#4a3337]',
      secondary: 'border border-[#b56b7a] bg-[#fffaf7] text-[#8d5360] rounded-2xl',
      primary: 'bg-[#b56b7a] text-white rounded-2xl',
    },
    'grid-catalog': {
      shell: 'mx-auto max-w-[1180px] px-3 pb-12 pt-4 sm:px-6 sm:pt-6',
      grid: 'grid gap-5 rounded-xl border border-[#dbe2ea] bg-white p-3 sm:p-5 md:grid-cols-[0.8fr_1.2fr] md:gap-8',
      image: 'aspect-square overflow-hidden rounded-lg bg-[#f3f6fa]',
      title: 'text-[#111827]',
      priceBox: 'rounded-lg border border-[#dbe2ea] bg-[#f8fafc]',
      chip: 'border border-[#dbe2ea] bg-white text-[#475467] rounded-md',
      qty: 'border border-[#dbe2ea] bg-white rounded-md',
      related: 'text-[#111827]',
      secondary: 'border border-[#0f6fff] bg-white text-[#0f6fff] rounded-md',
      primary: 'bg-[#0f6fff] text-white rounded-md',
    },
    'dark-modern': {
      shell: 'mx-auto max-w-[1320px] px-4 pb-14 pt-6 sm:px-8 sm:pt-10',
      grid: 'grid gap-7 md:grid-cols-[1.05fr_0.95fr] md:gap-12',
      image: 'aspect-[4/5] overflow-hidden rounded-[24px] border border-[#2a2a30] bg-[#0f0f12] shadow-[0_30px_80px_rgba(0,0,0,0.30)]',
      title: 'text-[#f8fafc]',
      priceBox: 'rounded-xl border border-[#2a2a30] bg-[#151518]',
      chip: 'border border-[#2a2a30] bg-[#151518] text-[#c9c9d0] rounded-lg',
      qty: 'border border-[#2a2a30] bg-[#151518] text-[#f8fafc] rounded-xl',
      related: 'text-[#f8fafc]',
      secondary: 'border border-[#73fbd3]/60 bg-[#151518] text-[#73fbd3] rounded-xl',
      primary: 'bg-[#73fbd3] text-[#08110e] rounded-xl',
    },
  }[theme.presetId];

  return (
    <div className={detail.shell}>
      <button onClick={() => nav(-1)} className="mb-4 inline-flex min-h-10 items-center gap-1.5 px-1 text-sm font-semibold transition" style={{color: visual.muted}}><ArrowLeft className="h-4 w-4" /> နောက်သို့</button>
      <div className={detail.grid}>
        <div>
          <div className={`relative ${detail.image}`}>
            {product.images[active] ? <img src={product.images[active]} alt={product.name} className="h-full w-full object-contain p-2" /> : <div className="grid h-full w-full place-items-center text-ink-soft"><ImageOff className="h-10 w-10" /></div>}
            {product.images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setActive((index) => (index - 1 + product.images.length) % product.images.length)}
                  aria-label="ယခင်ပုံ"
                  className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border shadow-sm"
                  style={{backgroundColor: visual.surface, borderColor: visual.border, color: visual.text}}>
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setActive((index) => (index + 1) % product.images.length)}
                  aria-label="နောက်ပုံ"
                  className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border shadow-sm"
                  style={{backgroundColor: visual.surface, borderColor: visual.border, color: visual.text}}>
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
          {product.images.length > 1 && <div className="mt-3 flex gap-2 overflow-x-auto pb-1">{product.images.map((im, i) => <button key={i} onClick={() => setActive(i)} className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-[#faf8f9] ${i === active ? 'border-[#e11d48]' : 'border-transparent'}`}><img src={im} alt="" className="h-full w-full object-contain p-1" /></button>)}</div>}
        </div>

        <div className="md:pt-2">
          <h1 className={`my font-display text-2xl font-bold leading-tight tracking-[-0.03em] sm:text-4xl ${detail.title}`}>{product.name}</h1>
          <div className={`mt-3 flex items-center gap-3 px-4 py-3 ${detail.priceBox}`}><span className="font-sans text-xl font-bold sm:text-2xl" style={{color: visual.accent}}>{ks(price)}</span>{hasPromo && <span className="text-sm line-through opacity-55 sm:text-base">{ks(product.price)}</span>}</div>

          <div className="mt-5">
            <p className="my mb-2 text-sm font-semibold" style={{color: visual.text}}>အရေအတွက်</p>
            <div className={`flex w-fit items-center ${detail.qty}`}><button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="အရေအတွက်လျှော့ရန်" className="grid h-11 w-11 place-items-center" style={{color: visual.accent}}><Minus className="h-4 w-4" /></button><span className="w-8 text-center font-semibold">{qty}</span><button onClick={() => setQty((q) => Math.min(Math.max(product.stock, 1), q + 1))} aria-label="အရေအတွက်တိုးရန်" className="grid h-11 w-11 place-items-center" style={{color: visual.accent}}><Plus className="h-4 w-4" /></button></div>
          </div>

          {product.description && (
            <div className="mt-5">
              <h2 className="my text-sm font-semibold" style={{color: visual.text}}>ပစ္စည်းအကြောင်း</h2>
              <p className="my mt-2 whitespace-pre-line text-sm leading-relaxed" style={{color: visual.muted}}>{product.description}</p>
            </div>
          )}

          <div className="my mt-5 flex flex-wrap items-center gap-3 text-sm">
            {product.category && <span className={`px-3 py-2 ${detail.chip}`}>{product.category}</span>}
            {product.size && <span className={`px-3 py-2 ${detail.chip}`}>Size — {product.size}</span>}
            {product.color && <span className={`inline-flex items-center gap-2 px-3 py-2 ${detail.chip}`}><span className="h-4 w-4 rounded-full border border-black/10 shadow-inner" style={{backgroundColor: colorHex ?? '#d1d5db'}} aria-hidden="true" /><span>{product.color}</span></span>}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button disabled={!product.inStock} onClick={doAdd} className={`inline-flex min-h-12 flex-1 items-center justify-center gap-2 px-6 py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${detail.secondary}`}>{added ? <><Check className="h-4 w-4" /> ထည့်ပြီးပါပြီ</> : <><ShoppingBag className="h-4 w-4" /> {theme.product.addToCartLabel}</>}</button>
            <button disabled={!product.inStock} onClick={buyNow} className={`min-h-12 flex-1 px-6 py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${detail.primary}`}>{theme.product.buyNowLabel}</button>
          </div>
        </div>
      </div>

      {theme.product.relatedEnabled && related.length > 0 && (
        <section className="mt-14 overflow-hidden">
          <h2 className={`mb-5 font-display text-xl font-bold sm:text-2xl ${detail.related}`}>ဆင်တူ ပစ္စည်းများ</h2>
          <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-6 sm:mx-0 sm:px-0">
            {related.map((p) => <ProductCard key={p.id} product={p} variant={theme.presetId} className="w-[72vw] max-w-[280px] shrink-0 snap-start sm:w-[260px]" />)}
          </div>
        </section>
      )}

    </div>
  );
}
