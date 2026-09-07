// ---- SHARED ORDER-STATUS CATALOG -------------------------------------------
// Single source of truth for order statuses, used by BOTH the storefront
// (OrderLookup) and the admin console. Keeping this in one place stops the two
// surfaces from drifting apart when a status is added or a label is reworded.

export type OrderStatus =
  | 'cod_pending'
  | 'pending_payment'
  | 'partial_checked'
  | 'checked'
  | 'shipped'
  | 'completed'
  | 'cancelled';

export interface StatusMeta {
  label: string; // Burmese, customer-facing
  cls: string; // Tailwind badge classes (uses the shared brand/gold tokens)
  admin: string; // shorter admin-side label
}

export const ORDER_STATUS: Record<OrderStatus, StatusMeta> = {
  cod_pending: {label: 'အိမ်ရောက်ငွေချေ (COD)', cls: 'bg-gold-500/15 text-gold-600', admin: 'COD စောင့်ဆဲ'},
  pending_payment: {label: 'ငွေစစ်ဆေးဆဲ', cls: 'bg-amber-100 text-amber-700', admin: 'ငွေစစ်ဆဲ'},
  partial_checked: {label: 'စရံ လက်ခံပြီး', cls: 'bg-blue-100 text-blue-700', admin: 'စရံ ရပြီး'},
  checked: {label: 'အတည်ပြုပြီး', cls: 'bg-emerald-100 text-emerald-700', admin: 'အတည်ပြုပြီး'},
  shipped: {label: 'ပို့ဆောင်ဆဲ', cls: 'bg-indigo-100 text-indigo-700', admin: 'ပို့ဆဲ'},
  completed: {label: 'ပြီးစီးပြီး', cls: 'bg-green-100 text-green-700', admin: 'ပြီးစီး'},
  cancelled: {label: 'ပယ်ဖျက်ပြီး', cls: 'bg-cream-200 text-ink-soft', admin: 'ပယ်ဖျက်'},
};

// Fallback for any legacy/unknown status string.
export function statusMeta(status: string): StatusMeta {
  return (
    ORDER_STATUS[status as OrderStatus] || {
      label: status,
      cls: 'bg-cream-200 text-ink-soft',
      admin: status,
    }
  );
}

// Statuses an admin may move an order into (order reflects a typical flow).
export const ADMIN_STATUS_OPTIONS: OrderStatus[] = [
  'pending_payment',
  'partial_checked',
  'checked',
  'shipped',
  'completed',
  'cancelled',
];

// "Money is settled" — used for revenue KPIs (exclude unpaid/cancelled).
export const PAID_STATUSES: OrderStatus[] = ['partial_checked', 'checked', 'shipped', 'completed'];

// "Needs the merchant's attention now."
export const OPEN_STATUSES: OrderStatus[] = ['cod_pending', 'pending_payment', 'partial_checked', 'checked'];
