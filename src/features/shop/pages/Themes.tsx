import {useEffect, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {Check, LoaderCircle, Paintbrush, RefreshCw} from 'lucide-react';
import {THEME_PRESETS, type ThemePresetId} from '@/domain/theme';
import {createThemeDraft, type StoreDesignLifecycle} from '@/domain/storeDesign';
import {adminApi} from '@/data/dataSource';
import {StoreDesignConflictError} from '@/features/shop/api/storeDesign';

type Status =
  | {kind: 'idle'}
  | {kind: 'loading'}
  | {kind: 'saving'; themeId: ThemePresetId}
  | {kind: 'saved'; themeId: ThemePresetId}
  | {kind: 'conflict'}
  | {kind: 'error'; message: string};

export default function Themes() {
  const [lifecycle, setLifecycle] = useState<StoreDesignLifecycle | null>(null);
  const [status, setStatus] = useState<Status>({kind: 'loading'});

  async function loadLifecycle() {
    setStatus({kind: 'loading'});
    try {
      const next = await adminApi.loadOwnStoreDesign();
      setLifecycle(next);
      setStatus({kind: 'idle'});
    } catch (error) {
      setStatus({kind: 'error', message: error instanceof Error ? error.message : 'Theme အချက်အလက် ရယူ၍မရပါ။'});
    }
  }

  useEffect(() => {
    void loadLifecycle();
  }, []);

  const publishedTheme = lifecycle ? THEME_PRESETS[lifecycle.published.themeId] : null;
  const draftThemeId = lifecycle?.draft.themeId;

  const alternateThemes = useMemo(
    () => Object.entries(THEME_PRESETS) as Array<[ThemePresetId, (typeof THEME_PRESETS)[ThemePresetId]]>,
    [],
  );

  async function chooseTheme(targetThemeId: ThemePresetId) {
    if (!lifecycle || targetThemeId === lifecycle.draft.themeId) return;

    const expectedRevision = lifecycle.draftRevision;
    const document = createThemeDraft(lifecycle.draft, targetThemeId);
    setStatus({kind: 'saving', themeId: targetThemeId});

    try {
      const saved = await adminApi.saveDraft({expectedRevision, document});
      setLifecycle({
        ...lifecycle,
        draft: saved.document,
        draftRevision: saved.revision,
      });
      setStatus({kind: 'saved', themeId: targetThemeId});
    } catch (error) {
      if (error instanceof StoreDesignConflictError) {
        setStatus({kind: 'conflict'});
        return;
      }
      setStatus({kind: 'error', message: error instanceof Error ? error.message : 'Draft သိမ်း၍မရပါ။'});
    }
  }

  if (status.kind === 'loading' && !lifecycle) {
    return <div className="flex min-h-64 items-center justify-center"><LoaderCircle className="h-6 w-6 animate-spin text-brand-500" aria-label="Loading themes" /></div>;
  }

  if (!lifecycle || !publishedTheme) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-black text-slate-950">Themes</h1>
        <p className="text-sm text-rose-600">{status.kind === 'error' ? status.message : 'Theme အချက်အလက် ရယူ၍မရပါ။'}</p>
        <button type="button" onClick={() => void loadLifecycle()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-4 font-semibold text-slate-700"><RefreshCw className="h-4 w-4" />ပြန်စမ်းမည်</button>
      </section>
    );
  }

  const currentDraftThemeId = lifecycle.draft.themeId;

  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm font-semibold text-brand-600">Online Store</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Themes</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">လက်ရှိ live storefront က Published theme ကိုပဲ သုံးနေပါတယ်။ Theme အသစ်ရွေးတာက Draft ကိုပဲပြောင်းပြီး Publish မလုပ်မချင်း customer ဆီ မပြောင်းပါ။</p>
      </div>

      <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700"><Check className="h-3.5 w-3.5" />Published</span>
              <h2 className="mt-4 text-2xl font-black text-slate-950">{publishedTheme.label}</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">{publishedTheme.description}</p>
            </div>
            <Link to="/admin/online-store/themes/customize" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 font-bold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"><Paintbrush className="h-4 w-4" />Customize</Link>
          </div>
        </div>
        {draftThemeId !== lifecycle.published.themeId && (
          <div className="bg-amber-50 px-6 py-4 text-sm text-amber-900">
            Draft မှာ <strong>{THEME_PRESETS[currentDraftThemeId].label}</strong> ကိုရွေးထားပါတယ်။ Live store ကတော့ <strong>{publishedTheme.label}</strong> အတိုင်းပဲရှိနေပါသေးတယ်။
          </div>
        )}
      </article>

      <div>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-950">Theme library</h2>
            <p className="mt-1 text-sm text-slate-600">ရွေးလိုက်တာနဲ့ Draft အသစ်ဖြစ်မယ်။ Auto-publish မလုပ်ပါဘူး။</p>
          </div>
          {status.kind === 'saving' && <span className="text-sm font-semibold text-slate-500">Draft သိမ်းနေသည်…</span>}
          {status.kind === 'saved' && <span className="text-sm font-semibold text-emerald-700">Draft သိမ်းပြီးပါပြီ</span>}
        </div>

        {status.kind === 'conflict' && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
            <span>ဒီ Draft ကို တခြားနေရာက ပြောင်းထားပါတယ်။ အဟောင်းနဲ့ overwrite မလုပ်ဘဲ latest version ကိုပြန်ယူပါ။</span>
            <button type="button" onClick={() => void loadLifecycle()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-amber-400 bg-white px-4 font-bold"><RefreshCw className="h-4 w-4" />Reload</button>
          </div>
        )}

        {status.kind === 'error' && (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{status.message}</div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {alternateThemes.map(([themeId, preset]) => {
            const isDraft = themeId === currentDraftThemeId;
            const isPublished = themeId === lifecycle.published.themeId;
            const isSaving = status.kind === 'saving' && status.themeId === themeId;
            return (
              <article key={themeId} className="flex min-h-64 flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{preset.shortLabel}</span>
                  <div className="flex gap-2">
                    {isPublished && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">Published</span>}
                    {isDraft && <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">Draft</span>}
                  </div>
                </div>
                <h3 className="text-lg font-black text-slate-950">{preset.label}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{preset.description}</p>
                <button
                  type="button"
                  disabled={isDraft || status.kind === 'saving'}
                  onClick={() => void chooseTheme(themeId)}
                  className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-4 font-bold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
                  {isSaving ? 'Draft သိမ်းနေသည်…' : isDraft ? 'Draft မှာရွေးထားသည်' : 'Draft အဖြစ်ရွေးမည်'}
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
