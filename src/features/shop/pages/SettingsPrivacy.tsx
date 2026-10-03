import {ShieldCheck, EyeOff, Lock} from 'lucide-react';
import AdminPageHeader from '@/features/admin/components/AdminPageHeader';
import AdminSurface from '@/features/admin/components/AdminSurface';

export default function SettingsPrivacy() {
  return (
    <div className="space-y-6 pb-12">
      <AdminPageHeader
        title="Customer Privacy & Data Protection"
        description="Buyer data handling and security architecture standards."
      />

      <AdminSurface>
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D8F1EA] text-[#29957F]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#1F2421]">Multi-Tenant Isolation & Privacy</h2>
            <p className="mt-1 text-sm text-[#66706C]">
              Customer information, delivery addresses, and payment references are isolated by tenant Row-Level Security (RLS) policies. No buyer PII or transaction data is leaked across merchants or public endpoints.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <div className="flex items-start gap-3 rounded-xl border border-[#E1E7E3] bg-[#F4F7F5] p-3 text-xs">
            <Lock className="mt-0.5 h-4 w-4 text-[#29957F] shrink-0" />
            <div>
              <p className="font-semibold text-[#1F2421]">Encrypted Payment Proofs</p>
              <p className="text-[#66706C]">Uploads to payment proof storage are scoped and inaccessible to unauthenticated parties.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-[#E1E7E3] bg-[#F4F7F5] p-3 text-xs">
            <EyeOff className="mt-0.5 h-4 w-4 text-[#29957F] shrink-0" />
            <div>
              <p className="font-semibold text-[#1F2421]">No Unauthorized Tracking Pixels</p>
              <p className="text-[#66706C]">MiniShop does not inject third-party ad trackers or surveillance scripts into storefronts.</p>
            </div>
          </div>
        </div>
      </AdminSurface>
    </div>
  );
}
