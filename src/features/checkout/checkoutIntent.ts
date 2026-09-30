import {newIdempotencyKey} from './checkoutLogic';

export const CHECKOUT_INTENT_TTL_MS = 30 * 60 * 1000;

export interface CheckoutIntentStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface CheckoutIntent {
  version: 1;
  shopSlug: string;
  cartFingerprint: string;
  idempotencyKey: string;
  createdAt: number;
  expiresAt: number;
}

const storageKey = (shopSlug: string) => `minishop:checkout-intent:${shopSlug}`;

export function createCheckoutIntent(input: {
  shopSlug: string;
  cartFingerprint: string;
  now?: number;
}): CheckoutIntent {
  const now = input.now ?? Date.now();
  return {
    version: 1,
    shopSlug: input.shopSlug,
    cartFingerprint: input.cartFingerprint,
    idempotencyKey: newIdempotencyKey(),
    createdAt: now,
    expiresAt: now + CHECKOUT_INTENT_TTL_MS,
  };
}

export function saveCheckoutIntent(storage: CheckoutIntentStorage, intent: CheckoutIntent): void {
  storage.setItem(storageKey(intent.shopSlug), JSON.stringify(intent));
}

export function loadCheckoutIntent(storage: CheckoutIntentStorage, input: {
  shopSlug: string;
  cartFingerprint: string;
  now?: number;
}): CheckoutIntent | null {
  const raw = storage.getItem(storageKey(input.shopSlug));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<CheckoutIntent>;
    const now = input.now ?? Date.now();
    if (
      parsed.version !== 1 ||
      parsed.shopSlug !== input.shopSlug ||
      parsed.cartFingerprint !== input.cartFingerprint ||
      typeof parsed.idempotencyKey !== 'string' ||
      !parsed.idempotencyKey ||
      typeof parsed.expiresAt !== 'number' ||
      parsed.expiresAt <= now
    ) {
      storage.removeItem(storageKey(input.shopSlug));
      return null;
    }
    return parsed as CheckoutIntent;
  } catch {
    storage.removeItem(storageKey(input.shopSlug));
    return null;
  }
}

export function clearCheckoutIntent(storage: CheckoutIntentStorage, shopSlug: string): void {
  storage.removeItem(storageKey(shopSlug));
}
