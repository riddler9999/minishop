import type {AdminOrder} from '@/domain/order';
import {statusMeta} from '@/domain/orderStatus';
import {ks} from '@/shared/lib/format';

function paymentLabel(method: string) {
  return method === 'kpay' ? 'KBZPay' : method === 'wave' ? 'WavePay' : method === 'cod' ? 'Cash on Delivery' : method;
}

function fulfillmentLabel(status: string) {
  if (status === 'shipped') return 'Shipped';
  if (status === 'completed') return 'Completed';
  if (status === 'cancelled') return 'Cancelled';
  return 'Not shipped';
}

export function AdminOrdersTable({
  orders,
  onSelect,
}: {
  orders: AdminOrder[];
  onSelect: (order: AdminOrder) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Order</th>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Payment</th>
            <th className="px-4 py-3">Fulfillment</th>
            <th className="px-4 py-3 text-right">Amount</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {orders.map((order) => {
            const status = statusMeta(order.status);
            return (
              <tr key={order.order_id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <button className="font-semibold text-violet-700 hover:underline" onClick={() => onSelect(order)}>
                    {order.order_id}
                  </button>
                  <div className="mt-1 text-xs text-slate-500">{new Date(order.created_at).toLocaleDateString('en-GB')}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{order.customer_name || '—'}</div>
                  <div className="text-xs text-slate-500">{order.customer_phone || 'No phone'}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-800">{paymentLabel(order.payment_method)}</div>
                  {order.paymentRefTail && order.payment_method !== 'cod' ? (
                    <div className="text-xs text-amber-700">Ref …{order.paymentRefTail}</div>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-slate-700">{fulfillmentLabel(order.status)}</td>
                <td className="px-4 py-3 text-right font-semibold text-slate-900">{ks(order.grand_total)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${status.cls}`}>
                    {status.admin}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
