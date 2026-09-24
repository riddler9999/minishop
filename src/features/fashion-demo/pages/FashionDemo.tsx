import {useEffect, useMemo, useState} from 'react';
import {ArrowLeft, Heart, ImageOff, Minus, Plus, Search, ShoppingBag, Trash2} from 'lucide-react';
import {Route, Routes, useNavigate, useParams} from 'react-router-dom';
import {api} from '@/data/dataSource';
import type {Product} from '@/domain/product';
import {useCart} from '@/features/cart/state';
import Checkout from '@/features/checkout/pages/Checkout';
import {setShopSlug} from '@/features/tenancy/shopContext';
import {ks} from '@/shared/lib/format';

const PINK = '#f43f70';

function FashionHeader() {
  const nav = useNavigate();
  const {count} = useCart();
  return (
    <header className="sticky top-0 z-40 border-b border-[#f7e7ed] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <button type="button" onClick={() => nav('/fashion-demo')} className="text-left" aria-label="Fashion Demo home">
          <span className="block text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#c92b59]">MiniShop</span>
          <span className="font-display text-base font-black tracking-[-0.03em] text-slate-950">FASHION</span>
        </button>
        <div className="flex items-center gap-2">
          <button type="button" className="grid h-11 w-11 place-items-center rounded-full bg-[#fff6f9] text-[#8f5267]" aria-label="Favorites">
            <Heart className="h-5 w-5" strokeWidth={1.8} />
          </button>
          <button type="button" onClick={() => nav('/fashion-demo/cart')} className="relative grid h-11 w-11 place-items-center rounded-full bg-[#fff6f9] text-[#8f5267]" aria-label="Open cart">
            <ShoppingBag className="h-5 w-5" strokeWidth={1.8} />
            {count > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-[#f43f70] px-1 text-[10px] font-bold text-white">{count}</span>}
          </button>
        </div>
      </div>
    </header>
  );
}

function FashionShell({children}: {children: React.ReactNode}) {
  return <div className="min-h-screen bg-[#fff9fb] text-slate-950"><FashionHeader />{children}</div>;
}

function DemoProductCard({product}: {product: Product}) {
  const nav = useNavigate();
  const {add} = useCart();
  const price = product.isPromotion && product.promoPrice ? product.promoPrice : product.price;
  const oldPrice = product.isPromotion && product.promoPrice ? product.price : null;

  const buyNow = () => {
    add(product);
    nav('/fashion-demo/checkout');
  };

  return (
    <article className="min-w-0 overflow-hidden rounded-[18px] bg-white shadow-[0_10px_28px_rgba(88,52,64,0.09)]">
      <button type="button" onClick={() => nav(`/fashion-demo/products/${encodeURIComponent(product.id)}`)} className="relative block w-full overflow-hidden bg-[#f8eef3] text-left">
        <div className="aspect-[0.88] w-full">
          {product.image ? <img src={product.image} alt={product.name} loading="lazy" className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center text-slate-400"><ImageOff className="h-7 w-7" /></div>}
        </div>
        {oldPrice && <span className="absolute left-2 top-2 rounded-full bg-[#f43f70] px-2 py-1 text-[9px] font-extrabold text-white">SALE</span>}
        <span className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/95 text-[#8c5669] shadow-sm"><Heart className="h-4 w-4" /></span>
      </button>
      <div className="p-2.5 sm:p-3">
        <button type="button" onClick={() => nav(`/fashion-demo/products/${encodeURIComponent(product.id)}`)} className="my line-clamp-2 min-h-[36px] text-left text-[12px] font-semibold leading-[1.45] text-slate-950 sm:text-sm">{product.name}</button>
        <div className="mt-1 flex min-h-10 flex-col justify-end">
          <span className="font-sans text-[13px] font-extrabold text-[#f43f70] sm:text-sm">{ks(price)}</span>
          {oldPrice && <span className="text-[10px] text-slate-400 line-through">{ks(oldPrice)}</span>}
        </div>
        <div className="mt-2 grid gap-1.5">
          <button type="button" disabled={!product.inStock} onClick={() => add(product)} className="min-h-9 rounded-[11px] border border-[#f43f70] bg-white px-2 text-[10px] font-bold text-[#e33565] transition hover:bg-[#fff1f6] disabled:border-slate-200 disabled:text-slate-400">
            ခြင်းထဲထည့်မည်
          </button>
          <button type="button" disabled={!product.inStock} onClick={buyNow} className="min-h-9 rounded-[11px] bg-[#f43f70] px-2 text-[10px] font-bold text-white shadow-[0_7px_18px_rgba(244,63,112,0.20)] transition hover:bg-[#d92f61] disabled:bg-slate-200 disabled:text-slate-400">
            ဝယ်မည်
          </button>
        </div>
      </div>
    </article>
  );
}

function FashionHome() {
  const nav = useNavigate();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    Promise.all([api.products({scope: 'active', limit: 20}), api.categories()])
      .then(([productResult, categoryResult]) => {
        if (!alive) return;
        setProducts(productResult.products);
        setCategories(categoryResult.categories);
      })
      .catch((e: unknown) => {
        if (alive) setError(e instanceof Error ? e.message : 'ပစ္စည်းများကို ယခုလောလောဆယ် ဆွဲယူ၍မရပါ။');
      });
    return () => { alive = false; };
  }, []);

  const visible = useMemo(() => {
    const list = products ?? [];
    const q = query.trim().toLowerCase();
    return list.filter((product) => {
      const categoryOk = activeCategory === 'All' || product.category === activeCategory;
      const queryOk = !q || `${product.name} ${product.category ?? ''}`.toLowerCase().includes(q);
      return categoryOk && queryOk;
    });
  }, [products, activeCategory, query]);

  const heroProduct = products?.find((p) => p.image) ?? null;

  return (
    <FashionShell>
      <main className="mx-auto max-w-6xl px-4 pb-12 pt-4 sm:px-6 sm:pt-6">
        <form onSubmit={(e) => e.preventDefault()} className="flex min-h-12 items-center gap-3 rounded-[15px] border border-[#f1dde5] bg-white px-4 shadow-[0_4px_18px_rgba(88,52,64,0.04)]">
          <Search className="h-5 w-5 shrink-0 text-[#a47a89]" strokeWidth={1.8} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Fashion products search" placeholder="အင်္ကျီ၊ ဂါဝန်၊ စကတ် ရှာရန်…" className="my min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#ad8f9a]" />
        </form>

        <section className="relative mt-4 min-h-[168px] overflow-hidden rounded-[24px] bg-[#f8dce6] shadow-[0_12px_32px_rgba(88,52,64,0.08)] sm:min-h-[220px]">
          {heroProduct?.image && <img src={heroProduct.image} alt="" className="absolute inset-y-0 right-0 h-full w-[52%] object-cover opacity-95" />}
          <div className="absolute inset-0 bg-gradient-to-r from-[#fff4f8] via-[#fff4f8]/90 to-transparent" />
          <div className="relative z-10 flex min-h-[168px] max-w-[68%] flex-col justify-center px-5 py-6 sm:min-h-[220px] sm:max-w-[50%] sm:px-8">
            <span className="text-[9px] font-black uppercase tracking-[0.24em] text-[#c92b59]">New collection</span>
            <h1 className="mt-1.5 font-display text-[28px] font-black leading-[1.03] tracking-[-0.045em] text-[#251820] sm:text-4xl">Soft looks.<br />Big mood.</h1>
            <p className="my mt-2 text-[11px] leading-5 text-[#755963] sm:text-sm">နေ့စဉ်ဝတ်စုံအတွက် သက်တောင့်သက်သာနဲ့ ခေတ်မီတဲ့ fashion picks.</p>
            <button type="button" onClick={() => nav('/fashion-demo')} className="mt-3 min-h-10 w-fit rounded-full bg-[#f43f70] px-4 text-[11px] font-bold text-white shadow-[0_8px_20px_rgba(244,63,112,0.24)]">Shop New</button>
          </div>
        </section>

        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
          {['All', ...categories].map((category) => (
            <button key={category} type="button" onClick={() => setActiveCategory(category)} className={`min-h-10 shrink-0 rounded-full border px-4 text-[11px] font-semibold transition ${activeCategory === category ? 'border-[#f43f70] bg-[#f43f70] text-white' : 'border-[#f5dce5] bg-white text-[#7e5867]'}`}>
              {category}
            </button>
          ))}
        </div>

        <div className="mt-5 flex items-end justify-between">
          <div><h2 className="font-display text-xl font-black tracking-[-0.03em]">Popular picks</h2><p className="my mt-1 text-xs text-slate-500">Fashion Demo Collection</p></div>
          <span className="text-xs font-bold text-[#f43f70]">View all</span>
        </div>

        {error && <div className="my mt-4 rounded-2xl border border-rose-100 bg-white p-4 text-sm text-slate-600">{error}</div>}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
          {products === null && !error
            ? Array.from({length: 6}).map((_, index) => <div key={index} className="overflow-hidden rounded-[18px] bg-white shadow-sm"><div className="aspect-[0.88] animate-pulse bg-[#f8eaf0]" /><div className="space-y-2 p-3"><div className="h-3 w-4/5 animate-pulse rounded bg-rose-50" /><div className="h-3 w-2/5 animate-pulse rounded bg-rose-50" /><div className="h-9 animate-pulse rounded-xl bg-rose-50" /><div className="h-9 animate-pulse rounded-xl bg-rose-100" /></div></div>)
            : visible.slice(0, 12).map((product) => <DemoProductCard key={product.id} product={product} />)}
        </div>
        {products && visible.length === 0 && <div className="my mt-5 rounded-2xl border border-[#f2e1e8] bg-white px-5 py-10 text-center text-sm text-slate-500">ဒီ filter နဲ့ကိုက်ညီတဲ့ fashion item မရှိသေးပါ။</div>}
      </main>
    </FashionShell>
  );
}

function FashionProductDetail() {
  const {id} = useParams();
  const nav = useNavigate();
  const {add} = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState('');
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    let alive = true;
    setProduct(null);
    setError('');
    api.product(id!)
      .then((result) => { if (alive) setProduct(result.product); })
      .catch((e: unknown) => { if (alive) setError(e instanceof Error ? e.message : 'ပစ္စည်း ရှာမတွေ့ပါ'); });
    return () => { alive = false; };
  }, [id]);

  if (error) return <FashionShell><div className="mx-auto max-w-xl px-4 py-20 text-center text-sm text-slate-500">{error}</div></FashionShell>;
  if (!product) return <FashionShell><div className="mx-auto max-w-5xl animate-pulse px-4 py-5"><div className="aspect-[0.95] max-h-[520px] rounded-[24px] bg-[#f8eaf0]" /></div></FashionShell>;

  const price = product.isPromotion && product.promoPrice ? product.promoPrice : product.price;
  const oldPrice = product.isPromotion && product.promoPrice ? product.price : null;
  const addCurrent = () => add(product, qty);

  return (
    <FashionShell>
      <main className="mx-auto max-w-5xl px-4 pb-12 pt-4 sm:px-6">
        <button type="button" onClick={() => nav(-1)} className="mb-3 inline-flex min-h-11 items-center gap-2 rounded-full px-1 text-sm font-semibold text-[#745765]"><ArrowLeft className="h-4 w-4" /> နောက်သို့</button>
        <div className="grid gap-5 md:grid-cols-2 md:gap-8">
          <div>
            <div className="relative aspect-[0.9] overflow-hidden rounded-[26px] bg-[#f8eef3] shadow-[0_16px_40px_rgba(88,52,64,0.10)]">
              {product.images[activeImage] ? <img src={product.images[activeImage]} alt={product.name} className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center text-slate-400"><ImageOff className="h-10 w-10" /></div>}
              <button type="button" aria-label="Favorite" className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full bg-white/95 text-[#f43f70] shadow-sm"><Heart className="h-5 w-5" /></button>
            </div>
            {product.images.length > 1 && <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">{product.images.map((src, index) => <button type="button" key={src} onClick={() => setActiveImage(index)} className={`h-16 w-14 shrink-0 overflow-hidden rounded-xl border-2 ${activeImage === index ? 'border-[#f43f70]' : 'border-transparent'}`}><img src={src} alt="" className="h-full w-full object-cover" /></button>)}</div>}
          </div>
          <div className="md:pt-3">
            {product.category && <span className="inline-flex rounded-full bg-[#fff0f5] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#c92b59]">{product.category}</span>}
            <h1 className="my mt-3 font-display text-[26px] font-black leading-[1.12] tracking-[-0.04em] text-[#21171c] sm:text-4xl">{product.name}</h1>
            <div className="mt-3 flex items-center gap-2"><span className="text-2xl font-black text-[#f43f70]">{ks(price)}</span>{oldPrice && <span className="text-sm text-slate-400 line-through">{ks(oldPrice)}</span>}</div>
            <div className="my mt-3 flex items-center gap-2 text-xs text-slate-500"><span className="text-[#f1a13e]">★★★★★</span><span>4.8 · Demo reviews</span></div>
            {product.description && <p className="my mt-5 whitespace-pre-line text-sm leading-7 text-[#745f68]">{product.description}</p>}
            {(product.size || product.color) && <div className="my mt-5 flex flex-wrap gap-2">{product.size && <span className="rounded-xl border border-[#f0dbe3] bg-white px-3 py-2 text-xs font-semibold">Size · {product.size}</span>}{product.color && <span className="rounded-xl border border-[#f0dbe3] bg-white px-3 py-2 text-xs font-semibold">Color · {product.color}</span>}</div>}
            <div className="mt-5 inline-flex min-h-11 items-center rounded-xl border border-[#f0dbe3] bg-white">
              <button type="button" onClick={() => setQty((v) => Math.max(1, v - 1))} className="grid h-11 w-11 place-items-center text-[#d73161]" aria-label="Decrease quantity"><Minus className="h-4 w-4" /></button>
              <span className="w-8 text-center text-sm font-bold">{qty}</span>
              <button type="button" onClick={() => setQty((v) => Math.min(Math.max(product.stock, 1), v + 1))} className="grid h-11 w-11 place-items-center text-[#d73161]" aria-label="Increase quantity"><Plus className="h-4 w-4" /></button>
            </div>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <button type="button" disabled={!product.inStock} onClick={addCurrent} className="min-h-12 rounded-[14px] border border-[#f43f70] bg-white px-4 text-sm font-bold text-[#e33565] hover:bg-[#fff1f6] disabled:opacity-50">ခြင်းထဲထည့်မည်</button>
              <button type="button" disabled={!product.inStock} onClick={() => { addCurrent(); nav('/fashion-demo/checkout'); }} className="min-h-12 rounded-[14px] bg-[#f43f70] px-4 text-sm font-bold text-white shadow-[0_10px_24px_rgba(244,63,112,0.22)] hover:bg-[#d92f61] disabled:opacity-50">ဝယ်မည်</button>
            </div>
          </div>
        </div>
      </main>
    </FashionShell>
  );
}

function FashionCart() {
  const nav = useNavigate();
  const {items, subtotal, setQty, remove} = useCart();
  return (
    <FashionShell>
      <main className="mx-auto max-w-3xl px-4 pb-28 pt-5 sm:px-6">
        <h1 className="font-display text-2xl font-black tracking-[-0.04em]">Shopping Bag</h1>
        <p className="my mt-1 text-xs text-slate-500">{items.length} item{items.length === 1 ? '' : 's'}</p>
        {items.length === 0 ? (
          <div className="mt-8 rounded-[22px] bg-white px-6 py-16 text-center shadow-sm"><ShoppingBag className="mx-auto h-8 w-8 text-[#f43f70]" /><p className="my mt-3 text-sm text-slate-500">ခြင်းထဲမှာ ပစ္စည်းမရှိသေးပါ။</p><button type="button" onClick={() => nav('/fashion-demo')} className="mt-4 min-h-11 rounded-full bg-[#f43f70] px-5 text-sm font-bold text-white">Shop Fashion</button></div>
        ) : (
          <>
            <div className="mt-5 space-y-3">
              {items.map((item) => (
                <article key={item.id} className="flex gap-3 rounded-[18px] bg-white p-2.5 shadow-[0_8px_24px_rgba(88,52,64,0.07)]">
                  <div className="h-24 w-20 shrink-0 overflow-hidden rounded-[14px] bg-[#f8eef3]">{item.image ? <img src={item.image} alt={item.name} className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center"><ImageOff className="h-5 w-5 text-slate-400" /></div>}</div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start gap-2"><p className="my line-clamp-2 flex-1 text-sm font-bold text-slate-950">{item.name}</p><button type="button" onClick={() => remove(item.id)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-400 hover:bg-rose-50 hover:text-[#e33565]" aria-label="Remove item"><Trash2 className="h-4 w-4" /></button></div>
                    <span className="text-sm font-extrabold text-[#f43f70]">{ks(item.price)}</span>
                    <div className="mt-auto inline-flex w-fit items-center rounded-xl border border-[#f0dbe3] bg-[#fff9fb]">
                      <button type="button" onClick={() => setQty(item.id, item.qty - 1)} className="grid h-9 w-9 place-items-center text-[#d73161]"><Minus className="h-3.5 w-3.5" /></button>
                      <span className="w-7 text-center text-xs font-bold">{item.qty}</span>
                      <button type="button" onClick={() => setQty(item.id, item.qty + 1)} className="grid h-9 w-9 place-items-center text-[#d73161]"><Plus className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <section className="mt-5 rounded-[20px] bg-white p-4 shadow-[0_8px_24px_rgba(88,52,64,0.07)]">
              <div className="flex items-center justify-between text-sm text-slate-500"><span>Subtotal</span><span className="font-semibold text-slate-950">{ks(subtotal)}</span></div>
              <div className="mt-3 flex items-center justify-between border-t border-[#f4e5eb] pt-3"><span className="font-bold">Total</span><span className="text-xl font-black text-[#f43f70]">{ks(subtotal)}</span></div>
            </section>
            <button type="button" onClick={() => nav('/fashion-demo/checkout')} className="mt-4 min-h-14 w-full rounded-[15px] bg-[#f43f70] px-5 text-sm font-black text-white shadow-[0_12px_28px_rgba(244,63,112,0.24)]">Continue to Checkout</button>
          </>
        )}
      </main>
    </FashionShell>
  );
}

function FashionCheckout() {
  return <FashionShell><div className="[&>div]:pt-5"><Checkout /></div></FashionShell>;
}

export default function FashionDemo() {
  setShopSlug(null);
  return (
    <Routes>
      <Route index element={<FashionHome />} />
      <Route path="products/:id" element={<FashionProductDetail />} />
      <Route path="cart" element={<FashionCart />} />
      <Route path="checkout" element={<FashionCheckout />} />
      <Route path="*" element={<FashionHome />} />
    </Routes>
  );
}

export const FASHION_DEMO_PRIMARY = PINK;
