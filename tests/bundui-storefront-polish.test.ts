import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const rendererPath = new URL('../src/features/catalog/storeDesign/StorefrontRenderer.tsx', import.meta.url);
const cartPath = new URL('../src/features/cart/components/CartDrawer.tsx', import.meta.url);

test('storefront hero follows each theme family layout instead of one universal composition', async () => {
  const source = await readFile(rendererPath, 'utf8');

  for (const variant of ['split', 'poster', 'centered', 'utility', 'glass']) {
    assert.match(source, new RegExp(`hero-\\${variant}`));
  }

  assert.match(source, /visual\.hero/);
  assert.match(source, /data-store-products/);
  assert.match(source, /scrollIntoView/);
});

test('product detail groups gallery and buying information into one responsive commerce shell', async () => {
  const source = await readFile(rendererPath, 'utf8');

  assert.match(source, /product-detail-shell/);
  assert.match(source, /md:grid-cols/);
  assert.match(source, /function ProductGallery/);
  assert.match(source, /ChevronLeft/);
  assert.match(source, /ChevronRight/);
  assert.match(source, /commerce-price/);
  assert.match(source, /product\.isPromotion/);

  const shell = source.indexOf('product-detail-shell');
  const gallery = source.indexOf('<ProductGallery', shell);
  const info = source.indexOf('product-info-panel', shell);
  const commerce = source.indexOf('renderRequiredCommerce', shell);
  assert.ok(shell >= 0 && gallery > shell && info > gallery && commerce > info);
});

test('cart drawer keeps item totals, subtotal and continue-shopping affordance visible', async () => {
  const source = await readFile(cartPath, 'utf8');

  assert.match(source, /ပစ္စည်းစုစုပေါင်း/);
  assert.match(source, /စုစုပေါင်း/);
  assert.match(source, /ဆက်ဝယ်မယ်/);
  assert.match(source, /commerce-secondary/);
});
