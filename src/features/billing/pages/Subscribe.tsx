// ---- Paid-onboarding gate: plan purchase + manual-approval waiting room ------
// Sits between login and shop onboarding. A seller must pick a plan, transfer
// the fee to the platform's KBZPay/WavePay/AYA account, upload the transfer
// screenshot, and wait for the owner's manual approval (done in the Supabase
// dashboard — there is no in-app super-admin surface). Route-gated in App.tsx
// and self-guards below, mirroring Onboarding.tsx.

import {useEffect, useRef, useState} from 'react';
import {Navigate, useSearchParams} from 'react-router-dom';
import {Check, Clock, Copy, ShieldAlert, Store, Upload, XCircle} from 'lucide-react';
import {useAdminAuth} from '@/features/auth/adminAuth';
import {APP_INITIAL} from '@/shared/lib/brand';
import type {Plan} from '@/domain/plan';
import {
  PLAN_PRICE_KS,
  PAYMENT_METHOD_LABEL,
  PLATFORM_PAYMENT_RECIPIENT,
  SUBSCRIPTION_PAYMENT_METHODS,
  type SubscriptionPaymentMethod,
} from '@/domain/subscription';
import {
  resolveSellerGate,
  submitApplication,
  type ShopApplication,
} from '@/features/billing/application';
import {
  persistWithPaymentProof,
  validatePaymentProof,
} from '@/features/billing/paymentProofStorage';

const PLAN_CARDS: {plan: Plan; label: string; blurb: string; features: string[]}[] = [
  {
    plan: 'business',
    label: 'Business',
    blurb: 'ရောင်းအားကောင်းသော ဆိုင်များအတွက် — feature အပြည့်အစုံ',
    features: ['လစဉ် Order ၁၅၀', 'Promotion စျေးနှုန်း', 'Analytics + Logo/Branding', 'Extra Orders ဝယ်နိုင်'],
  },
  {
    plan: 'starter',
    label: 'Starter',
    blurb: 'အသစ်စတင်သူများအတွက် — အခြေခံ ဆိုင်စီမံခန့်ခွဲမှု',
    features: ['လစဉ် Order ၆၀', 'ပစ္စည်း အကန့်အသတ်မဲ့', 'မြို့နယ်အလိုက် ပို့ခ', 'Extra Orders ဝယ်နိုင်'],
  },
];

function formatKs(n: number): string {
  return `${n.toLocaleString('en-US')} Ks`;
}

export default function Subscribe() {
  const {loading: authLoading, session, user} = useAdminAuth();
  const [searchParams] = useSearchParams();

  const [checking, setChecking] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [gate, setGate] = useState<'subscribe' | 'onboarding' | 'admin'>('subscribe');
  const [application, setApplication] = useState<ShopApplication | null>(null);

  useEffect(() => {
    if (!user) {
      setChecking(false);
      return;
    }
    let alive = true;
    setChecking(true);
    setLoadError(false);
    resolveSellerGate(user.id)
      .then((result) => {
        if (!alive) return;
        if (result.status === 'error') {
          setLoadError(true);
        } else {
          setGate(result.gate);
          setApplication(result.application);
        }
      })
      .finally(() => alive && setChecking(false));
    return () => {
      alive = false;
    };
  }, [user, retry]);

  if (!authLoading && !session) return <Navigate to="/admin/login" replace />;
  if (!checking && !loadError && gate === 'admin') return <Navigate to="/admin" replace />;
  if (!checking && !loadError && gate === 'onboarding') return <Navigate to="/admin/onboarding" replace />;

  if (authLoading || checking) {
    return <div className="grid min-h-screen place-items-center bg-white text-sm text-slate-500">Loading…</div>;
  }
  if (loadError) {
    return (
      <div className="grid min-h-screen place-items-center bg-white px-4 text-center">
        <div className="max-w-sm">
          <p className="my text-sm text-slate-500">အချက်အလက် ရယူ၍ မရသေးပါ — ကွန်ရက် ပြန်စစ်ပြီး ထပ်ကြိုးစားပါ။</p>
          <button
            onClick={() => setRetry((n) => n + 1)}
            className="my mt-4 rounded-xl bg-[#e11d48] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#be123c]">
            ထပ်ကြိုးစားရန်
          </button>
        </div>
      </div>
    );
  }

  if (application?.status === 'pending') {
    return <PendingView application={application} />;
  }

  return (
    <SubscribeForm
      userId={user!.id}
      previous={application?.status === 'rejected' ? application : null}
      onSubmitted={() => setRetry((n) => n + 1)}
      requestedPlan={searchParams.get('plan')}
    />
  );
}

