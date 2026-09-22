// ---- SHELL: admin console ----------------------------------------------------
import {useAdminAuth} from '@/features/auth/adminAuth';
import {PlanProvider, usePlan} from '@/features/billing/plan';
import AdminLayout from '@/features/admin/components/AdminLayout';

function PlanStateGate() {
  const {status, refresh} = usePlan();

  if (status === 'loading') {
    return <div className="grid min-h-screen place-items-center bg-ink text-sm text-cream-200">Loading…</div>;
  }

  if (status === 'error') {
    return (
      <div className="grid min-h-screen place-items-center bg-ink px-4 text-center">
        <div className="max-w-sm">
          <p className="text-sm text-cream-200">
            Plan နဲ့ ဆိုင်အချက်အလက် ရယူ၍မရသေးပါ — ကွန်ရက်ပြန်စစ်ပြီး ထပ်ကြိုးစားပါ။
          </p>
          <button
            type="button"
            onClick={refresh}
            className="mt-4 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600">
            ထပ်ကြိုးစားရန်
          </button>
        </div>
      </div>
    );
  }

  return <AdminLayout />;
}

// Admin console shell — RequireAdmin proves auth + shop existence first. This
// second load enriches the seller console with plan/shop details; unlike the old
// behaviour, a failed enrichment is an explicit retryable error and is never
// silently interpreted as the least-privileged plan.
export default function AdminConsole() {
  const {user} = useAdminAuth();
  if (!user) return null;
  return (
    <PlanProvider userId={user.id}>
      <PlanStateGate />
    </PlanProvider>
  );
}
