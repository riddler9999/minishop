import {useCallback, useEffect, useRef, useState} from 'react';
import {Search} from 'lucide-react';
import {useSearchParams} from 'react-router-dom';
import {api} from '@/data/dataSource';
import type {Product} from '@/domain/product';
import type {ThemePresetId} from '@/domain/theme';
import ProductCard, {ProductCardSkeleton} from '@/features/catalog/components/ProductCard';
import {cx} from '@/shared/lib/format';
import {getStorefrontTheme} from '@/features/tenancy/shopResolver';
import {useShopSlugParam} from '@/features/tenancy/ShopLink';
import {useDemoStore} from '@/features/demo/DemoStoreContext';

const PAGE = 12;

type CardVariant = 'clean-minimal' | 'street-bold' | 'soft-elegant' | 'grid-catalog' | 'dark-modern';

const STYLE: Record<ThemePresetId, {
  page: string;
  shell: string;
  title: string;
  muted: string;
  grid: string;
  card: CardVariant;
  search: string;
  searchIcon: string;
  chip: string;
  chipActive: string;
  error: string;
  load: string;
}> = {
  'clean-minimal': {
    page: 'min-h-screen bg-white text-black',
    shell: 'mx-auto max-w-[1440px] px-4 py-8 sm:px-8 lg:py-12',
    title: 'text-3xl font-medium tracking-[-0.04em] text-black sm:text-4xl',
    muted: 'text-zinc-500',
    grid: 'grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-7',
    card: 'clean-minimal',
    search: 'flex min-h-11 items-center gap-2 border-b border-black bg-white px-0',
    searchIcon: 'text-black',
    chip: 'border border-zinc-300 bg-white text-zinc-600 hover:border-black hover:text-black',
    chipActive: 'border border-black bg-black text-white',
    error: 'border border-zinc-300 bg-zinc-50 text-zinc-700',
    load: 'border border-black bg-white text-black hover:bg-black hover:text-white',
  },
  'street-bold': {
    page: 'min-h-screen bg-[#f2ff00] text-black',
    shell: 'mx-auto max-w-[1440px] px-4 py-7 sm:px-8 lg:py-10',
    title: 'text-4xl font-black uppercase tracking-[-0.055em] text-black sm:text-6xl',
    muted: 'font-bold text-black/65',
    grid: 'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6',
    card: 'street-bold',
    search: 'flex min-h-12 items-center gap-2 border-2 border-black bg-white px-3 shadow-[4px_4px_0_#111]',
    searchIcon: 'text-[#ff4d00]',
    chip: 'border-2 border-black bg-[#f2ff00] font-black uppercase text-black',
    chipActive: 'border-2 border-black bg-black font-black uppercase text-white',
    error: 'border-2 border-black bg-white text-black shadow-[4px_4px_0_#111]',
    load: 'border-2 border-black bg-[#ff4d00] font-black uppercase text-white shadow-[4px_4px_0_#111]',
  },
  'soft-elegant': {
    page: 'min-h-screen bg-[#f8f1ec] text-[#4a3337]',
    shell: 'mx-auto max-w-6xl px-4 py-8 sm:px-8 lg:py-12',
    title: 'font-display text-3xl font-semibold tracking-[-0.03em] text-[#4a3337] sm:text-4xl',
    muted: 'text-[#8a7378]',
    grid: 'grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4 lg:gap-6',
    card: 'soft-elegant',
    search: 'flex min-h-12 items-center gap-2 rounded-full border border-[#decac5] bg-[#fffaf7] px-4',
    searchIcon: 'text-[#b56b7a]',
    chip: 'rounded-full border border-[#decac5] bg-[#fffaf7] text-[#76565d]',
    chipActive: 'rounded-full border border-[#b56b7a] bg-[#b56b7a] text-white',
    error: 'rounded-2xl border border-[#decac5] bg-[#fffaf7] text-[#76565d]',
    load: 'rounded-full bg-[#b56b7a] text-white',
  },
  'grid-catalog': {
    page: 'min-h-screen bg-[#f5f7fb] text-[#111827]',
    shell: 'mx-auto max-w-[1440px] px-3 py-5 sm:px-6 lg:py-7',
    title: 'text-2xl font-extrabold tracking-[-0.03em] text-[#111827] sm:text-3xl',
    muted: 'text-[#667085]',
    grid: 'grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-5 xl:grid-cols-6',
    card: 'grid-catalog',
    search: 'flex min-h-11 items-center gap-2 rounded-lg border border-[#cfd8e3] bg-white px-3',
    searchIcon: 'text-[#0f6fff]',
    chip: 'rounded-md border border-[#dbe2ea] bg-white text-[#475467]',
    chipActive: 'rounded-md border border-[#0f6fff] bg-[#0f6fff] text-white',
    error: 'rounded-lg border border-[#dbe2ea] bg-white text-[#475467]',
    load: 'rounded-md bg-[#0f6fff] text-white',
  },
  'dark-modern': {
    page: 'min-h-screen bg-[#09090b] text-[#f8fafc]',
    shell: 'mx-auto max-w-[1400px] px-4 py-7 sm:px-8 lg:py-10',
    title: 'text-3xl font-black tracking-[-0.04em] text-[#f8fafc] sm:text-4xl',
    muted: 'text-[#8f8f99]',
    grid: 'grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5',
    card: 'dark-modern',
    search: 'flex min-h-12 items-center gap-2 rounded-xl border border-[#2a2a30] bg-[#151518] px-4',
    searchIcon: 'text-[#73fbd3]',
    chip: 'rounded-lg border border-[#2a2a30] bg-[#151518] text-[#c9c9d0] hover:border-[#73fbd3]/50',
    chipActive: 'rounded-lg border border-[#73fbd3] bg-[#73fbd3]/10 text-[#73fbd3]',
    error: 'rounded-xl border border-[#2a2a30] bg-[#151518] text-[#c9c9d0]',
    load: 'rounded-xl border border-[#73fbd3]/50 bg-[#73fbd3]/10 text-[#73fbd3]',
  },
};

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
  const theme = getStorefrontTheme();
  const isDemo = useDemoStore();
  const reqIdRef = useRef(0);
  const ui = STYLE[theme.presetId];

  useEffect(() => {
    let alive = true;
    api.categories().then((r) => alive && setCategories(r.categories)).catch(() => {});
    return () => { alive = false; };
  }, [slug]);

  const fetchPage = useCallback(
    async (offset: number, replace: boolean) => {
      const myReq = ++reqIdRef.current;
      setLoading(true);
      setErr('');
      try {
        const r = await api.products({scope: 'active', category, q, limit: PAGE, offset});
        if (myReq !== reqIdRef.current) return;
        setTotal(r.total);
        setProducts((prev) => (replace ? r.products : [...prev, ...r.products]));
      } catch (e: any) {
        if (myReq === reqIdRef.current) setErr(e.message || 'ပစ္စည်းများ ဆွဲယူ၍မရပါ');
      } finally {
        if (myReq === reqIdRef.current) setLoading(false);
      }
    },
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

  if (isDemo) {
    return (
      <div className="min-h-screen bg-[#eee6ff] px-4 pb-28 pt-5">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div><h1 className="font-display text-3xl font-black tracking-[-0.04em] text-[#21133f]">{theme.category.heading}</h1><p className="my mt-1 text-sm text-[#76698a]">{total} မျိုး တွေ့ရှိသည်</p></div>
            {theme.category.searchEnabled && <ThemeSearch value={q} onSubmit={(val) => update({q: val})} className="flex min-h-12 items-center gap-2 rounded-full border border-[#cdb8ec] bg-white/90 px-4" iconClass="text-[#6d28d9]" />}
          </div>
          <CategoryChips categories={categories} category={category} update={update} base="border border-[#cdb8ec] bg-white/70 text-[#59466f]" active="bg-[#6d28d9] text-white" />
          {err && <div className="mb-4 rounded-[20px] border border-[#d9c8f2] bg-white/80 p-4 text-sm text-[#59466f]">{err}</div>}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {products.map((p) => <ProductCard key={p.id} product={p} variant="demo-purple" />)}
            {loading && products.length === 0 && Array.from({length: 8}).map((_, i) => <ProductCardSkeleton key={i} compact />)}
          </div>
          {!loading && products.length === 0 && !err && <p className="my rounded-[24px] bg-white/60 py-16 text-center text-[#76698a]">ရှာဖွေမှုနှင့် ကိုက်ညီသော ပစ္စည်းမရှိပါ။</p>}
          {products.length < total && <LoadMore loading={loading} onClick={() => fetchPage(products.length, false)} className="rounded-full bg-[#3a1268] text-white" />}
        </div>
      </div>
    );
  }

  return (
    <div className={ui.page}>
      <div className={ui.shell}>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className={ui.title}>{theme.category.heading}</h1>
            <p className={cx('my mt-1 text-sm', ui.muted)}>{total} မျိုး တွေ့ရှိသည်</p>
          </div>
          {theme.category.searchEnabled && <ThemeSearch value={q} onSubmit={(val) => update({q: val})} className={cx('w-full sm:w-80', ui.search)} iconClass={ui.searchIcon} />}
        </div>

        <CategoryChips categories={categories} category={category} update={update} base={ui.chip} active={ui.chipActive} />

        {err && <div className={cx('mb-5 p-4 text-sm', ui.error)}>{err}</div>}

        <div className={ui.grid}>
          {products.map((p) => <ProductCard key={p.id} product={p} variant={ui.card} />)}
          {loading && products.length === 0 && Array.from({length: theme.presetId === 'grid-catalog' ? 12 : 8}).map((_, i) => <ProductCardSkeleton key={i} compact />)}
        </div>

        {!loading && products.length === 0 && !err && <p className={cx('my py-16 text-center text-sm', ui.muted)}>ရှာဖွေမှုနှင့် ကိုက်ညီသော ပစ္စည်းမရှိပါ။</p>}
        {products.length < total && <LoadMore loading={loading} onClick={() => fetchPage(products.length, false)} className={ui.load} />}
      </div>
    </div>
  );
}