// ---- Waiting-for-approval view ----------------------------------------------
function PendingView({application}: {application: ShopApplication}) {
  const {signOut} = useAdminAuth();
  return (
    <Shell title="ငွေပေးချေမှု စစ်ဆေးနေပါသည်" subtitle="Platform Admin မှ အတည်ပြုပြီးပါက ဆိုင်ဖွင့်နိုင်ပါမည်">
      <div className="space-y-4 rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center gap-3 rounded-xl bg-amber-50 p-4">
          <Clock className="h-6 w-6 shrink-0 text-amber-500" />
          <p className="my text-sm text-amber-900">
            သင့်ငွေပေးချေမှုကို လက်ခံရရှိပါပြီ။ Screenshot ကို စစ်ဆေးအတည်ပြုနေဆဲဖြစ်ပါသည် — အတည်ပြုပြီးပါက ဆက်လက်၍
            ဆိုင်ဖွင့်နိုင်ပါမည်။
          </p>
        </div>
        <dl className="my space-y-2 text-sm">
          <Row k="ရွေးချယ်ထားသော Plan" v={application.plan === 'business' ? 'Business' : 'Starter'} />
          <Row k="ငွေပမာဏ" v={formatKs(application.amount)} />
          <Row
            k="ငွေပေးချေမှုနည်းလမ်း"
            v={PAYMENT_METHOD_LABEL[application.paymentMethod as SubscriptionPaymentMethod] ?? application.paymentMethod}
          />
        </dl>
        <p className="my text-center text-xs text-slate-500">
          အတည်ပြုမှုကို ဤစာမျက်နှာ ပြန်ဖွင့်ကြည့်၍ စစ်နိုင်ပါသည်။
        </p>
        <button
          onClick={() => signOut()}
          className="my w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
          ထွက်ရန်
        </button>
      </div>
    </Shell>
  );
}

