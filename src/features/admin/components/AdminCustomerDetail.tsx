import {Calendar, MapPin, Phone, ShoppingBag, X} from 'lucide-react';
import type {CustomerSummary} from '@/features/admin/lib/customerSummary';
import type {AdminOrder} from '@/domain/order';
import {useModalA11y} from '@/shared/hooks/useModalA11y';
import {ks} from '@/shared/lib/format';
import AdminStatusBadge from '@/features/admin/components/AdminStatusBadge';

function getStatusBadge(status: string): {label: string; tone: 'neutral' | 'success' | 'warning' | 'danger' | 'info'} {
  switch (status) {
    case 'cod_pending':
      return {label: 'COD Pending', tone: 'neutral'};
    case 'pending_payment':
      return {label: 'Pending Payment', tone: 'warning'};
    case 'partial_checked':
      return {label: 'Deposit Verified', tone: 'info'};
    case 'checked':
      return {label: 'Confirmed', tone: 'info'};
    case 'shipped':
      return {label: 'Shipped', tone: 'info'};
    case 'completed':
      return {label: 'Delivered', tone: 'success'};
    case 'cancelled':
      return {label: 'Cancelled', tone: 'danger'};
    default:
      return {label: status, tone: 'neutral'};
  }
}

function getPaymentMethodLabel(method: string): string {
  switch (method) {
    case 'kpay':
      return 'KBZPay';
    case 'wave':
      return 'WavePay';
    case 'cod':
      return 'Cash on Delivery';
    default:
      return method || 'Unknown';
  }
}

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

