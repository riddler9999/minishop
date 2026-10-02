import {useCallback, useEffect, useMemo, useState} from 'react';
import {Search, Users} from 'lucide-react';
import {adminApi} from '@/data/dataSource';
import type {AdminOrder} from '@/domain/order';
import {buildCustomerSummaries} from '@/features/admin/lib/customerSummary';

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

export default function Customers() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await adminApi.listOrders();
      setOrders(result.orders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load customers.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const customers = useMemo(() => buildCustomerSummaries(orders), [orders]);
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter((customer) =>
      customer.name.toLowerCase().includes(term)
      || customer.phone.toLowerCase().includes(term)
      || customer.lastOrderId.toLowerCase().includes(term)
    );
  }, [customers, query]);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-600">Commerce</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-950">Customers</h1>
        <p className="mt-1 text-sm text-slate-500">Read-only customer summaries derived from your order history.</p>
      </div>

      <label className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 focus-within:border-violet-500">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          aria-label="Search customers"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search customers"
          className="w-full bg-transparent text-sm outline-none"
        />
      </label>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <div className="px-6 py-14 text-center text-sm text-slate-500">Loading customers…</div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <p className="text-sm font-semibold text-slate-800">Could not load customers</p>
            <p className="max-w-md text-sm text-slate-500">{error}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
              Retry
            </button>
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
            <Users className="h-8 w-8 text-slate-300" />
            <p className="text-sm text-slate-500">No customers yet.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-14 text-center text-sm text-slate-500">No customers match your search.</div>
        ) : (
          <>
            <div className="hidden grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_100px_140px_140px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
              <span>Customer</span><span>Phone</span><span>Orders</span><span>Total spend</span><span>Last order</span>
            </div>
            <ul className="divide-y divide-slate-200">
              {filtered.map((customer) => (
                <li key={customer.key} className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_100px_140px_140px] md:items-center md:gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{customer.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500 md:hidden">{customer.phone || 'No phone'}</p>
                  </div>
                  <p className="hidden truncate text-sm text-slate-600 md:block">{customer.phone || '—'}</p>
                  <div><span className="text-xs text-slate-500 md:hidden">Orders: </span><span className="text-sm font-medium text-slate-700">{customer.orderCount}</span></div>
                  <div><span className="text-xs text-slate-500 md:hidden">Total spend: </span><span className="text-sm font-semibold text-slate-900">{formatMoney(customer.totalSpend)} MMK</span></div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{customer.lastOrderId}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{new Date(customer.lastOrderAt).toLocaleDateString('en-GB')}</p>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
