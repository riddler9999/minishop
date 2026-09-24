import type {MerchantAccount} from '@/domain/shop';

export type PayMethod = 'cod' | 'kpay' | 'wave';

export const PAYMENT_METHODS: {key: PayMethod; label: string; sub: string}[] = [
  {key: 'cod', label: 'Cash on Delivery', sub: 'အိမ်ရောက် ငွေချေ'},
  {key: 'kpay', label: 'KBZPay', sub: 'ငွေကြိုရှင်း'},
  {key: 'wave', label: 'WavePay', sub: 'ငွေကြိုရှင်း'},
];

export function newIdempotencyKey(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    return (ch === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function isOnlinePayment(method: PayMethod): boolean {
  return method === 'kpay' || method === 'wave';
}

export function paymentAccounts(accounts: MerchantAccount[], method: PayMethod): MerchantAccount[] {
  return accounts.filter((account) => account.provider === method);
}

export function resolveShippingFee(input: {
  region: string;
  township: string;
  live: boolean;
  shippingConfig: {defaultFee: number; zones: {region: string; township: string; fee: number}[]} | null;
  demoFee: number | null;
}): number | null {
  const {region, township, live, shippingConfig, demoFee} = input;
  if (!region || !township) return null;
  if (!live) return demoFee ?? 0;
  if (!shippingConfig) return null;
  const zone = shippingConfig.zones.find((item) => item.region === region && item.township === township);
  return zone ? zone.fee : shippingConfig.defaultFee;
}

export function isCheckoutReady(input: {
  name: string;
  phone: string;
  street: string;
  region: string;
  township: string;
  fee: number | null;
  itemCount: number;
  method: PayMethod;
  refTail: string;
}): boolean {
  return Boolean(
    input.name.trim() &&
    input.phone.trim().length >= 6 &&
    input.street.trim() &&
    input.region &&
    input.township &&
    input.fee != null &&
    input.itemCount > 0 &&
    (!isOnlinePayment(input.method) || /^\d{5}$/.test(input.refTail)),
  );
}
