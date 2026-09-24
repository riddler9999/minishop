import {useCallback, useEffect, useRef, useState} from 'react';
import {Search} from 'lucide-react';
import {useSearchParams} from 'react-router-dom';
import {api} from '@/data/dataSource';
import type {Product} from '@/domain/product';
import {ks} from '@/shared/lib/format';
import {useCart} from '@/features/cart/state';
import {useNavigate} from 'react-router-dom';

const PAGE_SIZE = 12;

function Card({product}: {product: Product}) {
  const nav = useNavigate();
  const {add} = useCart();
  const price = product.isPromotion && product.promoPrice ? product.promoPrice : product.price;
  return (
    <article className="overflow-hidden rounded-[18px] bg-white shadow-[0_10px_28px_rgba(88,52,64,0.09)]">
      <button type="button" onClick={() => nav(`/fashion-demo/products/${encodeURIComponent(product.id)}`)} className="block w-full bg-[#f8eef3] text-left">
        <div className="aspect-[0.88]">{product.image && <img src={product.image} alt={product.name} className="h-full w-full object-cover" />}</div>
      </button>
      <div className="p-3">
        <p className="my line-clamp-2 min-h-9 text-xs font-semibold">{product.name}</p>
        <p className="mt-1 text-sm font-extrabold text-[#f43f70]">{ks(price)}</p>
        <div className="mt-2 grid gap-1.5">
          <button type="button" onClick={() => add(product)} className="min-h-9 rounded-xl border border-[#f43f70] text-[10px] font-bold text-[#e33565]">ခြင်းထဲထည့်မည်</button>
          <button type="button" onClick={() => {add(product); nav('/fashion-demo/checkout');}} className="min-h-9 rounded-xl bg-[#f43f70] text-[10px] font-bold text-white">ဝယ်မည်</button>
        </div>
      </div>
    </article>
  );
}

export default function FashionProducts() {
  const [params, setParams] = useSearchParams();
  const category = params.get('category') ?? '';
  const q = params.get('q') ?? '';
  const [categories, setCategories] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestId = useRef(0);
  const [query, setQuery] = useState(q);

  useEffect(() => {
    let alive = true;
    api.categories().then((r) => alive && setCategories(r.categories)).catch(() => {});
    return () => {alive = false;};
  }, []);

  const fetchPage = useCallback(async (offset: number, replace: boolean) => {
    const id = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const r = await api.products({scope: 'active', category, q, limit: PAGE_SIZE, offset});
      if (id !== requestId.current) return;
      setTotal(r.total);
      setProducts((prev) => replace ? r.products : [...prev, ...r.products]);
    } catch (e: unknown) {
      if (id === requestId.current) setError(e instanceof Error ? e.message : 'ပစ္စည်းများ ဆွဲယူ၍မရပါ');
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [category, q]);

  useEffect(() => {fetchPage(0, true);}, [fetchPage]);

  const update = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key));
    setParams(next);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-12 pt-5 sm:px-6">
      <div className="flex items-end justify-between gap-4">
        <div><p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#c92b59]">Fashion collection</p><h1 className="mt-1 font-display text-2xl font-black tracking-[-0.04em]">Shop all</h1><p className="my mt-1 text-xs text-slate-500">{total} items</p></div>
      </div>
      <form onSubmit={(e) => {e.preventDefault(); update({q: query.trim()});}} className="mt-4 flex min-h-12 items-center gap-2 rounded-[15px] border border-[#f1dde5] bg-white px-4">
        <Search className="h-4 w-4 text-[#a47a89]" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ပစ္စည်းရှာရန်…" className="my min-w-0 flex-1 bg-transparent text-sm outline-none" />
      </form>
      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
        {['', ...categories].map((item) => <button type="button" key={item || 'all'} onClick={() => update({category: item})} className={`min-h-10 shrink-0 rounded-full border px-4 text-xs font-semibold ${category === item ? 'border-[#f43f70] bg-[#f43f70] text-white' : 'border-[#f2dce4] bg-white text-[#755963]'}`}>{item || 'အားလုံး'}</button>)}
      </div>
      {error && <div className="my mt-4 rounded-2xl border border-rose-100 bg-white p-4 text-sm text-slate-600">{error}</div>}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
        {products.map((product) => <Card key={product.id} product={product} />)}
        {loading && products.length === 0 && Array.from({length: 8}).map((_, i) => <div key={i} className="overflow-hidden rounded-[18px] bg-white"><div className="aspect-[0.88] animate-pulse bg-rose-50" /><div className="space-y-2 p-3"><div className="h-3 animate-pulse rounded bg-rose-50" /><div className="h-3 w-1/2 animate-pulse rounded bg-rose-50" /></div></div>)}
      </div>
      {!loading && !error && products.length === 0 && <div className="my mt-8 rounded-2xl bg-white px-5 py-14 text-center text-sm text-slate-500">ရှာဖွေမှုနဲ့ ကိုက်ညီတဲ့ fashion item မရှိသေးပါ။</div>}
      {products.length < total && <button type="button" disabled={loading} onClick={() => fetchPage(products.length, false)} className="mx-auto mt-7 block min-h-11 rounded-full border border-[#f43f70] px-6 text-sm font-bold text-[#e33565] disabled:opacity-50">{loading ? 'ဆွဲယူနေသည်…' : 'နောက်ထပ်ကြည့်ရန်'}</button>}
    </div>
  );
}
