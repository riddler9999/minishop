import {Search} from 'lucide-react';

export type ProductStatusFilter = 'all' | 'active' | 'hidden';
export type ProductStockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
export type ProductSort = 'newest' | 'name' | 'price_low' | 'price_high' | 'stock_low';

export default function AdminProductFilters({
  query,
  onQueryChange,
  status,
  onStatusChange,
  stock,
  onStockChange,
  category,
  categories,
  onCategoryChange,
  sort,
  onSortChange,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  status: ProductStatusFilter;
  onStatusChange: (value: ProductStatusFilter) => void;
  stock: ProductStockFilter;
  onStockChange: (value: ProductStockFilter) => void;
  category: string;
  categories: string[];
  onCategoryChange: (value: string) => void;
  sort: ProductSort;
  onSortChange: (value: ProductSort) => void;
}) {
  const field = 'min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-violet-400 focus-visible:ring-2 focus-visible:ring-violet-200';

  return (
    <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 lg:grid-cols-[minmax(220px,1.5fr)_repeat(4,minmax(140px,0.75fr))]">
      <label className="relative block">
        <span className="sr-only">Search products</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search products"
          className={`${field} w-full pl-9`}
        />
      </label>

      <label className="grid gap-1 text-xs font-semibold text-slate-500">
        <span>Status</span>
        <select value={status} onChange={(event) => onStatusChange(event.target.value as ProductStatusFilter)} className={field}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="hidden">Hidden</option>
        </select>
      </label>

      <label className="grid gap-1 text-xs font-semibold text-slate-500">
        <span>Stock</span>
        <select value={stock} onChange={(event) => onStockChange(event.target.value as ProductStockFilter)} className={field}>
          <option value="all">All stock</option>
          <option value="in_stock">In stock</option>
          <option value="low_stock">Low stock</option>
          <option value="out_of_stock">Out of stock</option>
        </select>
      </label>

      <label className="grid gap-1 text-xs font-semibold text-slate-500">
        <span>Category</span>
        <select value={category} onChange={(event) => onCategoryChange(event.target.value)} className={field}>
          <option value="all">All categories</option>
          {categories.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>

      <label className="grid gap-1 text-xs font-semibold text-slate-500">
        <span>Sort</span>
        <select value={sort} onChange={(event) => onSortChange(event.target.value as ProductSort)} className={field}>
          <option value="newest">Newest</option>
          <option value="name">Name</option>
          <option value="price_low">Price: low to high</option>
          <option value="price_high">Price: high to low</option>
          <option value="stock_low">Stock: low to high</option>
        </select>
      </label>
    </div>
  );
}
