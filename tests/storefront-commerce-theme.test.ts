import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const cssPath = new URL('../src/index.css', import.meta.url);
const checkoutPath = new URL('../src/features/checkout/pages/Checkout.tsx', import.meta.url);
const successPath = new URL('../src/features/checkout/pages/OrderSuccess.tsx', import.meta.url);
const lookupPath = new URL('../src/features/orders/pages/OrderLookup.tsx', import.meta.url);
const drawerPath = new URL('../src/features/cart/components/CartDrawer.tsx', import.meta.url);
const previewPath = new URL('../src/features/shop/components/StorePreview.tsx', import.meta.url);
const designPath = new URL('../src/features/shop/pages/StoreDesign.tsx', import.meta.url);

test('commerce journey inherits all five storefront aesthetic families', async () => {
  const css = await readFile(cssPath, 'utf8');

  for (const id of ['clean-minimal', 'street-bold', 'soft-elegant', 'grid-catalog', 'dark-modern']) {
    assert.match(css, new RegExp(`\\[data-store-theme="${id}"\\]`));
  }

  for (const token of [
    '--commerce-surface',
    '--commerce-border',
    '--commerce-accent',
    '--commerce-radius',
    '--commerce-shadow',
  ]) {
    assert.match(css, new RegExp(token));
  }

  assert.match(css, /commerce-panel/);
  assert.match(css, /commerce-primary/);
  assert.match(css, /commerce-drawer/);
  assert.equal(css.includes('color-mix('), false, 'commerce theme must stay compatible with older embedded WebViews');
});

test('checkout semantics are themed without changing order/payment contracts', async () => {
  const source = await readFile(checkoutPath, 'utf8');

  for (const cls of [
    'commerce-page',
    'commerce-checkout-grid',
    'commerce-panel',
    'commerce-input',
    'commerce-choice',
    'commerce-primary',
  ]) {
    assert.match(source, new RegExp(cls));
  }

  assert.match(source, /api\.createOrder/);
  assert.match(source, /idempotencyKey/);
  assert.match(source, /resolveShippingFee/);
  assert.match(source, /PAYMENT_METHODS/);
  assert.match(source, /paymentAccounts/);
});

test('confirmation tracking and cart drawer use the shared commerce theme layer', async () => {
  const [success, lookup, drawer] = await Promise.all([
    readFile(successPath, 'utf8'),
    readFile(lookupPath, 'utf8'),
    readFile(drawerPath, 'utf8'),
  ]);

  assert.match(success, /commerce-order-card/);
  assert.match(success, /commerce-tracking-panel/);
  assert.match(success, /commerce-primary/);

  assert.match(lookup, /commerce-order-card/);
  assert.match(lookup, /commerce-input/);
  assert.match(lookup, /commerce-primary/);

  assert.match(drawer, /commerce-drawer/);
  assert.match(drawer, /commerce-cart-item/);
  assert.match(drawer, /commerce-qty/);
  assert.match(drawer, /commerce-primary/);
});

test('store design exposes an explicit checkout preview', async () => {
  const [preview, design] = await Promise.all([
    readFile(previewPath, 'utf8'),
    readFile(designPath, 'utf8'),
  ]);

  assert.match(preview, /PreviewPage = 'home' \| 'category' \| 'product' \| 'checkout'/);
  assert.match(preview, /function CheckoutPreview/);
  assert.match(preview, /page === 'checkout'/);
  assert.match(design, /id: 'checkout'/);
  assert.match(design, /Checkout Theme Preview/);
});
