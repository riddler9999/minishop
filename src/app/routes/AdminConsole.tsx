// ---- SHELL: admin console ----------------------------------------------------
import {useAdminAuth} from '@/features/auth/adminAuth';
import {PlanProvider} from '@/features/billing/plan';
import AdminLayout from '@/features/admin/components/AdminLayout';

// Admin console shell — wraps the layout in PlanProvider so every admin page can
// read the seller's plan + shop via usePlan(). RequireAdmin has already proven a
// session AND an owned shop exist by the time this renders, so `user` is set.
export default function AdminConsole() {
  const {user} = useAdminAuth();
  if (!user) return null;
  return (
    <PlanProvider userId={user.id}>
      <AdminLayout />
    </PlanProvider>
  );
}