// ---- Plan selection + payment + upload form ---------------------------------
function SubscribeForm({
  userId,
  previous,
  onSubmitted,
  requestedPlan,
}: {
  userId: string;
  previous: ShopApplication | null;
  onSubmitted: () => void;
  requestedPlan: string | null;
}) {
  const initialPaidPlan: Plan = requestedPlan === 'starter' || requestedPlan === 'business'
    ? requestedPlan
    : (previous?.plan as Plan) === 'starter'
      ? 'starter'
      : 'business';
  const [plan, setPlan] = useState<Plan>(initialPaidPlan);
  const [method, setMethod] = useState<SubscriptionPaymentMethod>(
    (previous?.paymentMethod as SubscriptionPaymentMethod) ?? 'kpay',
  );
  const [refTail, setRefTail] = useState(previous?.paymentRefTail ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const [startingFree, setStartingFree] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const amount = PLAN_PRICE_KS[plan];

  // Free Trial needs no payment and is auto-approved by the DB (0016). Submit a
  // free-trial application (no screenshot) and the gate flips to onboarding.
  const startFreeTrial = async () => {
    setErr('');
    setStartingFree(true);
    try {
      await submitApplication(userId, {
        plan: 'free_trial',
        paymentMethod: 'kpay', // placeholder — free trial carries no payment
        paymentRefTail: null,
        screenshotPath: null,
        amount: 0,
      });
      onSubmitted();
    } catch (e: any) {
      setErr(e?.message || 'Free Trial စတင်၍မရပါ — ပြန်ကြိုးစားပါ။');
      setStartingFree(false);
    }
  };

  // Local object-URL preview of the chosen file; revoked on change/unmount.
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
      /* clipboard may be blocked in-WebView — the number is shown regardless */
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

  const refTailClean = refTail.trim();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return setErr('ငွေလွှဲ Screenshot တင်ပါ။');
    if (refTailClean && !/^[0-9]{5}$/.test(refTailClean)) {
      return setErr('ငွေလွှဲ နောက်ဆုံး ဂဏန်း ၅ လုံးကို မှန်ကန်စွာ ဖြည့်ပါ (သို့) ကွက်လပ်ထားပါ။');
    }

    setErr('');
    setSaving(true);
    try {
      await persistWithPaymentProof({
        userId,
        file,
        previousPath: previous?.screenshotPath,
        persist: (screenshotPath) =>
          submitApplication(userId, {
            plan,
            paymentMethod: method,
            paymentRefTail: refTailClean || null,
            screenshotPath,
            amount,
          }),
      });
      onSubmitted();
    } catch (e: any) {
      setErr(e?.message || 'လျှောက်လွှာ တင်၍မရပါ — ပြန်ကြိုးစားပါ။');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Shell
      title="Plan ရွေးချယ်ပြီး ဆိုင်စတင်ရန်"
      subtitle="Plan ရွေး → ငွေလွှဲ → Screenshot တင် → အတည်ပြုပြီးမှ ဆိုင်ဖွင့်နိုင်သည်">
      {/* Free Trial — no payment, start immediately. The query string only preserves intent;
          the DB-backed application gate still authorizes onboarding. */}
      <div className="mb-5 rounded-2xl border-2 border-emerald-200 bg-emerald-50/60 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display text-lg font-bold text-slate-950">Free Trial</p>
            <p className="my mt-0.5 text-xs text-slate-500">Order ၂၀ (တစ်သက်တာ) · ပစ္စည်း ၁၀ ခုအထိ · အခမဲ့</p>
          </div>
          <span className="font-display text-lg font-bold text-emerald-600">0 Ks</span>
        </div>
        <button
          type="button"
          onClick={startFreeTrial}
          autoFocus={requestedPlan === 'free_trial'}
          disabled={startingFree}
          className="my mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50">
          <Store className="h-4 w-4" /> {startingFree ? 'စတင်နေသည်…' : 'အခမဲ့ ချက်ချင်း စတင်ရန်'}
        </button>
      </div>

      <div className="my mb-4 flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" /> သို့မဟုတ် plan ဝယ်ယူရန် <span className="h-px flex-1 bg-slate-200" />
      </div>

      <form onSubmit={submit} className="space-y-5">
        {previous && (
          <div className="flex items-start gap-3 rounded-2xl bg-rose-50 p-4">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#e11d48]" />
            <div>
              <p className="my text-sm font-semibold text-[#be123c]">ယခင်လျှောက်လွှာ ငြင်းပယ်ခံရပါသည်</p>
              {previous.reviewNote && <p className="my mt-1 text-sm text-slate-600">{previous.reviewNote}</p>}
              <p className="my mt-1 text-xs text-slate-500">အချက်အလက်ပြင်ပြီး ပြန်လည်တင်သွင်းနိုင်ပါသည်။</p>
            </div>
          </div>
        )}

        {/* Step 1 — plan */}
        <fieldset className="space-y-3">
          <legend className="my text-sm font-bold text-slate-950">၁။ Plan ရွေးချယ်ပါ</legend>
          <div className="grid gap-3">
            {PLAN_CARDS.map((c) => {
              const active = plan === c.plan;
              return (
                <label
                  key={c.plan}
                  className={`cursor-pointer rounded-2xl border-2 p-4 transition ${
                    active ? 'border-[#e11d48] bg-rose-50/60' : 'border-slate-200 bg-white hover:border-rose-200'
                  }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="plan"
                        className="sr-only"
                        checked={active}
                        onChange={() => setPlan(c.plan)}
                      />
                      <span
                        className={`grid h-5 w-5 place-items-center rounded-full border-2 ${
                          active ? 'border-[#e11d48] bg-[#e11d48]' : 'border-slate-300'
                        }`}>
                        {active && <Check className="h-3 w-3 text-white" />}
                      </span>
                      <span className="font-display text-lg font-bold text-slate-950">{c.label}</span>
                    </div>
                    <span className="my font-display text-lg font-bold text-[#e11d48]">
                      {formatKs(PLAN_PRICE_KS[c.plan])}
                    </span>
                  </div>
                  <p className="my mt-1.5 text-xs text-slate-500">{c.blurb}</p>
                  <ul className="my mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
                    {c.features.map((f) => (
                      <li key={f} className="flex items-center gap-1 text-xs text-slate-600">
                        <Check className="h-3 w-3 shrink-0 text-[#e11d48]" /> {f}
                      </li>
                    ))}
                  </ul>
                </label>
              );
            })}
          </div>
        </fieldset>

        {/* Step 2 — payment instructions + method */}
        <fieldset className="space-y-3">
          <legend className="my text-sm font-bold text-slate-950">၂။ ငွေလွှဲပါ</legend>
          <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-4">
            <p className="my text-sm text-slate-600">
              အောက်ပါ အကောင့်သို့ <span className="font-bold text-[#e11d48]">{formatKs(amount)}</span> လွှဲပါ။
            </p>
            <div className="my mt-2 flex items-center justify-between rounded-xl bg-white px-3.5 py-2.5">
              <div>
                <p className="text-base font-bold tracking-wide text-slate-950">{PLATFORM_PAYMENT_RECIPIENT.phone}</p>
                <p className="text-xs text-slate-500">{PLATFORM_PAYMENT_RECIPIENT.name}</p>
              </div>
              <button
                type="button"
                onClick={copyPhone}
                className="my flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-[#e11d48] transition hover:bg-rose-50">
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'ကူးပြီး' : 'ကူးရန်'}
              </button>
            </div>
            <p className="my mt-2 text-xs text-slate-500">လွှဲရန်နည်းလမ်း — KBZPay / WavePay / AYA Pay အသုံးပြုနိုင်သည်။</p>
          </div>

          <div>
            <span className="my mb-1.5 block text-sm font-semibold text-slate-950">မည်သည့်နည်းလမ်းဖြင့် လွှဲသနည်း?</span>
            <div className="grid grid-cols-3 gap-2">
              {SUBSCRIPTION_PAYMENT_METHODS.map((m) => {
                const active = method === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    className={`my rounded-xl border-2 px-2 py-2.5 text-sm font-semibold transition ${
                      active ? 'border-[#e11d48] bg-rose-50 text-[#e11d48]' : 'border-slate-200 text-slate-600'
                    }`}>
                    {PAYMENT_METHOD_LABEL[m]}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="block">
            <span className="my mb-1.5 block text-sm font-semibold text-slate-950">
              ငွေလွှဲ နောက်ဆုံး ဂဏန်း ၅ လုံး <span className="font-normal text-slate-400">(ရွေးချယ်)</span>
            </span>
            <input
              inputMode="numeric"
              value={refTail}
              onChange={(e) => setRefTail(e.target.value.replace(/[^0-9]/g, '').slice(0, 5))}
              placeholder="ဥပမာ — 12345"
              className="w-full rounded-xl border border-rose-100 bg-rose-50/40 px-3.5 py-2.5 text-sm outline-none focus:border-[#e11d48]"
            />
          </label>
        </fieldset>

        {/* Step 3 — screenshot */}
        <fieldset className="space-y-2">
          <legend className="my text-sm font-bold text-slate-950">၃။ ငွေလွှဲ Screenshot တင်ပါ</legend>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/webp,image/jpeg"
            onChange={pickFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="my flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-rose-200 py-4 text-sm font-semibold text-[#e11d48] transition hover:bg-rose-50">
            <Upload className="h-4 w-4" /> {file ? 'ပုံ ပြောင်းရန်' : 'Screenshot ရွေးရန်'}
          </button>
          {previewUrl && (
            <img
              src={previewUrl}
              alt="ငွေလွှဲ screenshot"
              className="mx-auto max-h-56 rounded-xl border border-rose-100 object-contain"
            />
          )}
          <p className="my text-xs text-slate-500">PNG / JPG / WebP — 5MB အထိ။</p>
        </fieldset>

        {err && (
          <p className="my flex items-center gap-1.5 text-sm text-[#e11d48]">
            <ShieldAlert className="h-4 w-4 shrink-0" /> {err}
          </p>
        )}

        <button
          disabled={saving}
          className="my flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#e11d48] py-3 text-sm font-bold text-white transition hover:bg-[#be123c] disabled:opacity-50">
          <Store className="h-4 w-4" /> {saving ? 'တင်နေသည်…' : 'ငွေပေးချေမှု တင်သွင်းရန်'}
        </button>
        <p className="my text-center text-xs text-slate-500">
          တင်သွင်းပြီးပါက Platform Admin မှ Screenshot ကို စစ်ဆေးအတည်ပြုပါမည်။ အတည်ပြုပြီးမှ ဆိုင်ဖွင့်နိုင်ပါမည်။
        </p>
      </form>
    </Shell>
  );
}

// ---- shared chrome ----------------------------------------------------------
function Shell({title, subtitle, children}: {title: string; subtitle: string; children: React.ReactNode}) {
  return (
    <div className="grid min-h-screen place-items-center bg-white px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[#fb7185] to-[#e11d48] font-display text-2xl font-bold text-white shadow-lg">
            {APP_INITIAL}
          </span>
          <h1 className="my mt-4 font-display text-2xl font-bold text-slate-950">{title}</h1>
          <p className="my mt-1 text-sm text-slate-500/70">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

function Row({k, v}: {k: string; v: string}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
      <dt className="text-slate-500">{k}</dt>
      <dd className="font-semibold text-slate-950">{v}</dd>
    </div>
  );
}
