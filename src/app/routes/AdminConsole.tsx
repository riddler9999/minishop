// ---- SHELL: admin console ----------------------------------------------------
import {useAdminAuth} from '@/features/auth/adminAuth';
import {PlanProvider, usePlan} from '@/features/billing/plan';
import AdminLayout from '@/features/admin/components/AdminLayout';
import AdminErrorState from '@/features/admin/components/AdminErrorState';

function PlanStateGate() {
  const {status, refresh} = usePlan();

  if (status === 'loading') {
    return <div className="grid min-h-screen place-items-center bg-slate-950 text-sm text-slate-200">Loading…</div>;
  }

  if (status === 'error') {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 px-4">
        <div className="w-full max-w-md">
          <AdminErrorState
            title="Unable to load your shop"
            description="Check your connection and try again."
            onRetry={refresh}
          />
        </div>
      </div>
    );
  }

  return <AdminLayout />;
}

export default function AdminConsole() {
  const {user} = useAdminAuth();
  if (!user) return null;
  return (
    <PlanProvider userId={user.id}>
      <PlanStateGate />
    </PlanProvider>
  );
}
