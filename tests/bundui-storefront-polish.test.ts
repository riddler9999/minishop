import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const rendererPath = new URL('../src/features/catalog/storeDesign/StorefrontRenderer.tsx', import.meta.url);
const cartPath = new URL('../src/features/cart/components/CartDrawer.tsx', import.meta.url);

test('storefront hero uses the BundUI-inspired responsive split composition', async () => {
  const source = await readFile(rendererPath, 'utf8');

  assert.match(source, /storefront-bundui-hero/);
  assert.match(source, /md:grid-cols-2/);
  assert.match(source, /data-store-products/);
  assert.match(source, /scrollIntoView/);
});

test('product detail renderer exposes an interactive gallery and strong commerce hierarchy', async () => {
  const source = await readFile(rendererPath, 'utf8');

  assert.match(source, /function ProductGallery/);
  assert.match(source, /ChevronLeft/);
  assert.match(source, /ChevronRight/);
  assert.match(source, /commerce-price/);
  assert.match(source, /product\.isPromotion/);
});

test('cart drawer keeps item totals, subtotal and continue-shopping affordance visible', async () => {
  const source = await readFile(cartPath, 'utf8');

  assert.match(source, /ပစ္စည်းစုစုပေါင်း/);
  assert.match(source, /စုစုပေါင်း/);
  assert.match(source, /ဆက်ဝယ်မယ်/);
  assert.match(source, /commerce-secondary/);
});