function ThemeSearch({value, onSubmit, className, iconClass}: {value: string; onSubmit: (q: string) => void; className: string; iconClass: string}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <form onSubmit={(e) => {e.preventDefault(); onSubmit(draft.trim());}} className={className}>
      <Search className={cx('h-4 w-4 shrink-0', iconClass)} />
      <input value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="ပစ္စည်းရှာရန်" placeholder="ပစ္စည်းရှာရန်…" className="min-w-0 flex-1 bg-transparent text-sm text-inherit outline-none placeholder:text-current/45" />
    </form>
  );
}

function CategoryChips({categories, category, update, base, active}: {categories: string[]; category: string; update: (patch: Record<string, string>) => void; base: string; active: string}) {
  return (
    <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto pb-1">
      <button onClick={() => update({category: ''})} className={cx('shrink-0 px-4 py-2 text-xs font-semibold transition', category ? base : active)}>အားလုံး</button>
      {categories.map((c) => <button key={c} onClick={() => update({category: c})} className={cx('shrink-0 px-4 py-2 text-xs font-semibold transition', category === c ? active : base)}>{c}</button>)}
    </div>
  );
}

function LoadMore({loading, onClick, className}: {loading: boolean; onClick: () => void; className: string}) {
  return (
    <div className="mt-8 text-center">
      <button disabled={loading} onClick={onClick} className={cx('min-h-11 px-6 py-2.5 text-sm font-semibold transition disabled:opacity-50', className)}>
        {loading ? 'ဆွဲယူနေသည်…' : 'နောက်ထပ်ကြည့်ရန်'}
      </button>
    </div>
  );
}
