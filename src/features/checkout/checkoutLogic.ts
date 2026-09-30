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


export type CheckoutIntentStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const CHECKOUT_INTENT_TTL_MS = 30 * 60 * 1000;

function checkoutIntentStorageKey(scope: string): string {
  return `minishop_checkout_intent:${scope}`;
}

export function checkoutIntentFingerprint(input: {
  itemIds: string[];
  quantities: number[];
  region: string;
  township: string;
  paymentMethod: PayMethod;
}): string {
  return JSON.stringify({
    itemIds: input.itemIds,
    quantities: input.quantities,
    region: input.region,
    township: input.township,
    paymentMethod: input.paymentMethod,
  });
}

export function getOrCreateCheckoutIntent(input: {
  scope: string;
  fingerprint: string;
  storage: CheckoutIntentStorage;
  now?: number;
}): string {
  const now = input.now ?? Date.now();
  const key = checkoutIntentStorageKey(input.scope);
  try {
    const raw = input.storage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as {idempotencyKey?: string; fingerprint?: string; createdAt?: number};
      if (
        typeof parsed.idempotencyKey === 'string' &&
        parsed.idempotencyKey &&
        parsed.fingerprint === input.fingerprint &&
        typeof parsed.createdAt === 'number' &&
        now - parsed.createdAt <= CHECKOUT_INTENT_TTL_MS
      ) {
        return parsed.idempotencyKey;
      }
    }
  } catch {
    // Corrupt/unavailable storage falls through to a fresh in-memory-safe key.
  }

  const idempotencyKey = newIdempotencyKey();
  try {
    input.storage.setItem(key, JSON.stringify({idempotencyKey, fingerprint: input.fingerprint, createdAt: now}));
  } catch {
    // Checkout must still work when WebView storage is unavailable.
  }
  return idempotencyKey;
}

export function clearCheckoutIntent(scope: string, storage: CheckoutIntentStorage): void {
  try {
    storage.removeItem(checkoutIntentStorageKey(scope));
  } catch {
    // Best-effort cleanup only.
  }
}
