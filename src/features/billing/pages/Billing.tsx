// ---- Billing & Extra Orders (seller admin) ----------------------------------
// One place for the seller's order entitlements: view the two balances, buy an
// Extra-Orders pack (paid plans), or see how to upgrade / reactivate. All money
// movement is manual prepaid: transfer -> upload screenshot -> owner credits
// from the Supabase dashboard (admin_credit_order_pack / admin_activate_*).

import {useEffect, useRef, useState} from 'react';
import {Check, Clock, Copy, PlusCircle, ShieldAlert, Sparkles, Upload} from 'lucide-react';
import {useAdminAuth} from '@/features/auth/adminAuth';
import {usePlan} from '@/features/billing/plan';
import EntitlementSummary from '@/features/billing/components/EntitlementSummary';
import {
  listOrderPackPurchases,
  submitOrderPackPurchase,
  type OrderPackPurchase,
} from '@/features/billing/orderPacks';
import {
  persistWithPaymentProof,
  validatePaymentProof,
} from '@/features/billing/paymentProofStorage';
import {
  EXTRA_ORDER_PRESETS,
  EXTRA_ORDER_UNIT_PRICE_KS,
  PLAN_MONTHLY_QUOTA,
  PLAN_PRODUCT_LIMIT,
  extraOrdersPriceKs,
} from '@/domain/entitlement';
import {
  PLAN_PRICE_KS,
  PAYMENT_METHOD_LABEL,
  PLATFORM_PAYMENT_RECIPIENT,
  SUBSCRIPTION_PAYMENT_METHODS,
  type SubscriptionPaymentMethod,
} from '@/domain/subscription';

function formatKs(n: number): string {
  return `${n.toLocaleString('en-US')} Ks`;
}

export default function Billing() {
  const {plan} = usePlan();
  const isPaid = plan === 'starter' || plan === 'business';

  return (
    <div className="space-y-4 pb-24 lg:pb-8">
      <header>
        <h1 className="text-[26px] font-black tracking-tight text-slate-950 sm:text-3xl">Billing &amp; Extra Orders</h1>
        <p className="mt-1 text-sm text-slate-500">Order လက်ခံနိုင်မှုနှင့် ငွေပေးချေမှု စီမံခန့်ခွဲမှု</p>
      </header>

      <EntitlementSummary compact />

      {isPaid ? <ExtraOrdersPanel /> : <UpgradePanel />}
    </div>
  );
}

