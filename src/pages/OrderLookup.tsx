import {useCallback, useEffect, useState} from 'react';
import {useSearchParams} from 'react-router-dom';
import {Package, Search} from 'lucide-react';
import {api, type TrackedOrder} from '../lib/store';
import {ks} from '../lib/format';
import {statusMeta} from '../lib/orderStatus';

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
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-cream-100 text-brand-700">
          <Package className="h-6 w-6" />
        </div>
        <h1 className="my mt-3 font-display text-2xl font-bold text-brand-800">Order စစ်ဆေးရန်</h1>
        <p className="my mt-1 text-sm text-ink-soft">Order တင်စဉ်က ဖုန်းနံပါတ် နှင့် Order နံပါတ်ဖြင့် ရှာပါ။</p>
      </div>

      <form onSubmit={search} className="mx-auto mt-6 flex max-w-md flex-col gap-2">
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="ဖုန်းနံပါတ် — 09…"
          aria-label="ဖုန်းနံပါတ်"
          inputMode="tel"
          className="my w-full rounded-full border border-cream-200 bg-white px-5 py-3 text-sm outline-none focus:border-brand-400"
        />
        <input
          value={orderNo}
          onChange={(e) => setOrderNo(e.target.value)}
          placeholder="Order နံပါတ်"
          aria-label="Order နံပါတ်"
          className="my w-full rounded-full border border-cream-200 bg-white px-5 py-3 text-sm outline-none focus:border-brand-400"
        />
        <button
          disabled={!phone.trim() || !orderNo.trim()}
          className="inline-flex items-center justify-center gap-1.5 rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-cream-100 hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50">
          <Search className="h-4 w-4" /> ရှာ
        </button>
      </form>

      {err && <div className="mx-auto mt-4 max-w-md rounded-xl border border-brand-200 bg-brand-50 p-3 text-sm text-brand-700">{err}</div>}
      {loading && <p className="my mt-6 text-center text-ink-soft">ရှာဖွေနေသည်…</p>}

      {orders !== null && !loading && (
        <div className="mt-6 space-y-3">
          {orders.length === 0 && <p className="my text-center text-ink-soft">ဤဖုန်းနံပါတ်ဖြင့် Order မတွေ့ပါ။</p>}
          {orders.map((o) => {
            const st = statusMeta(o.status);
            return (
              <div key={o.order_id} className="rounded-2xl border border-cream-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-brand-700">{o.order_id}</span>
                  <span className={`my rounded-full px-3 py-1 text-xs font-semibold ${st.cls}`}>{st.label}</span>
                </div>
                <p className="my mt-1 text-xs text-ink-soft">{new Date(o.created_at).toLocaleString('en-GB')}</p>
                <div className="my mt-3 space-y-1 text-sm">
                  {(o.items || []).map((it, i) => (
                    <div key={i} className="flex justify-between text-ink-soft">
                      <span className="truncate">{it.name} ×{it.qty}</span>
                      <span>{ks(it.price * it.qty)}</span>
                    </div>
                  ))}
                </div>
                <div className="my mt-3 flex justify-between border-t border-cream-200 pt-3 text-sm">
                  <span className="text-ink-soft">စုစုပေါင်း (ပို့ခ {ks(o.delivery_fee)})</span>
                  <span className="font-bold text-brand-700">{ks(o.grand_total)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
