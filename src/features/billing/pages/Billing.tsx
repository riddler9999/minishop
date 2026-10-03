// ---- Billing & Extra Orders (seller admin) ----------------------------------
// One place for the seller's order entitlements: view the two balances, buy an
// Extra-Orders pack (paid plans), or see how to upgrade / reactivate. All money
// movement is manual prepaid: transfer -> upload screenshot -> owner credits
// from the Supabase dashboard (admin_credit_order_pack / admin_activate_*).

import {useEffect, useRef, useState} from 'react';
import {Check, Clock, Copy, PlusCircle, ShieldAlert, Sparkles, Upload} from 'lucide-react';
import {useAdminAuth} from '@/features/auth/adminAuth';
import {usePlan} from '@/features/billing/plan';
import EntitlementSummary from '@/features/billing/components/EntitlementSummary';
import AdminPageHeader from '@/features/admin/components/AdminPageHeader';
import AdminSurface from '@/features/admin/components/AdminSurface';
import {
  listOrderPackPurchases,
  submitOrderPackPurchase,
  type OrderPackPurchase,
} from '@/features/billing/orderPacks';
import {
  persistWithPaymentProof,
  validatePaymentProof,
} from '@/features/billing/paymentProofStorage';
import {
  EXTRA_ORDER_PRESETS,
  EXTRA_ORDER_UNIT_PRICE_KS,
  PLAN_MONTHLY_QUOTA,
  PLAN_PRODUCT_LIMIT,
  extraOrdersPriceKs,
} from '@/domain/entitlement';
import {
  PLAN_PRICE_KS,
  PAYMENT_METHOD_LABEL,
  PLATFORM_PAYMENT_RECIPIENT,
  SUBSCRIPTION_PAYMENT_METHODS,
  type SubscriptionPaymentMethod,
} from '@/domain/subscription';

function formatKs(n: number): string {
  return `${n.toLocaleString('en-US')} Ks`;
}

export default function Billing() {
  const {plan} = usePlan();
  const isPaid = plan === 'starter' || plan === 'business';

  return (
    <div className="space-y-6 pb-12">
      <AdminPageHeader
        title="Plan & Billing"
        description="Manage plan usage, order capacity, and subscription upgrades."
      />

      <EntitlementSummary compact />

      {isPaid ? <ExtraOrdersPanel /> : <UpgradePanel />}
    </div>
  );
}

