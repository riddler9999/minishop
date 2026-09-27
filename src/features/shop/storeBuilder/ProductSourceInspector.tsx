import type {Product} from '@/domain/product';
import {MAX_PRODUCT_SOURCE_PRODUCTS, type ProductSource, type ProductSourceRule} from '@/domain/storeDesign';
import {removeManualProductId, unavailableManualProductIds} from './manualProductSelection';

type Props = {
  source: ProductSource;
  products: Product[];
  categories: string[];
  blocked: boolean;
  onChange: (source: ProductSource) => void;
};

const RULE_LABELS: Record<ProductSourceRule, string> = {
  best_selling: 'အရောင်းရဆုံး',
  new_arrivals: 'အသစ်ရောက်',
  sale: 'လျှော့ဈေးပစ္စည်း',
  category: 'အမျိုးအစားအလိုက်',
};

export function ProductSourceInspector({source, products, categories, blocked, onChange}: Props) {
  const unavailableProductIds = unavailableManualProductIds(source, products);
  const setMode = (mode: ProductSource['mode']) => {
    if (mode === source.mode) return;
    onChange(mode === 'manual'
      ? {mode: 'manual', productIds: []}
      : {mode: 'dynamic', rule: 'new_arrivals', limit: 8});
  };

  return (
    <fieldset className="space-y-3 border-t border-cream-200 pt-3" disabled={blocked}>
      <legend className="text-xs font-bold text-ink-soft">ပစ္စည်းရွေးချယ်မှု</legend>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setMode('manual')} aria-pressed={source.mode === 'manual'} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${source.mode === 'manual' ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-cream-300'}`}>ကိုယ်တိုင်ရွေးမည်</button>
        <button type="button" onClick={() => setMode('dynamic')} aria-pressed={source.mode === 'dynamic'} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${source.mode === 'dynamic' ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-cream-300'}`}>အလိုအလျောက်</button>
      </div>

      {source.mode === 'manual' ? (
        <div className="max-h-64 space-y-1 overflow-y-auto rounded-xl border border-cream-200 p-2" aria-label="ပစ္စည်းများရွေးရန်">
          {products.length === 0 && <p className="p-2 text-xs text-ink-soft">ရွေးချယ်နိုင်တဲ့ ပစ္စည်းမရှိသေးပါ။</p>}
          {unavailableProductIds.map((productId) => (
            <label key={productId} className="flex min-h-10 items-center gap-2 rounded-lg bg-amber-50 px-2 text-sm text-amber-800">
              <input
                type="checkbox"
                checked
                onChange={() => onChange(removeManualProductId(source, productId))}
              />
              <span className="min-w-0 truncate">မရှိတော့သောပစ္စည်း ({productId})</span>
            </label>
          ))}
          {products.map((product) => {
            const checked = source.productIds.includes(product.id);
            const atLimit = source.productIds.length >= MAX_PRODUCT_SOURCE_PRODUCTS;
            return (
              <label key={product.id} className="flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm hover:bg-cream-100">
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={!checked && atLimit}
                  onChange={() => onChange({mode: 'manual', productIds: checked ? source.productIds.filter((id) => id !== product.id) : [...source.productIds, product.id]})}
                />
                <span className="min-w-0 truncate">{product.name}</span>
              </label>
            );
          })}
          <p className="px-2 pt-1 text-xs text-ink-soft">{source.productIds.length}/{MAX_PRODUCT_SOURCE_PRODUCTS} ခု ရွေးထားသည်</p>
        </div>
      ) : (
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-ink-soft">စည်းမျဉ်း
            <select value={source.rule} onChange={(event) => {
              const rule = event.target.value as ProductSourceRule;
              onChange({mode: 'dynamic', rule, limit: source.limit, ...(rule === 'category' ? {category: source.category ?? categories[0] ?? ''} : {})});
            }} className="mt-1 w-full rounded-lg border border-cream-300 px-3 py-2 text-sm">
              {(Object.keys(RULE_LABELS) as ProductSourceRule[]).map((rule) => <option key={rule} value={rule}>{RULE_LABELS[rule]}</option>)}
            </select>
          </label>
          {source.rule === 'category' && (
            <label className="block text-xs font-semibold text-ink-soft">အမျိုးအစား
              <select value={source.category ?? ''} onChange={(event) => onChange({...source, category: event.target.value})} className="mt-1 w-full rounded-lg border border-cream-300 px-3 py-2 text-sm">
                <option value="">အမျိုးအစားရွေးပါ</option>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </label>
          )}
          <label className="block text-xs font-semibold text-ink-soft">ပြမည့်အရေအတွက်
            <input type="number" min={1} max={MAX_PRODUCT_SOURCE_PRODUCTS} value={source.limit} onChange={(event) => onChange({...source, limit: Math.min(MAX_PRODUCT_SOURCE_PRODUCTS, Math.max(1, Number(event.target.value) || 1))})} className="mt-1 w-full rounded-lg border border-cream-300 px-3 py-2 text-sm" />
          </label>
        </div>
      )}
    </fieldset>
  );
}
