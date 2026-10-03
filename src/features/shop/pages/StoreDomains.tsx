import {Globe2} from 'lucide-react';
import AdminPageHeader from '@/features/admin/components/AdminPageHeader';
import AdminSurface from '@/features/admin/components/AdminSurface';

export default function StoreDomains() {
  return (
    <div className="space-y-6 pb-12">
      <AdminPageHeader
        title="Domains"
        description="Custom domain setup is not configured yet in this admin. Your existing MiniShop storefront URL continues to work normally."
      />
      <AdminSurface>
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D8F1EA] text-[#29957F]">
            <Globe2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#1F2421]">No domain changes available</h2>
            <p className="mt-1 text-sm text-[#66706C]">
              This page is intentionally read-only until domain verification and attachment have an authoritative backend workflow.
            </p>
          </div>
        </div>
      </AdminSurface>
    </div>
  );
}
