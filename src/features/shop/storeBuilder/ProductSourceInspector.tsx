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
  best_selling: 'Best selling',
  new_arrivals: 'New arrivals',
  sale: 'On sale',
  category: 'Category',
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
    <fieldset className="space-y-3" disabled={blocked}>
      <legend className="sr-only">Product Source</legend>
      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Product Source mode">
        <button type="button" onClick={() => setMode('manual')} aria-pressed={source.mode === 'manual'} className={`min-h-11 rounded-lg border px-3 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35B99D] ${source.mode === 'manual' ? 'border-[#35B99D] bg-[#D8F1EA] text-[#29957F]' : 'border-[#E1E7E3]'}`}>Manual</button>
        <button type="button" onClick={() => setMode('dynamic')} aria-pressed={source.mode === 'dynamic'} className={`min-h-11 rounded-lg border px-3 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35B99D] ${source.mode === 'dynamic' ? 'border-[#35B99D] bg-[#D8F1EA] text-[#29957F]' : 'border-[#E1E7E3]'}`}>Dynamic</button>
      </div>

      {source.mode === 'manual' ? (
        <div className="max-h-64 space-y-1 overflow-y-auto rounded-xl border border-[#E1E7E3] p-2" aria-label="Products">
          {products.length === 0 && <p className="p-2 text-sm text-[#66706C]">No products available.</p>}
          {unavailableProductIds.map((productId) => (
            <label key={productId} className="flex min-h-11 items-center gap-2 rounded-lg bg-amber-50 px-2 text-sm text-amber-900">
              <input type="checkbox" checked onChange={() => onChange(removeManualProductId(source, productId))} />
              <span className="min-w-0 truncate">Unavailable product ({productId})</span>
            </label>
          ))}
          {products.map((product) => {
            const checked = source.productIds.includes(product.id);
            const atLimit = source.productIds.length >= MAX_PRODUCT_SOURCE_PRODUCTS;
            return (
              <label key={product.id} className="flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm hover:bg-[#F4F7F5]">
                <input type="checkbox" checked={checked} disabled={!checked && atLimit} onChange={() => onChange({mode: 'manual', productIds: checked ? source.productIds.filter((id) => id !== product.id) : [...source.productIds, product.id]})} />
                <span className="min-w-0 truncate">{product.name}</span>
              </label>
            );
          })}
          <p className="px-2 pt-1 text-xs leading-5 text-[#66706C]" aria-live="polite">{source.productIds.length}/{MAX_PRODUCT_SOURCE_PRODUCTS} selected</p>
        </div>
      ) : (
        <div className="space-y-3">
          <label className="block text-sm font-medium leading-6 text-[#1F2421]">Rule
            <select aria-label="Rule" value={source.rule} onChange={(event) => {
              const rule = event.target.value as ProductSourceRule;
              onChange({mode: 'dynamic', rule, limit: source.limit, ...(rule === 'category' ? {category: source.category ?? categories[0] ?? ''} : {})});
            }} className="mt-1 min-h-11 w-full rounded-lg border border-[#E1E7E3] px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35B99D]">
              {(Object.keys(RULE_LABELS) as ProductSourceRule[]).map((rule) => <option key={rule} value={rule}>{RULE_LABELS[rule]}</option>)}
            </select>
          </label>
          {source.rule === 'category' && (
            <label className="block text-sm font-medium leading-6 text-[#1F2421]">Category
              <select aria-label="Category" value={source.category ?? ''} onChange={(event) => onChange({...source, category: event.target.value})} className="mt-1 min-h-11 w-full rounded-lg border border-[#E1E7E3] px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35B99D]">
                <option value="">Select a category</option>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </label>
          )}
          <label className="block text-sm font-medium leading-6 text-[#1F2421]">Limit
            <input aria-label="Limit" type="number" min={1} max={MAX_PRODUCT_SOURCE_PRODUCTS} value={source.limit} onChange={(event) => onChange({...source, limit: Math.min(MAX_PRODUCT_SOURCE_PRODUCTS, Math.max(1, Number(event.target.value) || 1))})} className="mt-1 min-h-11 w-full rounded-lg border border-[#E1E7E3] px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35B99D]" />
          </label>
        </div>
      )}
    </fieldset>
  );
}
