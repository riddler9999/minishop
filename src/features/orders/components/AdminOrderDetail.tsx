import {useState} from 'react';
import {MapPin, Phone, X} from 'lucide-react';
import {adminApi} from '@/data/dataSource';
import type {AdminOrder} from '@/domain/order';
import {ADMIN_STATUS_OPTIONS, ORDER_STATUS} from '@/domain/orderStatus';
import {usePlan} from '@/features/billing/plan';
import {useModalA11y} from '@/shared/hooks/useModalA11y';
import {cx, ks} from '@/shared/lib/format';

function paymentLabel(method: string) {
  return method === 'kpay' ? 'KBZPay' : method === 'wave' ? 'WavePay' : method === 'cod' ? 'Cash on Delivery' : method;
}

function Row({label, value}: {label: string; value: string}) {
  return <div className="flex justify-between gap-4 text-sm text-slate-600"><span>{label}</span><span className="text-right font-medium text-slate-900">{value}</span></div>;
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
  const [status, setStatus] = useState(order.status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const panelRef = useModalA11y<HTMLDivElement>(onClose);

  async function changeStatus(next: string) {
    const previous = status;
    setStatus(next);
    setBusy(true);
    setError('');
    try {
      await adminApi.updateOrderStatus(order.order_id, next);
      onChanged({...order, status: next});
    } catch (err) {
      setStatus(previous);
      setError(err instanceof Error ? err.message : 'Could not update order status.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label="Close order detail" className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="order-detail-title" tabIndex={-1} className="relative flex h-full w-full max-w-xl flex-col bg-white shadow-2xl outline-none">
        <header className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Order detail</p>
            <h2 id="order-detail-title" className="mt-1 text-xl font-bold text-slate-950">{order.order_id}</h2>
            <p className="mt-1 text-xs text-slate-500">{new Date(order.created_at).toLocaleString('en-GB')}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close order detail" className="grid h-10 w-10 place-items-center rounded-lg text-slate-600 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Customer</h3>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="font-semibold text-slate-950">{order.customer_name || '—'}</p>
              {order.customer_phone ? <p className="mt-2 flex items-center gap-2 text-sm text-slate-600"><Phone className="h-4 w-4" />{order.customer_phone}</p> : null}
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Delivery</h3>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="flex items-start gap-2 text-sm text-slate-700"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />{order.customer_address || 'No delivery address recorded.'}</p>
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Items</h3>
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <ul className="divide-y divide-slate-200">
                {(order.items || []).map((item, index) => (
                  <li key={index} className="flex justify-between gap-4 px-4 py-3 text-sm">
                    <span className="min-w-0 truncate text-slate-800">{item.name} <span className="text-slate-500">×{item.qty}</span></span>
                    <span className="shrink-0 font-semibold text-slate-950">{ks(item.price * item.qty)}</span>
                  </li>
                ))}
              </ul>
              <div className="space-y-2 border-t border-slate-200 px-4 py-3">
                <Row label="Items subtotal" value={ks(order.item_total)} />
                <Row label="Delivery fee" value={ks(order.delivery_fee)} />
                <Row label="Total" value={ks(order.grand_total)} />
              </div>
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Payment</h3>
            <div className="space-y-2 rounded-xl border border-slate-200 p-4">
              <Row label="Method" value={paymentLabel(order.payment_method)} />
              {order.payment_method !== 'cod' ? <Row label="Transfer reference" value={order.paymentRefTail ? `…${order.paymentRefTail}` : '—'} /> : null}
              <Row label="Amount" value={ks(order.grand_total)} />
              {order.payment_method !== 'cod' && features.paymentVerification && (status === 'pending_payment' || status === 'partial_checked') ? (
                <div className="flex flex-wrap gap-2 pt-2">
                  {status === 'pending_payment' ? <>
                    <button disabled={busy} onClick={() => void changeStatus('checked')} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Mark fully paid</button>
                    <button disabled={busy} onClick={() => void changeStatus('partial_checked')} className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 disabled:opacity-50">Mark deposit paid</button>
                  </> : null}
                  {status === 'partial_checked' ? <button disabled={busy} onClick={() => void changeStatus('checked')} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Mark remaining paid</button> : null}
                </div>
              ) : null}
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Status</h3>
            <div className="grid grid-cols-2 gap-2">
              {ADMIN_STATUS_OPTIONS.map((option) => {
                const meta = ORDER_STATUS[option];
                const active = status === option;
                return <button key={option} disabled={busy} onClick={() => void changeStatus(option)} className={cx('rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-50', active ? 'border-violet-600 bg-violet-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50')}>{meta.admin}</button>;
              })}
            </div>
            {error ? <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          </section>
        </div>
      </div>
    </div>
  );
}
