import {useEffect, useMemo, useState} from 'react';
import {Plus} from 'lucide-react';
import {adminApi} from '@/data/dataSource';
import type {Product} from '@/domain/product';
import AdminPageHeader from '@/features/admin/components/AdminPageHeader';
import AdminErrorState from '@/features/admin/components/AdminErrorState';
import AdminEmptyState from '@/features/admin/components/AdminEmptyState';
import AdminProductFilters, {
  type ProductSort,
  type ProductStatusFilter,
  type ProductStockFilter,
} from '@/features/catalog/components/AdminProductFilters';
import AdminProductTable from '@/features/catalog/components/AdminProductTable';
import AdminProductEditor from '@/features/catalog/components/AdminProductEditor';

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

  return (
    <div className="space-y-5 pb-24 lg:pb-8">
      <AdminPageHeader
        title="Products"
        description={`Manage your catalog, storefront visibility, stock, and pricing. ${products.length}/${total || products.length} loaded.`}
        actions={(
          <button type="button" onClick={() => setCreating(true)} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-violet-600 px-4 text-sm font-semibold text-white hover:bg-violet-700">
            <Plus className="h-4 w-4" /> Add Product
          </button>
        )}
      />

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
        <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
          {Array.from({length: 6}).map((_, index) => <div key={index} className="h-14 animate-pulse rounded-lg bg-slate-100" />)}
        </div>
      ) : visibleProducts.length === 0 ? (
        <AdminEmptyState
          title={products.length === 0 ? 'No products yet' : 'No products match your filters'}
          description={products.length === 0 ? 'Add your first product to start selling from your storefront.' : 'Try changing search, status, stock, or category filters.'}
          action={products.length === 0 ? (
            <button type="button" onClick={() => setCreating(true)} className="min-h-10 rounded-lg bg-violet-600 px-4 text-sm font-semibold text-white hover:bg-violet-700">Add Product</button>
          ) : hasActiveFilters ? (
            <button type="button" onClick={() => {setQuery(''); setStatus('all'); setStock('all'); setCategory('all');}} className="min-h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Clear filters</button>
          ) : null}
        />
      ) : (
        <AdminProductTable products={visibleProducts} onEdit={setEditing} />
      )}

      {nextCursor && !hasActiveFilters ? (
        <div className="flex justify-center">
          <button type="button" onClick={() => void loadMore()} disabled={loadingMore} className="min-h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            {loadingMore ? 'Loading…' : 'Load more products'}
          </button>
        </div>
      ) : null}

      {editing ? <AdminProductEditor mode="edit" product={editing} onClose={() => setEditing(null)} onSaved={onEdited} onDeleted={onDeleted} /> : null}
      {creating ? <AdminProductEditor mode="create" onClose={() => setCreating(false)} onSaved={onCreated} /> : null}
    </div>
  );
}
