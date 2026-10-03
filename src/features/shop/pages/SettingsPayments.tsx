import {CreditCard, ShieldCheck, Banknote} from 'lucide-react';
import AdminPageHeader from '@/features/admin/components/AdminPageHeader';
import AdminSurface from '@/features/admin/components/AdminSurface';

export default function SettingsPayments() {
  return (
    <div className="space-y-6 pb-12">
      <AdminPageHeader
        title="Payment Methods"
        description="Current payment capabilities available to your TikTok storefront buyers. Configuration is managed through the existing checkout and order workflows."
      />

      <div className="grid gap-4">
        {/* Cash on Delivery */}
        <AdminSurface>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--admin-primary-soft)] text-[var(--admin-primary-hover)]">
                <Banknote className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[var(--admin-text)]">Cash on Delivery (COD)</h2>
                  <span className="rounded-full bg-[var(--admin-primary-soft)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--admin-primary-hover)]">
                    Available
                  </span>
                </div>
                <p className="mt-1 text-sm leading-5 text-[var(--admin-muted)]">
                  Buyers place orders without prepayment and pay cash upon package delivery.
                </p>
              </div>
            </div>
          </div>
        </AdminSurface>

        {/* KBZPay & WavePay */}
        <AdminSurface>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--admin-primary-soft)] text-[var(--admin-primary-hover)]">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[var(--admin-text)]">KBZPay & WavePay Transfer</h2>
                  <span className="rounded-full bg-[var(--admin-primary-soft)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--admin-primary-hover)]">
                    Available
                  </span>
                </div>
                <p className="mt-1 text-sm leading-5 text-[var(--admin-muted)]">
                  Buyers transfer funds directly to your wallet account and submit proof/slip or transaction digits during checkout.
                </p>
              </div>
            </div>
          </div>
        </AdminSurface>
      </div>

      <AdminSurface>
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--admin-canvas)] text-[var(--admin-muted)]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--admin-text)]">Financial Verification</h2>
            <p className="mt-1 text-sm text-[var(--admin-muted)]">
              Payment reconciliation is seller-verified from the admin Orders workspace. MiniShop strictly enforces financial idempotency and does not count unverified payments as recognized sales.
            </p>
          </div>
        </div>
      </AdminSurface>
    </div>
  );
}
