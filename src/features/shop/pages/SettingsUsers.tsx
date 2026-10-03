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
        description="Manage store owner authentication and access control."
      />

      <AdminSurface>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D8F1EA] text-[#29957F]">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1F2421]">Store Owner</h2>
              <p className="text-xs text-[#66706C]">Full administrative access to catalog, orders, and settings</p>
            </div>
          </div>
          <span className="rounded-full bg-[#D8F1EA] px-3 py-1 text-xs font-bold text-[#29957F]">
            Owner
          </span>
        </div>

        <div className="mt-4 divide-y divide-[#E1E7E3] rounded-xl border border-[#E1E7E3] bg-[#F4F7F5] p-3 text-xs">
          <div className="flex items-center justify-between py-2">
            <span className="text-[#66706C]">Account Email:</span>
            <span className="font-semibold text-[#1F2421]">{user?.email ?? 'Unknown'}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-[#66706C]">Account ID:</span>
            <code className="text-[#1F2421]">{user?.id ?? '—'}</code>
          </div>
        </div>
      </AdminSurface>

      <AdminSurface>
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F4F7F5] text-[#66706C]">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#1F2421]">Staff Accounts</h2>
            <p className="mt-1 text-sm text-[#66706C]">
              Multi-staff role management is not configured for this tier. MiniShop enforces Row-Level Security (RLS) on all seller data to ensure tenant isolation.
            </p>
          </div>
        </div>
      </AdminSurface>
    </div>
  );
}
