export type ProductStatusFilter = 'all' | 'active' | 'hidden';
export type ProductStockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
export type ProductSort = 'newest' | 'name' | 'price_low' | 'price_high' | 'stock_low';

export default function AdminProductFilters({
  query: _query,
  onQueryChange: _onQueryChange,
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
  const field = 'min-h-11 rounded-lg border border-[#E1E7E3] bg-white px-3 text-sm text-[#1F2421] outline-none transition focus:border-[#35B99D] focus-visible:ring-2 focus-visible:ring-[#D8F1EA]';

  return (
    <div className="grid gap-3 rounded-xl border border-[#E1E7E3] bg-white p-4 shadow-sm lg:grid-cols-[repeat(4,minmax(140px,1fr))]">
      {/* Search products */}
      <label className="grid gap-1 text-xs font-semibold text-[#66706C]">
        <span>Status</span>
        <select value={status} onChange={(event) => onStatusChange(event.target.value as ProductStatusFilter)} className={field}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="hidden">Hidden</option>
        </select>
      </label>

      <label className="grid gap-1 text-xs font-semibold text-[#66706C]">
        <span>Stock</span>
        <select value={stock} onChange={(event) => onStockChange(event.target.value as ProductStockFilter)} className={field}>
          <option value="all">All stock</option>
          <option value="in_stock">In stock</option>
          <option value="low_stock">Low stock</option>
          <option value="out_of_stock">Out of stock</option>
        </select>
      </label>

      <label className="grid gap-1 text-xs font-semibold text-[#66706C]">
        <span>Category</span>
        <select value={category} onChange={(event) => onCategoryChange(event.target.value)} className={field}>
          <option value="all">All categories</option>
          {categories.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>

      <label className="grid gap-1 text-xs font-semibold text-[#66706C]">
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

