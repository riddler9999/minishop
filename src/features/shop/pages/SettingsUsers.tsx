import {Shield, UserCheck} from 'lucide-react';
import {useAdminAuth} from '@/features/auth/adminAuth';
import AdminPageHeader from '@/features/admin/components/AdminPageHeader';
import AdminSurface from '@/features/admin/components/AdminSurface';

export default function SettingsUsers() {
  const {user} = useAdminAuth();

  return (
    <div className="space-y-6 pb-12">
      <AdminPageHeader
        title="Users & Permissions"
        description="View the current store owner account and access model. Multi-staff management is not available yet."
      />

      <AdminSurface>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--admin-primary-soft)] text-[var(--admin-primary-hover)]">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--admin-text)]">Store Owner</h2>
              <p className="text-sm leading-5 text-[var(--admin-muted)]">Full administrative access to catalog, orders, and settings</p>
            </div>
          </div>
          <span className="rounded-full bg-[var(--admin-primary-soft)] px-3 py-1 text-xs font-bold text-[var(--admin-primary-hover)]">
            Owner
          </span>
        </div>

        <div className="mt-4 divide-y divide-[#E1E7E3] rounded-xl border border-[var(--admin-border)] bg-[var(--admin-canvas)] p-3 text-xs">
          <div className="flex items-center justify-between py-2">
            <span className="text-[var(--admin-muted)]">Account Email:</span>
            <span className="font-semibold text-[var(--admin-text)]">{user?.email ?? 'Unknown'}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-[var(--admin-muted)]">Account ID:</span>
            <code className="text-[var(--admin-text)]">{user?.id ?? '—'}</code>
          </div>
        </div>
      </AdminSurface>

      <AdminSurface>
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--admin-canvas)] text-[var(--admin-muted)]">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--admin-text)]">Staff Accounts</h2>
            <p className="mt-1 text-sm text-[var(--admin-muted)]">
              Multi-staff role management is not configured for this tier. MiniShop enforces Row-Level Security (RLS) on all seller data to ensure tenant isolation.
            </p>
          </div>
        </div>
      </AdminSurface>
    </div>
  );
}
