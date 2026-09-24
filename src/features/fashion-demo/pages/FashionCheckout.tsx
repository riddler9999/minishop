import {useEffect, useMemo, useRef, useState} from 'react';
import {Check, Copy, ImageOff, Loader2} from 'lucide-react';
import {useNavigate} from 'react-router-dom';
import {api, isLiveBackend} from '@/data/dataSource';
import type {MerchantAccount} from '@/domain/shop';
import {useCart} from '@/features/cart/state';
import {ks, cx} from '@/shared/lib/format';
import {regionNames, shippingFee, townshipsOf} from '@/shared/data/locations';

type PayMethod = 'cod' | 'kpay' | 'wave';

function newIdempotencyKey(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    return (ch === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const METHODS: {key: PayMethod; label: string; sub: string}[] = [
  {key: 'cod', label: 'Cash on Delivery', sub: 'အိမ်ရောက် ငွေချေ'},
  {key: 'kpay', label: 'KBZPay', sub: 'ငွေကြိုရှင်း'},
  {key: 'wave', label: 'WavePay', sub: 'ငွေကြိုရှင်း'},
];

export default function FashionCheckout() {
  const {items, subtotal, clear} = useCart();
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [region, setRegion] = useState('');
  const [township, setTownship] = useState('');
  const [method, setMethod] = useState<PayMethod>('cod');
  const [accounts, setAccounts] = useState<MerchantAccount[]>([]);
  const [refTail, setRefTail] = useState('');
  const [copied, setCopied] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');
  const live = isLiveBackend();
  const [shipCfg, setShipCfg] = useState<Awaited<ReturnType<typeof api.shippingConfig>> | null>(null);
  const [shipErr, setShipErr] = useState(false);
  const [shipReload, setShipReload] = useState(0);
  const idempotencyKey = useRef('');

  useEffect(() => {
    let alive = true;
    api.merchantAccounts().then((r) => alive && setAccounts(r.accounts)).catch(() => {});
    return () => {alive = false;};
  }, []);

  useEffect(() => {
    if (!live) {
      setShipCfg(null);
      setShipErr(false);
      return;
    }
    let alive = true;
    setShipCfg(null);
    setShipErr(false);
    api.shippingConfig().then((c) => alive && setShipCfg(c)).catch(() => alive && setShipErr(true));
    return () => {alive = false;};
  }, [live, shipReload]);

  const townships = useMemo(() => townshipsOf(region), [region]);
  const fee = useMemo(() => {
    if (!region || !township) return null;
    if (live) {
      if (!shipCfg) return null;
      const z = shipCfg.zones.find((x) => x.region === region && x.township === township);
      return z ? z.fee : shipCfg.defaultFee;
    }
    return shippingFee(region, township) ?? 0;
  }, [region, township, live, shipCfg]);

  const grandTotal = subtotal + (fee ?? 0);
  const online = method === 'kpay' || method === 'wave';
  const providerAccounts = accounts.filter((a) => a.provider === method);
  const ready = Boolean(name.trim() && phone.trim().length >= 6 && street.trim() && region && township && fee != null && items.length > 0 && (!online || refTail.length === 5));

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(''), 1500);
    } catch {}
  };

  const submit = async () => {
    if (!ready || submitting) return;
    setSubmitting(true);
    setErr('');
    if (!idempotencyKey.current) idempotencyKey.current = newIdempotencyKey();
    try {
      const res = await api.createOrder({
        customer: {name: name.trim(), phone: phone.trim(), street: street.trim(), region, township},
        items: items.map((i) => ({id: i.id, qty: i.qty})),
        paymentMethod: method,
        shippingFee: fee ?? 0,
        paymentRefTail: online ? refTail.trim() : undefined,
        idempotencyKey: idempotencyKey.current,
      });
      idempotencyKey.current = '';
      clear();
      nav(`/fashion-demo/order/${encodeURIComponent(res.orderId)}`, {state: {result: res, method, name: name.trim(), phone: phone.trim()}});
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Order တင်၍မရပါ — ပြန်လည်ကြိုးစားပါ');
      setSubmitting(false);
    }
  };

  if (!items.length) {
    return <div className="mx-auto max-w-xl px-4 py-20 text-center"><p className="my text-sm text-slate-500">ခြင်းထဲတွင် ပစ္စည်းမရှိသေးပါ။</p><button type="button" onClick={() => nav('/fashion-demo/products')} className="mt-4 min-h-11 rounded-full bg-[#f43f70] px-6 text-sm font-bold text-white">Fashion items ကြည့်မယ်</button></div>;
  }

  const label = 'mb-1.5 block text-xs font-semibold text-[#49343d]';
  const input = 'my w-full min-h-12 rounded-[14px] border border-[#f0dce4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#f43f70] focus:ring-2 focus:ring-[#f43f70]/10';

  return (
    <div className="mx-auto max-w-6xl px-4 pb-14 pt-5 sm:px-6">
      <div><p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#c92b59]">Secure checkout</p><h1 className="mt-1 font-display text-2xl font-black tracking-[-0.04em]">Complete your order</h1><p className="my mt-1 text-xs text-slate-500">ပို့ဆောင်ရန်နဲ့ ငွေပေးချေမှုအချက်အလက်ကို ဖြည့်ပါ။</p></div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(300px,.6fr)] lg:gap-7">
        <div className="space-y-4">
          <section className="rounded-[20px] bg-white p-4 shadow-[0_10px_28px_rgba(88,52,64,0.07)] sm:p-5">
            <h2 className="mb-4 text-sm font-bold">Delivery information</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label htmlFor="fashion-name" className={label}>အမည်</label><input id="fashion-name" className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="အမည်ရေးပါ" /></div>
              <div><label htmlFor="fashion-phone" className={label}>ဖုန်းနံပါတ်</label><input id="fashion-phone" className={input} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09…" inputMode="tel" /></div>
              <div className="sm:col-span-2"><label htmlFor="fashion-street" className={label}>လမ်းအမည် / အိမ်အမှတ်</label><input id="fashion-street" className={input} value={street} onChange={(e) => setStreet(e.target.value)} placeholder="လိပ်စာရေးပါ" /></div>
              <div><label htmlFor="fashion-region" className={label}>တိုင်း / ပြည်နယ်</label><select id="fashion-region" className={input} value={region} onChange={(e) => {setRegion(e.target.value); setTownship('');}}><option value="">— ရွေးချယ်ပါ —</option>{regionNames().map((r) => <option key={r} value={r}>{r}</option>)}</select></div>
              <div><label htmlFor="fashion-township" className={label}>မြို့နယ်</label><select id="fashion-township" className={cx(input, !region && 'cursor-not-allowed opacity-60')} value={township} disabled={!region} onChange={(e) => setTownship(e.target.value)}><option value="">{region ? '— ရွေးချယ်ပါ —' : 'တိုင်းအရင်ရွေးပါ'}</option>{townships.map((t) => <option key={t.name} value={t.name}>{t.name}</option>)}</select></div>
            </div>
            {fee != null && <p className="my mt-3 rounded-xl bg-[#fff0f5] px-3 py-2 text-xs text-[#6f4e5c]">ပို့ဆောင်ခ <span className="font-bold text-[#f43f70]">{ks(fee)}</span></p>}
            {live && shipErr && <div className="my mt-3 flex items-center justify-between rounded-xl bg-rose-50 px-3 py-2 text-xs text-[#d22e5d]"><span>ပို့ဆောင်ခ တင်ယူ၍မရပါ။</span><button type="button" onClick={() => setShipReload((n) => n + 1)} className="font-bold underline">ပြန်ကြိုးစားရန်</button></div>}
          </section>

          <section className="rounded-[20px] bg-white p-4 shadow-[0_10px_28px_rgba(88,52,64,0.07)] sm:p-5">
            <h2 className="mb-3 text-sm font-bold">Payment method</h2>
            <div className="grid grid-cols-3 gap-2">
              {METHODS.map((m) => <button type="button" key={m.key} onClick={() => setMethod(m.key)} className={`min-h-20 rounded-[14px] border p-2.5 text-left ${method === m.key ? 'border-[#f43f70] bg-[#fff0f5] ring-1 ring-[#f43f70]' : 'border-[#f1e0e7] bg-white'}`}><span className="my block text-xs font-bold">{m.label}</span><span className="my text-[10px] text-slate-500">{m.sub}</span></button>)}
            </div>
            {method !== 'cod' && <>
              <div className="mt-3 space-y-2">{providerAccounts.map((a) => <div key={a.phone + a.accountName} className="flex items-center justify-between rounded-[14px] bg-[#fff8fa] px-3 py-2.5"><div><p className="my text-xs font-semibold">{a.accountName}</p><p className="text-sm font-bold text-[#f43f70]">{a.phone}</p></div><button type="button" onClick={() => copy(a.phone, a.phone)} className="inline-flex min-h-9 items-center gap-1 rounded-full bg-[#f43f70] px-3 text-[10px] font-bold text-white">{copied === a.phone ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copied === a.phone ? 'ကူးပြီး' : 'ကူးမယ်'}</button></div>)}</div>
              <div className="mt-3"><label htmlFor="fashion-ref" className={label}>Transaction နံပါတ် နောက်ဆုံး ၅လုံး</label><input id="fashion-ref" className={input} value={refTail} onChange={(e) => setRefTail(e.target.value.replace(/\D/g, '').slice(0, 5))} placeholder="12345" inputMode="numeric" maxLength={5} /></div>
            </>}
          </section>
        </div>

        <aside className="h-fit rounded-[20px] bg-white p-4 shadow-[0_10px_28px_rgba(88,52,64,0.07)] lg:sticky lg:top-20 sm:p-5">
          <h2 className="text-sm font-bold">Order summary</h2>
          <div className="my mt-3 max-h-60 space-y-2 overflow-auto">{items.map((it) => <div key={it.id} className="flex items-center gap-2 text-xs"><div className="h-11 w-9 overflow-hidden rounded-lg bg-rose-50">{it.image ? <img src={it.image} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center"><ImageOff className="h-4 w-4 text-slate-400" /></div>}</div><span className="my flex-1 truncate">{it.name} ×{it.qty}</span><span className="font-semibold">{ks(it.price * it.qty)}</span></div>)}</div>
          <div className="my mt-4 space-y-2 border-t border-[#f3e3e9] pt-4 text-xs"><div className="flex justify-between"><span className="text-slate-500">ပစ္စည်းဖိုး</span><span className="font-semibold">{ks(subtotal)}</span></div><div className="flex justify-between"><span className="text-slate-500">ပို့ဆောင်ခ</span><span className="font-semibold">{fee != null ? ks(fee) : '—'}</span></div><div className="flex justify-between border-t border-[#f3e3e9] pt-2 text-base"><span className="font-bold">စုစုပေါင်း</span><span className="font-black text-[#f43f70]">{fee != null ? ks(grandTotal) : '—'}</span></div></div>
          {err && <div className="my mt-3 rounded-xl bg-rose-50 p-3 text-xs text-[#d22e5d]">{err}</div>}
          <button type="button" disabled={!ready || submitting} onClick={submit} className="mt-4 min-h-14 w-full rounded-[15px] bg-[#f43f70] px-5 text-sm font-black text-white shadow-[0_12px_28px_rgba(244,63,112,0.24)] disabled:cursor-not-allowed disabled:opacity-50">{submitting ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> တင်နေသည်…</span> : <>အော်ဒါတင်မည် {fee != null && `· ${ks(grandTotal)}`}</>}</button>
        </aside>
      </div>
    </div>
  );
}
