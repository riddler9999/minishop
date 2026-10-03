import {useCallback, useEffect, useMemo, useState} from 'react';
import {Search} from 'lucide-react';
import {adminApi} from '@/data/dataSource';
import type {AdminOrder} from '@/domain/order';
import {cx} from '@/shared/lib/format';
import AdminPageHeader from '@/features/admin/components/AdminPageHeader';
import AdminButton from '@/features/admin/components/AdminButton';
import AdminLoadingState from '@/features/admin/components/AdminLoadingState';
import AdminEmptyState from '@/features/admin/components/AdminEmptyState';
import AdminErrorState from '@/features/admin/components/AdminErrorState';
import {AdminOrdersTable} from '@/features/orders/components/AdminOrdersTable';
import {AdminOrderDetail} from '@/features/orders/components/AdminOrderDetail';
import {
  ORDER_STAGE_TABS,
  getOrderStage,
  type OrderStage,
} from '@/features/orders/lib/orderStage';

export default function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | OrderStage>('all');
  const [selected, setSelected] = useState<AdminOrder | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await adminApi.listOrders({limit: 50});
      setOrders(result.orders);
      setNextCursor(result.page.nextCursor);
      setTotal(result.page.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load orders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

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

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: orders.length,
      pending: 0,
      confirmed: 0,
      delivered: 0,
      return: 0,
    };
    for (const order of orders) {
      const stage = getOrderStage(order.status);
      if (counts[stage] !== undefined) {
        counts[stage] += 1;
      }
    }
    return counts;
  }, [orders]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return orders.filter((order) => {
      if (filter !== 'all') {
        const stage = getOrderStage(order.status);
        if (stage !== filter) return false;
      }
      if (!term) return true;
      return (
        order.order_id.toLowerCase().includes(term) ||
        (order.customer_name ?? '').toLowerCase().includes(term) ||
        (order.customer_phone ?? '').includes(term)
      );
    });
  }, [orders, q, filter]);

  function onChanged(updated: AdminOrder) {
    setOrders((current) =>
      current.map((order) => (order.order_id === updated.order_id ? updated : order)),
    );
    setSelected(updated);
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Orders"
        description={`Manage customer orders, track fulfillment states, verify payments, and process deliveries (${orders.length}/${total || orders.length} loaded).`}
      />

      {/* Stage Tabs */}
      <div className="border-b border-[#E1E7E3] -mx-4 px-4 sm:mx-0 sm:px-0">
        <nav className="flex gap-2 overflow-x-auto pb-px" aria-label="Order stages">
          {ORDER_STAGE_TABS.map((tab) => {
            const count = stageCounts[tab.id] ?? 0;
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={cx(
                  'flex shrink-0 items-center gap-2 border-b-2 px-3.5 py-3 text-sm font-semibold transition min-h-[44px]',
                  active
                    ? 'border-[#35B99D] text-[#1F2421]'
                    : 'border-transparent text-[#66706C] hover:border-[#E1E7E3] hover:text-[#1F2421]',
                )}>
                <span>{tab.label}</span>
                <span
                  className={cx(
                    'rounded-full px-2 py-0.5 text-xs font-semibold',
                    active ? 'bg-[#D8F1EA] text-[#29957F]' : 'bg-[#F4F7F5] text-[#66706C]',
                  )}>
                  {count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Search Input Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex min-h-11 flex-1 items-center gap-2.5 rounded-xl border border-[#E1E7E3] bg-white px-3.5 shadow-xs focus-within:border-[#35B99D] focus-within:ring-2 focus-within:ring-[#35B99D]/20 transition">
          <Search className="h-4 w-4 text-[#66706C] shrink-0" />
          <input
            type="search"
            aria-label="Search orders"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Search by order ID, customer name, or phone number…"
            className="w-full bg-transparent text-sm text-[#1F2421] placeholder-[#66706C] outline-none"
          />
          {q ? (
            <button
              type="button"
              onClick={() => setQ('')}
              className="text-xs font-medium text-[#66706C] hover:text-[#1F2421] px-1.5 py-1 rounded">
              Clear
            </button>
          ) : null}
        </label>
      </div>

      {/* Main Content Area */}
      <div>
        {loading ? (
          <AdminLoadingState message="Loading orders…" />
        ) : error ? (
          <AdminErrorState
            title="Could not load orders"
            description={error}
            onRetry={() => void loadInitial()}
          />
        ) : filtered.length === 0 ? (
          <AdminEmptyState
            title={
              orders.length === 0
                ? 'No orders yet'
                : filter === 'return'
                ? 'No returns'
                : 'No matching orders'
            }
            description={
              orders.length === 0
                ? 'When buyers place orders on your storefront, they will appear here in real time.'
                : filter === 'return'
                ? 'There are currently no returned orders. Returns are managed after orders are delivered.'
                : q.trim()
                ? `No orders match the search query "${q}".`
                : `There are currently no orders in the "${filter}" stage.`
            }
            action={
              q.trim() || filter !== 'all' ? (
                <AdminButton
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    setQ('');
                    setFilter('all');
                  }}>
                  Reset Filters
                </AdminButton>
              ) : undefined
            }
          />
        ) : (
          <AdminOrdersTable orders={filtered} onSelect={setSelected} />
        )}
      </div>

      {/* Keyset Pagination Load More */}
      {nextCursor && !q.trim() && filter === 'all' ? (
        <div className="flex justify-center pt-2">
          <AdminButton
            type="button"
            variant="secondary"
            size="md"
            onClick={() => void loadMore()}
            disabled={loadingMore}>
            {loadingMore ? 'Loading more…' : 'Load more orders'}
          </AdminButton>
        </div>
      ) : null}

      {/* Order Detail Modal / Drawer */}
      {selected ? (
        <AdminOrderDetail
          order={selected}
          onClose={() => setSelected(null)}
          onChanged={onChanged}
        />
      ) : null}
    </div>
  );
}
