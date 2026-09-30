import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CHECKOUT_INTENT_TTL_MS,
  createCheckoutIntent,
  loadCheckoutIntent,
  saveCheckoutIntent,
  clearCheckoutIntent,
  type CheckoutIntentStorage,
} from '../src/features/checkout/checkoutIntent.ts';

class MemoryStorage implements CheckoutIntentStorage {
  private map = new Map<string, string>();
  getItem(key: string) { return this.map.get(key) ?? null; }
  setItem(key: string, value: string) { this.map.set(key, value); }
  removeItem(key: string) { this.map.delete(key); }
}

test('checkout intent survives reload for the same shop and cart binding', () => {
  const storage = new MemoryStorage();
  const now = 1_000_000;
  const intent = createCheckoutIntent({
    shopSlug: 'demo',
    cartFingerprint: 'cart-a',
    now,
  });
  saveCheckoutIntent(storage, intent);

  const loaded = loadCheckoutIntent(storage, {
    shopSlug: 'demo',
    cartFingerprint: 'cart-a',
    now: now + 1000,
  });

  assert.equal(loaded?.idempotencyKey, intent.idempotencyKey);
});

test('checkout intent does not cross shop or cart boundaries', () => {
  const storage = new MemoryStorage();
  const now = 1_000_000;
  const intent = createCheckoutIntent({
    shopSlug: 'demo',
    cartFingerprint: 'cart-a',
    now,
  });
  saveCheckoutIntent(storage, intent);

  assert.equal(loadCheckoutIntent(storage, {shopSlug: 'other', cartFingerprint: 'cart-a', now}), null);
  assert.equal(loadCheckoutIntent(storage, {shopSlug: 'demo', cartFingerprint: 'cart-b', now}), null);
});

test('expired checkout intent is discarded', () => {
  const storage = new MemoryStorage();
  const now = 1_000_000;
  const intent = createCheckoutIntent({
    shopSlug: 'demo',
    cartFingerprint: 'cart-a',
    now,
  });
  saveCheckoutIntent(storage, intent);

  assert.equal(loadCheckoutIntent(storage, {
    shopSlug: 'demo',
    cartFingerprint: 'cart-a',
    now: now + CHECKOUT_INTENT_TTL_MS + 1,
  }), null);
});

test('clearing checkout intent removes retry state after confirmed success', () => {
  const storage = new MemoryStorage();
  const now = 1_000_000;
  const intent = createCheckoutIntent({
    shopSlug: 'demo',
    cartFingerprint: 'cart-a',
    now,
  });
  saveCheckoutIntent(storage, intent);
  clearCheckoutIntent(storage, 'demo');
  assert.equal(loadCheckoutIntent(storage, {shopSlug: 'demo', cartFingerprint: 'cart-a', now}), null);
});


test('checkout intent binding changes when accepted checkout context changes', () => {
  const storage = new MemoryStorage();
  const now = 1_000_000;
  const intent = createCheckoutIntent({
    shopSlug: 'demo',
    cartFingerprint: 'cart-a|yangon|hlaing|cod|7000|1800',
    now,
  });
  saveCheckoutIntent(storage, intent);

  assert.equal(loadCheckoutIntent(storage, {
    shopSlug: 'demo',
    cartFingerprint: 'cart-a|yangon|hlaing|cod|8000|1800',
    now,
  }), null);
});