// ---- Extra Orders purchase (paid plans) -------------------------------------
function ExtraOrdersPanel() {
  const {user} = useAdminAuth();
  const [qty, setQty] = useState<number>(EXTRA_ORDER_PRESETS[1]);
  const [method, setMethod] = useState<SubscriptionPaymentMethod>('kpay');
  const [refTail, setRefTail] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [history, setHistory] = useState<OrderPackPurchase[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const amount = extraOrdersPriceKs(qty);

  useEffect(() => {
    let alive = true;
    listOrderPackPurchases()
      .then((r) => alive && setHistory(r))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [done]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const copyPhone = async () => {
    try {
      await navigator.clipboard.writeText(PLATFORM_PAYMENT_RECIPIENT.phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be blocked in WebView */
    }
  };

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    const invalid = validatePaymentProof(f);
    if (invalid) {
      setErr(invalid);
      setFile(null);
      return;
    }
    setErr('');
    setFile(f);
  };

  const refClean = refTail.trim();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!file) return setErr('ငွေလွှဲ Screenshot တင်ပါ။');
    if (refClean && !/^[0-9]{5}$/.test(refClean)) {
      return setErr('ငွေလွှဲ နောက်ဆုံး ဂဏန်း ၅ လုံးကို မှန်ကန်စွာ ဖြည့်ပါ (သို့) ကွက်လပ်ထားပါ။');
    }
    setErr('');
    setSaving(true);
    try {
      await persistWithPaymentProof({
        userId: user.id,
        file,
        persist: (screenshotPath) =>
          submitOrderPackPurchase({
            userId: user.id,
            qty,
            paymentMethod: method,
            paymentRefTail: refClean || null,
            screenshotPath,
          }),
      });
      setDone(true);
      setFile(null);
    } catch (e: any) {
      setErr(e?.message || 'တင်သွင်း၍မရပါ — ပြန်ကြိုးစားပါ။');
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <section className="rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3 rounded-2xl bg-amber-50 p-4">
          <Clock className="h-6 w-6 shrink-0 text-amber-500" />
          <p className="text-sm text-amber-900">
            Extra Orders ဝယ်ယူမှုကို လက်ခံရရှိပါပြီ။ ငွေလွှဲ Screenshot စစ်ဆေးအတည်ပြုပြီးပါက သင့် balance သို့
            အလိုအလျောက် ပေါင်းထည့်ပေးပါမည်။
          </p>
        </div>
        <button
          onClick={() => setDone(false)}
          className="mt-4 w-full rounded-2xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
          နောက်ထပ် ဝယ်ရန်
        </button>
        <PurchaseHistory items={history} />
      </section>
    );
  }

  const field = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-pink-400';

  return (
    <section className="rounded-[26px] border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="flex items-center gap-2 text-[17px] font-bold text-slate-950">
        <PlusCircle className="h-5 w-5 text-pink-500" /> Extra Orders ဝယ်ယူရန်
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Order တစ်ခုလျှင် {formatKs(EXTRA_ORDER_UNIT_PRICE_KS)} — ဝယ်ထားသည့် အရေအတွက် ဘယ်တော့မှ သက်တမ်းမကုန်ပါ။
      </p>

      <form onSubmit={submit} className="mt-4 space-y-5">
        {/* qty presets */}
        <fieldset>
          <legend className="mb-2 text-sm font-bold text-slate-950">၁။ အရေအတွက် ရွေးပါ</legend>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {EXTRA_ORDER_PRESETS.map((n) => {
              const active = qty === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setQty(n)}
                  className={`rounded-xl border-2 py-2.5 text-sm font-bold transition ${
                    active ? 'border-pink-500 bg-pink-50 text-pink-600' : 'border-slate-200 text-slate-600 hover:border-pink-200'
                  }`}>
                  {n}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-sm text-slate-600">
            စုစုပေါင်း — <span className="font-black text-pink-600">{formatKs(amount)}</span>
          </p>
        </fieldset>

        {/* payment instructions */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-bold text-slate-950">၂။ ငွေလွှဲပါ</legend>
          <div className="rounded-2xl border border-pink-100 bg-pink-50/40 p-4">
            <p className="text-sm text-slate-600">
              အောက်ပါ အကောင့်သို့ <span className="font-bold text-pink-600">{formatKs(amount)}</span> လွှဲပါ။
            </p>
            <div className="mt-2 flex items-center justify-between rounded-xl bg-white px-3.5 py-2.5">
              <div>
                <p className="text-base font-bold tracking-wide text-slate-950">{PLATFORM_PAYMENT_RECIPIENT.phone}</p>
                <p className="text-xs text-slate-500">{PLATFORM_PAYMENT_RECIPIENT.name}</p>
              </div>
              <button
                type="button"
                onClick={copyPhone}
                className="flex items-center gap-1 rounded-lg border border-pink-200 px-2.5 py-1.5 text-xs font-semibold text-pink-600 transition hover:bg-pink-50">
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'ကူးပြီး' : 'ကူးရန်'}
              </button>
            </div>
          </div>
          <div>
            <span className="mb-1.5 block text-sm font-semibold text-slate-950">မည်သည့်နည်းလမ်းဖြင့် လွှဲသနည်း?</span>
            <div className="grid grid-cols-3 gap-2">
              {SUBSCRIPTION_PAYMENT_METHODS.map((m) => {
                const active = method === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    className={`rounded-xl border-2 px-2 py-2.5 text-sm font-semibold transition ${
                      active ? 'border-pink-500 bg-pink-50 text-pink-600' : 'border-slate-200 text-slate-600'
                    }`}>
                    {PAYMENT_METHOD_LABEL[m]}
                  </button>
                );
              })}
            </div>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-950">
              ငွေလွှဲ နောက်ဆုံး ဂဏန်း ၅ လုံး <span className="font-normal text-slate-400">(ရွေးချယ်)</span>
            </span>
            <input
              inputMode="numeric"
              value={refTail}
              onChange={(e) => setRefTail(e.target.value.replace(/[^0-9]/g, '').slice(0, 5))}
              placeholder="ဥပမာ — 12345"
              className={field}
            />
          </label>
        </fieldset>

        {/* proof */}
        <fieldset className="space-y-2">
          <legend className="text-sm font-bold text-slate-950">၃။ ငွေလွှဲ Screenshot တင်ပါ</legend>
          <input ref={fileInputRef} type="file" accept="image/png,image/webp,image/jpeg" onChange={pickFile} className="hidden" />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-pink-200 py-4 text-sm font-semibold text-pink-600 transition hover:bg-pink-50">
            <Upload className="h-4 w-4" /> {file ? 'ပုံ ပြောင်းရန်' : 'Screenshot ရွေးရန်'}
          </button>
          {previewUrl && (
            <img src={previewUrl} alt="ငွေလွှဲ screenshot" className="mx-auto max-h-56 rounded-xl border border-pink-100 object-contain" />
          )}
          <p className="text-xs text-slate-500">PNG / JPG / WebP — 5MB အထိ။</p>
        </fieldset>

        {err && (
          <p className="flex items-center gap-1.5 text-sm text-rose-600">
            <ShieldAlert className="h-4 w-4 shrink-0" /> {err}
          </p>
        )}

        <button
          disabled={saving}
          className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-pink-500 py-3 text-sm font-bold text-white transition hover:bg-pink-600 disabled:opacity-50">
          <PlusCircle className="h-4 w-4" /> {saving ? 'တင်နေသည်…' : `${formatKs(amount)} — ဝယ်ယူမှု တင်သွင်းရန်`}
        </button>
      </form>

      <PurchaseHistory items={history} />
    </section>
  );
}

function PurchaseHistory({items}: {items: OrderPackPurchase[]}) {
  if (items.length === 0) return null;
  const statusText: Record<OrderPackPurchase['status'], string> = {
    pending: 'စစ်ဆေးဆဲ',
    approved: 'အတည်ပြုပြီး',
    rejected: 'ငြင်းပယ်',
  };
  const statusCls: Record<OrderPackPurchase['status'], string> = {
    pending: 'bg-amber-50 text-amber-600',
    approved: 'bg-emerald-50 text-emerald-600',
    rejected: 'bg-rose-50 text-rose-600',
  };
  return (
    <div className="mt-5 border-t border-slate-100 pt-4">
      <h3 className="mb-2 text-sm font-bold text-slate-950">ယခင် ဝယ်ယူမှုများ</h3>
      <ul className="space-y-2">
        {items.map((p) => (
          <li key={p.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 text-sm">
            <span className="font-semibold text-slate-800">{p.qty} orders · {formatKs(p.amount)}</span>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusCls[p.status]}`}>
              {statusText[p.status]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---- Upgrade panel (free trial) ---------------------------------------------
function UpgradePanel() {
  const [copied, setCopied] = useState(false);
  const copyPhone = async () => {
    try {
      await navigator.clipboard.writeText(PLATFORM_PAYMENT_RECIPIENT.phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be blocked */
    }
  };
  return (
    <section className="rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-2 text-[17px] font-bold text-slate-950">
        <Sparkles className="h-5 w-5 text-pink-500" /> Plan upgrade
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Free Trial တွင် Order ${PLAN_MONTHLY_QUOTA.free_trial} ခု (တစ်သက်တာ) နှင့် ပစ္စည်း ${PLAN_PRODUCT_LIMIT.free_trial} ခုအထိသာ ရပါသည်။ ပိုမိုလက်ခံနိုင်ရန် upgrade လုပ်ပါ။
      </p>

      <div className="mt-4 grid gap-3">
        <PlanRow name="Starter" price={PLAN_PRICE_KS.starter} orders={PLAN_MONTHLY_QUOTA.starter} products={PLAN_PRODUCT_LIMIT.starter} note="selling features အပြည့်" />
        <PlanRow name="Business" price={PLAN_PRICE_KS.business} orders={PLAN_MONTHLY_QUOTA.business} products={PLAN_PRODUCT_LIMIT.business} note="ပိုမြန်၊ လူသက်သာ၊ automation-ready" />
      </div>

      <div className="mt-4 rounded-2xl border border-pink-100 bg-pink-50/40 p-4">
        <p className="text-sm font-semibold text-slate-800">Upgrade လုပ်နည်း</p>
        <ol className="mt-2 space-y-1 text-sm text-slate-600">
          <li>၁။ အောက်ပါ အကောင့်သို့ plan ဈေးနှုန်း လွှဲပါ။</li>
          <li>၂။ ငွေလွှဲ Screenshot နှင့် သင့်ဆိုင်နာမည်ကို platform သို့ ပေးပို့ပါ။</li>
          <li>၃။ အတည်ပြုပြီးပါက သင့် plan ကို အလိုအလျောက် upgrade လုပ်ပေးပါမည်။</li>
        </ol>
        <div className="mt-3 flex items-center justify-between rounded-xl bg-white px-3.5 py-2.5">
          <div>
            <p className="text-base font-bold tracking-wide text-slate-950">{PLATFORM_PAYMENT_RECIPIENT.phone}</p>
            <p className="text-xs text-slate-500">{PLATFORM_PAYMENT_RECIPIENT.name}</p>
          </div>
          <button
            type="button"
            onClick={copyPhone}
            className="flex items-center gap-1 rounded-lg border border-pink-200 px-2.5 py-1.5 text-xs font-semibold text-pink-600 transition hover:bg-pink-50">
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'ကူးပြီး' : 'ကူးရန်'}
          </button>
        </div>
      </div>
    </section>
  );
}

function PlanRow({name, price, orders, products, note}: {name: string; price: number; orders: number; products: number; note: string}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border-2 border-slate-200 p-4">
      <div>
        <p className="font-display text-lg font-bold text-slate-950">{name}</p>
        <p className="text-xs text-slate-500">လစဉ် Order {orders} ခု · Product {products} ခု · {note}</p>
      </div>
      <span className="font-display text-lg font-bold text-pink-600">{formatKs(price)}<span className="text-xs font-medium text-slate-400">/လ</span></span>
    </div>
  );
}
