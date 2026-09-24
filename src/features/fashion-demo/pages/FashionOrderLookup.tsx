import {useCallback, useEffect, useState} from 'react';
import {Package, Search} from 'lucide-react';
import {useSearchParams} from 'react-router-dom';
import {api} from '@/data/dataSource';
import type {TrackedOrder} from '@/domain/order';
import {statusMeta} from '@/domain/orderStatus';
import {ks} from '@/shared/lib/format';

export default function FashionOrderLookup() {
  const [params] = useSearchParams();
  const [phone, setPhone] = useState(params.get('phone') ?? '');
  const [orderNo, setOrderNo] = useState(params.get('orderNo') ?? '');
  const [orders, setOrders] = useState<TrackedOrder[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const runSearch = useCallback(async (p: string, o: string) => {
    if (!p.trim() || !o.trim()) return;
    setLoading(true); setErr(''); setOrders(null);
    try {
      const r = await api.ordersByPhone(p.trim(), o.trim());
      setOrders(r.orders);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'ရှာဖွေ၍မရပါ');
    } finally {setLoading(false);}
  }, []);

  useEffect(() => {
    const p = params.get('phone'); const o = params.get('orderNo');
    if (p && o) runSearch(p, o);
    else if (p || o) setErr('ဖုန်းနံပါတ် နှင့် Order နံပါတ် နှစ်ခုလုံး ဖြည့်ပါ။');
  }, [params, runSearch]);

  return (
    <div className="mx-auto max-w-2xl px-4 pb-12 pt-8 sm:px-6">
      <div className="text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#fff0f5] text-[#f43f70]"><Package className="h-7 w-7" /></div><p className="mt-4 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#c92b59]">Track order</p><h1 className="my mt-1 font-display text-2xl font-black tracking-[-0.04em]">Order စစ်ဆေးရန်</h1><p className="my mt-1 text-xs text-slate-500">Order တင်စဉ်က ဖုန်းနံပါတ်နှင့် Order နံပါတ်ဖြင့်ရှာပါ။</p></div>
      <form onSubmit={(e) => {e.preventDefault(); runSearch(phone, orderNo);}} className="mx-auto mt-6 max-w-md space-y-2 rounded-[20px] bg-white p-4 shadow-[0_10px_28px_rgba(88,52,64,0.07)]"><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="ဖုန်းနံပါတ် — 09…" inputMode="tel" className="my min-h-12 w-full rounded-[14px] border border-[#f0dbe3] px-4 text-sm outline-none focus:border-[#f43f70]" /><input value={orderNo} onChange={(e) => setOrderNo(e.target.value)} placeholder="Order နံပါတ်" className="my min-h-12 w-full rounded-[14px] border border-[#f0dbe3] px-4 text-sm outline-none focus:border-[#f43f70]" /><button disabled={!phone.trim() || !orderNo.trim()} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-[#f43f70] text-sm font-bold text-white disabled:opacity-50"><Search className="h-4 w-4" /> ရှာမယ်</button></form>
      {err && <div className="mx-auto mt-4 max-w-md rounded-[14px] bg-rose-50 p-3 text-xs text-[#d22e5d]">{err}</div>}
      {loading && <p className="my mt-6 text-center text-sm text-slate-500">ရှာဖွေနေသည်…</p>}
      {orders !== null && !loading && <div className="mt-6 space-y-3">{orders.length === 0 && <div className="rounded-[18px] bg-white px-5 py-10 text-center text-sm text-slate-500">ဒီ Order ကို မတွေ့ပါ။</div>}{orders.map((o) => {const st = statusMeta(o.status); return <article key={o.order_id} className="rounded-[20px] bg-white p-4 shadow-[0_10px_28px_rgba(88,52,64,0.07)]"><div className="flex items-center justify-between gap-3"><span className="break-all text-sm font-black text-[#f43f70]">{o.order_id}</span><span className={`my shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${st.cls}`}>{st.label}</span></div><p className="my mt-1 text-[10px] text-slate-400">{new Date(o.created_at).toLocaleString('en-GB')}</p><div className="my mt-3 space-y-1 text-xs">{(o.items || []).map((item, i) => <div key={i} className="flex justify-between gap-3 text-slate-500"><span className="truncate">{item.name} ×{item.qty}</span><span>{ks(item.price * item.qty)}</span></div>)}</div><div className="my mt-3 flex justify-between border-t border-[#f3e3e9] pt-3 text-sm"><span className="text-slate-500">စုစုပေါင်း</span><span className="font-black text-[#f43f70]">{ks(o.grand_total)}</span></div></article>;})}</div>}
    </div>
  );
}
