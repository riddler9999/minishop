// ---- SHOP: Store Design (storefront customization) --------------------------
// The Shopify-style storefront editor: a form ("inspector") on the left and a
// live phone preview ("canvas") on the right, both driven by one draft copy of
// the shop's StorefrontTheme. Save writes the whole blob via
// adminApi.updateShopTheme(); the storefront then renders it (Home / Category /
// Product pages + a global announcement bar). Business-gated, consistent with
// the existing branding feature.
//
// Store Design is cosmetic only — normalizeTheme() re-validates on both write
// and read, so nothing here can put the storefront into a broken state.

import {useEffect, useMemo, useRef, useState} from 'react';
import {AlertTriangle, Check, Eye, Image as ImageIcon, Loader2, Palette, Pencil, RotateCcw, Save, Sparkles, Upload, X} from 'lucide-react';
import {adminApi} from '@/data/dataSource';
import type {Product} from '@/domain/product';
import {DEFAULT_THEME, THEME_PRESETS, themeFromPreset, type StorefrontTheme, type ThemePresetId} from '@/domain/theme';
import {FONT_PAIRING_IDS, FONT_PAIRINGS, type FontPairingId} from '@/domain/fontPairing';
import {usePlan} from '@/features/billing/plan';
import {PlanBadge, UpgradeCard} from '@/features/billing/PlanGate';
import {SHOP_LOGOS_BUCKET} from '@/core/storage/buckets';
import {validateImageFile, prepareImageForUpload, deriveStoragePath} from '@/core/storage/imageUpload';
import {cx} from '@/shared/lib/format';
import StorePreview, {type PreviewPage} from '@/features/shop/components/StorePreview';

type Section = 'themes' | 'global' | 'home' | 'category' | 'product';

const SECTIONS: {id: Section; label: string; preview: PreviewPage}[] = [
  {id: 'themes', label: 'Themes', preview: 'home'},
  {id: 'global', label: 'အထွေထွေ', preview: 'home'},
  {id: 'home', label: 'ပင်မစာမျက်နှာ', preview: 'home'},
  {id: 'category', label: 'ပစ္စည်းစာရင်း', preview: 'category'},
  {id: 'product', label: 'ပစ္စည်းအသေးစိတ်', preview: 'product'},
];

export default function StoreDesign() {
  const {shop, features, loading} = usePlan();

  if (loading) return <div className="grid min-h-[40vh] place-items-center text-sm text-ink-soft">Loading…</div>;
  if (!shop) return <p className="my text-sm text-ink-soft">ဆိုင် အချက်အလက် ရှာမတွေ့ပါ။</p>;

  if (!features.branding) {
    return (
      <div className="space-y-5">
        <Header />
        <UpgradeCard title="Store Design">
          ပင်မစာမျက်နှာ၊ ပစ္စည်းစာရင်းနှင့် ပစ္စည်းအသေးစိတ် စာမျက်နှာများကို ကိုယ်ပိုင်ပုံစံ customize လုပ်ခြင်းသည် Business package feature ဖြစ်သည်။
        </UpgradeCard>
      </div>
    );
  }

  return <StoreDesignEditor key={shop.id} shopName={shop.name} logoUrl={shop.logoUrl} />;
}

function Header() {
  return (
    <div>
      <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-ink">
        <Palette className="h-6 w-6 text-brand-500" /> Store Design
        <PlanBadge className="ml-1" />
      </h1>
      <p className="my mt-1 text-sm text-ink-soft">ဆိုင် storefront ၏ ပင်မ၊ ပစ္စည်းစာရင်းနှင့် ပစ္စည်းအသေးစိတ် စာမျက်နှာများကို ကိုယ်တိုင် ပြင်ဆင်၍ live preview ဖြင့် ကြည့်ရှုနိုင်သည်။</p>
    </div>
  );
}

