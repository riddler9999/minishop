import {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {ArrowLeft, Check, ImageOff, Minus, Plus, ShoppingBag} from 'lucide-react';
import {api} from '@/data/dataSource';
import type {Product} from '@/domain/product';
import {useCart} from '@/features/cart/state';
import {ks} from '@/shared/lib/format';
import ProductCard from '@/features/catalog/components/ProductCard';
import {getStorefrontTheme} from '@/features/tenancy/shopResolver';
import {ShopLink, useShopNavigate, useShopSlugParam} from '@/features/tenancy/ShopLink';

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

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <button onClick={() => nav(-1)} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-brand-700"><ArrowLeft className="h-4 w-4" /> နောက်သို့</button>
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <div className="aspect-4/5 overflow-hidden rounded-2xl border border-cream-200 bg-cream-100">
            {product.images[active] ? <img src={product.images[active]} alt={product.name} className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center text-ink-soft"><ImageOff className="h-10 w-10" /></div>}
          </div>
          {product.images.length > 1 && <div className="mt-3 flex gap-2 overflow-x-auto pb-1">{product.images.map((im, i) => <button key={i} onClick={() => setActive(i)} className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${i === active ? 'border-brand-600' : 'border-transparent'}`}><img src={im} alt="" className="h-full w-full object-cover" /></button>)}</div>}
        </div>

        <div>
          {product.category && <p className="text-sm font-medium text-ink-soft">{product.category}</p>}
          <h1 className="my mt-1 font-display text-3xl font-bold leading-tight text-brand-800 sm:text-4xl">{product.name}</h1>
          <div className="mt-3 flex items-center gap-3"><span className="font-sans text-xl font-bold text-brand-700 sm:text-2xl">{ks(price)}</span>{hasPromo && <span className="text-sm text-ink-soft line-through sm:text-base">{ks(product.price)}</span>}</div>

          <div className="my mt-5 flex flex-wrap items-center gap-3 text-sm">
            {product.size && <span className="rounded-full bg-cream-100 px-3 py-1.5">Size — {product.size}</span>}
            {product.color && <span className="inline-flex items-center gap-2 rounded-full border border-cream-200 bg-white px-3 py-1.5"><span className="h-4 w-4 rounded-full border border-black/10 shadow-inner" style={{backgroundColor: colorHex ?? '#d1d5db'}} aria-hidden="true" /><span>{product.color}</span></span>}
          </div>
          {product.description && <p className="my mt-5 whitespace-pre-line text-sm leading-relaxed text-ink-soft">{product.description}</p>}

          <div className="mt-7 flex items-center"><div className="flex items-center rounded-full border border-cream-200 bg-white"><button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="အရေအတွက်လျှော့ရန်" className="grid h-11 w-11 place-items-center text-brand-700"><Minus className="h-4 w-4" /></button><span className="w-8 text-center font-semibold">{qty}</span><button onClick={() => setQty((q) => Math.min(Math.max(product.stock, 1), q + 1))} aria-label="အရေအတွက်တိုးရန်" className="grid h-11 w-11 place-items-center text-brand-700"><Plus className="h-4 w-4" /></button></div></div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button disabled={!product.inStock} onClick={doAdd} className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-brand-700 bg-white px-6 py-3 font-semibold text-brand-700 transition hover:bg-cream-100 disabled:cursor-not-allowed disabled:opacity-50">{added ? <><Check className="h-4 w-4" /> ထည့်ပြီးပါပြီ</> : <><ShoppingBag className="h-4 w-4" /> {theme.product.addToCartLabel}</>}</button>
            <button disabled={!product.inStock} onClick={buyNow} className="flex-1 rounded-full bg-brand-700 px-6 py-3 font-semibold text-cream-100 transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50">{theme.product.buyNowLabel}</button>
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
