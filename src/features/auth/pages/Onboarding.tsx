// ---- Shop onboarding ---------------------------------------------------
// A freshly-authenticated seller has no `shops` row yet — this form creates
// it. Route-gated in App.tsx (RequireAdmin sends here when a session exists
// but no shop does) but also self-guards (below) since it's reachable
// directly at /admin/onboarding.

import {useEffect, useState} from 'react';
import {Navigate, useNavigate} from 'react-router-dom';
import {ShieldAlert, Store} from 'lucide-react';
import {useAdminAuth} from '@/features/auth/adminAuth';
import {createOwnShop} from '@/features/shop/sellerShop';
import {resolveSellerGate} from '@/features/billing/application';
import {APP_INITIAL} from '@/shared/lib/brand';
import {SLUG_RE, slugify} from '@/domain/slug';
import {regionNames, townshipsOf} from '@/shared/data/locations';

export default function Onboarding() {
  const {loading: authLoading, session, user} = useAdminAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [gate, setGate] = useState<'subscribe' | 'onboarding' | 'admin'>('subscribe');
  // Distinguish a failed lookup from a resolved paid-onboarding gate.
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [phone, setPhone] = useState('');
  const [fee, setFee] = useState('0');
  const [originRegion, setOriginRegion] = useState('');
  const [originTownship, setOriginTownship] = useState('');
  const [deliveryService, setDeliveryService] = useState<'ninjavan' | 'custom'>('ninjavan');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

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
        if (result.status === 'error') setLoadError(true);
        else setGate(result.gate);
      })
      .finally(() => alive && setChecking(false));
    return () => {
      alive = false;
    };
  }, [user, retry]);

  if (!authLoading && !session) return <Navigate to="/admin/login" replace />;
  if (!checking && !loadError && gate === 'admin') return <Navigate to="/admin" replace />;
  if (!checking && !loadError && gate === 'subscribe') return <Navigate to="/admin/subscribe" replace />;
  if (authLoading || checking) {
    return <div className="platform-shell grid min-h-screen place-items-center bg-[var(--minishop-canvas)] text-sm text-slate-500">Loading…</div>;
  }
  if (loadError) {
    return (
      <div className="platform-shell grid min-h-screen place-items-center bg-[var(--minishop-canvas)] px-4 text-center">
        <div className="max-w-sm">
          <p className="my text-sm text-slate-500">ဆိုင် အချက်အလက် ရယူ၍ မရသေးပါ — ကွန်ရက် ပြန်စစ်ပြီး ထပ်ကြိုးစားပါ။</p>
          <button
            onClick={() => setRetry((n) => n + 1)}
            className="my mt-4 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600">
            ထပ်ကြိုးစားရန်
          </button>
        </div>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const cleanSlug = slug.trim().toLowerCase();
    if (!name.trim()) return setErr('ဆိုင်နာမည် ဖြည့်ပါ။');
    if (!SLUG_RE.test(cleanSlug)) {
      return setErr('Link (slug) သည် အင်္ဂလိပ်စာလုံးအသေး/နံပါတ်/(-) ဖြင့်၊ ၃ လုံးအထက် ဖြစ်ရပါမည်။');
    }
    if (!originRegion || !originTownship) return setErr('ဆိုင်တည်နေရာကို ရွေးပါ။');
    const feeN = Number(fee);
    if (deliveryService === 'custom' && (!Number.isFinite(feeN) || feeN < 0)) return setErr('ပို့ခ မမှန်ပါ။');

    setErr('');
    setSaving(true);
    try {
      await createOwnShop(user.id, {
        name,
        slug: cleanSlug,
        phone,
        defaultDeliveryFee: deliveryService === 'custom' ? feeN : 0,
        originRegion,
        originTownship,
        deliveryService,
      });
      navigate('/admin', {replace: true});
    } catch (e: any) {
      setErr(e.message || 'ဆိုင် ဖန်တီး၍မရပါ။');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="platform-shell grid min-h-screen place-items-center bg-[var(--minishop-canvas)] px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-500 font-display text-2xl font-bold text-white shadow-lg">
            {APP_INITIAL}
          </span>
          <h1 className="my mt-4 font-display text-2xl font-bold text-slate-950">ဆိုင် စတင်ဖွင့်ရန်</h1>
          <p className="my mt-1 text-sm text-slate-500/70">အဆင့် ၄ ဆင့်ဖြင့် မိနစ်ပိုင်းအတွင်း ဆိုင်ဖွင့်နိုင်သည်</p>
        </div>

        <form onSubmit={submit} className="space-y-3 rounded-2xl border border-[var(--minishop-border)] bg-white p-6 shadow-[0_18px_50px_rgba(15,29,49,0.08)]">
          <label className="block">
            <span className="my mb-1.5 block text-sm font-semibold text-slate-950">ဆိုင်နာမည်</span>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              placeholder="ဥပမာ — Su Su Fashion"
              className="w-full rounded-xl border border-[var(--minishop-border)] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
            />
          </label>

          <label className="block">
            <span className="my mb-1.5 block text-sm font-semibold text-slate-950">ဆိုင် Link</span>
            <div className="flex items-center gap-1 rounded-xl border border-[var(--minishop-border)] bg-white px-3.5 py-2.5 focus-within:border-brand-500">
              <span className="my shrink-0 text-sm text-slate-500">/s/</span>
              <input
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value.toLowerCase());
                  setSlugTouched(true);
                }}
                placeholder="su-su-fashion"
                className="my w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
              />
            </div>
            <span className="my mt-1 block text-xs text-slate-500">
              ဆိုင် link — {slug.trim() ? (
                <span className="font-semibold text-brand-600">/s/{slug.trim()}</span>
              ) : (
                'ဖောက်သည်ကို မျှဝေမည့် အမြဲတမ်း လိပ်စာ'
              )}
              {' '}(နောက်ပြောင်း၍မရပါ)
            </span>
          </label>

          <label className="block">
            <span className="my mb-1.5 block text-sm font-semibold text-slate-950">ဖုန်းနံပါတ် (ရွေးချယ်)</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="09xxxxxxxxx"
              className="w-full rounded-xl border border-[var(--minishop-border)] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="my mb-1.5 block text-sm font-semibold text-slate-950">ဆိုင်တည်နေရာ တိုင်း / ပြည်နယ်</span>
              <select
                value={originRegion}
                onChange={(e) => {
                  setOriginRegion(e.target.value);
                  setOriginTownship('');
                }}
                className="w-full rounded-xl border border-[var(--minishop-border)] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-500">
                <option value="">— ရွေးချယ်ပါ —</option>
                {regionNames().map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="my mb-1.5 block text-sm font-semibold text-slate-950">မြို့ / မြို့နယ်</span>
              <select
                value={originTownship}
                disabled={!originRegion}
                onChange={(e) => setOriginTownship(e.target.value)}
                className="w-full rounded-xl border border-[var(--minishop-border)] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 disabled:opacity-60">
                <option value="">{originRegion ? '— ရွေးချယ်ပါ —' : 'တိုင်းအရင်ရွေးပါ'}</option>
                {townshipsOf(originRegion).map((t) => <option key={t.name} value={t.name}>{t.name}</option>)}
              </select>
            </label>
          </div>

          <div>
            <span className="my mb-1.5 block text-sm font-semibold text-slate-950">Delivery Service</span>
            <div className="grid grid-cols-2 gap-2">
              {([
                ['ninjavan', 'Ninja Van', 'ပို့သူ/လက်ခံသူ တည်နေရာအလိုက် အော်တိုတွက်မည်'],
                ['custom', 'Custom', 'ကိုယ်ပိုင်ပို့ခကို သတ်မှတ်မည်'],
              ] as const).map(([key, title, sub]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDeliveryService(key)}
                  className={`rounded-xl border p-3 text-left transition ${deliveryService === key ? 'border-brand-500 bg-brand-50' : 'border-[var(--minishop-border)] bg-white'}`}>
                  <span className="my block text-sm font-bold text-slate-950">{title}</span>
                  <span className="my mt-1 block text-xs text-slate-500">{sub}</span>
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="my mb-1.5 block text-sm font-semibold text-slate-950">ပုံမှန် ပို့ခ (Ks)</span>
            <input
              inputMode="numeric"
              value={fee}
              disabled={deliveryService !== 'custom'}
              onChange={(e) => setFee(e.target.value)}
              className="w-full rounded-xl border border-[var(--minishop-border)] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <span className="my mt-1 block text-xs text-slate-500">
              {deliveryService === 'ninjavan'
                ? 'Ninja Van ကိုရွေးထားလျှင် checkout မှာ sender city + customer township အလိုက် အော်တိုတွက်မည်'
                : 'Custom ကိုရွေးထားလျှင် zone မရှိသောနေရာများအတွက် ဒီပမာဏကို သုံးမည်'}
            </span>
          </label>

          {err && (
            <p className="my flex items-center gap-1.5 text-sm text-brand-600">
              <ShieldAlert className="h-4 w-4 shrink-0" /> {err}
            </p>
          )}

          <button
            disabled={saving}
            className="my mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-500 py-3 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-50">
            <Store className="h-4 w-4" /> {saving ? 'ဖန်တီးနေသည်…' : 'ဆိုင် ဖန်တီးရန်'}
          </button>

          <p className="my pt-1 text-center text-xs text-slate-500">
            Logo၊ ငွေလွှဲအကောင့်၊ ပို့ဆောင်ခ ဇုန်များကို ဆိုင်ဖွင့်ပြီးမှ “ဆိုင် ချိန်ညှိ” တွင် ထည့်နိုင်သည်။
          </p>
        </form>
      </div>
    </div>
  );
}