function StoreDesignEditor({shopName, logoUrl}: {shopName: string; logoUrl: string | null}) {
  const [draft, setDraft] = useState<StorefrontTheme>(DEFAULT_THEME);
  const [saved, setSaved] = useState<StorefrontTheme>(DEFAULT_THEME);
  const [supported, setSupported] = useState(true);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [section, setSection] = useState<Section>('themes');
  const [mobileView, setMobileView] = useState<'edit' | 'preview'>('edit');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState(false);

  // Hero-image upload consistency (same invariant as the logo in Settings): an
  // object uploaded but not yet saved is tracked so it can be cleaned up on
  // replace / save-failure / unmount, and the previous saved object is only
  // deleted AFTER a successful write.
  const [uploadingHero, setUploadingHero] = useState(false);
  const [heroErr, setHeroErr] = useState('');
  const [pendingHeroPath, setPendingHeroPath] = useState<string | null>(null);
  const pendingHeroPathRef = useRef(pendingHeroPath);
  pendingHeroPathRef.current = pendingHeroPath;

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [{theme, supported: isSupported}, {products: list}] = await Promise.all([
          adminApi.getShopTheme(),
          adminApi.listProducts(),
        ]);
        if (!alive) return;
        setDraft(theme);
        setSaved(theme);
        setSupported(isSupported);
        setProducts(list.filter((p) => p.status === 'active').slice(0, 8));
      } catch (e: any) {
        if (alive) setErr(e.message || 'Store Design ဆွဲယူ၍မရပါ။');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {alive = false;};
  }, []);

  // Delete an unsaved hero upload if the seller leaves without saving.
  useEffect(
    () => () => {
      if (pendingHeroPathRef.current) void adminApi.deleteShopLogo(pendingHeroPathRef.current);
    },
    [],
  );

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category).filter((c): c is string => !!c))),
    [products],
  );
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved]);
  const previewPage = SECTIONS.find((s) => s.id === section)?.preview ?? 'home';

  // Nested updaters — each returns a new theme so React re-renders the preview.
  const patch = (p: Partial<StorefrontTheme>) => {setDraft((d) => ({...d, ...p})); setOk(false);};
  const applyPreset = (id: ThemePresetId) => {
    setDraft((current) => themeFromPreset(id, current));
    setOk(false);
  };
  const patchHome = (p: Partial<StorefrontTheme['home']>) => {setDraft((d) => ({...d, home: {...d.home, ...p}})); setOk(false);};
  const patchAnnouncement = (p: Partial<StorefrontTheme['announcement']>) => {setDraft((d) => ({...d, announcement: {...d.announcement, ...p}})); setOk(false);};
  const patchCategory = (p: Partial<StorefrontTheme['category']>) => {setDraft((d) => ({...d, category: {...d.category, ...p}})); setOk(false);};
  const patchProduct = (p: Partial<StorefrontTheme['product']>) => {setDraft((d) => ({...d, product: {...d.product, ...p}})); setOk(false);};

  const save = async () => {
    setErr('');
    setOk(false);
    setSaving(true);
    const previousHeroUrl = saved.home.heroImageUrl;
    try {
      await adminApi.updateShopTheme(draft);
      // Only after the write succeeds is it safe to drop the previously-saved
      // hero object (if it changed) — deleting earlier risks a live URL pointing
      // at nothing had the write failed.
      if (previousHeroUrl && previousHeroUrl !== draft.home.heroImageUrl) {
        const oldPath = deriveStoragePath(previousHeroUrl, SHOP_LOGOS_BUCKET);
        if (oldPath) await adminApi.deleteShopLogo(oldPath).catch(() => {});
      }
      setPendingHeroPath(null);
      setSaved(draft);
      setOk(true);
    } catch (e: any) {
      setErr(e.message || 'သိမ်း၍မရပါ။');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = () => {
    // Keep any already-saved hero image; only the copy/toggles reset. (Clearing
    // the hero is a separate, explicit action via the Remove button.)
    setDraft((d) => ({...DEFAULT_THEME, home: {...DEFAULT_THEME.home, heroImageUrl: d.home.heroImageUrl}}));
    setOk(false);
  };

  const onHeroFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = '';
    if (!file) return;
    const validationError = validateImageFile(file);
    if (validationError) return setHeroErr(validationError);
    setHeroErr('');
    setUploadingHero(true);
    try {
      const prepared = await prepareImageForUpload(file);
      const {url, path} = await adminApi.uploadShopLogo(prepared);
      // Replacing an earlier unsaved pick — that object was never persisted, so
      // it can be removed immediately.
      if (pendingHeroPath) await adminApi.deleteShopLogo(pendingHeroPath).catch(() => {});
      setPendingHeroPath(path);
      patchHome({heroImageUrl: url});
    } catch (e: any) {
      setHeroErr(e.message || 'ပုံ တင်၍မရပါ။');
    } finally {
      setUploadingHero(false);
    }
  };

  const removeHero = async () => {
    if (pendingHeroPath) {
      await adminApi.deleteShopLogo(pendingHeroPath).catch(() => {});
      setPendingHeroPath(null);
    }
    patchHome({heroImageUrl: null});
  };

  if (loading) return <div className="grid min-h-[40vh] place-items-center text-sm text-ink-soft">Loading…</div>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Header />
        <div className="flex items-center gap-2">
          <button
            onClick={resetToDefault}
            className="my inline-flex items-center gap-1.5 rounded-xl border border-cream-200 px-3 py-2.5 text-sm font-semibold text-ink hover:bg-cream-100">
            <RotateCcw className="h-4 w-4" /> Default
          </button>
          <button
            onClick={save}
            disabled={saving || !dirty || !supported}
            className="my inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {saving ? 'သိမ်းနေသည်…' : 'သိမ်းရန်'}
          </button>
        </div>
      </div>

      {!supported && (
        <div className="flex items-start gap-2 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Store Design ကို သိမ်းဆည်းရန် database migration <code className="font-mono">0009_shop_theme</code> ကို apply လုပ်ရန် လိုအပ်ပါသည်။ ယခု preview ကိုသာ ကြည့်ရှုနိုင်ပြီး မသိမ်းနိုင်သေးပါ။</span>
        </div>
      )}

      {err && <p className="my flex items-center gap-1.5 text-sm text-brand-600"><X className="h-4 w-4" /> {err}</p>}
      {ok && <p className="my flex items-center gap-1.5 text-sm text-emerald-600"><Check className="h-4 w-4" /> သိမ်းပြီးပါပြီ။</p>}

      {/* Mobile edit/preview switch */}
      <div className="flex gap-1 rounded-xl border border-cream-200 bg-cream-50 p-1 lg:hidden">
        {(['edit', 'preview'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setMobileView(v)}
            className={cx('flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition', mobileView === v ? 'bg-white text-ink shadow-sm' : 'text-ink-soft')}>
            {v === 'edit' ? <><Pencil className="h-4 w-4" /> ပြင်ဆင်ရန်</> : <><Eye className="h-4 w-4" /> Preview</>}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
        {/* Inspector */}
        <div className={cx('space-y-4', mobileView === 'preview' && 'hidden lg:block')}>
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={cx('shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition', section === s.id ? 'bg-brand-700 text-cream-100' : 'border border-cream-200 bg-white text-ink hover:bg-cream-100')}>
                {s.label}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-cream-200 bg-white p-4 sm:p-5">
            {section === 'themes' && (
              <div className="space-y-3">
                <div>
                  <h2 className="my text-base font-bold text-ink">Store Theme ရွေးရန်</h2>
                  <p className="my mt-1 text-xs text-ink-soft">Theme ရွေးပြီးနောက် အရောင်၊ စာသား၊ ပုံနဲ့ typography ကို ဆက်ပြီး customize လုပ်နိုင်သည်။</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(Object.entries(THEME_PRESETS) as [ThemePresetId, (typeof THEME_PRESETS)[ThemePresetId]][]).map(([id, preset]) => {
                    const active = draft.presetId === id;
                    return (
                      <button key={id} type="button" onClick={() => applyPreset(id)}
                        className={cx('my overflow-hidden rounded-2xl border p-3 text-left transition', active ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-cream-200 bg-white hover:bg-cream-50')}>
                        <span className="mb-3 flex h-16 overflow-hidden rounded-xl border border-black/5 bg-white">
                          <span className="w-2/5" style={{backgroundColor: preset.theme.accentColor}} />
                          <span className="flex flex-1 flex-col justify-center gap-1.5 p-2">
                            <span className="h-2 w-4/5 rounded-full bg-slate-900/80" />
                            <span className="h-1.5 w-full rounded-full bg-slate-200" />
                            <span className="h-1.5 w-2/3 rounded-full bg-slate-200" />
                          </span>
                        </span>
                        <span className="my flex items-center justify-between gap-2 text-sm font-bold text-ink">
                          {preset.label}{active && <Check className="h-4 w-4 text-brand-500" />}
                        </span>
                        <span className="my mt-1 block text-xs leading-5 text-ink-soft">{preset.description}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {section === 'global' && (
              <div className="space-y-4">
                <FontPairingField value={draft.fontPairing} onChange={(v) => patch({fontPairing: v})} />
                <hr className="border-cream-200" />
                <ColorField label="အသားပေးအရောင် (Accent)" value={draft.accentColor} onChange={(v) => patch({accentColor: v})} />
                <Toggle label="ကြေညာချက်ဘား ပြရန်" hint="storefront စာမျက်နှာအားလုံး၏ ထိပ်တွင် ပေါ်မည်" checked={draft.announcement.enabled} onChange={(v) => patchAnnouncement({enabled: v})} />
                <TextField label="ကြေညာချက် စာသား" value={draft.announcement.text} onChange={(v) => patchAnnouncement({text: v})} placeholder="ဥပမာ — ရန်ကုန်တွင်း အခမဲ့ပို့ဆောင်ပေးသည်" maxLength={200} />
              </div>
            )}

            {section === 'home' && (
              <div className="space-y-4">
                <Toggle label="Hero band ပြရန်" checked={draft.home.heroEnabled} onChange={(v) => patchHome({heroEnabled: v})} />
                <TextArea label="Hero ခေါင်းစဉ်" value={draft.home.heroHeadline} onChange={(v) => patchHome({heroHeadline: v})} maxLength={120} />
                <TextArea label="Hero စာသား" value={draft.home.heroSubtext} onChange={(v) => patchHome({heroSubtext: v})} maxLength={300} />
                <TextField label="Hero ခလုတ် စာသား" value={draft.home.heroCtaLabel} onChange={(v) => patchHome({heroCtaLabel: v})} maxLength={40} />
                <HeroImageField
                  url={draft.home.heroImageUrl}
                  uploading={uploadingHero}
                  error={heroErr}
                  onFile={onHeroFileChange}
                  onRemove={removeHero}
                />
                <hr className="border-cream-200" />
                <Toggle label="Category rail ပြရန်" checked={draft.home.categoriesEnabled} onChange={(v) => patchHome({categoriesEnabled: v})} />
                <TextField label="ပစ္စည်းကဏ္ဍ ခေါင်းစဉ်" value={draft.home.featuredTitle} onChange={(v) => patchHome({featuredTitle: v})} maxLength={80} />
                <TextField label="ပစ္စည်းကဏ္ဍ စာသား" value={draft.home.featuredSubtitle} onChange={(v) => patchHome({featuredSubtitle: v})} maxLength={160} />
              </div>
            )}

            {section === 'category' && (
              <div className="space-y-4">
                <TextField label="စာမျက်နှာ ခေါင်းစဉ်" value={draft.category.heading} onChange={(v) => patchCategory({heading: v})} maxLength={60} />
                <Toggle label="ရှာဖွေမှု box ပြရန်" checked={draft.category.searchEnabled} onChange={(v) => patchCategory({searchEnabled: v})} />
              </div>
            )}

            {section === 'product' && (
              <div className="space-y-4">
                <Toggle label="ဆင်တူ ပစ္စည်းများ ပြရန်" checked={draft.product.relatedEnabled} onChange={(v) => patchProduct({relatedEnabled: v})} />
                <TextField label="“ခြင်းထဲထည့်” ခလုတ် စာသား" value={draft.product.addToCartLabel} onChange={(v) => patchProduct({addToCartLabel: v})} maxLength={40} />
                <TextField label="“ဝယ်မည်” ခလုတ် စာသား" value={draft.product.buyNowLabel} onChange={(v) => patchProduct({buyNowLabel: v})} maxLength={40} />
              </div>
            )}
          </div>
        </div>

        {/* Canvas */}
        <div className={cx(mobileView === 'edit' && 'hidden lg:block')}>
          <div className="lg:sticky lg:top-24">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
              <Sparkles className="h-3.5 w-3.5 text-gold-500" /> Live preview — {SECTIONS.find((s) => s.id === section)?.label}
            </div>
            <StorePreview theme={draft} page={previewPage} products={products} categories={categories} shopName={shopName} logoUrl={logoUrl} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- reusable inspector controls --------------------------------------------

const lbl = 'my mb-1.5 block text-sm font-semibold text-ink';
const inputCls = 'w-full rounded-xl border border-cream-200 bg-cream-50 px-3.5 py-2.5 text-sm outline-none focus:border-brand-400';

function TextField({label, value, onChange, placeholder, maxLength}: {label: string; value: string; onChange: (v: string) => void; placeholder?: string; maxLength?: number}) {
  return (
    <label className="block">
      <span className={lbl}>{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} maxLength={maxLength} className={inputCls} />
    </label>
  );
}

function TextArea({label, value, onChange, maxLength}: {label: string; value: string; onChange: (v: string) => void; maxLength?: number}) {
  return (
    <label className="block">
      <span className={lbl}>{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} maxLength={maxLength} rows={2} className={cx(inputCls, 'resize-none')} />
    </label>
  );
}

function FontPairingField({value, onChange}: {value: FontPairingId; onChange: (v: FontPairingId) => void}) {
  return (
    <div className="block">
      <span className={lbl}>စာလုံးပုံစံ (Typography)</span>
      <div role="radiogroup" aria-label="Typography" className="grid grid-cols-3 gap-2">
        {FONT_PAIRING_IDS.map((id) => {
          const pairing = FONT_PAIRINGS[id];
          const active = value === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(id)}
              className={cx(
                'my flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2.5 text-center transition',
                active ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-cream-200 bg-white text-ink hover:bg-cream-100',
              )}>
              <span style={{fontFamily: pairing.display}} className="text-base">{pairing.sampleText}</span>
              <span className="text-[11px] font-semibold">{pairing.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ColorField({label, value, onChange}: {label: string; value: string; onChange: (v: string) => void}) {
  return (
    <div className="block">
      <span className={lbl}>{label}</span>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-cream-200 bg-white p-1" />
        <input value={value} onChange={(e) => onChange(e.target.value)} className={cx(inputCls, 'font-mono')} placeholder="#e11d48" />
      </div>
    </div>
  );
}

function Toggle({label, hint, checked, onChange}: {label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void}) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex w-full items-center justify-between gap-3 text-left">
      <span>
        <span className="my block text-sm font-semibold text-ink">{label}</span>
        {hint && <span className="my block text-xs text-ink-soft">{hint}</span>}
      </span>
      <span className={cx('relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition', checked ? 'bg-brand-500' : 'bg-cream-300')}>
        <span className={cx('inline-block h-5 w-5 transform rounded-full bg-white shadow transition', checked ? 'translate-x-5' : 'translate-x-0.5')} />
      </span>
    </button>
  );
}

function HeroImageField({url, uploading, error, onFile, onRemove}: {url: string | null; uploading: boolean; error: string; onFile: (e: React.ChangeEvent<HTMLInputElement>) => void; onRemove: () => void}) {
  return (
    <div className="block">
      <span className={lbl}><span className="inline-flex items-center gap-1.5"><ImageIcon className="h-4 w-4 text-gold-600" /> Hero ပုံ (မထည့်ရင် ပထမဆုံး ပစ္စည်းပုံကို သုံးမည်)</span></span>
      <div className="flex items-center gap-3">
        {url ? (
          <div className="relative">
            <img src={url} alt="hero preview" className="h-14 w-20 rounded-xl border border-cream-200 object-cover" />
            <button type="button" onClick={onRemove} aria-label="Hero ပုံ ဖယ်ရှားရန်" className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-ink text-white shadow"><X className="h-3 w-3" /></button>
          </div>
        ) : (
          <div className="grid h-14 w-20 shrink-0 place-items-center rounded-xl border border-dashed border-cream-300 bg-cream-50 text-ink-soft"><ImageIcon className="h-5 w-5" /></div>
        )}
        <label className={cx('my inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-cream-200 px-3.5 py-2.5 text-sm font-semibold text-ink hover:bg-cream-100', uploading && 'pointer-events-none opacity-60')}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? 'တင်နေသည်…' : url ? 'ပြောင်းရန်' : 'ပုံတင်ရန်'}
          <input type="file" accept="image/png,image/webp" className="hidden" onChange={onFile} disabled={uploading} />
        </label>
      </div>
      <span className="my mt-1.5 block text-xs text-ink-soft">PNG သို့မဟုတ် WebP ပုံဖိုင်သာ (JPG/JPEG လက်မခံပါ)။</span>
      {error && <p className="my mt-1 text-sm text-brand-600">{error}</p>}
    </div>
  );
}
