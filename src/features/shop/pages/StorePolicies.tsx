import {FileText} from 'lucide-react';
import AdminPageHeader from '@/features/admin/components/AdminPageHeader';
import AdminSurface from '@/features/admin/components/AdminSurface';

export default function StorePolicies() {
  return (
    <div className="space-y-6 pb-12">
      <AdminPageHeader
        title="Policies"
        description="Policy editing is not available yet in Admin V3. Existing storefront policy behavior remains unchanged."
      />
      <AdminSurface>
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D8F1EA] text-[#29957F]">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#1F2421]">Existing policy behavior is preserved</h2>
            <p className="mt-1 text-sm text-[#66706C]">
              No draft or save controls are exposed until a real policy persistence contract is implemented.
            </p>
          </div>
        </div>
      </AdminSurface>
    </div>
  );
}
