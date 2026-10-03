import {useEffect, useMemo, useState} from 'react';
import {Plus} from 'lucide-react';
import {adminApi} from '@/data/dataSource';
import type {Product} from '@/domain/product';
import {cx} from '@/shared/lib/format';
import AdminPageHeader from '@/features/admin/components/AdminPageHeader';
import AdminButton from '@/features/admin/components/AdminButton';
import AdminErrorState from '@/features/admin/components/AdminErrorState';
import AdminEmptyState from '@/features/admin/components/AdminEmptyState';
import AdminLoadingState from '@/features/admin/components/AdminLoadingState';
import AdminProductFilters, {
  type ProductSort,
  type ProductStatusFilter,
  type ProductStockFilter,
} from '@/features/catalog/components/AdminProductFilters';
import AdminProductTable from '@/features/catalog/components/AdminProductTable';
import AdminProductEditor from '@/features/catalog/components/AdminProductEditor';

type ProductViewTab = 'all' | 'active' | 'hidden' | 'out_of_stock';

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<ProductStatusFilter>('all');
  const [stock, setStock] = useState<ProductStockFilter>('all');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState<ProductSort>('newest');
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setLoadError('');
    adminApi.listProducts({limit: 50})
      .then((result) => {
        if (!alive) return;
        setProducts(result.products);
        setNextCursor(result.page.nextCursor);
        setTotal(result.page.total);
      })
      .catch((error: unknown) => {
        if (!alive) return;
        setLoadError(error instanceof Error ? error.message : 'Products could not be loaded.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, [reloadKey]);

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const result = await adminApi.listProducts({cursor: nextCursor});
      setProducts((current) => [...current, ...result.products]);
      setNextCursor(result.page.nextCursor);
      setTotal(result.page.total);
    } catch (error: unknown) {
      setLoadError(error instanceof Error ? error.message : 'Products could not be loaded.');
    } finally {
      setLoadingMore(false);
    }
  };

  const categories = useMemo(
    () => [...new Set(products.map((product) => product.category).filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b)),
    [products],
  );

  const activeCount = useMemo(() => products.filter((p) => p.status === 'active').length, [products]);
  const hiddenCount = useMemo(() => products.filter((p) => p.status === 'hidden').length, [products]);
  const outOfStockCount = useMemo(() => products.filter((p) => p.stock <= 0).length, [products]);

  const activeTab: ProductViewTab =
    status === 'active' && stock === 'all'
      ? 'active'
      : status === 'hidden' && stock === 'all'
      ? 'hidden'
      : stock === 'out_of_stock' && status === 'all'
      ? 'out_of_stock'
      : 'all';

  const visibleProducts = useMemo(() => {
    const term = query.trim().toLowerCase();
    const filtered = products.filter((product) => {
      const matchesQuery = !term
        || product.name.toLowerCase().includes(term)
        || product.itemCode.toLowerCase().includes(term)
        || (product.category ?? '').toLowerCase().includes(term);
      const matchesStatus = status === 'all' || product.status === status;
      const matchesStock = stock === 'all'
        || (stock === 'out_of_stock' && product.stock <= 0)
        || (stock === 'low_stock' && product.stock > 0 && product.stock <= 5)
        || (stock === 'in_stock' && product.stock > 5);
      const matchesCategory = category === 'all' || product.category === category;
      return matchesQuery && matchesStatus && matchesStock && matchesCategory;
    });

    return [...filtered].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'price_low') return (a.promoPrice ?? a.price) - (b.promoPrice ?? b.price);
      if (sort === 'price_high') return (b.promoPrice ?? b.price) - (a.promoPrice ?? a.price);
      if (sort === 'stock_low') return a.stock - b.stock;
      return Date.parse(b.arrivalDate ?? '') - Date.parse(a.arrivalDate ?? '');
    });
  }, [products, query, status, stock, category, sort]);

  const hasActiveFilters = Boolean(query.trim()) || status !== 'all' || stock !== 'all' || category !== 'all';

  const onEdited = (updated: Product) => {
    setProducts((current) => current.map((product) => product.id === updated.id ? updated : product));
    setEditing(null);
  };

  const onCreated = (created: Product) => {
    setProducts((current) => [created, ...current]);
    setTotal((current) => current + 1);
    setCreating(false);
  };

  const onDeleted = (product: Product) => {
    setProducts((current) => current.filter((item) => item.id !== product.id));
    setTotal((current) => Math.max(0, current - 1));
    setEditing(null);
  };

  const clearFilters = () => {
    setQuery('');
    setStatus('all');
    setStock('all');
    setCategory('all');
  };

  return (
    <div className="space-y-5 pb-24 lg:pb-8">
      <AdminPageHeader
        title="Products"
        description={`Manage your catalog, storefront visibility, stock, and pricing. ${products.length}/${total || products.length} loaded.`}
        actions={(
          <AdminButton
            type="button"
            variant="mint"
            size="md"
            onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> Add Product
          </AdminButton>
        )}
      />

      {/* Product Views Sub-Navigation */}
      <nav aria-label="Product views" className="flex items-center gap-1.5 border-b border-[#E1E7E3] pb-2 overflow-x-auto">
        {[
          {id: 'all', label: 'All', count: total || products.length},
          {id: 'active', label: 'Active', count: activeCount},
          {id: 'hidden', label: 'Hidden', count: hiddenCount},
          {id: 'out_of_stock', label: 'Out of stock', count: outOfStockCount},
        ].map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => {
                if (tab.id === 'all') { setStatus('all'); setStock('all'); }
                else if (tab.id === 'active') { setStatus('active'); setStock('all'); }
                else if (tab.id === 'hidden') { setStatus('hidden'); setStock('all'); }
                else if (tab.id === 'out_of_stock') { setStatus('all'); setStock('out_of_stock'); }
              }}
              className={cx(
                'inline-flex min-h-11 items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-lg transition whitespace-nowrap cursor-pointer',
                isSelected
                  ? 'bg-[#1F2421] text-white shadow-xs'
                  : 'text-[#66706C] hover:text-[#1F2421] hover:bg-[#F4F7F5]',
              )}>
              <span>{tab.label}</span>
              <span className={cx(
                'rounded-full px-2 py-0.5 text-xs font-bold',
                isSelected ? 'bg-white/20 text-white' : 'bg-[#E1E7E3] text-[#66706C]',
              )}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </nav>

      <AdminProductFilters
        query={query}
        onQueryChange={setQuery}
        status={status}
        onStatusChange={setStatus}
        stock={stock}
        onStockChange={setStock}
        category={category}
        categories={categories}
        onCategoryChange={setCategory}
        sort={sort}
        onSortChange={setSort}
      />

      {loadError ? (
        <AdminErrorState
          title="Products could not be loaded"
          description={loadError}
          onRetry={() => setReloadKey((key) => key + 1)}
        />
      ) : null}

      {loading ? (
        <AdminLoadingState message="Loading catalog products…" />
      ) : visibleProducts.length === 0 ? (
        <AdminEmptyState
          title={products.length === 0 ? 'No products yet' : 'No products match your filters'}
          description={products.length === 0 ? 'Add your first product to start selling from your storefront.' : 'Try changing search, status, stock, or category filters.'}
          action={products.length === 0 ? (
            <AdminButton
              type="button"
              variant="mint"
              size="md"
              onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" /> Add Product
            </AdminButton>
          ) : hasActiveFilters ? (
            <AdminButton
              type="button"
              variant="secondary"
              size="md"
              onClick={clearFilters}>
              Clear filters
            </AdminButton>
          ) : null}
        />
      ) : (
        <AdminProductTable products={visibleProducts} onEdit={setEditing} />
      )}

      {nextCursor && !hasActiveFilters ? (
        <div className="flex justify-center pt-2">
          <AdminButton
            type="button"
            variant="secondary"
            size="md"
            onClick={() => void loadMore()}
            disabled={loadingMore}>
            {loadingMore ? 'Loading…' : 'Load more products'}
          </AdminButton>
        </div>
      ) : null}

      {editing ? <AdminProductEditor mode="edit" product={editing} onClose={() => setEditing(null)} onSaved={onEdited} onDeleted={onDeleted} /> : null}
      {creating ? <AdminProductEditor mode="create" onClose={() => setCreating(false)} onSaved={onCreated} /> : null}
    </div>
  );
}

