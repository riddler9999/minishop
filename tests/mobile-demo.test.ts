import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const appPath = new URL('../src/app/App.tsx', import.meta.url);
const mobilePath = new URL('../src/features/mobile-demo/pages/MobileDemo.tsx', import.meta.url);
const mobileDataPath = new URL('../src/features/mobile-demo/data.ts', import.meta.url);
const mobileOrderPath = new URL('../src/features/mobile-demo/orderStore.ts', import.meta.url);
const productionHomePath = new URL('../src/features/catalog/pages/Home.tsx', import.meta.url);

test('mobile demo is isolated behind its own route', async () => {
  const app = await readFile(appPath, 'utf8');
  assert.match(app, /path="\/mobile-store-demo\/\*"/);
  assert.match(app, /MobileDemo/);
  assert.match(app, /path="\/demo\/\*".*RootStorefront/s);
  assert.match(app, /path="\/fashion-demo\/\*".*FashionDemo/s);
  assert.match(app, /path="\/furniture-demo\/\*".*FurnitureDemo/s);
  assert.match(app, /path="\/s\/:slug\/\*".*ShopRoute/s);
});

test('mobile demo exposes the complete buyer journey', async () => {
  const source = await readFile(mobilePath, 'utf8');
  for (const route of [
    'products',
    'products/:id',
    'cart',
    'checkout',
    'order/:orderId',
    'orders',
    'shipping-policy',
    'refund-policy',
    'privacy-policy',
    'terms-of-service',
  ]) {
    assert.ok(source.includes(`path="${route}"`), `missing mobile route: ${route}`);
  }
  assert.match(source, /Mobile One demo mobile navigation/);
  assert.match(source, /Mobile One/);
});

test('mobile demo uses matte black visual contract and MMK pricing', async () => {
  const source = await readFile(mobilePath, 'utf8');
  assert.match(source, /#0a0a0b/);
  assert.match(source, /#141416/);
  assert.match(source, /Own the/);
  assert.match(source, /Next Upgrade/);
  assert.match(source, /Best Selling/);
  assert.match(source, /MMK/);
  assert.match(source, /Intl\.NumberFormat/);
  assert.equal(source.includes('USD'), false);
});

test('mobile demo has believable category fixtures and at least ten products', async () => {
  const data = await readFile(mobileDataPath, 'utf8');
  assert.match(data, /iPhone 16 Pro Max 256GB/);
  assert.match(data, /Samsung Galaxy S25 Ultra 256GB/);
  assert.match(data, /AirPods Pro \(2nd Gen\)/);
  assert.match(data, /MOBILE_FEATURED_IDS/);
  assert.match(data, /MOBILE_BEST_SELLING_IDS/);
  const productCount = (data.match(/id: 'mobile-/g) ?? []).length;
  assert.ok(productCount >= 10, `expected at least 10 demo products, got ${productCount}`);
});

test('mobile cart and orders use isolated local storage scopes', async () => {
  const page = await readFile(mobilePath, 'utf8');
  const order = await readFile(mobileOrderPath, 'utf8');
  assert.match(page, /CartProvider storageScope="mobile-demo"/);
  assert.match(order, /minishop:mobile-demo:orders:v1/);
  assert.match(order, /localStorage/);
  assert.match(order, /MO-/);
});

test('mobile checkout remains demo local and does not call production order APIs', async () => {
  const page = await readFile(mobilePath, 'utf8');
  assert.match(page, /createMobileDemoOrder/);
  assert.match(page, /findMobileDemoOrder/);
  assert.match(page, /noValidate/);
  assert.equal(page.includes('api.createOrder'), false);
  assert.equal(page.includes('place_order'), false);
});

test('production storefront remains separate from Mobile One demo', async () => {
  const productionHome = await readFile(productionHomePath, 'utf8');
  assert.equal(productionHome.includes('mobile-store-demo'), false);
  assert.equal(productionHome.includes('Mobile One'), false);
});


test('mobile shipping contract stays consistent at 5,000 MMK below free threshold', async () => {
  const page = await readFile(mobilePath, 'utf8');
  const order = await readFile(mobileOrderPath, 'utf8');
  assert.match(page, /const shippingFee = subtotal >= 2_000_000 \? 0 : 5_000;/);
  assert.match(page, /Yangon delivery from 5,000 MMK/);
  assert.match(order, /const shippingFee = input\.subtotal >= 2_000_000 \? 0 : 5_000;/);
});

test('mobile product card avoids nested buttons and keeps dark-theme readable foregrounds', async () => {
  const source = await readFile(mobilePath, 'utf8');
  const productCardStart = source.indexOf('function ProductCard');
  const productCardEnd = source.indexOf('function MobileHome');
  const productCard = source.slice(productCardStart, productCardEnd);
  let buttonDepth = 0;
  for (const match of productCard.matchAll(/<\/?button\b/g)) {
    if (match[0].startsWith('</')) buttonDepth -= 1;
    else buttonDepth += 1;
    assert.ok(buttonDepth <= 1, 'ProductCard must not nest a button inside another button');
  }
  assert.equal(buttonDepth, 0, 'ProductCard button tags must remain balanced');
  assert.equal(source.includes('text-[#292b29]'), false);
  assert.equal(source.includes('text-[#1d201e]'), false);
  assert.equal(source.includes('text-[#373936]'), false);
  assert.equal(source.includes('text-[#4c4e4b]'), false);
  assert.equal(source.includes('text-[#66655f]'), false);
  assert.equal(source.includes('text-[#615f5a]'), false);
  assert.equal(source.includes('text-[#8c572f]'), false);
});
