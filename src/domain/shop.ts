// ---- DOMAIN: shop (tenant) ---------------------------------------------------
// The tenant aggregate: public branding, seller-editable settings, delivery
// zones, payment accounts and billable usage. `plan` is platform-managed and
// read-only to sellers (enforced in the DB by 0007_production_hardening.sql).

import type {Plan} from './plan';

/** Alias kept for call sites that read the plan off a shop row. */
export type ShopPlan = Plan;

export interface ShopInfo {
  id: string;
  name: string;
  logoUrl: string | null;
  defaultDeliveryFee: number;
}

export interface MerchantAccount {
  provider: 'kpay' | 'wave';
  label: string;
  accountName: string;
  phone: string;
  tail: string;
}

export interface ShippingZone {
  id: string;
  region: string;
  township: string;
  fee: number;
}
export interface ShippingZoneInput {
  region: string;
  township: string;
  fee: number;
}
export interface ShippingZonePatch {
  fee?: number;
}

export type UsageTier = '0-100' | '101-500' | '501-1500' | '1501-3000' | '3000+';

// Current-month billable-order usage for the signed-in seller's own shop.
// `billableOrders` counts confirmed orders EXCLUDING cancelled / test / duplicate.
export interface ShopUsage {
  shopId: string;
  plan: ShopPlan;
  month: string; // 'YYYY-MM'
  billableOrders: number;
  tier: UsageTier;
}

// Seller-editable shop settings (plan is platform-set → read-only here).
export interface ShopSettings {
  id: string;
  slug: string;
  name: string;
  phone: string | null;
  logoUrl: string | null;
  defaultDeliveryFee: number;
  plan: ShopPlan;
  isActive: boolean;
}
export interface ShopSettingsPatch {
  name?: string;
  phone?: string | null;
  logoUrl?: string | null;
  defaultDeliveryFee?: number;
}

// ---- payment accounts (seller-managed KBZPay / WavePay) ---------------------
export interface PaymentAccount {
  id: string;
  provider: 'kpay' | 'wave';
  accountName: string;
  phone: string;
  isActive: boolean;
}
export interface PaymentAccountInput {
  provider: 'kpay' | 'wave';
  accountName: string;
  phone: string;
  isActive?: boolean;
}
export interface PaymentAccountPatch {
  accountName?: string;
  phone?: string;
  isActive?: boolean;
}
