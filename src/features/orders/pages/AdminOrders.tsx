import {useCallback, useEffect, useMemo, useState} from 'react';
import {Search, ShoppingCart} from 'lucide-react';
import {adminApi} from '@/data/dataSource';
import type {AdminOrder} from '@/domain/order';
import {ADMIN_STATUS_OPTIONS, ORDER_STATUS} from '@/domain/orderStatus';
import {cx} from '@/shared/lib/format';
import {AdminOrdersTable} from '@/features/orders/components/AdminOrdersTable';
import {AdminOrderDetail} from '@/features/orders/components/AdminOrderDetail';

const FILTERS = [
  {value: 'all', label: 'All'},
  ...ADMIN_STATUS_OPTIONS.map((status) => ({value: status, label: ORDER_STATUS[status].admin})),
];

export default function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<AdminOrder | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await adminApi.listOrders({limit:50});
      setOrders(result.orders);
      setNextCursor(result.page.nextCursor);
      setTotal(result.page.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load orders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadInitial(); }, [loadInitial]);

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const result = await adminApi.listOrders({cursor: nextCursor});
      setOrders((current) => [...current, ...result.orders]);
      setNextCursor(result.page.nextCursor);
      setTotal(result.page.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load more orders.');
    } finally {
      setLoadingMore(false);
    }
  }

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return orders.filter((order) => {
      if (filter !== 'all' && order.status !== filter) return false;
      if (!term) return true;
      return order.order_id.toLowerCase().includes(term)
        || (order.customer_name ?? '').toLowerCase().includes(term)
        || (order.customer_phone ?? '').includes(term);
    });
  }, [orders, q, filter]);

  function onChanged(updated: AdminOrder) {
    setOrders((current) => current.map((order) => order.order_id === updated.order_id ? updated : order));
    setSelected(updated);
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-600">Operations</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-950">Orders</h1>
            <p className="mt-1 text-sm text-slate-500">{orders.length}/{total || orders.length} loaded</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="flex min-h-11 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 focus-within:border-violet-500">
          <Search className="h-4 w-4 text-slate-400" />
          <input aria-label="Search orders" value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search order, customer or phone" className="w-full bg-transparent text-sm outline-none" />
        </label>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((item) => <button key={item.value} onClick={() => setFilter(item.value)} className={cx('shrink-0 rounded-lg px-3 py-2 text-sm font-semibold', filter === item.value ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50')}>{item.label}</button>)}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading ? <div className="space-y-2 p-4">{Array.from({length:6}).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}</div>
          : error ? <div className="flex flex-col items-center gap-3 px-6 py-14 text-center"><p className="text-sm font-semibold text-slate-800">Could not load orders</p><p className="max-w-md text-sm text-slate-500">{error}</p><button onClick={() => void loadInitial()} className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Retry</button></div>
          : filtered.length === 0 ? <div className="flex flex-col items-center gap-2 px-6 py-14 text-center"><ShoppingCart className="h-8 w-8 text-slate-300" /><p className="text-sm text-slate-500">{orders.length === 0 ? 'No orders yet.' : 'No orders match your search or filter.'}</p></div>
          : <AdminOrdersTable orders={filtered} onSelect={setSelected} />}
      </div>

      {nextCursor && !q.trim() && filter === 'all' ? <div className="flex justify-center"><button type="button" onClick={() => void loadMore()} disabled={loadingMore} className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">{loadingMore ? 'Loading…' : 'Load more orders'}</button></div> : null}

      {selected ? <AdminOrderDetail order={selected} onClose={() => setSelected(null)} onChanged={onChanged} /> : null}
    </div>
  );
}
