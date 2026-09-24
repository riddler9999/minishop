// ---- Shop settings / branding ----------------------------------------------
// Seller-managed shop profile: name, phone, default delivery fee (all plans);
// logo + extended branding (all plans). Writes go through updateOwnShop() which
// is confined by RLS to the seller's own row. The public `/s/:slug` address is
// intentionally read-only here — changing it would break every shared link.

import {useEffect, useMemo, useRef, useState} from 'react';
import {Store, Save, Link2, Copy, Check, Image as ImageIcon, Upload, X, Loader2} from 'lucide-react';
import type {User} from '@supabase/supabase-js';
import {useAdminAuth} from '@/features/auth/adminAuth';
import {usePlan, PLAN_LABEL} from '@/features/billing/plan';
import {updateOwnShop, type OwnShop} from '@/features/shop/sellerShop';
import {SHOP_LOGOS_BUCKET} from '@/core/storage/buckets';
import {adminApi} from '@/data/dataSource';
import {validateImageFile, prepareImageForUpload, deriveStoragePath} from '@/core/storage/imageUpload';
import {PlanBadge} from '@/features/billing/PlanGate';
import {cx} from '@/shared/lib/format';

const field =
  'w-full rounded-xl border border-cream-200 bg-cream-50 px-3.5 py-2.5 text-sm outline-none focus:border-brand-400';
const lbl = 'my mb-1.5 block text-sm font-semibold text-ink';

export default function Settings() {
  const {user} = useAdminAuth();
  const {shop, loading} = usePlan();

  if (loading) {
    return <div className="grid min-h-[40vh] place-items-center text-sm text-ink-soft">Loading…</div>;
  }
  if (!shop || !user) {
    return <p className="my text-sm text-ink-soft">ဆိုင် အချက်အလက် ရှာမတွေ့ပါ။</p>;
  }
  // Keyed on shop.id so the form's initial state always reflects the loaded shop
  // (a direct hard-load resolves the shop AFTER first render; remounting on id
  // seeds the inputs correctly instead of leaving them blank).
  return <SettingsForm key={shop.id} shop={shop} user={user} />;
}

