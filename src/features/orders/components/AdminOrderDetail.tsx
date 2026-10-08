import {useState} from 'react';
import {CheckCircle2, Clock, Info, MapPin, Phone, ShieldCheck, X} from 'lucide-react';
import {adminApi} from '@/data/dataSource';
import type {AdminOrder} from '@/domain/order';
import {ADMIN_STATUS_OPTIONS} from '@/domain/orderStatus';
import {usePlan} from '@/features/billing/plan';
import {useModalA11y} from '@/shared/hooks/useModalA11y';
import {ks} from '@/shared/lib/format';
import AdminStatusBadge from '@/features/admin/components/AdminStatusBadge';
import AdminButton from '@/features/admin/components/AdminButton';
import {
  getOrderStage,
  getOrderStageLabel,
  getOrderStageTone,
  getPaymentDisplayInfo,
  getFulfillmentDisplayInfo,
  getAllowedStageTransitions,
  type AllowedTransition,
} from '@/features/orders/lib/orderStage';

function SummaryRow({label, value}: {label: string; value: string}) {
  return (
    <div className="flex justify-between gap-4 text-sm text-[#66706C]">
      <span>{label}</span>
      <span className="text-right font-medium text-[#1F2421]">{value}</span>
    </div>
  );
}

export function AdminOrderDetail({
  order,
  onClose,
  onChanged,
}: {
  order: AdminOrder;
  onClose: () => void;
  onChanged: (order: AdminOrder) => void;
}) {
  const {features} = usePlan();
  const [currentOrder, setCurrentOrder] = useState<AdminOrder>(order);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [pendingTransition, setPendingTransition] = useState<AllowedTransition | null>(null);

  const panelRef = useModalA11y<HTMLDivElement>(onClose);

  // Validate status against canonical options
  const isRecognizedStatus = ADMIN_STATUS_OPTIONS.includes(currentOrder.status as any) || currentOrder.status === 'cod_pending';
  if (!isRecognizedStatus) {
    // Fail-safe fallback if unknown
  }

  const stage = getOrderStage(currentOrder.status);
  const stageLabel = getOrderStageLabel(stage);
  const stageTone = getOrderStageTone(stage);
  const payment = getPaymentDisplayInfo(currentOrder);
  const fulfillment = getFulfillmentDisplayInfo(currentOrder.status);
  const allowedTransitions = getAllowedStageTransitions(
    currentOrder,
    features.paymentVerification,
  );

  async function executeTransition(transition: AllowedTransition) {
    setBusy(true);
    setError('');
    setSuccessMessage('');
    try {
      await adminApi.updateOrderStatus(currentOrder.order_id, transition.targetStatus);
      const updated: AdminOrder = {
        ...currentOrder,
        status: transition.targetStatus,
      };
      setCurrentOrder(updated);
      onChanged(updated);
      setSuccessMessage(`Order updated to ${transition.label}. Resulting stage: ${getOrderStageLabel(transition.resultingStage)}.`);
      setPendingTransition(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update order status.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close order detail"
        className="fixed inset-0 bg-[#1F2421]/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-detail-title"
        tabIndex={-1}
        className="relative flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl outline-none z-10">
        
        {/* Header */}
        <header className="flex items-start justify-between border-b border-[#E1E7E3] bg-[#F4F7F5] px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 id="order-detail-title" className="text-xl font-bold text-[#1F2421]">
                {currentOrder.order_id}
              </h2>
              <AdminStatusBadge tone={stageTone}>
                {stageLabel}
              </AdminStatusBadge>
            </div>
            <p className="mt-1 text-xs text-[#66706C]">
              Placed on {new Date(currentOrder.created_at).toLocaleString('en-GB', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close order detail"
            className="grid h-10 w-10 place-items-center rounded-lg text-[#66706C] hover:bg-white hover:text-[#1F2421] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35B99D]">
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Scrollable Body */}
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {error ? (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              <p className="font-semibold">Update failed</p>
              <p className="mt-1">{error}</p>
            </div>
          ) : null}

          {successMessage ? (
            <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <p>{successMessage}</p>
            </div>
          ) : null}

          {/* Section: Current Order Stage & Allowed Actions */}
          <section className="rounded-xl border border-[#E1E7E3] bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#E1E7E3]">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#66706C]">Order Stage</h3>
                <div className="mt-1 flex items-center gap-2">
                  <AdminStatusBadge tone={stageTone}>
                    {stageLabel}
                  </AdminStatusBadge>
                  <span className="text-xs text-[#66706C]">
                    Fulfillment: {fulfillment.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Allowed Status Actions */}
            <div className="mt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[#66706C] mb-2.5">
                Allowed Stage Actions
              </p>
              {allowedTransitions.length > 0 ? (
                <div className="flex flex-wrap gap-2.5">
                  {allowedTransitions.map((transition) => (
                    <AdminButton
                      key={transition.targetStatus}
                      type="button"
                      variant={transition.variant}
                      size="md"
                      disabled={busy}
                      className="min-h-[44px]"
                      onClick={() => setPendingTransition(transition)}>
                      {transition.label}
                    </AdminButton>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#66706C] italic">
                  {stage === 'delivered'
                    ? 'This order has been delivered and completed.'
                    : stage === 'cancelled'
                    ? 'This order is cancelled and terminal.'
                    : 'No additional stage actions are available for this order.'}
                </p>
              )}
            </div>
          </section>

          {/* Section: Customer Information */}
          <section className="rounded-xl border border-[#E1E7E3] bg-white p-5 shadow-xs">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#66706C]">
              Customer Information
            </h3>
            <div className="space-y-2">
              <p className="font-semibold text-[#1F2421] text-base">
                {currentOrder.customer_name || 'Guest Customer'}
              </p>
              {currentOrder.customer_phone ? (
                <a
                  href={`tel:${currentOrder.customer_phone}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#29957F] hover:underline min-h-[44px]">
                  <Phone className="h-4 w-4" />
                  {currentOrder.customer_phone}
                </a>
              ) : (
                <p className="text-sm text-[#66706C]">No contact phone recorded</p>
              )}
            </div>
          </section>

          {/* Section: Delivery Information */}
          <section className="rounded-xl border border-[#E1E7E3] bg-white p-5 shadow-xs">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#66706C]">
              Delivery Address & Logistics
            </h3>
            <div className="flex items-start gap-3 text-sm text-[#1F2421]">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#29957F]" />
              <div>
                <p className="font-medium">
                  {currentOrder.customer_address || 'No street address recorded.'}
                </p>
                <p className="mt-1 text-xs text-[#66706C]">
                  Status: {fulfillment.label}
                </p>
              </div>
            </div>
          </section>

          {/* Section: Ordered Products */}
          <section className="rounded-xl border border-[#E1E7E3] bg-white overflow-hidden shadow-xs">
            <div className="p-4 border-b border-[#E1E7E3] bg-[#F4F7F5]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#66706C]">
                Ordered Products
              </h3>
            </div>
            <ul className="divide-y divide-[#E1E7E3]">
              {(currentOrder.items || []).map((item, index) => (
                <li key={index} className="flex justify-between items-center gap-4 px-5 py-3.5 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[#1F2421] truncate">{item.name}</p>
                    {(item.variantName || item.variantSku) && (
                      <p className="text-xs text-[#6B746F] truncate">
                        {[item.variantName, item.variantSku].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    <p className="text-xs text-[#66706C] mt-0.5">
                      {ks(item.price)} × {item.qty}
                    </p>
                  </div>
                  <span className="shrink-0 font-semibold text-[#1F2421]">
                    {ks(item.price * item.qty)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="space-y-2 border-t border-[#E1E7E3] bg-[#F4F7F5]/50 px-5 py-4">
              <SummaryRow label="Items Subtotal" value={ks(currentOrder.item_total)} />
              <SummaryRow label="Delivery Fee" value={ks(currentOrder.delivery_fee)} />
              <div className="border-t border-[#E1E7E3] pt-2">
                <div className="flex justify-between gap-4 text-base font-bold text-[#1F2421]">
                  <span>Grand Total</span>
                  <span>{ks(currentOrder.grand_total)}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Payment Information */}
          <section className="rounded-xl border border-[#E1E7E3] bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#66706C]">
                Payment Information
              </h3>
              <AdminStatusBadge tone={payment.tone}>
                {payment.label}
              </AdminStatusBadge>
            </div>
            <div className="space-y-2.5">
              <SummaryRow label="Payment Method" value={payment.methodLabel} />
              {currentOrder.payment_method !== 'cod' ? (
                <SummaryRow
                  label="Transfer Reference (Last 5)"
                  value={currentOrder.paymentRefTail ? `…${currentOrder.paymentRefTail}` : 'Not provided'}
                />
              ) : null}
              <SummaryRow label="Total Amount" value={ks(currentOrder.grand_total)} />
            </div>

            {/* Quick payment verification for pending payment */}
            {currentOrder.payment_method !== 'cod' && features.paymentVerification && (currentOrder.status === 'pending_payment' || currentOrder.status === 'partial_checked') ? (
              <div className="mt-4 pt-3 border-t border-[#E1E7E3] flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#29957F]" />
                <span className="text-xs text-[#66706C]">
                  Verify against transfer reference before confirming.
                </span>
              </div>
            ) : null}
          </section>

          {/* Section: Timeline / Audit Metadata */}
          <section className="rounded-xl border border-[#E1E7E3] bg-[#F4F7F5] p-5 text-xs text-[#66706C]">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#1F2421] flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Order Timestamps
            </h3>
            <div className="space-y-1 mt-2">
              <p>
                <span className="font-semibold text-[#1F2421]">Created:</span> {new Date(currentOrder.created_at).toLocaleString('en-GB')}
              </p>
              <div className="mt-2 flex items-start gap-1.5 text-[#66706C] pt-2 border-t border-[#E1E7E3]">
                <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <p>
                  Per-event status audit history is recorded in database transactional logs; seller-facing view reflects authoritative current state.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Confirmation Dialog Modal */}
      {pendingTransition ? (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Dismiss confirmation dialog"
            className="fixed inset-0 bg-[#1F2421]/70 backdrop-blur-xs"
            onClick={() => !busy && setPendingTransition(null)}
          />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-desc"
            className="relative w-full max-w-md rounded-2xl border border-[#E1E7E3] bg-white p-6 shadow-2xl z-10 space-y-4">
            <h3 id="confirm-dialog-title" className="text-lg font-bold text-[#1F2421]">
              {pendingTransition.confirmationTitle}
            </h3>
            <p id="confirm-dialog-desc" className="text-sm text-[#66706C]">
              {pendingTransition.confirmationMessage}
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <AdminButton
                type="button"
                variant="secondary"
                size="md"
                disabled={busy}
                onClick={() => setPendingTransition(null)}>
                Cancel
              </AdminButton>
              <AdminButton
                type="button"
                variant={pendingTransition.variant}
                size="md"
                disabled={busy}
                onClick={() => void executeTransition(pendingTransition)}>
                {busy ? 'Updating…' : 'Confirm'}
              </AdminButton>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
