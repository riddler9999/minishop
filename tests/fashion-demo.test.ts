import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const appPath = new URL('../src/app/App.tsx', import.meta.url);
const fashionPath = new URL('../src/features/fashion-demo/pages/FashionDemo.tsx', import.meta.url);
const fashionProductsPath = new URL('../src/features/fashion-demo/pages/FashionProducts.tsx', import.meta.url);
const fashionCheckoutPath = new URL('../src/features/fashion-demo/pages/FashionCheckout.tsx', import.meta.url);
const fashionSuccessPath = new URL('../src/features/fashion-demo/pages/FashionOrderSuccess.tsx', import.meta.url);
const fashionLookupPath = new URL('../src/features/fashion-demo/pages/FashionOrderLookup.tsx', import.meta.url);
const productionHomePath = new URL('../src/features/catalog/pages/Home.tsx', import.meta.url);
const productionCardPath = new URL('../src/features/catalog/components/ProductCard.tsx', import.meta.url);

test('fashion demo is isolated behind its own route', async () => {
  const app = await readFile(appPath, 'utf8');
  assert.match(app, /path="\/fashion-demo\/\*"/);
  assert.match(app, /FashionDemo/);
  assert.match(app, /path="\/demo\/\*".*RootStorefront/s);
  assert.match(app, /path="\/s\/:slug\/\*".*ShopRoute/s);
});

test('fashion demo exposes the complete buyer storefront route set', async () => {
  const source = await readFile(fashionPath, 'utf8');
  for (const route of ['products','products/:id','cart','checkout','order/:orderId','orders','shipping-policy','refund-policy','privacy-policy','terms-of-service']) {
    assert.ok(source.includes(`path="${route}"`), `missing fashion route: ${route}`);
  }
  assert.match(source, /Fashion demo mobile navigation/);
  assert.match(source, /Shop All/);
  assert.match(source, /Track Order/);
});

test('fashion collection keeps mobile-first grid search filters and CTA hierarchy', async () => {
  const source = await readFile(fashionProductsPath, 'utf8');
  assert.match(source, /grid-cols-2/);
  assert.match(source, /sm:grid-cols-3/);
  assert.match(source, /lg:grid-cols-4/);
  assert.match(source, /api\.products/);
  assert.match(source, /api\.categories/);
  assert.match(source, /ခြင်းထဲထည့်မည်/);
  assert.match(source, /ဝယ်မည်/);
  assert.match(source, /border-\[#f43f70\]/);
  assert.match(source, /bg-\[#f43f70\]/);
});

test('fashion checkout preserves existing order security contracts but stays inside fashion routes', async () => {
  const source = await readFile(fashionCheckoutPath, 'utf8');
  assert.match(source, /api\.shippingConfig/);
  assert.match(source, /api\.merchantAccounts/);
  assert.match(source, /api\.createOrder/);
  assert.match(source, /idempotencyKey/);
  assert.match(source, /paymentRefTail/);
  assert.match(source, /\/fashion-demo\/order\//);
  assert.equal(source.includes("nav('/order/"), false);
});

test('fashion order success and tracking preserve two-factor lookup contract', async () => {
  const success = await readFile(fashionSuccessPath, 'utf8');
  const lookup = await readFile(fashionLookupPath, 'utf8');
  assert.match(success, /orderNo/);
  assert.match(success, /phone/);
  assert.match(success, /\/fashion-demo\/orders/);
  assert.match(lookup, /api\.ordersByPhone\(p\.trim\(\), o\.trim\(\)\)/);
  assert.match(lookup, /ဖုန်းနံပါတ် နှင့် Order နံပါတ်/);
});

test('fashion demo clears tenant slug and production storefront implementation remains separate', async () => {
  const fashion = await readFile(fashionPath, 'utf8');
  const home = await readFile(productionHomePath, 'utf8');
  const card = await readFile(productionCardPath, 'utf8');
  assert.match(fashion, /setShopSlug\(null\)/);
  assert.equal(home.includes('fashion-demo'), false);
  assert.equal(card.includes('fashion-demo'), false);
});