function SettingsForm({shop, user}: {shop: OwnShop; user: User}) {
  const {plan, refresh} = usePlan();

  const [name, setName] = useState(shop.name);
  const [phone, setPhone] = useState(shop.phone ?? '');
  const [fee, setFee] = useState(String(shop.defaultDeliveryFee));
  const [logoUrl, setLogoUrl] = useState(shop.logoUrl ?? '');
  // Path of a logo uploaded THIS session that hasn't been saved into
  // shops.logo_url yet — kept so it can be cleaned up if the seller replaces
  // it again, fails to save, or navigates away before saving (see PROJECT.md
  // Task B invariant: upload before the write, never leave an orphan).
  const [pendingLogoPath, setPendingLogoPath] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoErr, setLogoErr] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState(false);
  const [copied, setCopied] = useState(false);

  // Delete any not-yet-saved upload if the seller navigates away without
  // saving — a ref keeps the cleanup effect from needing pendingLogoPath in
  // its dependency array (it must only run once, on unmount).
  const pendingLogoPathRef = useRef(pendingLogoPath);
  pendingLogoPathRef.current = pendingLogoPath;
  useEffect(
    () => () => {
      if (pendingLogoPathRef.current) void adminApi.deleteShopLogo(pendingLogoPathRef.current);
    },
    [],
  );

  // The public storefront URL for this shop (channel-neutral — a seller pastes
  // it into any bio/message/QR, TikTok included).
  const storeUrl = useMemo(() => `${window.location.origin}/s/${shop.slug}`, [shop.slug]);

  const save = async () => {
    const feeN = Number(fee);
    if (!name.trim()) return setErr('ဆိုင်နာမည် ဖြည့်ပါ။');
    if (!Number.isFinite(feeN) || feeN < 0) return setErr('ပို့ခ မမှန်ပါ။');
    setErr('');
    setOk(false);
    setSaving(true);
    const previousLogoUrl = shop.logoUrl;
    try {
      await updateOwnShop(user.id, {
        name,
        phone,
        defaultDeliveryFee: feeN,        logoUrl,
      });
      // Only after the DB write succeeds is it safe to drop the old object —
      // deleting first risks a persisted URL pointing at nothing if the write
      // above had failed instead.
      if (previousLogoUrl && previousLogoUrl !== logoUrl) {
        const oldPath = deriveStoragePath(previousLogoUrl, SHOP_LOGOS_BUCKET);
        if (oldPath) await adminApi.deleteShopLogo(oldPath).catch(() => {});
      }
      setPendingLogoPath(null);
      setOk(true);
      refresh();
    } catch (e: any) {
      // The write failed — undo only what this attempt uploaded. Nothing else
      // was touched, so there's nothing else to compensate.
      if (pendingLogoPath) {
        await adminApi.deleteShopLogo(pendingLogoPath).catch(() => {});
        setPendingLogoPath(null);
        setLogoUrl(shop.logoUrl ?? '');
      }
      setErr(e.message || 'သိမ်း၍မရပါ။');
    } finally {
      setSaving(false);
    }
  };

  const onLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;
    const validationError = validateImageFile(file);
    if (validationError) return setLogoErr(validationError);
    setLogoErr('');
    setUploadingLogo(true);
    try {
      const prepared = await prepareImageForUpload(file);
      const {url, path} = await adminApi.uploadShopLogo(prepared);
      // Replacing an earlier pick from this same session — that upload was
      // never saved anywhere, so it's safe to delete immediately.
      if (pendingLogoPath) await adminApi.deleteShopLogo(pendingLogoPath).catch(() => {});
      setPendingLogoPath(path);
      setLogoUrl(url);
    } catch (e: any) {
      setLogoErr(e.message || 'ပုံ တင်၍မရပါ။');
    } finally {
      setUploadingLogo(false);
    }
  };

  const removeLogo = async () => {
    if (pendingLogoPath) {
      await adminApi.deleteShopLogo(pendingLogoPath).catch(() => {});
      setPendingLogoPath(null);
    }
    setLogoUrl('');
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked (e.g. WebView) — the link is shown for manual copy */
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-ink">
          <Store className="h-6 w-6 text-brand-500" /> ဆိုင် ချိန်ညှိ
          <PlanBadge className="ml-1" />
        </h1>
        <p className="my mt-1 text-sm text-ink-soft">ဆိုင်၏ အမည်၊ ဆက်သွယ်ရန်နှင့် branding ကို စီမံပါ။</p>
      </div>

      {/* Public link */}
      <section className="rounded-2xl border border-cream-200 bg-white p-4">
        <h2 className="my mb-2 flex items-center gap-1.5 text-sm font-bold text-ink">
          <Link2 className="h-4 w-4 text-brand-500" /> ဆိုင် Link (အများမြင်)
        </h2>
        <div className="flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-xl border border-cream-200 bg-cream-50 px-3 py-2.5 text-sm text-ink">
            {storeUrl}
          </code>
          <button
            onClick={copyUrl}
            className="my inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-cream-200 px-3 py-2.5 text-sm font-semibold text-ink hover:bg-cream-100">
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            {copied ? 'ကူးပြီး' : 'Copy'}
          </button>
        </div>
        <p className="my mt-2 text-xs text-ink-soft">ဤ link ကို bio / post / message တွင် မျှဝေပါ။ (link ကို ပြောင်း၍မရပါ)</p>
      </section>

      {/* Profile form */}
      <section className="space-y-3 rounded-2xl border border-cream-200 bg-white p-5">
        <label className="block">
          <span className={lbl}>ဆိုင်နာမည် <span className="text-brand-600">*</span></span>
          <input value={name} onChange={(e) => setName(e.target.value)} className={field} placeholder="ဆိုင်နာမည်" />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className={lbl}>ဖုန်းနံပါတ်</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={field} placeholder="09xxxxxxxxx" />
          </label>
          <label className="block">
            <span className={lbl}>ပုံမှန် ပို့ခ (Ks)</span>
            <input inputMode="numeric" value={fee} onChange={(e) => setFee(e.target.value)} className={field} placeholder="0" />
          </label>
        </div>

        {/* Branding — Business only */}
        

        {err && <p className="my text-sm text-brand-600">{err}</p>}
        {ok && (
          <p className="my flex items-center gap-1.5 text-sm text-emerald-600">
            <Check className="h-4 w-4" /> သိမ်းပြီးပါပြီ။
          </p>
        )}

        <button
          onClick={save}
          disabled={saving}
          className="my inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50">
          <Save className="h-4 w-4" /> {saving ? 'သိမ်းနေသည်…' : 'သိမ်းရန်'}
        </button>
      </section>

      {/* Integration hooks — Business placeholder (channel-neutral, no external calls) */}
      {features.integrations && (
        <section className="rounded-2xl border border-cream-200 bg-white p-5">
          <h2 className="my mb-1 text-sm font-bold text-ink">Integration-ready</h2>
          <p className="my mb-3 text-xs text-ink-soft">
            အောက်ပါ public URL များကို ပြင်ပ tool / automation တွင် ချိတ်ဆက်ရန် အသုံးပြုနိုင်သည်။
          </p>
          <dl className="space-y-2 text-sm">
            <IntegrationRow label="Storefront" value={storeUrl} />
            <IntegrationRow label="Order tracking" value={`${storeUrl}/orders`} />
          </dl>
        </section>
      )}

      <p className="my text-xs text-ink-soft/70">
        Package: <span className="font-semibold text-ink">{PLAN_LABEL[plan]}</span>
      </p>
    </div>
  );
}

function IntegrationRow({label, value}: {label: string; value: string}) {
  return (
    <div className={cx('flex flex-col gap-1 rounded-xl border border-cream-200 bg-cream-50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between')}>
      <span className="my font-semibold text-ink-soft">{label}</span>
      <code className="truncate text-xs text-ink">{value}</code>
    </div>
  );
}
