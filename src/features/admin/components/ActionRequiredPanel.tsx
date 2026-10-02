import {ArrowRight, CheckCircle2} from 'lucide-react';
import {Link} from 'react-router-dom';
import type {AdminOrder} from '@/domain/order';
import {statusMeta} from '@/domain/orderStatus';
import AdminEmptyState from '@/features/admin/components/AdminEmptyState';
import AdminSurface from '@/features/admin/components/AdminSurface';

export default function ActionRequiredPanel({orders}: {orders: AdminOrder[]}) {
  return (
    <AdminSurface>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Priority queue</p>
          <h2 className="mt-1 text-lg font-bold text-slate-950">Action Required</h2>
        </div>
        <Link to="/admin/orders" className="inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-violet-700 hover:text-violet-900">
          View orders <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      {orders.length === 0 ? (
        <div className="mt-4">
          <AdminEmptyState
            title="No orders need attention"
            description="New payment checks and fulfilment actions will appear here."
          />
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100">
          {orders.slice(0, 4).map((order) => {
            const status = statusMeta(order.status);
            return (
              <li key={order.order_id}>
                <Link to="/admin/orders" className="flex min-h-16 items-center gap-3 rounded-lg px-1 py-3 hover:bg-slate-50">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-amber-600" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-950">#{order.order_id} · {order.customer_name || 'Customer'}</p>
                    <p className="mt-1 text-xs text-slate-500">{status.admin}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </AdminSurface>
  );
}
