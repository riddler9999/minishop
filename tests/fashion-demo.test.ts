import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const appPath = new URL('../src/app/App.tsx', import.meta.url);
const fashionPath = new URL('../src/features/fashion-demo/pages/FashionDemo.tsx', import.meta.url);
const productionHomePath = new URL('../src/features/catalog/pages/Home.tsx', import.meta.url);
const productionCardPath = new URL('../src/features/catalog/components/ProductCard.tsx', import.meta.url);

test('fashion demo is isolated behind its own route', async () => {
  const app = await readFile(appPath, 'utf8');
  assert.match(app, /path="\/fashion-demo\/\*"/);
  assert.match(app, /FashionDemo/);
  assert.match(app, /path="\/demo\/\*".*RootStorefront/s);
  assert.match(app, /path="\/s\/:slug\/\*".*ShopRoute/s);
});

test('fashion demo keeps mobile two-column product grid and CTA hierarchy', async () => {
  const source = await readFile(fashionPath, 'utf8');
  assert.match(source, /grid-cols-2/);
  assert.match(source, /sm:grid-cols-3/);
  assert.match(source, /lg:grid-cols-4/);
  assert.match(source, /ခြင်းထဲထည့်မည်/);
  assert.match(source, /ဝယ်မည်/);
  assert.match(source, /border-\[#f43f70\]/);
  assert.match(source, /bg-\[#f43f70\]/);
});

test('fashion demo reuses cart checkout and storefront data contracts', async () => {
  const source = await readFile(fashionPath, 'utf8');
  assert.match(source, /api\.products/);
  assert.match(source, /api\.categories/);
  assert.match(source, /api\.product/);
  assert.match(source, /useCart/);
  assert.match(source, /<Checkout \/>/);
  assert.match(source, /setShopSlug\(null\)/);
});

test('production storefront implementation remains separate', async () => {
  const home = await readFile(productionHomePath, 'utf8');
  const card = await readFile(productionCardPath, 'utf8');
  assert.equal(home.includes('fashion-demo'), false);
  assert.equal(card.includes('fashion-demo'), false);
});
