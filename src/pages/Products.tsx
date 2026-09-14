import {useCallback, useEffect, useRef, useState} from 'react';
import {useSearchParams} from 'react-router-dom';
import {api, type Product} from '../lib/store';
import ProductCard, {ProductCardSkeleton} from '../components/ProductCard';
import {SearchBox} from '../components/Layout';
import {cx} from '../lib/format';
import {useShopSlugParam} from '../components/ShopLink';

const PAGE = 12;

export default function Products() {
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || '';
  const q = params.get('q') || '';

  const [categories, setCategories] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const slug = useShopSlugParam();
  const reqIdRef = useRef(0);

  useEffect(() => {
    let alive = true;
    api.categories().then((r) => alive && setCategories(r.categories)).catch(() => {});
    return () => {
      alive = false;
    };
  }, [slug]);

  const fetchPage = useCallback(
    async (offset: number, replace: boolean) => {
      const myReq = ++reqIdRef.current;
      setLoading(true);
      setErr('');
      try {
        const r = await api.products({scope: 'active', category, q, limit: PAGE, offset});
        if (myReq !== reqIdRef.current) return; // a newer fetch superseded this one
        setTotal(r.total);
        setProducts((prev) => (replace ? r.products : [...prev, ...r.products]));
      } catch (e: any) {
        if (myReq === reqIdRef.current) setErr(e.message || 'ပစ္စည်းများ ဆွဲယူ၍မရပါ');
      } finally {
        if (myReq === reqIdRef.current) setLoading(false);
      }
    },
    // `slug` isn't read in the body — `api.products()` resolves against whichever shop is
    // active via the store proxy — but it must stay a dep so a tenant switch still forces a
    // refetch (the effect below only reruns when this callback's identity changes).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [category, q, slug],
  );

  useEffect(() => {
    fetchPage(0, true);
  }, [fetchPage]);

  const update = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    setParams(next);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-brand-800">ပစ္စည်းများ</h1>
          <p className="my mt-1 text-sm text-ink-soft">{total} မျိုး တွေ့ရှိသည်</p>
        </div>
        <div className="w-full sm:w-72">
          <SearchBox defaultValue={q} onSubmit={(val) => update({q: val})} />
        </div>
      </div>

      <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => update({category: ''})}
          className={cx(
            'shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition',
            !category ? 'bg-brand-700 text-cream-100' : 'border border-cream-200 bg-white text-ink hover:bg-cream-100',
          )}>
          အားလုံး
        </button>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => update({category: c})}
            className={cx(
              'my shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition',
              category === c ? 'bg-brand-700 text-cream-100' : 'border border-cream-200 bg-white text-ink hover:bg-cream-100',
            )}>
            {c}
          </button>
        ))}
      </div>

      {err && <div className="mb-4 rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-700">{err}</div>}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
        {loading && products.length === 0 && Array.from({length: 8}).map((_, i) => <ProductCardSkeleton key={i} />)}
      </div>

      {!loading && products.length === 0 && !err && (
        <p className="my py-16 text-center text-ink-soft">ရှာဖွေမှုနှင့် ကိုက်ညီသော ပစ္စည်းမရှိပါ။</p>
      )}

      {products.length < total && (
        <div className="mt-8 text-center">
          <button
            disabled={loading}
            onClick={() => fetchPage(products.length, false)}
            className="rounded-full border border-brand-700 px-6 py-3 font-semibold text-brand-700 transition hover:bg-brand-700 hover:text-cream-100 disabled:opacity-50">
            {loading ? 'ဆွဲယူနေသည်…' : 'နောက်ထပ်ကြည့်ရန်'}
          </button>
        </div>
      )}
    </div>
  );
}
