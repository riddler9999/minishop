import {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {ArrowLeft, Check, Heart, ImageOff, Minus, MoreHorizontal, Plus, ShoppingBag} from 'lucide-react';
import {api} from '@/data/dataSource';
import type {Product} from '@/domain/product';
import {useCart} from '@/features/cart/state';
import {ks} from '@/shared/lib/format';
import ProductCard from '@/features/catalog/components/ProductCard';
import {getStorefrontTheme} from '@/features/tenancy/shopResolver';
import {ShopLink, useShopNavigate, useShopSlugParam} from '@/features/tenancy/ShopLink';
import {useDemoStore} from '@/features/demo/DemoStoreContext';

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

  if (err) return <div className="mx-auto max-w-3xl px-4 py-16 text-center"><p className="my text-ink-soft">{err}</p><ShopLink to="/products" className="mt-4 inline-block font-semibold text-brand-700">← ပစ္စည်းများသို့</ShopLink></div>;
  if (!product) return <div className="mx-auto grid max-w-5xl gap-8 px-4 py-8 md:grid-cols-2"><div className="aspect-4/5 animate-pulse rounded-2xl bg-cream-100" /><div className="space-y-4"><div className="h-6 w-2/3 animate-pulse rounded bg-cream-100" /><div className="h-8 w-1/3 animate-pulse rounded bg-cream-100" /></div></div>;

  const price = product.isPromotion && product.promoPrice ? product.promoPrice : product.price;
  const hasPromo = product.isPromotion && product.promoPrice != null;
  const colorHex = product.color ? COLOR_MAP[product.color.trim().toLowerCase()] ?? '#d1d5db' : null;
  const doAdd = () => {add(product, qty); setAdded(true); setTimeout(() => setAdded(false), 1500);};
  const buyNow = () => {add(product, qty); shopNav('/checkout');};

  if (isDemo) {
    return (
      <div className="min-h-screen bg-[#fff1e6] pb-28">
        <div className="mx-auto max-w-[430px]">
          <div className="relative min-h-[455px] overflow-hidden px-4 pt-4">
            <div className="relative z-20 flex items-center justify-between">
              <button
                onClick={() => nav(-1)}
                aria-label="Back"
                className="grid h-11 w-11 place-items-center rounded-full bg-white/80 text-[#25140b] shadow-[0_8px_22px_rgba(151,63,10,0.10)] backdrop-blur">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex gap-2">
                <span aria-hidden="true" className="grid h-11 w-11 place-items-center rounded-full bg-[#25140b] text-white">
                  <Heart className="h-5 w-5" />
                </span>
                <span aria-hidden="true" className="grid h-11 w-11 place-items-center rounded-full bg-white/80 text-[#7a3210] backdrop-blur">
                  <MoreHorizontal className="h-5 w-5" />
                </span>
              </div>
            </div>

            <div className="absolute inset-x-4 bottom-5 top-16 overflow-hidden rounded-[34px] bg-[radial-gradient(circle_at_50%_42%,#fffaf4_0%,#ffe3c7_58%,#ffc88d_100%)]">
              {product.images[active] ? (
                <img src={product.images[active]} alt={product.name} className="h-full w-full object-contain p-7 drop-shadow-[0_30px_28px_rgba(116,43,4,0.22)]" />
              ) : (
                <div className="grid h-full w-full place-items-center text-[#f05a00]"><ImageOff className="h-10 w-10" /></div>
              )}
            </div>
          </div>

          {product.images.length > 1 && (
            <div className="no-scrollbar flex justify-center gap-2 overflow-x-auto px-4 pb-3">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setActive(index)}
                  className={`h-2.5 w-2.5 shrink-0 rounded-full transition ${index === active ? 'bg-[#f05a00]' : 'bg-white/85'}`}
                  aria-label={`Image ${index + 1}`}>
                  <span className="sr-only">{image}</span>
                </button>
              ))}
            </div>
          )}

          {(product.color || product.size) && (
            <div className="flex flex-wrap items-center gap-3 px-4 pb-4 pt-2">
              {product.color && (
                <span className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/80 px-4 text-sm font-semibold text-[#6f5140]">
                  <span className="h-5 w-5 rounded-full border border-black/10" style={{backgroundColor: colorHex ?? '#d1d5db'}} />
                  {product.color}
                </span>
              )}
              {product.size && <span className="inline-flex min-h-11 items-center rounded-full bg-white/80 px-4 text-sm font-semibold text-[#6f5140]">Size · {product.size}</span>}
            </div>
          )}

          <div className="rounded-t-[34px] bg-[#fffaf5] px-5 pb-8 pt-6 shadow-[0_-18px_42px_rgba(151,63,10,0.10)]">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#f05a00]">Signature fragrance</p>
            <h1 className="mt-1 font-serif text-[31px] font-black leading-tight tracking-[-0.03em] text-[#25140b]">{product.name}</h1>
            {product.description && <p className="my mt-3 line-clamp-3 text-sm leading-6 text-[#80695b]">{product.description}</p>}

            <div className="mt-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#a07c65]">Price</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-sans text-[27px] font-black tracking-[-0.03em] text-[#25140b]">{ks(price)}</span>
                  {hasPromo && <span className="text-xs text-[#a68b7a] line-through">{ks(product.price)}</span>}
                </div>
              </div>
              <div className="flex items-center rounded-[16px] border border-[#f3d5bd] bg-white">
                <button onClick={() => setQty((value) => Math.max(1, value - 1))} aria-label="Decrease quantity" className="grid h-11 w-11 place-items-center text-[#f05a00]">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center text-sm font-bold text-[#25140b]">{qty}</span>
                <button onClick={() => setQty((value) => Math.min(Math.max(product.stock, 1), value + 1))} aria-label="Increase quantity" className="grid h-11 w-11 place-items-center text-[#f05a00]">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                disabled={!product.inStock}
                onClick={doAdd}
                className="inline-flex min-h-13 items-center justify-center gap-2 rounded-[18px] border border-[#f05a00] bg-white px-4 py-3 text-sm font-bold text-[#f05a00] transition hover:bg-[#fff2e7] disabled:cursor-not-allowed disabled:opacity-50">
                {added ? <><Check className="h-4 w-4" /> Added</> : <><ShoppingBag className="h-4 w-4" /> Add to bag</>}
              </button>
              <button
                disabled={!product.inStock}
                onClick={buyNow}
                className="min-h-13 rounded-[18px] bg-[#f05a00] px-4 py-3 text-sm font-bold text-white shadow-[0_12px_28px_rgba(240,90,0,0.28)] transition hover:bg-[#d94700] disabled:cursor-not-allowed disabled:opacity-50">
                Buy now
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`mx-auto max-w-6xl px-4 pb-10 pt-4 sm:px-6 sm:pt-6 ${isDemo ? 'min-h-screen bg-[#eee6ff]' : ''}`}>
      <button onClick={() => nav(-1)} className={`mb-4 inline-flex min-h-10 items-center gap-1.5 rounded-full px-1 text-sm font-semibold transition ${isDemo ? 'text-[#59466f] hover:text-[#6d28d9]' : 'text-slate-500 hover:text-[#e11d48]'}`}><ArrowLeft className="h-4 w-4" /> နောက်သို့</button>
      <div className="grid gap-6 md:grid-cols-[1.05fr_0.95fr] md:gap-10">
        <div>
          <div className={`aspect-[4/4.7] overflow-hidden sm:aspect-4/5 ${isDemo ? 'rounded-[34px] bg-[#cdb7f7] shadow-[0_24px_60px_rgba(76,29,149,0.20)]' : 'rounded-[28px] bg-[#f7f4f5] shadow-[0_18px_50px_rgba(88,52,64,0.10)]'}`}>
            {product.images[active] ? <img src={product.images[active]} alt={product.name} className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center text-ink-soft"><ImageOff className="h-10 w-10" /></div>}
          </div>
          {product.images.length > 1 && <div className="mt-3 flex gap-2 overflow-x-auto pb-1">{product.images.map((im, i) => <button key={i} onClick={() => setActive(i)} className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-[#faf8f9] ${i === active ? 'border-[#e11d48]' : 'border-transparent'}`}><img src={im} alt="" className="h-full w-full object-cover" /></button>)}</div>}
        </div>

        <div className="md:pt-2">
          {product.category && <p className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${isDemo ? 'bg-white/70 text-[#5b21b6]' : 'bg-[#fff0f6] text-[#be123c]'}`}>{product.category}</p>}
          <h1 className={`my mt-3 font-display text-2xl font-bold leading-tight tracking-[-0.03em] sm:text-4xl ${isDemo ? 'text-[#21133f]' : 'text-slate-950'}`}>{product.name}</h1>
          <div className={`mt-3 flex items-center gap-3 rounded-2xl px-4 py-3 ${isDemo ? 'bg-white/70 shadow-[0_10px_28px_rgba(76,29,149,0.08)]' : 'bg-[#faf8f9]'}`}><span className={`font-sans text-xl font-bold sm:text-2xl ${isDemo ? 'text-[#3b176c]' : 'text-[#e11d48]'}`}>{ks(price)}</span>{hasPromo && <span className="text-sm text-ink-soft line-through sm:text-base">{ks(product.price)}</span>}</div>

          <div className="my mt-5 flex flex-wrap items-center gap-3 text-sm">
            {product.size && <span className="rounded-xl bg-[#faf8f9] px-3 py-2">Size — {product.size}</span>}
            {product.color && <span className="inline-flex items-center gap-2 rounded-xl border border-rose-100 bg-white px-3 py-2"><span className="h-4 w-4 rounded-full border border-black/10 shadow-inner" style={{backgroundColor: colorHex ?? '#d1d5db'}} aria-hidden="true" /><span>{product.color}</span></span>}
          </div>
          {product.description && <p className="my mt-5 whitespace-pre-line text-sm leading-relaxed text-ink-soft">{product.description}</p>}

          <div className="mt-7 flex items-center"><div className="flex items-center rounded-xl border border-rose-100 bg-white shadow-sm"><button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="အရေအတွက်လျှော့ရန်" className="grid h-11 w-11 place-items-center text-brand-700"><Minus className="h-4 w-4" /></button><span className="w-8 text-center font-semibold">{qty}</span><button onClick={() => setQty((q) => Math.min(Math.max(product.stock, 1), q + 1))} aria-label="အရေအတွက်တိုးရန်" className="grid h-11 w-11 place-items-center text-brand-700"><Plus className="h-4 w-4" /></button></div></div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button disabled={!product.inStock} onClick={doAdd} className={`inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${isDemo ? 'border border-[#6d28d9] text-[#6d28d9] hover:bg-[#f5efff]' : 'border border-[#e11d48] text-[#e11d48] hover:bg-[#fff0f6]'}`}>{added ? <><Check className="h-4 w-4" /> ထည့်ပြီးပါပြီ</> : <><ShoppingBag className="h-4 w-4" /> {theme.product.addToCartLabel}</>}</button>
            <button disabled={!product.inStock} onClick={buyNow} className={`min-h-12 flex-1 rounded-2xl px-6 py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${isDemo ? 'bg-[#6d28d9] shadow-[0_12px_30px_rgba(109,40,217,0.30)] hover:bg-[#5b21b6]' : 'bg-[#e11d48] shadow-[0_12px_30px_rgba(225,29,72,0.22)] hover:bg-[#be123c]'}`}>{theme.product.buyNowLabel}</button>
          </div>
        </div>
      </div>

      {theme.product.relatedEnabled && related.length > 0 && (
        <section className="mt-14 overflow-hidden">
          <h2 className="mb-5 font-display text-xl font-bold text-brand-800 sm:text-2xl">ဆင်တူ ပစ္စည်းများ</h2>
          <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-6 sm:mx-0 sm:px-0">
            {related.map((p) => <ProductCard key={p.id} product={p} variant="compact" className="w-[72vw] max-w-[280px] shrink-0 snap-start sm:w-[260px]" />)}
          </div>
        </section>
      )}
    </div>
  );
}
