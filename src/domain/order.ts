// ---- DOMAIN: order -----------------------------------------------------------
// Buyer-facing order shapes (place + track) and the admin-console projection.
// See domain/orderStatus.ts for the single source of truth on status labels.

export interface OrderResult {
  orderId: string;
  itemTotal: number;
  deliveryFee: number;
  grandTotal: number;
  amountNow: number; // 0 for Cash on Delivery (pay on delivery); grandTotal for KBZPay/WavePay
  paymentMethod: 'cod' | 'kpay' | 'wave';
}

export interface TrackedOrder {
  order_id: string;
  items: {name: string; price: number; qty: number}[];
  item_total: number;
  delivery_fee: number;
  grand_total: number;
  payment_method: string;
  status: string;
  slip_url: string | null;
  created_at: string;
  // Added for the admin console — safe/optional so older stored orders still load.
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
}

// An order flattened out of the per-phone store, for the admin order table.
export interface AdminOrder extends TrackedOrder {
  phone_key: string;
  // Last-5 digits of the buyer's KBZPay/Wave transfer (online orders) — the
  // seller matches this against their payment app to confirm payment.
  paymentRefTail?: string | null;
}

