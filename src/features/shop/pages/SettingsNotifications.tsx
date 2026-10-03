import {Bell, Mail, MessageSquare} from 'lucide-react';
import AdminPageHeader from '@/features/admin/components/AdminPageHeader';
import AdminSurface from '@/features/admin/components/AdminSurface';

export default function SettingsNotifications() {
  return (
    <div className="space-y-6 pb-12">
      <AdminPageHeader
        title="Notifications"
        description="Transactional order lifecycle notices and customer communications."
      />

      <AdminSurface>
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D8F1EA] text-[#29957F]">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#1F2421]">Transactional Order Alerts</h2>
            <p className="mt-1 text-sm text-[#66706C]">
              MiniShop automatically logs and queues transactional notifications for order placement, payment status changes, and shipping dispatches via the durable notification outbox.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[#E1E7E3] bg-[#F4F7F5] p-3.5">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#29957F]" />
              <h3 className="font-semibold text-xs text-[#1F2421]">Seller Email Digests</h3>
            </div>
            <p className="mt-1 text-[11px] text-[#66706C]">Delivered to your primary admin account email.</p>
          </div>

          <div className="rounded-xl border border-[#E1E7E3] bg-[#F4F7F5] p-3.5">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-[#29957F]" />
              <h3 className="font-semibold text-xs text-[#1F2421]">Buyer Order Lookup Link</h3>
            </div>
            <p className="mt-1 text-[11px] text-[#66706C]">Available via phone number on your storefront /orders page.</p>
          </div>
        </div>
      </AdminSurface>
    </div>
  );
}
