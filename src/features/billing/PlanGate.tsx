// ---- Plan gating UI helpers -------------------------------------------------
// Shared presentation for locked (Business-only) features. Gating never DELETES
// a capability from Starter — it replaces the control with a clear, honest
// upsell so the seller knows what upgrading unlocks and why. Copy is
// public/seller-facing, so it's written accessibly (not caveman-terse).

import {Lock, Sparkles} from 'lucide-react';
import {PLAN_LABEL, usePlan} from '@/features/billing/plan';

export function PlanBadge({className = ''}: {className?: string}) {
  const {plan} = usePlan();
  const isBiz = plan === 'business';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide ${
        isBiz ? 'bg-gold-100 text-gold-700' : 'bg-cream-200 text-ink-soft'
      } ${className}`}>
      {isBiz && <Sparkles className="h-3 w-3" />}
      {PLAN_LABEL[plan]}
    </span>
  );
}

/** Full-width card shown in place of a Business-only page/section. */
export function UpgradeCard({title, children}: {title: string; children?: React.ReactNode}) {
  return (
    <div className="rounded-2xl border border-dashed border-gold-300 bg-gold-50/60 p-6 text-center">
      <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-gold-100 text-gold-700">
        <Lock className="h-5 w-5" />
      </span>
      <h3 className="my mt-3 font-display text-base font-bold text-ink">{title}</h3>
      {children && <p className="my mx-auto mt-1.5 max-w-md text-sm text-ink-soft">{children}</p>}
      <span className="my mt-4 inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-xs font-bold text-white">
        <Sparkles className="h-3.5 w-3.5 text-gold-400" /> Business package ဖြင့် အသုံးပြုနိုင်သည်
      </span>
    </div>
  );
}

/** Compact inline lock, for a single control inside a form. */
export function UpgradeInline({label}: {label: string}) {
  return (
    <div className="my flex items-center gap-2 rounded-xl border border-dashed border-gold-300 bg-gold-50/60 px-3 py-2.5 text-xs text-ink-soft">
      <Lock className="h-3.5 w-3.5 shrink-0 text-gold-600" />
      <span>
        <span className="font-semibold text-ink">{label}</span> — Business package feature
      </span>
    </div>
  );
}
