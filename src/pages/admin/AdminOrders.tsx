import {useEffect, useMemo, useState} from 'react';
import {Search, X, Trash2, Phone, MapPin, ShoppingCart} from 'lucide-react';
import {adminApi, type AdminOrder} from '../../lib/store';
import {ks, cx} from '../../lib/format';
import {statusMeta, ADMIN_STATUS_OPTIONS, ORDER_STATUS, type OrderStatus} from '../../lib/orderStatus';

// ---- Detail / edit drawer --------------------------------------------------
function OrderDetail({
  order,
  onClose,
  onChanged,
  onDeleted,
}: {
  order: AdminOrder;
  onClose: () => void;
  onChanged: (o: AdminOrder) => void;
  onDeleted: (id: string) => void;
}) {
  const [status, setStatus] = useState(order.status);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const changeStatus = async (next: string) => {
    const prev = status;
    setStatus(next); // optimistic
    setBusy(true);
    setErr('');
    try {
      await adminApi.updateOrderStatus(order.order_id, next);
      onChanged({...order, status: next});
    } catch (e: any) {
      setStatus(prev); // roll back the optimistic change on failure
      setErr(e.message || 'အခြေအနေ ပြောင်း၍မရပါ။');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm(`${order.order_id} ကို ဖျက်မည်။ သေချာပါသလား?`)) return;
    setBusy(true);
    setErr('');
    try {
      await adminApi.deleteOrder(order.order_id);
      onDeleted(order.order_id);
    } catch (e: any) {
      setErr(e.message || 'ဖျက်၍မရပါ။');
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-cream-200 px-5 py-4">
          <div>
            <p className="font-display text-lg font-bold text-brand-700">{order.order_id}</p>
            <p className="my text-xs text-ink-soft">{new Date(order.created_at).toLocaleString('en-GB')}</p>
          </div>
          <button onClick={onClose} aria-label="close" className="grid h-9 w-9 place-items-center rounded-lg text-ink-soft hover:bg-cream-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {/* Customer */}
          <section>
            <h4 className="my mb-2 text-xs font-bold uppercase tracking-wide text-ink-soft">ဝယ်သူ</h4>
            <div className="space-y-1.5 rounded-xl border border-cream-200 bg-cream-50 p-3 text-sm">
              <p className="my font-semibold text-ink">{order.customer_name || '—'}</p>
              {order.customer_phone && (
                <p className="my flex items-center gap-1.5 text-ink-soft">
                  <Phone className="h-3.5 w-3.5" /> {order.customer_phone}
                </p>
              )}
              {order.customer_address && (
                <p className="my flex items-start gap-1.5 text-ink-soft">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {order.customer_address}
                </p>
              )}
            </div>
          </section>

          {/* Items */}
          <section>
            <h4 className="my mb-2 text-xs font-bold uppercase tracking-wide text-ink-soft">ပစ္စည်းများ</h4>
            <div className="rounded-xl border border-cream-200">
              <ul className="divide-y divide-cream-200">
                {(order.items || []).map((it, i) => (
                  <li key={i} className="flex justify-between gap-2 px-3 py-2 text-sm">
                    <span className="my min-w-0 truncate text-ink">
                      {it.name} <span className="text-ink-soft">×{it.qty}</span>
                    </span>
                    <span className="shrink-0 font-semibold text-ink">{ks(it.price * it.qty)}</span>
                  </li>
                ))}
              </ul>
              <div className="space-y-1 border-t border-cream-200 px-3 py-2.5 text-sm">
                <Row label="ပစ္စည်းဖိုး" value={ks(order.item_total)} />
                <Row label="ပို့ခ" value={ks(order.delivery_fee)} />
                <div className="flex justify-between border-t border-cream-200 pt-1.5 font-bold">
                  <span className="text-ink">စုစုပေါင်း</span>
                  <span className="text-brand-700">{ks(order.grand_total)}</span>
                </div>
              </div>
            </div>
            <div className="my mt-2 text-xs text-ink-soft">
              <span>ငွေပေးချေမှု — {payMethodLabel(order.payment_method)}</span>
            </div>
          </section>

          {/* Manual payment confirmation (online orders only) */}
          {order.payment_method !== 'cod' && (
            <section>
              <h4 className="my mb-2 text-xs font-bold uppercase tracking-wide text-ink-soft">ငွေပေးချေမှု စစ်ဆေးရန်</h4>
              <div className="space-y-2 rounded-xl border border-cream-200 bg-cream-50 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="my text-ink-soft">လွှဲငွေ နောက်ဆုံး ၅ လုံး</span>
                  <span className="font-display text-lg font-bold tracking-[0.3em] text-brand-700">{order.paymentRefTail || '—'}</span>
                </div>
                <Row label="ရရန်ငွေ" value={ks(order.grand_total)} />
                <p className="my text-xs text-ink-soft">
                  KBZPay / WavePay app ထဲတွင် ဤ ၅ လုံး + ပမာဏကို တိုက်ဆိုင်စစ်ဆေးပြီးမှ အတည်ပြုပါ။
                </p>
                {(status === 'pending_payment' || status === 'partial_checked') && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {status === 'pending_payment' && (
                      <button
                        disabled={busy}
                        onClick={() => changeStatus('checked')}
                        className="my rounded-xl bg-emerald-500 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-50">
                        ✓ ငွေအပြည့် ရပြီ
                      </button>
                    )}
                    {status === 'pending_payment' && (
                      <button
                        disabled={busy}
                        onClick={() => changeStatus('partial_checked')}
                        className="my rounded-xl border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-50">
                        စရံသာ ရပြီ
                      </button>
                    )}
                    {status === 'partial_checked' && (
                      <button
                        disabled={busy}
                        onClick={() => changeStatus('checked')}
                        className="my rounded-xl bg-emerald-500 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-50">
                        ✓ ကျန်ငွေ ရပြီ
                      </button>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Status */}
          <section>
            <h4 className="my mb-2 text-xs font-bold uppercase tracking-wide text-ink-soft">အခြေအနေ ပြောင်းရန်</h4>
            <div className="grid grid-cols-2 gap-2">
              {ADMIN_STATUS_OPTIONS.map((s) => {
                const meta = ORDER_STATUS[s];
                const active = status === s;
                return (
                  <button
                    key={s}
                    disabled={busy}
                    onClick={() => changeStatus(s)}
                    className={cx(
                      'my rounded-xl border px-3 py-2 text-sm font-semibold transition disabled:opacity-60',
                      active
                        ? 'border-brand-500 bg-brand-500 text-white'
                        : 'border-cream-200 bg-white text-ink hover:bg-cream-100',
                    )}>
                    {meta.admin}
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <div className="border-t border-cream-200 p-4">
          {err && <p className="my mb-2 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-600">{err}</p>}
          <button
            onClick={remove}
            disabled={busy}
            className="my flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50">
            <Trash2 className="h-4 w-4" /> Order ဖျက်ရန်
          </button>
        </div>
      </div>
    </div>
  );
}

function payMethodLabel(m: string): string {
  return m === 'kpay' ? 'KBZPay' : m === 'wave' ? 'WavePay' : m === 'cod' ? 'Cash on Delivery' : m;
}

function Row({label, value}: {label: string; value: string}) {
  return (
    <div className="flex justify-between text-ink-soft">
      <span className="my">{label}</span>
      <span>{value}</span>
    </div>
  );
}

// ---- Page ------------------------------------------------------------------
const FILTERS: {value: string; label: string}[] = [
  {value: 'all', label: 'အားလုံး'},
  ...ADMIN_STATUS_OPTIONS.map((s) => ({value: s, label: ORDER_STATUS[s].admin})),
];

export default function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [selected, setSelected] = useState<AdminOrder | null>(null);

  useEffect(() => {
    adminApi.listOrders().then((r) => {
      setOrders(r.orders);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return orders.filter((o) => {
      if (filter !== 'all' && o.status !== filter) return false;
      if (!term) return true;
      return (
        o.order_id.toLowerCase().includes(term) ||
        (o.customer_name ?? '').toLowerCase().includes(term) ||
        (o.customer_phone ?? '').includes(term)
      );
    });
  }, [orders, q, filter]);

  const onChanged = (updated: AdminOrder) => {
    setOrders((prev) => prev.map((o) => (o.order_id === updated.order_id ? updated : o)));
    setSelected(updated);
  };

  const onDeleted = (id: string) => {
    setOrders((prev) => prev.filter((o) => o.order_id !== id));
    setSelected(null);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Order စီမံခန့်ခွဲမှု</h1>
        <p className="my mt-1 text-sm text-ink-soft">{orders.length} order · အခြေအနေ ပြောင်း / အသေးစိတ်ကြည့်နိုင်သည်</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 rounded-full border border-cream-200 bg-white px-4 py-2 shadow-sm focus-within:border-brand-400 sm:max-w-xs">
          <Search className="h-4 w-4 text-ink-soft" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Order ID / အမည် / ဖုန်း…"
            className="my w-full bg-transparent text-sm outline-none placeholder:text-ink-soft"
          />
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cx(
                'my shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition',
                filter === f.value ? 'bg-ink text-white' : 'border border-cream-200 bg-white text-ink-soft hover:bg-cream-100',
              )}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-cream-200 bg-white">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({length: 6}).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-cream-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-14 text-center">
            <ShoppingCart className="h-8 w-8 text-ink-soft/40" />
            <p className="my text-sm text-ink-soft">
              {orders.length === 0 ? 'Order မရှိသေးပါ။ ဆိုင်တွင် order တင်ကြည့်ပါ။' : 'ကိုက်ညီသော order မတွေ့ပါ။'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-cream-200">
            {filtered.map((o) => {
              const st = statusMeta(o.status);
              return (
                <li key={o.order_id}>
                  <button
                    onClick={() => setSelected(o)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-cream-50/60">
                    <div className="min-w-0">
                      <p className="font-display text-sm font-bold text-brand-700">{o.order_id}</p>
                      <p className="my truncate text-xs text-ink-soft">
                        {o.customer_name || '—'}
                        {o.customer_phone ? ` · ${o.customer_phone}` : ''} ·{' '}
                        {new Date(o.created_at).toLocaleDateString('en-GB')}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      {(o.status === 'pending_payment' || o.status === 'partial_checked') && o.paymentRefTail && (
                        <span className="my rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-amber-700">
                          …{o.paymentRefTail}
                        </span>
                      )}
                      <span className="text-sm font-bold text-ink">{ks(o.grand_total)}</span>
                      <span className={`my w-[92px] rounded-full px-2.5 py-1 text-center text-[11px] font-semibold ${st.cls}`}>
                        {st.admin}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {selected && (
        <OrderDetail order={selected} onClose={() => setSelected(null)} onChanged={onChanged} onDeleted={onDeleted} />
      )}
    </div>
  );
}
