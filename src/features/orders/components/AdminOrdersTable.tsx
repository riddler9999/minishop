import {Eye} from 'lucide-react';
import type {AdminOrder} from '@/domain/order';
import {statusMeta} from '@/domain/orderStatus';
import {ks} from '@/shared/lib/format';
import AdminStatusBadge from '@/features/admin/components/AdminStatusBadge';
import AdminButton from '@/features/admin/components/AdminButton';
import {
  getOrderStage,
  getOrderStageLabel,
  getOrderStageTone,
  getPaymentDisplayInfo,
  getFulfillmentDisplayInfo,
} from '@/features/orders/lib/orderStage';

export function AdminOrdersTable({
  orders,
  onSelect,
}: {
  orders: AdminOrder[];
  onSelect: (order: AdminOrder) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#E1E7E3] bg-white shadow-sm">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="border-b border-[#E1E7E3] bg-[#F4F7F5] text-xs font-semibold uppercase tracking-wide text-[#66706C]">
            <tr>
              <th scope="col" className="px-4 py-3">Order</th>
              <th scope="col" className="px-4 py-3">Customer</th>
              <th scope="col" className="px-4 py-3">Stage</th>
              <th scope="col" className="px-4 py-3">Payment</th>
              <th scope="col" className="px-4 py-3">Fulfillment</th>
              <th scope="col" className="px-4 py-3 text-right">Amount</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E1E7E3]">
            {orders.map((order) => {
              const meta = statusMeta(order.status);
              const stage = getOrderStage(order.status);
              const stageLabel = getOrderStageLabel(stage);
              const stageTone = getOrderStageTone(stage);
              const payment = getPaymentDisplayInfo(order);
              const fulfillment = getFulfillmentDisplayInfo(order.status);

              return (
                <tr key={order.order_id} className="hover:bg-[#F4F7F5]/50 transition-colors">
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className="font-semibold text-[#1F2421] hover:text-[#29957F] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35B99D] rounded"
                      onClick={() => onSelect(order)}>
                      {order.order_id}
                    </button>
                    <div className="mt-0.5 text-xs text-[#66706C]">
                      {new Date(order.created_at).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-[#1F2421]">{order.customer_name || '—'}</div>
                    <div className="text-xs text-[#66706C]">{order.customer_phone || 'No phone'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <AdminStatusBadge tone={stageTone}>
                      {stageLabel}
                    </AdminStatusBadge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-[#1F2421]">{payment.methodLabel}</span>
                    </div>
                    <div className="mt-0.5 text-xs text-[#66706C]">
                      <span className="font-medium">{payment.label}</span>
                      {order.paymentRefTail && order.payment_method !== 'cod' ? (
                        <span className="ml-1 text-amber-800 font-mono">Ref …{order.paymentRefTail}</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <AdminStatusBadge tone={fulfillment.tone}>
                      {fulfillment.label}
                    </AdminStatusBadge>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-[#1F2421]">
                    {ks(order.grand_total)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-[#66706C]" title={`Backend status: ${order.status}`}>
                      {meta.admin}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <AdminButton
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => onSelect(order)}>
                      <Eye className="h-3.5 w-3.5" /> View
                    </AdminButton>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card / List View */}
      <ul className="md:hidden divide-y divide-[#E1E7E3] w-full overflow-x-hidden">
        {orders.map((order) => {
          const stage = getOrderStage(order.status);
          const stageLabel = getOrderStageLabel(stage);
          const stageTone = getOrderStageTone(stage);
          const payment = getPaymentDisplayInfo(order);
          const fulfillment = getFulfillmentDisplayInfo(order.status);

          return (
            <li key={order.order_id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="font-bold text-base text-[#1F2421] hover:text-[#29957F] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35B99D] rounded"
                      onClick={() => onSelect(order)}>
                      {order.order_id}
                    </button>
                    <AdminStatusBadge tone={stageTone}>
                      {stageLabel}
                    </AdminStatusBadge>
                  </div>
                  <p className="mt-1 font-medium text-sm text-[#1F2421] truncate">
                    {order.customer_name || 'Guest Customer'}
                  </p>
                  <p className="text-xs text-[#66706C]">
                    {order.customer_phone || 'No phone'} · {new Date(order.created_at).toLocaleDateString('en-GB')}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-base text-[#1F2421]">{ks(order.grand_total)}</div>
                  <AdminStatusBadge tone={fulfillment.tone}>
                    {fulfillment.label}
                  </AdminStatusBadge>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-[#E1E7E3] pt-3 text-xs text-[#66706C]">
                <div>
                  <span className="font-medium text-[#1F2421]">{payment.methodLabel}</span>
                  <span className="mx-1">·</span>
                  <span>{payment.label}</span>
                  {order.paymentRefTail && order.payment_method !== 'cod' ? (
                    <span className="ml-1 text-amber-800 font-mono">…{order.paymentRefTail}</span>
                  ) : null}
                </div>
                <AdminButton
                  type="button"
                  variant="secondary"
                  size="md"
                  className="min-h-[44px] min-w-[88px]"
                  onClick={() => onSelect(order)}>
                  <Eye className="h-4 w-4" /> View
                </AdminButton>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
