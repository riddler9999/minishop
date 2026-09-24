import {useEffect, useMemo, useRef, useState} from 'react';
import {Check, Copy, ImageOff, Loader2} from 'lucide-react';
import {api, isLiveBackend} from '@/data/dataSource';
import type {MerchantAccount} from '@/domain/shop';
import {useCart} from '@/features/cart/state';
import {ks, cx} from '@/shared/lib/format';
import {regionNames, shippingFee, townshipsOf} from '@/shared/data/locations';
import {ShopLink, useShopNavigate, useShopSlugParam} from '@/features/tenancy/ShopLink';
import {isCheckoutReady, isOnlinePayment, newIdempotencyKey, paymentAccounts, PAYMENT_METHODS, resolveShippingFee, type PayMethod} from '@/features/checkout/checkoutLogic';

export default function Checkout() {
  const {items, subtotal, clear} = useCart();
  const nav = useShopNavigate();

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
  const slug = useShopSlugParam();
  const live = isLiveBackend();
  const [shipCfg, setShipCfg] = useState<Awaited<ReturnType<typeof api.shippingConfig>> | null>(null);
  const [shipErr, setShipErr] = useState(false);
  const [shipReload, setShipReload] = useState(0);
  const idempotencyKey = useRef('');

  useEffect(() => {
    let alive = true;
    api.merchantAccounts().then((r) => alive && setAccounts(r.accounts)).catch(() => {});
    return () => {
      alive = false;
    };
  }, [slug]);

  // Live: load the shop's real delivery-fee zones so the SHOWN fee matches what
  // place_order() will CHARGE (zone by region+township, else the shop default).
  // Demo: fees come from the static locations table (see the fee memo below).
  useEffect(() => {
    if (!live) {
      setShipCfg(null);
      setShipErr(false);
      return;
    }
    let alive = true;
    setShipCfg(null); // clear the previous shop's zones so a cross-shop SPA nav can't submit with a stale fee while the new shop's config loads
    setShipErr(false);
    api
      .shippingConfig()
      .then((c) => alive && setShipCfg(c))
      .catch(() => alive && setShipErr(true)); // surface, don't silently fall back to default (would re-introduce the shown≠charged mismatch)
    return () => {
      alive = false;
    };
  }, [slug, live, shipReload]);

  const townships = useMemo(() => townshipsOf(region), [region]);
  const demoFee = useMemo(() => shippingFee(region, township), [region, township]);
  const fee = useMemo(
    () => resolveShippingFee({region, township, live, shippingConfig: shipCfg, demoFee}),
    [region, township, live, shipCfg, demoFee],
  );
  const grandTotal = subtotal + (fee ?? 0);
  const online = isOnlinePayment(method);
  const providerAccounts = paymentAccounts(accounts, method);
  const ready = isCheckoutReady({name, phone, street, region, township, fee, itemCount: items.length, method, refTail});

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(''), 1500);
    } catch {
      /* clipboard blocked */
    }
  };

  const submit = async () => {
    if (!ready || submitting) return;
    setSubmitting(true);
    setErr('');
    // A stable idempotency key per checkout intent: reused across double-clicks
    // and network retries so place_order() returns the SAME order (and bills it
    // once) instead of creating a duplicate. Regenerated only after success.
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
      nav(`/order/${encodeURIComponent(res.orderId)}`, {
        state: {result: res, method, name: name.trim(), phone: phone.trim()},
      });
    } catch (e: any) {
      setErr(e.message || 'Order တင်၍မရပါ — ပြန်လည်ကြိုးစားပါ');
      setSubmitting(false);
    }
  };

  if (!items.length) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="my text-slate-500">ခြင်းထဲတွင် ပစ္စည်းမရှိသေးပါ။</p>
        <ShopLink to="/products" className="mt-4 inline-block rounded-full bg-[#e11d48] px-6 py-3 font-semibold text-white">ဈေးဝယ်မယ်</ShopLink>
      </div>
    );
  }

  const label = 'mb-1.5 block text-sm font-semibold text-slate-950';
  const input =
    'w-full min-h-12 rounded-2xl border border-[#f0dce4] bg-[#fffdfd] px-4 py-3 text-sm outline-none transition focus:border-[#e11d48] focus:ring-2 focus:ring-[#e11d48]/10';

  return (
    <div className="mx-auto max-w-6xl px-4 pb-12 pt-5 sm:px-6 sm:pt-8">
      <div className="mb-6"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#e11d48]">Checkout</p><h1 className="mt-1 font-display text-2xl font-bold tracking-[-0.03em] text-slate-950 sm:text-3xl">Order တင်မယ်</h1><p className="my mt-1 text-sm text-slate-500">ပို့ဆောင်ရန်အချက်အလက်နဲ့ ငွေပေးချေမှုကို အောက်မှာဖြည့်ပါ။</p></div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.55fr)] lg:gap-8">
        <div className="space-y-5">
          {/* 1. Delivery info */}
          <section className="rounded-[24px] border border-[#f3e5ea] bg-white p-5 shadow-[0_14px_38px_rgba(88,52,64,0.07)]">
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-950">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-[#e11d48] text-xs text-white">၁</span>
              ပို့ဆောင်မည့် လိပ်စာ
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="checkout-name" className={label}>အမည် <span className="text-[#e11d48]">*</span></label>
                <input id="checkout-name" className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="အမည်ရေးပါ" />
              </div>
              <div>
                <label htmlFor="checkout-phone" className={label}>ဖုန်းနံပါတ် <span className="text-[#e11d48]">*</span></label>
                <input id="checkout-phone" className={input} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09…" inputMode="tel" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="checkout-street" className={label}>လမ်းအမည် / အိမ်အမှတ် <span className="text-[#e11d48]">*</span></label>
                <input id="checkout-street" className={input} value={street} onChange={(e) => setStreet(e.target.value)} placeholder="ဥပမာ — မြသီတာလမ်း၊ အမှတ် ၁၂၃" />
              </div>
              <div>
                <label htmlFor="checkout-region" className={label}>တိုင်း / ပြည်နယ် <span className="text-[#e11d48]">*</span></label>
                <select
                  id="checkout-region"
                  className={input}
                  value={region}
                  onChange={(e) => {
                    setRegion(e.target.value);
                    setTownship('');
                  }}>
                  <option value="">— ရွေးချယ်ပါ —</option>
                  {regionNames().map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="checkout-township" className={label}>မြို့နယ် <span className="text-[#e11d48]">*</span></label>
                <select
                  id="checkout-township"
                  className={cx(input, !region && 'cursor-not-allowed opacity-60')}
                  value={township}
                  disabled={!region}
                  onChange={(e) => setTownship(e.target.value)}>
                  <option value="">{region ? '— ရွေးချယ်ပါ —' : 'တိုင်းအရင်ရွေးပါ'}</option>
                  {townships.map((t) => (
                    <option key={t.name} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>
            {fee != null && (
              <p className="my mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-slate-950">
                📦 {township} — ပို့ဆောင်ခ <span className="font-bold text-[#e11d48]">{ks(fee)}</span>
              </p>
            )}
            {live && shipErr && (
              <div className="my mt-3 flex items-center justify-between gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-[#e11d48]">
                <span>ပို့ဆောင်ခ တင်ယူ၍မရပါ။</span>
                <button type="button" onClick={() => setShipReload((n) => n + 1)} className="font-semibold underline">
                  ပြန်ကြိုးစားရန်
                </button>
              </div>
            )}
          </section>

          {/* 2. Payment */}
          <section className="rounded-[24px] border border-[#f3e5ea] bg-white p-5 shadow-[0_14px_38px_rgba(88,52,64,0.07)]">
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-950">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-[#e11d48] text-xs text-white">၂</span>
              ငွေပေးချေမှု
            </h2>

            <p className="my mb-2 text-sm font-semibold text-slate-950">ငွေပေးချေမှုနည်းလမ်း ရွေးပါ</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setMethod(m.key)}
                  className={cx('min-h-20 rounded-2xl border-2 p-3 text-left transition', method === m.key ? 'border-[#e11d48] bg-[#fff0f6] shadow-sm' : 'border-[#f0e3e8] bg-white hover:border-rose-200')}>
                  <span className="my block text-sm font-semibold text-slate-950">{m.label}</span>
                  <span className="my text-xs text-slate-500">{m.sub}</span>
                </button>
              ))}
            </div>

            <div className="my mt-4 rounded-2xl border border-dashed border-rose-200 bg-[#fff5f8] px-4 py-3">
              <span className="text-xs text-slate-500">{method === 'cod' ? 'အိမ်ရောက်မှ ပေးရမည့် ငွေ' : 'အခု လွှဲရမည့် ငွေ'}</span>
              <div className="font-display text-2xl font-bold text-[#e11d48]">{fee != null ? ks(grandTotal) : '—'}</div>
            </div>

            {method !== 'cod' && (
              <>
                <div className="mt-3 space-y-2">
                  {providerAccounts.map((a) => (
                    <div key={a.phone + a.accountName} className="flex items-center justify-between gap-2 rounded-2xl border border-rose-100 bg-[#fffafb] px-4 py-3">
                      <div className="min-w-0">
                        <p className="my truncate text-sm font-semibold text-slate-950">{a.accountName}</p>
                        <p className="font-display text-base font-bold tracking-wide text-[#e11d48]">{a.phone}</p>
                      </div>
                      <button
                        onClick={() => copy(a.phone, a.phone)}
                        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#e11d48] px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-[#be123c]">
                        {copied === a.phone ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied === a.phone ? 'ကူးပြီး' : 'ကူးမယ်'}
                      </button>
                    </div>
                  ))}
                  {providerAccounts.length === 0 && <p className="my text-sm text-slate-500">အကောင့် မရရှိနိုင်ပါ။</p>}
                </div>
                {/* Payment reference — last 5 digits of the transfer (WebView-safe; no slip upload). */}
                <div className="mt-4">
                  <label htmlFor="checkout-reftail" className={label}>
                    Transaction နံပါတ်၏ နောက်ဆုံးဂဏန်း ၅လုံး ဖြည့်ပေးပါ <span className="text-[#e11d48]">*</span>
                  </label>
                  <input
                    id="checkout-reftail"
                    className={input}
                    value={refTail}
                    onChange={(e) => setRefTail(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    placeholder="12345"
                    inputMode="numeric"
                    maxLength={5}
                  />
                </div>
              </>
            )}
          </section>
        </div>

        {/* Summary rail */}
        <div className="h-fit space-y-4 lg:sticky lg:top-20">
          <div className="rounded-[24px] border border-[#f3e5ea] bg-white p-5 shadow-[0_14px_38px_rgba(88,52,64,0.07)]">
            <h2 className="font-display text-lg font-bold text-slate-950">အော်ဒါ အကျဉ်း</h2>
            <div className="my mt-3 max-h-56 space-y-2 overflow-y-auto">
              {items.map((it) => (
                <div key={it.id} className="flex items-center gap-2 text-sm">
                  <div className="h-10 w-9 shrink-0 overflow-hidden rounded-md bg-rose-50">
                    {it.image ? <img src={it.image} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center"><ImageOff className="h-4 w-4 text-slate-500" /></div>}
                  </div>
                  <span className="my flex-1 truncate">{it.name} ×{it.qty}</span>
                  <span className="font-semibold">{ks(it.price * it.qty)}</span>
                </div>
              ))}
            </div>
            <div className="my mt-4 space-y-2 border-t border-rose-100 pt-4 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">ပစ္စည်းဖိုး</span><span className="font-semibold">{ks(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">ပို့ဆောင်ခ</span><span className="font-semibold">{fee != null ? ks(fee) : '—'}</span></div>
              <div className="flex justify-between border-t border-rose-100 pt-2 text-base">
                <span className="font-bold">စုစုပေါင်း</span>
                <span className="font-display font-bold text-[#e11d48]">{fee != null ? ks(grandTotal) : '—'}</span>
              </div>
            </div>
          </div>

          {err && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-[#e11d48]">{err}</div>}

          <button
            disabled={!ready || submitting}
            onClick={submit}
            className="w-full min-h-14 rounded-2xl bg-[#e11d48] px-6 py-4 font-bold text-white shadow-[0_14px_32px_rgba(225,29,72,0.24)] transition hover:bg-[#be123c] disabled:cursor-not-allowed disabled:opacity-50">
            {submitting ? (
              <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> တင်နေသည်…</span>
            ) : (
              <>✅ အော်ဒါတင်မည် {fee != null && `— ${ks(grandTotal)}`}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
