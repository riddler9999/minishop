import {ArrowRight, Package} from 'lucide-react';
import {Link} from 'react-router-dom';
import type {AdminOrder} from '@/domain/order';
import AdminEmptyState from '@/features/admin/components/AdminEmptyState';
import AdminSurface from '@/features/admin/components/AdminSurface';
import AdminStatusBadge from '@/features/admin/components/AdminStatusBadge';
import {statusMeta} from '@/domain/orderStatus';

function money(value: number) {
  return `K ${Math.round(value).toLocaleString('en-US')}`;
}

export default function RecentOrdersPanel({orders}: {orders: AdminOrder[]}) {
  return (
    <AdminSurface>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-950">Recent Orders</h2>
        <Link to="/admin/orders" className="inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-violet-700 hover:text-violet-900">
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      {orders.length === 0 ? (
        <div className="mt-4">
          <AdminEmptyState title="No orders yet" description="Orders will appear here after a customer completes checkout." />
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100">
          {orders.slice(0, 5).map((order) => (
            <li key={order.order_id} className="flex items-center gap-3 py-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500"><Package className="h-4 w-4" /></div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-950">#{order.order_id} · {order.customer_name || 'Customer'}</p>
                <div className="mt-1"><AdminStatusBadge>{statusMeta(order.status).admin}</AdminStatusBadge></div>
              </div>
              <span className="shrink-0 text-sm font-bold text-slate-950">{money(order.grand_total)}</span>
            </li>
          ))}
        </ul>
      )}
    </AdminSurface>
  );
}
