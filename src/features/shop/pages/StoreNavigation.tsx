import {ListTree} from 'lucide-react';
import AdminPageHeader from '@/features/admin/components/AdminPageHeader';
import AdminSurface from '@/features/admin/components/AdminSurface';

export default function StoreNavigation() {
  return (
    <div className="space-y-6 pb-12">
      <AdminPageHeader
        title="Navigation"
        description="Store menu management is not available yet. MiniShop will keep the current storefront navigation unchanged until a backed configuration API exists."
      />
      <AdminSurface>
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D8F1EA] text-[#29957F]">
            <ListTree className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#1F2421]">Current navigation is preserved</h2>
            <p className="mt-1 text-sm text-[#66706C]">
              No controls are shown here because changing navigation without a persisted domain contract could create a false setup state.
            </p>
          </div>
        </div>
      </AdminSurface>
    </div>
  );
}
