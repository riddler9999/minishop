import {useCallback, useEffect, useState} from 'react';
import {useSearchParams} from 'react-router-dom';
import {Package, Search} from 'lucide-react';
import {api} from '@/data/dataSource';
import type {TrackedOrder} from '@/domain/order';
import {ks} from '@/shared/lib/format';
import {statusMeta} from '@/domain/orderStatus';

export default function OrderLookup() {
  const [params] = useSearchParams();
  const [phone, setPhone] = useState(params.get('phone') ?? '');
  const [orderNo, setOrderNo] = useState(params.get('orderNo') ?? '');
  const [orders, setOrders] = useState<TrackedOrder[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  // Both phone AND order number are required — the live backend's lookup_order
  // RPC needs both (anti-enumeration; a phone alone would expose a buyer's whole
  // order history). Phone-only lookup is retired everywhere for consistency.
  const runSearch = useCallback(async (phoneVal: string, orderVal: string) => {
    if (!phoneVal.trim() || !orderVal.trim()) return;
    setLoading(true);
    setErr('');
    setOrders(null);
    try {
      const r = await api.ordersByPhone(phoneVal.trim(), orderVal.trim());
      setOrders(r.orders);
    } catch (e: any) {
      setErr(e.message || 'ရှာဖွေ၍မရပါ');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-track when arriving from the thank-you page with ?phone=…&orderNo=…
  useEffect(() => {
    const p = params.get('phone');
    const o = params.get('orderNo');
    if (p && o) runSearch(p, o);
    // A link with only one of the two params can't auto-search anymore (both
    // now required) — tell the buyer instead of silently doing nothing.
    else if (p || o) setErr('ဖုန်းနံပါတ် နှင့် Order နံပါတ် နှစ်ခုလုံး ဖြည့်ပြီး ရှာပါ။');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch(phone, orderNo);
  };

  return (
    <div className="commerce-page mx-auto max-w-2xl px-4 py-10">
      <div className="text-center">
        <div className="commerce-icon-well mx-auto grid h-14 w-14 place-items-center rounded-full">
          <Package className="h-6 w-6" />
        </div>
        <h1 className="commerce-title my mt-3 font-display text-2xl font-bold">Order စစ်ဆေးရန်</h1>
        <p className="commerce-muted my mt-1 text-sm">Order တင်စဉ်က ဖုန်းနံပါတ် နှင့် Order နံပါတ်ဖြင့် ရှာပါ။</p>
      </div>

      <form onSubmit={search} className="mx-auto mt-6 flex max-w-md flex-col gap-2">
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="ဖုန်းနံပါတ် — 09…"
          aria-label="ဖုန်းနံပါတ်"
          inputMode="tel"
          className="commerce-input my w-full px-5 py-3 text-sm outline-none"
        />
        <input
          value={orderNo}
          onChange={(e) => setOrderNo(e.target.value)}
          placeholder="Order နံပါတ်"
          aria-label="Order နံပါတ်"
          className="commerce-input my w-full px-5 py-3 text-sm outline-none"
        />
        <button
          disabled={!phone.trim() || !orderNo.trim()}
          className="commerce-primary inline-flex items-center justify-center gap-1.5 px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50">
          <Search className="h-4 w-4" /> ရှာ
        </button>
      </form>

      {err && <div className="commerce-error mx-auto mt-4 max-w-md rounded-xl border p-3 text-sm">{err}</div>}
      {loading && <p className="commerce-muted my mt-6 text-center">ရှာဖွေနေသည်…</p>}

      {orders !== null && !loading && (
        <div className="mt-6 space-y-3">
          {orders.length === 0 && <p className="commerce-muted my text-center">ဤဖုန်းနံပါတ်ဖြင့် Order မတွေ့ပါ။</p>}
          {orders.map((o) => {
            const st = statusMeta(o.status);
            return (
              <div key={o.order_id} className="commerce-order-card p-4">
                <div className="flex items-center justify-between">
                  <span className="commerce-price font-display font-bold">{o.order_id}</span>
                  <span className={`my rounded-full px-3 py-1 text-xs font-semibold ${st.cls}`}>{st.label}</span>
                </div>
                <p className="commerce-muted my mt-1 text-xs">{new Date(o.created_at).toLocaleString('en-GB')}</p>
                <div className="my mt-3 space-y-1 text-sm">
                  {(o.items || []).map((it, i) => (
                    <div key={i} className="commerce-muted flex justify-between">
                      <span className="truncate">{it.name} ×{it.qty}</span>
                      <span>{ks(it.price * it.qty)}</span>
                    </div>
                  ))}
                </div>
                <div className="commerce-divider my mt-3 flex justify-between border-t pt-3 text-sm">
                  <span className="commerce-muted">စုစုပေါင်း (ပို့ခ {ks(o.delivery_fee)})</span>
                  <span className="commerce-price font-bold">{ks(o.grand_total)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