export default function AdminCustomerDetail({
  customer,
  onClose,
}: {
  customer: CustomerSummary;
  onClose: () => void;
}) {
  const panelRef = useModalA11y<HTMLDivElement>(onClose);

  const initials = customer.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'C';

  const averageRecognized = customer.recognizedOrderCount > 0
    ? Math.round(customer.totalSpend / customer.recognizedOrderCount)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close customer details"
        className="fixed inset-0 bg-[#1F2421]/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-detail-title"
        className="relative z-10 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl overflow-y-auto">
        
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[#E1E7E3] bg-white px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#D8F1EA] text-base font-bold text-[#1F2421]">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 id="customer-detail-title" className="truncate text-lg font-bold text-[#1F2421]">
                  {customer.name}
                </h2>
                {customer.orderCount > 1 ? (
                  <AdminStatusBadge tone="success">Repeat Customer</AdminStatusBadge>
                ) : (
                  <AdminStatusBadge tone="neutral">First-Time Buyer</AdminStatusBadge>
                )}
              </div>
              <p className="truncate text-xs text-[#66706C]">
                {customer.phone || 'No phone recorded'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close customer details"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[#66706C] transition hover:bg-[#F4F7F5] hover:text-[#1F2421] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35B99D]">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-6 p-5 sm:p-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-[#E1E7E3] bg-[#F4F7F5]/50 p-3 text-center">
              <p className="text-xs font-medium text-[#66706C]">Total Spend</p>
              <p className="mt-1 text-base font-bold tabular-nums text-[#1F2421]">{ks(customer.totalSpend)}</p>
              <p className="mt-0.5 text-[11px] text-[#66706C]">Recognized sales</p>
            </div>
            <div className="rounded-xl border border-[#E1E7E3] bg-[#F4F7F5]/50 p-3 text-center">
              <p className="text-xs font-medium text-[#66706C]">Total Orders</p>
              <p className="mt-1 text-base font-bold tabular-nums text-[#1F2421]">{customer.orderCount}</p>
              <p className="mt-0.5 text-[11px] text-[#66706C]">Lifetime orders</p>
            </div>
            <div className="rounded-xl border border-[#E1E7E3] bg-[#F4F7F5]/50 p-3 text-center">
              <p className="text-xs font-medium text-[#66706C]">Avg Recognized</p>
              <p className="mt-1 text-base font-bold tabular-nums text-[#1F2421]">{ks(averageRecognized)}</p>
              <p className="mt-0.5 text-[11px] text-[#66706C]">Per confirmed order</p>
            </div>
          </div>

          {/* Customer Information Section */}
          <div className="rounded-xl border border-[#E1E7E3] bg-white p-4 space-y-3">
            <h3 className="text-sm font-bold text-[#1F2421]">Customer Information</h3>
            <div className="grid gap-2.5 text-sm">
              <div className="flex items-start gap-2.5 text-[#66706C]">
                <Phone className="h-4 w-4 mt-0.5 shrink-0 text-[#1F2421]" />
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-medium text-[#66706C] block">Phone number</span>
                  {customer.phone ? (
                    <a
                      href={`tel:${customer.phone}`}
                      className="font-medium text-[#1F2421] hover:text-[#35B99D] transition">
                      {customer.phone}
                    </a>
                  ) : (
                    <span className="text-slate-400">Not recorded</span>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-[#66706C]">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-[#1F2421]" />
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-medium text-[#66706C] block">Latest delivery address</span>
                  <span className="font-medium text-[#1F2421] break-words">
                    {customer.latestAddress || 'No address recorded'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-[#66706C]">
                <Calendar className="h-4 w-4 mt-0.5 shrink-0 text-[#1F2421]" />
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-medium text-[#66706C] block">Customer since</span>
                  <span className="font-medium text-[#1F2421]">
                    {formatDate(customer.firstOrderAt)} (First order: {customer.orders[customer.orders.length - 1]?.order_id || '—'})
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-[#66706C] border-t border-[#E1E7E3] pt-2">
                <ShoppingBag className="h-4 w-4 mt-0.5 shrink-0 text-[#1F2421]" />
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-medium text-[#66706C] block">Identity key</span>
                  <span className="font-mono text-xs text-[#66706C]">{customer.key}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Purchase History */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#1F2421]">Order History ({customer.orders.length})</h3>
              <span className="text-xs text-[#66706C]">Newest first</span>
            </div>

            <div className="space-y-3">
              {customer.orders.map((customerOrder: AdminOrder) => {
                const status = getStatusBadge(customerOrder.status);
                const paymentLabel = getPaymentMethodLabel(customerOrder.payment_method);
                return (
                  <div
                    key={customerOrder.order_id}
                    className="rounded-xl border border-[#E1E7E3] bg-white p-4 shadow-2xs space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#1F2421]">#{customerOrder.order_id}</span>
                          <AdminStatusBadge tone={status.tone}>{status.label}</AdminStatusBadge>
                        </div>
                        <p className="mt-0.5 text-xs text-[#66706C]">{formatDate(customerOrder.created_at)}</p>
                      </div>
                      <p className="text-sm font-bold tabular-nums text-[#1F2421]">{ks(customerOrder.grand_total)}</p>
                    </div>

                    {/* Items */}
                    {customerOrder.items && customerOrder.items.length > 0 ? (
                      <div className="rounded-lg bg-[#F4F7F5] p-2.5 text-xs text-[#1F2421] space-y-1">
                        {customerOrder.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between gap-2">
                            <span className="truncate">{item.qty}x {item.name}</span>
                            <span className="shrink-0 font-medium">{ks(item.price * item.qty)}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {/* Payment & Delivery breakdown */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#66706C] pt-1 border-t border-[#E1E7E3]">
                      <span>Payment: <strong className="text-[#1F2421] font-medium">{paymentLabel}</strong>{customerOrder.paymentRefTail ? ` (Tail: ${customerOrder.paymentRefTail})` : ''}</span>
                      <span>Delivery: <strong className="text-[#1F2421] font-medium">{ks(customerOrder.delivery_fee)}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Read-Only Notice */}
          <div className="rounded-xl border border-dashed border-[#E1E7E3] bg-[#F4F7F5] p-3 text-center text-xs text-[#66706C]">
            Customer profiles are automatically derived from shop order records. Direct customer data editing is not supported.
          </div>
        </div>
      </div>
    </div>
  );
}
