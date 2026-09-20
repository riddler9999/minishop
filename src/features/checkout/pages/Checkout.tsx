import {useEffect, useMemo, useState} from 'react';
import {Check, Copy, ImageOff, Loader2} from 'lucide-react';
import {api, isLiveBackend} from '@/data/dataSource';
import type {MerchantAccount} from '@/domain/shop';
import {useCart} from '@/features/cart/state';
import {ks, cx} from '@/shared/lib/format';
import {regionNames, shippingFee, townshipsOf} from '@/shared/data/locations';
import {ShopLink, useShopNavigate, useShopSlugParam} from '@/features/tenancy/ShopLink';

type PayMethod = 'cod' | 'kpay' | 'wave';

const METHODS: {key: PayMethod; label: string; sub: string}[] = [
  {key: 'cod', label: 'Cash on Delivery', sub: 'အိမ်ရောက် ငွေချေ'},
  {key: 'kpay', label: 'KBZPay', sub: 'ကြိုတင် ငွေလွှဲ'},
  {key: 'wave', label: 'WavePay', sub: 'ကြိုတင် ငွေလွှဲ'},
];

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
  const fee = useMemo(() => {
    if (!region || !township) return null;
    if (live) {
      if (!shipCfg) return null; // still loading the shop's zones
      const z = shipCfg.zones.find((x) => x.region === region && x.township === township);
      return z ? z.fee : shipCfg.defaultFee;
    }
    return shippingFee(region, township) ?? 0;
  }, [region, township, live, shipCfg]);
  const grandTotal = subtotal + (fee ?? 0);
  const isOnline = method === 'kpay' || method === 'wave';
  const providerAccounts = accounts.filter((a) => a.provider === method);

  const refTailValid = !isOnline || refTail.length === 5;
  const ready =
    name.trim() && phone.trim().length >= 6 && street.trim() && region && township && fee != null && items.length > 0 && refTailValid;

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
    try {
      const res = await api.createOrder({
        customer: {name: name.trim(), phone: phone.trim(), street: street.trim(), region, township},
        items: items.map((i) => ({id: i.id, qty: i.qty})),
        paymentMethod: method,
        shippingFee: fee ?? 0,
        paymentRefTail: isOnline ? refTail.trim() : undefined,
      });
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
        <p className="my text-ink-soft">ခြင်းထဲတွင် ပစ္စည်းမရှိသေးပါ။</p>
        <ShopLink to="/products" className="mt-4 inline-block rounded-full bg-brand-700 px-6 py-3 font-semibold text-cream-100">ဈေးဝယ်မယ်</ShopLink>
      </div>
    );
  }

  const label = 'mb-1.5 block text-sm font-semibold text-ink';
  const input =
    'w-full rounded-xl border border-cream-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-400';

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 font-display text-2xl font-bold text-brand-800">Order တင်မယ်</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* 1. Delivery info */}
          <section className="rounded-2xl border border-cream-200 bg-white p-5">
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-brand-800">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-700 text-xs text-white">၁</span>
              ပို့ဆောင်မည့် လိပ်စာ
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="checkout-name" className={label}>အမည် <span className="text-brand-600">*</span></label>
                <input id="checkout-name" className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="အမည်ရေးပါ" />
              </div>
              <div>
                <label htmlFor="checkout-phone" className={label}>ဖုန်းနံပါတ် <span className="text-brand-600">*</span></label>
                <input id="checkout-phone" className={input} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09…" inputMode="tel" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="checkout-street" className={label}>လမ်းအမည် / အိမ်အမှတ် <span className="text-brand-600">*</span></label>
                <input id="checkout-street" className={input} value={street} onChange={(e) => setStreet(e.target.value)} placeholder="ဥပမာ — မြသီတာလမ်း၊ အမှတ် ၁၂၃" />
              </div>
              <div>
                <label htmlFor="checkout-region" className={label}>တိုင်း / ပြည်နယ် <span className="text-brand-600">*</span></label>
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
                <label htmlFor="checkout-township" className={label}>မြို့နယ် <span className="text-brand-600">*</span></label>
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
              <p className="my mt-3 rounded-lg bg-cream-100 px-3 py-2 text-sm text-ink">
                📦 {township} — ပို့ဆောင်ခ <span className="font-bold text-brand-700">{ks(fee)}</span>
              </p>
            )}
            {live && shipErr && (
              <div className="my mt-3 flex items-center justify-between gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
                <span>ပို့ဆောင်ခ တင်ယူ၍မရပါ။</span>
                <button type="button" onClick={() => setShipReload((n) => n + 1)} className="font-semibold underline">
                  ပြန်ကြိုးစားရန်
                </button>
              </div>
            )}
          </section>

          {/* 2. Payment */}
          <section className="rounded-2xl border border-cream-200 bg-white p-5">
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-brand-800">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-700 text-xs text-white">၂</span>
              ငွေပေးချေမှု
            </h2>

            <p className="my mb-2 text-sm font-semibold text-ink">ငွေပေးချေမှုနည်းလမ်း ရွေးပါ</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {METHODS.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setMethod(m.key)}
                  className={cx('rounded-xl border-2 p-3 text-left transition', method === m.key ? 'border-brand-600 bg-brand-50' : 'border-cream-200 bg-white')}>
                  <span className="my block text-sm font-semibold text-ink">{m.label}</span>
                  <span className="my text-xs text-ink-soft">{m.sub}</span>
                </button>
              ))}
            </div>

            <div className="my mt-4 rounded-xl border border-dashed border-gold-500/50 bg-cream-100 px-4 py-3">
              <span className="text-xs text-ink-soft">{method === 'cod' ? 'အိမ်ရောက်မှ ပေးရမည့် ငွေ' : 'အခု လွှဲရမည့် ငွေ'}</span>
              <div className="font-display text-2xl font-bold text-brand-700">{fee != null ? ks(grandTotal) : '—'}</div>
            </div>

            {method === 'cod' ? (
              <p className="my mt-3 rounded-lg bg-cream-100 px-3 py-2 text-sm text-ink">
                🚚 ပစ္စည်း အိမ်တိုင်ရာရောက် ပို့ဆောင်ချိန်တွင် ငွေပေးချေနိုင်ပါသည်။ အခု ကြိုတင်ပေးစရာ မလိုပါ။
              </p>
            ) : (
              <>
                <div className="mt-3 space-y-2">
                  {providerAccounts.map((a) => (
                    <div key={a.phone + a.accountName} className="flex items-center justify-between gap-2 rounded-xl border border-cream-200 bg-cream-50 px-4 py-3">
                      <div className="min-w-0">
                        <p className="my truncate text-sm font-semibold text-ink">{a.accountName}</p>
                        <p className="font-display text-base font-bold tracking-wide text-brand-700">{a.phone}</p>
                      </div>
                      <button
                        onClick={() => copy(a.phone, a.phone)}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gold-500 px-3 py-2 text-xs font-bold text-brand-900 hover:bg-gold-400">
                        {copied === a.phone ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied === a.phone ? 'ကူးပြီး' : 'ကူးမယ်'}
                      </button>
                    </div>
                  ))}
                  {providerAccounts.length === 0 && <p className="my text-sm text-ink-soft">အကောင့် မရရှိနိုင်ပါ။</p>}
                </div>
                {fee != null && (
                  <p className="my mt-3 text-sm text-ink-soft">
                    👆 ဤနံပါတ်သို့ <b className="text-brand-700">{ks(grandTotal)}</b> လွှဲပြီး အောက်တွင် transaction ၏ နောက်ဆုံး ၅ လုံး ဖြည့်ပါ။
                  </p>
                )}

                {/* Payment reference — last 5 digits of the transfer (WebView-safe; no slip upload). */}
                <div className="mt-4">
                  <label htmlFor="checkout-reftail" className={label}>
                    ငွေလွှဲ လုပ်ဆောင်မှုနံပါတ်၏ နောက်ဆုံး ဂဏန်း ၅ လုံး <span className="text-brand-600">*</span>
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
                  <p className="my mt-2 text-xs text-ink-soft">
                    KBZPay / WavePay transaction ID ၏ နောက်ဆုံး ၅ လုံးကို ရိုက်ထည့်ပါ — ဆိုင်မှ ပမာဏနှင့် တိုက်ဆိုင်စစ်ဆေး၍ အတည်ပြုပေးပါမည်။
                  </p>
                </div>
              </>
            )}
          </section>
        </div>

        {/* Summary rail */}
        <div className="h-fit space-y-4 lg:sticky lg:top-20">
          <div className="rounded-2xl border border-cream-200 bg-white p-5">
            <h2 className="font-display text-lg font-bold text-brand-800">အော်ဒါ အကျဉ်း</h2>
            <div className="my mt-3 max-h-56 space-y-2 overflow-y-auto">
              {items.map((it) => (
                <div key={it.id} className="flex items-center gap-2 text-sm">
                  <div className="h-10 w-9 shrink-0 overflow-hidden rounded-md bg-cream-100">
                    {it.image ? <img src={it.image} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center"><ImageOff className="h-4 w-4 text-ink-soft" /></div>}
                  </div>
                  <span className="my flex-1 truncate">{it.name} ×{it.qty}</span>
                  <span className="font-semibold">{ks(it.price * it.qty)}</span>
                </div>
              ))}
            </div>
            <div className="my mt-4 space-y-2 border-t border-cream-200 pt-4 text-sm">
              <div className="flex justify-between"><span className="text-ink-soft">ပစ္စည်းဖိုး</span><span className="font-semibold">{ks(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-ink-soft">ပို့ဆောင်ခ</span><span className="font-semibold">{fee != null ? ks(fee) : '—'}</span></div>
              <div className="flex justify-between border-t border-cream-200 pt-2 text-base">
                <span className="font-bold">စုစုပေါင်း</span>
                <span className="font-display font-bold text-brand-700">{fee != null ? ks(grandTotal) : '—'}</span>
              </div>
            </div>
          </div>

          {err && <div className="rounded-xl border border-brand-200 bg-brand-50 p-3 text-sm text-brand-700">{err}</div>}

          <button
            disabled={!ready || submitting}
            onClick={submit}
            className="w-full rounded-full bg-brand-700 px-6 py-4 font-bold text-cream-100 shadow-lg transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50">
            {submitting ? (
              <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> တင်နေသည်…</span>
            ) : (
              <>✅ ဒါပဲ ဝယ်တော့မယ် {fee != null && `— ${ks(grandTotal)}`}</>
            )}
          </button>
          {!ready && <p className="my text-center text-xs text-ink-soft">အမည်၊ ဖုန်း၊ လိပ်စာ၊ တိုင်း/မြို့နယ် ဖြည့်ပါ။</p>}
        </div>
      </div>
    </div>
  );
}
