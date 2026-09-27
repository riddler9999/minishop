import {Check, Palette, PencilRuler} from 'lucide-react';
import {Link} from 'react-router-dom';
import {THEME_PRESETS} from '@/domain/theme';

export default function Themes() {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-500">Online Store</p>
          <h1 className="mt-1 text-2xl font-black text-slate-950">Store Builder</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Theme ကိုရွေးပြီး storefront ကို Customize လုပ်နိုင်တယ်။ Publish မလုပ်မချင်း buyer-facing store ကို မထိဘူး။</p>
        </div>
        <Link to="/admin/online-store/themes/customize" className="inline-flex items-center gap-2 rounded-2xl bg-brand-500 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-brand-600">
          <PencilRuler className="h-4 w-4"/> Customize store
        </Link>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2"><Palette className="h-5 w-5 text-brand-500"/><h2 className="text-lg font-black text-slate-950">Themes</h2></div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Object.entries(THEME_PRESETS).map(([id, preset], index) => (
            <article key={id} className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
              <div className="aspect-[4/3] p-4" style={{backgroundColor:preset.visual.canvas}}>
                <div className="h-full rounded-2xl border border-black/10 p-3" style={{backgroundColor:preset.visual.surface}}>
                  <div className="mb-3 h-16 rounded-xl" style={{backgroundColor:preset.visual.accent,opacity:.22}}/>
                  <div className="grid grid-cols-3 gap-2">{Array.from({length:6}).map((_,i)=><span key={i} className="aspect-square rounded-lg border border-black/10" style={{backgroundColor:i%2?preset.visual.border:preset.visual.surface}}/>)}</div>
                </div>
              </div>
              <div className="flex items-start justify-between gap-3 p-4">
                <div><strong className="block text-sm font-black text-slate-950">{preset.label}</strong><span className="mt-1 block text-xs leading-5 text-slate-500">{preset.description}</span></div>
                {index===0 && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700"><Check className="h-3 w-3"/> Published</span>}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