// ---- Extra Orders purchase (paid plans) -------------------------------------
function ExtraOrdersPanel() {
  const {user} = useAdminAuth();
  const [qty, setQty] = useState<number>(EXTRA_ORDER_PRESETS[1]);
  const [method, setMethod] = useState<SubscriptionPaymentMethod>('kpay');
  const [refTail, setRefTail] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [history, setHistory] = useState<OrderPackPurchase[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const amount = extraOrdersPriceKs(qty);

  useEffect(() => {
    let alive = true;
    listOrderPackPurchases()
      .then((r) => alive && setHistory(r))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [done]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const copyPhone = async () => {
    try {
      await navigator.clipboard.writeText(PLATFORM_PAYMENT_RECIPIENT.phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be blocked in WebView */
    }
  };

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    const invalid = validatePaymentProof(f);
    if (invalid) {
      setErr(invalid);
      setFile(null);
      return;
    }
    setErr('');
    setFile(f);
  };

  const refClean = refTail.trim();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!file) return setErr('Please upload your payment screenshot.');
    if (refClean && !/^[0-9]{5}$/.test(refClean)) {
      return setErr('Please enter the last 5 digits of your transfer reference.');
    }
    setErr('');
    setSaving(true);
    try {
      await persistWithPaymentProof({
        userId: user.id,
        file,
        persist: (screenshotPath) =>
          submitOrderPackPurchase({
            userId: user.id,
            qty,
            paymentMethod: method,
            paymentRefTail: refClean || null,
            screenshotPath,
          }),
      });
      setDone(true);
      setFile(null);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Could not submit order pack purchase.');
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <AdminSurface>
        <div className="flex items-center gap-3 rounded-2xl bg-[#D8F1EA] p-4 text-[#1F2421]">
          <Clock className="h-6 w-6 shrink-0 text-[#29957F]" />
          <p className="text-sm font-medium">
            Your Extra Orders purchase has been submitted. Once verified by support, the order pack balance will be credited automatically.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDone(false)}
          className="mt-4 w-full rounded-xl border border-[#E1E7E3] py-2.5 text-sm font-semibold text-[#1F2421] transition hover:bg-[#F4F7F5]"
        >
          Purchase Another Pack
        </button>
        <PurchaseHistory items={history} />
      </AdminSurface>
    );
  }

  const field =
    'w-full rounded-xl border border-[#E1E7E3] bg-[#F4F7F5] px-3.5 py-2.5 text-sm text-[#1F2421] outline-none focus:border-[#35B99D] focus:ring-1 focus:ring-[#35B99D]';

  return (
    <AdminSurface>
      <h2 className="flex items-center gap-2 text-base font-bold text-[#1F2421]">
        <PlusCircle className="h-5 w-5 text-[#35B99D]" /> Buy Extra Orders
      </h2>
      <p className="mt-1 text-xs text-[#66706C]">
        {formatKs(EXTRA_ORDER_UNIT_PRICE_KS)} per extra order — purchased quota never expires.
      </p>

      <form onSubmit={submit} className="mt-4 space-y-5">
        {/* qty presets */}
        <fieldset>
          <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-[#66706C]">
            1. Select Order Pack Size
          </legend>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {EXTRA_ORDER_PRESETS.map((n) => {
              const active = qty === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setQty(n)}
                  className={`rounded-xl border py-2.5 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35B99D] ${
                    active
                      ? 'border-[#35B99D] bg-[#D8F1EA] text-[#1F2421]'
                      : 'border-[#E1E7E3] bg-[#FFFFFF] text-[#1F2421] hover:border-[#35B99D]'
                  }`}
                >
                  {n}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-[#66706C]">
            Total Amount: <span className="font-bold text-[#1F2421]">{formatKs(amount)}</span>
          </p>
        </fieldset>

        {/* payment instructions */}
        <fieldset className="space-y-3">
          <legend className="text-xs font-bold uppercase tracking-wider text-[#66706C]">
            2. Transfer Funds
          </legend>
          <div className="rounded-2xl border border-[#D8F1EA] bg-[#D8F1EA]/30 p-4">
            <p className="text-xs text-[#66706C]">
              Transfer exactly <span className="font-bold text-[#1F2421]">{formatKs(amount)}</span> to:
            </p>
            <div className="mt-2 flex items-center justify-between rounded-xl border border-[#E1E7E3] bg-[#FFFFFF] px-3.5 py-2.5">
              <div>
                <p className="text-base font-bold tracking-wide text-[#1F2421]">
                  {PLATFORM_PAYMENT_RECIPIENT.phone}
                </p>
                <p className="text-xs text-[#66706C]">{PLATFORM_PAYMENT_RECIPIENT.name}</p>
              </div>
              <button
                type="button"
                onClick={copyPhone}
                className="flex items-center gap-1 rounded-lg border border-[#E1E7E3] px-2.5 py-1.5 text-xs font-semibold text-[#1F2421] transition hover:bg-[#F4F7F5]"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
          <div>
            <span className="mb-1.5 block text-xs font-semibold text-[#1F2421]">
              Payment Method Used
            </span>
            <div className="grid grid-cols-3 gap-2">
              {SUBSCRIPTION_PAYMENT_METHODS.map((m) => {
                const active = method === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    className={`rounded-xl border px-2 py-2.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35B99D] ${
                      active
                        ? 'border-[#35B99D] bg-[#D8F1EA] text-[#1F2421] font-bold'
                        : 'border-[#E1E7E3] bg-[#FFFFFF] text-[#66706C]'
                    }`}
                  >
                    {PAYMENT_METHOD_LABEL[m]}
                  </button>
                );
              })}
            </div>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-[#1F2421]">
              Last 5 digits of transfer <span className="font-normal text-[#66706C]">(Optional)</span>
            </span>
            <input
              inputMode="numeric"
              value={refTail}
              onChange={(e) => setRefTail(e.target.value.replace(/[^0-9]/g, '').slice(0, 5))}
              placeholder="e.g. 12345"
              className={field}
            />
          </label>
        </fieldset>

        {/* proof */}
        <fieldset className="space-y-2">
          <legend className="text-xs font-bold uppercase tracking-wider text-[#66706C]">
            3. Upload Payment Screenshot
          </legend>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/webp,image/jpeg"
            onChange={pickFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#E1E7E3] py-4 text-sm font-semibold text-[#1F2421] transition hover:bg-[#F4F7F5]"
          >
            <Upload className="h-4 w-4 text-[#35B99D]" /> {file ? 'Change screenshot' : 'Select payment screenshot'}
          </button>
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Payment screenshot"
              className="mx-auto max-h-56 rounded-xl border border-[#E1E7E3] object-contain"
            />
          )}
          <p className="text-xs text-[#66706C]">PNG / JPG / WebP up to 5MB.</p>
        </fieldset>

        {err && (
          <p className="flex items-center gap-1.5 text-sm text-rose-600">
            <ShieldAlert className="h-4 w-4 shrink-0" /> {err}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-[#1F2421] py-3 text-sm font-bold text-white transition hover:bg-[#303a35] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35B99D] disabled:opacity-50"
        >
          <PlusCircle className="h-4 w-4" /> {saving ? 'Submitting…' : `${formatKs(amount)} — Submit Order Pack`}
        </button>
      </form>

      <PurchaseHistory items={history} />
    </AdminSurface>
  );
}

function PurchaseHistory({items}: {items: OrderPackPurchase[]}) {
  if (items.length === 0) return null;
  const statusText: Record<OrderPackPurchase['status'], string> = {
    pending: 'Pending verification',
    approved: 'Approved',
    rejected: 'Declined',
  };
  const statusCls: Record<OrderPackPurchase['status'], string> = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    approved: 'bg-[#D8F1EA] text-[#29957F] border-[#8FD7C6]',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  };
  return (
    <div className="mt-6 border-t border-[#E1E7E3] pt-4">
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#66706C]">
        Previous Purchases
      </h3>
      <ul className="space-y-2">
        {items.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between rounded-xl border border-[#E1E7E3] bg-[#F4F7F5] px-3.5 py-2.5 text-xs"
          >
            <span className="font-semibold text-[#1F2421]">
              {p.qty} orders · {formatKs(p.amount)}
            </span>
            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${statusCls[p.status]}`}>
              {statusText[p.status]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---- Upgrade panel (free trial) ---------------------------------------------
function UpgradePanel() {
  const [copied, setCopied] = useState(false);
  const copyPhone = async () => {
    try {
      await navigator.clipboard.writeText(PLATFORM_PAYMENT_RECIPIENT.phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be blocked */
    }
  };
  return (
    <AdminSurface>
      <h2 className="flex items-center gap-2 text-base font-bold text-[#1F2421]">
        <Sparkles className="h-5 w-5 text-[#35B99D]" /> Upgrade Your Plan
      </h2>
      <p className="mt-1 text-xs text-[#66706C]">
        Free Trial includes 20 lifetime orders and up to 10 products. Upgrade for full selling capacity.
      </p>

      <div className="mt-4 grid gap-3">
        <PlanRow
          name="Starter"
          price={PLAN_PRICE_KS.starter}
          orders={PLAN_MONTHLY_QUOTA.starter}
          products={PLAN_PRODUCT_LIMIT.starter}
          note="Full selling features & storefront"
        />
        <PlanRow
          name="Business"
          price={PLAN_PRICE_KS.business}
          orders={PLAN_MONTHLY_QUOTA.business}
          products={PLAN_PRODUCT_LIMIT.business}
          note="Higher volume, automation & priority support"
        />
      </div>

      <div className="mt-4 rounded-2xl border border-[#D8F1EA] bg-[#D8F1EA]/30 p-4">
        <p className="text-xs font-bold text-[#1F2421]">How to Upgrade</p>
        <ol className="mt-2 space-y-1 text-xs text-[#66706C]">
          <li>1. Transfer the plan subscription amount to the account below.</li>
          <li>2. Submit screenshot and store name to platform support.</li>
          <li>3. Upon confirmation, your plan is upgraded immediately.</li>
        </ol>
        <div className="mt-3 flex items-center justify-between rounded-xl border border-[#E1E7E3] bg-[#FFFFFF] px-3.5 py-2.5">
          <div>
            <p className="text-base font-bold tracking-wide text-[#1F2421]">
              {PLATFORM_PAYMENT_RECIPIENT.phone}
            </p>
            <p className="text-xs text-[#66706C]">{PLATFORM_PAYMENT_RECIPIENT.name}</p>
          </div>
          <button
            type="button"
            onClick={copyPhone}
            className="flex items-center gap-1 rounded-lg border border-[#E1E7E3] px-2.5 py-1.5 text-xs font-semibold text-[#1F2421] transition hover:bg-[#F4F7F5]"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </AdminSurface>
  );
}

function PlanRow({
  name,
  price,
  orders,
  products,
  note,
}: {
  name: string;
  price: number;
  orders: number;
  products: number;
  note: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[#E1E7E3] bg-[#F4F7F5] p-4">
      <div>
        <p className="text-sm font-bold text-[#1F2421]">{name}</p>
        <p className="text-xs text-[#66706C]">
          {orders} orders/mo · {products} products · {note}
        </p>
      </div>
      <span className="text-sm font-bold tabular-nums text-[#1F2421]">
        {formatKs(price)}
        <span className="text-xs font-normal text-[#66706C]">/mo</span>
      </span>
    </div>
  );
}
