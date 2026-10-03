import {CheckCircle2, MapPin} from 'lucide-react';
import AdminPageHeader from '@/features/admin/components/AdminPageHeader';
import AdminSurface from '@/features/admin/components/AdminSurface';

export default function SettingsCheckout() {
  return (
    <div className="space-y-6 pb-12">
      <AdminPageHeader
        title="Checkout Rules"
        description="Configure customer information collection and order placement requirements."
      />

      <AdminSurface>
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D8F1EA] text-[#29957F]">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#1F2421]">Customer Address & Contact</h2>
            <p className="mt-1 text-xs text-[#66706C]">
              Myanmar mobile phone numbers (e.g. 09xxxxxxxxx), buyer name, delivery township, and street address are strictly validated on all checkout submissions.
            </p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-[#1F2421]">
                <CheckCircle2 className="h-4 w-4 text-[#35B99D]" />
                <span>Phone number required for order tracking and SMS verification</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-[#1F2421]">
                <CheckCircle2 className="h-4 w-4 text-[#35B99D]" />
                <span>Standardized Region and Township selector matching logistics routes</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-[#1F2421]">
                <CheckCircle2 className="h-4 w-4 text-[#35B99D]" />
                <span>One-tap Buy Now button mandatory on product detail pages</span>
              </div>
            </div>
          </div>
        </div>
      </AdminSurface>
    </div>
  );
}
