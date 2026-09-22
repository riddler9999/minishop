// ---- Seller order-entitlement summary ---------------------------------------
// Shows the two balances the seller has, kept VISUALLY SEPARATE because they
// expire differently (monthly quota resets on renewal; purchased Extra Orders
// never expire). Mobile-first, Burmese, TikTok-WebView friendly. Reads the live
// counters through adminApi.getEntitlement() (the same numbers place_order()
// enforces server-side).

import {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {Infinity as InfinityIcon, PlusCircle, ShoppingBag, Sparkles} from 'lucide-react';
import {adminApi} from '@/data/dataSource';

// Derived from the data-source surface rather than importing the feature's own
// api module directly (the layering lint rule reserves @/features/*/api for
// data/liveApi.ts composition).
type ShopEntitlement = Awaited<ReturnType<typeof adminApi.getEntitlement>>['entitlement'];

function Bar({used, quota}: {used: number; quota: number}) {
  const pct = quota > 0 ? Math.min(100, Math.round((used / quota) * 100)) : 0;
  const near = pct >= 80;
  return (
    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className={`h-full rounded-full transition-all ${near ? 'bg-rose-500' : 'bg-pink-500'}`}
        style={{width: `${pct}%`}}
      />
    </div>
  );
}

export default function EntitlementSummary({compact = false}: {compact?: boolean}) {
  const [ent, setEnt] = useState<ShopEntitlement | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let alive = true;
    adminApi
      .getEntitlement()
      .then((r) => alive && setEnt(r.entitlement))
      .catch(() => alive && setErr(true))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return <div className="h-[120px] animate-pulse rounded-[26px] border border-slate-200 bg-white" />;
  }
  if (err || !ent) {
    return (
      <div className="rounded-[26px] border border-slate-200/80 bg-white p-4 text-sm text-slate-500">
        Order အသုံးပြုမှု အချက်အလက် ရယူ၍ မရသေးပါ။
      </div>
    );
  }

  const isFree = ent.plan === 'free_trial';
  const monthlyLabel = ent.quotaIsLifetime ? 'Trial Order (တစ်သက်တာ)' : 'လစဉ် Order';

  return (
    <section className="rounded-[26px] border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-[17px] font-bold text-slate-950">
          <ShoppingBag className="h-5 w-5 text-pink-500" /> Order လက်ခံနိုင်မှု
        </h2>
        {!ent.active && (
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-600">
            ရပ်ဆိုင်းထား
          </span>
        )}
      </div>

      {/* Monthly / lifetime quota — always shown */}
      <div className="rounded-2xl bg-slate-50 p-3.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">{monthlyLabel}</span>
          <span className="text-sm font-black text-slate-950">
            {ent.monthlyUsed} / {ent.monthlyQuota} <span className="font-medium text-slate-500">သုံးပြီး</span>
          </span>
        </div>
        <Bar used={ent.monthlyUsed} quota={ent.monthlyQuota} />
        <p className="mt-1.5 text-[11px] text-slate-500">
          {ent.quotaIsLifetime
            ? 'Free Trial — ဒီအရေအတွက် ပြန်မ reset ပါ။'
            : `ကျန် ${ent.monthlyRemaining} ခု — နောက်လ (renew) တွင် ပြန်ပြည့်မည်။`}
        </p>
      </div>

      {/* Purchased Extra Orders — separate balance, paid plans only */}
      {!isFree && (
        <div className="mt-2.5 rounded-2xl border border-pink-100 bg-pink-50/50 p-3.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
              <InfinityIcon className="h-4 w-4 text-pink-500" /> ဝယ်ထားသော Extra Orders
            </span>
            <span className="text-sm font-black text-pink-600">{ent.purchasedBalance} ခု ကျန်</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            ဒီ balance က ဘယ်တော့မှ သက်တမ်းမကုန်ပါ — လစဉ် quota ကုန်မှ အသုံးပြုမည်။
          </p>
        </div>
      )}

      {!compact && (
        <div className="mt-3.5">
          {isFree ? (
            <Link
              to="/admin/billing"
              className="flex items-center justify-center gap-1.5 rounded-2xl bg-slate-900 py-3 text-sm font-bold text-white transition hover:bg-slate-800">
              <Sparkles className="h-4 w-4 text-pink-300" /> Starter / Business သို့ upgrade
            </Link>
          ) : (
            <Link
              to="/admin/billing"
              className="flex items-center justify-center gap-1.5 rounded-2xl bg-pink-500 py-3 text-sm font-bold text-white transition hover:bg-pink-600">
              <PlusCircle className="h-4 w-4" /> Extra Orders ဝယ်ရန်
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
