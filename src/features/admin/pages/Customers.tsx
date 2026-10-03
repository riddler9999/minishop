import {useCallback, useEffect, useMemo, useState} from 'react';
import {ArrowUpDown, CircleDollarSign, Search, UserCheck, Users, X} from 'lucide-react';
import {adminApi} from '@/data/dataSource';
import type {AdminOrder} from '@/domain/order';
import {
  buildCustomerSummaries,
  calculateCustomerMetrics,
  filterCustomerSummaries,
  sortCustomerSummaries,
  type CustomerSortOption,
  type CustomerSummary,
} from '@/features/admin/lib/customerSummary';
import {ks} from '@/shared/lib/format';
import AdminPageHeader from '@/features/admin/components/AdminPageHeader';
import AdminStatCard from '@/features/admin/components/AdminStatCard';
import AdminButton from '@/features/admin/components/AdminButton';
import AdminStatusBadge from '@/features/admin/components/AdminStatusBadge';
import AdminLoadingState from '@/features/admin/components/AdminLoadingState';
import AdminEmptyState from '@/features/admin/components/AdminEmptyState';
import AdminErrorState from '@/features/admin/components/AdminErrorState';
import AdminCustomerDetail from '@/features/admin/components/AdminCustomerDetail';

function formatDate(isoString: string): string {
  try {
    return new Date(isoString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

export default function Customers() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<CustomerSortOption>('recent');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummary | null>(null);

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

  const rawSummaries = useMemo(() => buildCustomerSummaries(orders), [orders]);
  const metrics = useMemo(() => calculateCustomerMetrics(rawSummaries), [rawSummaries]);

  const filteredSummaries = useMemo(() => {
    const matched = filterCustomerSummaries(rawSummaries, query);
    return sortCustomerSummaries(matched, sortBy);
  }, [rawSummaries, query, sortBy]);

  // Keep selectedCustomer in sync if orders reload
  useEffect(() => {
    if (selectedCustomer) {
      const refreshed = rawSummaries.find((c) => c.key === selectedCustomer.key);
      if (refreshed) {
        setSelectedCustomer(refreshed);
      }
    }
  }, [rawSummaries, selectedCustomer]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Customers"
        description="Read-only customer summaries and order history derived from your store records."
      />

      {error ? (
        <AdminErrorState
          title="Could not load customers"
          description={error}
          onRetry={() => void load()}
        />
      ) : null}

      {!loading && !error && rawSummaries.length > 0 ? (
        <section className="grid gap-3 sm:grid-cols-3" aria-label="Customer metrics">
          <AdminStatCard
            label="Total Customers"
            value={String(metrics.totalCustomers)}
            detail="Unique customer phone / order records"
            icon={Users}
          />
          <AdminStatCard
            label="Repeat Customers"
            value={String(metrics.repeatCustomers)}
            detail={`${metrics.totalCustomers > 0 ? Math.round((metrics.repeatCustomers / metrics.totalCustomers) * 100) : 0}% repeat rate`}
            icon={UserCheck}
          />
          <AdminStatCard
            label="Recognized Spend"
            value={ks(metrics.totalRecognizedSpend)}
            detail={`Avg ${ks(metrics.averageRecognizedSpendPerCustomer)} / customer`}
            icon={CircleDollarSign}
          />
        </section>
      ) : null}

      {/* Controls Bar: Search & Sort */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex min-h-11 flex-1 items-center gap-2.5 rounded-xl border border-[#E1E7E3] bg-white px-3.5 shadow-2xs focus-within:border-[#35B99D] focus-within:ring-2 focus-within:ring-[#35B99D]/20 transition">
          <Search className="h-4 w-4 text-[#66706C] shrink-0" />
          <input
            type="search"
            aria-label="Search customers"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, phone, order ID, or address..."
            className="w-full bg-transparent text-sm text-[#1F2421] placeholder-[#66706C] outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="grid h-7 w-7 place-items-center rounded-lg text-[#66706C] hover:bg-[#F4F7F5] hover:text-[#1F2421]">
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </label>

        <div className="flex items-center gap-2 shrink-0">
          <label className="flex min-h-11 items-center gap-2 rounded-xl border border-[#E1E7E3] bg-white px-3 shadow-2xs text-sm text-[#1F2421]">
            <ArrowUpDown className="h-4 w-4 text-[#66706C] shrink-0" />
            <span className="text-xs font-semibold text-[#66706C] hidden sm:inline">Sort:</span>
            <select
              aria-label="Sort customers"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as CustomerSortOption)}
              className="bg-transparent text-sm font-semibold text-[#1F2421] outline-none cursor-pointer">
              <option value="recent">Most recent</option>
              <option value="spend">Highest spend</option>
              <option value="orders">Most orders</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </label>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="overflow-hidden rounded-xl border border-[#E1E7E3] bg-white shadow-2xs">
        {loading ? (
          <AdminLoadingState message="Loading customers…" />
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-sm font-semibold text-[#1F2421]">Could not load customers</p>
            <p className="mt-1 text-sm text-[#66706C]">{error}</p>
            <div className="mt-4">
              <AdminButton variant="secondary" size="sm" onClick={() => void load()}>
                Retry
              </AdminButton>
            </div>
          </div>
        ) : rawSummaries.length === 0 ? (
          <div className="p-8">
            <AdminEmptyState
              title="No customers yet"
              description="Customer profiles will appear here automatically once buyers place orders in your shop."
            />
          </div>
        ) : filteredSummaries.length === 0 ? (
          <div className="p-8">
            <AdminEmptyState
              title="No customers match your search"
              description={`No customer records match "${query}". Try searching by a different name, phone number, address, or order ID.`}
              action={
                <AdminButton variant="secondary" size="sm" onClick={() => setQuery('')}>
                  Clear search
                </AdminButton>
              }
            />
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E1E7E3] bg-[#F4F7F5] text-xs font-semibold uppercase tracking-wider text-[#66706C]">
                    <th scope="col" className="px-5 py-3">Customer</th>
                    <th scope="col" className="px-5 py-3">Contact & Location</th>
                    <th scope="col" className="px-5 py-3 text-center">Orders</th>
                    <th scope="col" className="px-5 py-3 text-right">Recognized Spend</th>
                    <th scope="col" className="px-5 py-3">Last Order</th>
                    <th scope="col" className="px-5 py-3 text-right"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E1E7E3]">
                  {filteredSummaries.map((customer) => {
                    const initials = customer.name
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((p) => p[0]?.toUpperCase())
                      .join('') || 'C';

                    return (
                      <tr
                        key={customer.key}
                        className="group hover:bg-[#F4F7F5]/60 transition">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#D8F1EA] text-xs font-bold text-[#1F2421]">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-[#1F2421] truncate">
                                {customer.name}
                              </p>
                              {customer.orderCount > 1 ? (
                                <span className="inline-flex items-center rounded-md bg-[#D8F1EA] px-1.5 py-0.5 text-[11px] font-semibold text-[#29957F]">
                                  Repeat
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-medium text-[#1F2421]">{customer.phone || '—'}</p>
                          {customer.latestAddress ? (
                            <p className="text-xs text-[#66706C] truncate max-w-xs">{customer.latestAddress}</p>
                          ) : null}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex min-h-7 items-center rounded-full bg-[#F4F7F5] px-2.5 py-0.5 text-xs font-semibold text-[#1F2421]">
                            {customer.orderCount} {customer.orderCount === 1 ? 'order' : 'orders'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <p className="font-bold tabular-nums text-[#1F2421]">{ks(customer.totalSpend)}</p>
                          <p className="text-[11px] text-[#66706C]">
                            {customer.recognizedOrderCount} of {customer.orderCount} paid
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-[#1F2421]">#{customer.lastOrderId}</p>
                          <p className="text-xs text-[#66706C]">{formatDate(customer.lastOrderAt)}</p>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <AdminButton
                            variant="secondary"
                            size="sm"
                            onClick={() => setSelectedCustomer(customer)}>
                            View details
                          </AdminButton>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="divide-y divide-[#E1E7E3] md:hidden">
              {filteredSummaries.map((customer) => {
                const initials = customer.name
                  .split(' ')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((p) => p[0]?.toUpperCase())
                  .join('') || 'C';

                return (
                  <div
                    key={customer.key}
                    className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#D8F1EA] text-sm font-bold text-[#1F2421]">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-[#1F2421] truncate">{customer.name}</p>
                          <p className="text-xs text-[#66706C]">{customer.phone || 'No phone'}</p>
                        </div>
                      </div>
                      {customer.orderCount > 1 ? (
                        <AdminStatusBadge tone="success">Repeat</AdminStatusBadge>
                      ) : (
                        <AdminStatusBadge tone="neutral">1 Order</AdminStatusBadge>
                      )}
                    </div>

                    {customer.latestAddress ? (
                      <p className="text-xs text-[#66706C] truncate">{customer.latestAddress}</p>
                    ) : null}

                    <div className="grid grid-cols-2 gap-2 rounded-lg bg-[#F4F7F5] p-2.5 text-xs">
                      <div>
                        <span className="text-[#66706C] block">Recognized Spend</span>
                        <span className="font-bold text-[#1F2421] tabular-nums">{ks(customer.totalSpend)}</span>
                      </div>
                      <div>
                        <span className="text-[#66706C] block">Last Order</span>
                        <span className="font-medium text-[#1F2421]">#{customer.lastOrderId}</span>
                        <span className="text-[11px] text-[#66706C] block">{formatDate(customer.lastOrderAt)}</span>
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <AdminButton
                        variant="secondary"
                        size="sm"
                        className="w-full min-h-[44px]"
                        onClick={() => setSelectedCustomer(customer)}>
                        View customer details
                      </AdminButton>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Selected Customer Details Drawer */}
      {selectedCustomer ? (
        <AdminCustomerDetail
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      ) : null}
    </div>
  );
}
