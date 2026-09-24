import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const appPath = new URL('../src/app/App.tsx', import.meta.url);
const furniturePath = new URL('../src/features/furniture-demo/pages/FurnitureDemo.tsx', import.meta.url);
const furnitureDataPath = new URL('../src/features/furniture-demo/data.ts', import.meta.url);
const furnitureOrderPath = new URL('../src/features/furniture-demo/orderStore.ts', import.meta.url);
const cartPath = new URL('../src/features/cart/state.tsx', import.meta.url);
const productionHomePath = new URL('../src/features/catalog/pages/Home.tsx', import.meta.url);

test('furniture demo is isolated behind its own route', async () => {
  const app = await readFile(appPath, 'utf8');
  assert.match(app, /path="\/furniture-demo\/\*"/);
  assert.match(app, /FurnitureDemo/);
  assert.match(app, /path="\/demo\/\*".*RootStorefront/s);
  assert.match(app, /path="\/fashion-demo\/\*".*FashionDemo/s);
  assert.match(app, /path="\/s\/:slug\/\*".*ShopRoute/s);
});

test('furniture demo exposes a complete buyer journey', async () => {
  const source = await readFile(furniturePath, 'utf8');
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
    assert.ok(source.includes(`path="${route}"`), `missing furniture route: ${route}`);
  }
  assert.match(source, /Furniture demo mobile navigation/);
  assert.match(source, /Rangoon Furniture/);
});

test('furniture home follows the approved clean mobile visual contract', async () => {
  const source = await readFile(furniturePath, 'utf8');
  assert.match(source, /Make Your/);
  assert.match(source, /Home Brighter/);
  assert.match(source, /Categories/);
  assert.match(source, /Featured/);
  assert.match(source, /grid-cols-2/);
  assert.match(source, /rounded-\[28px\]/);
  assert.match(source, /#f7f3ed/);
  assert.match(source, /#a66b3f/);
  assert.equal(source.includes('device mockup'), false);
});

test('furniture demo uses explicit MMK prices and furniture-only fixtures', async () => {
  const data = await readFile(furnitureDataPath, 'utf8');
  const page = await readFile(furniturePath, 'utf8');
  assert.match(data, /Sage Lounge Chair/);
  assert.match(data, /Nova 3-Seater Sofa/);
  assert.match(data, /Rattan Sideboard/);
  assert.match(page, /MMK/);
  assert.match(page, /Intl\.NumberFormat/);
  assert.equal(page.includes('USD'), false);
});

test('furniture cart is isolated from existing demo cart storage', async () => {
  const furniture = await readFile(furniturePath, 'utf8');
  const cart = await readFile(cartPath, 'utf8');
  assert.match(furniture, /CartProvider storageScope="furniture-demo"/);
  assert.match(cart, /storageScope\?: string/);
  assert.match(cart, /storageScope \?\? getShopSlug\(\) \?\? 'demo'/);
});

test('furniture checkout remains demo-local and does not call production order APIs', async () => {
  const page = await readFile(furniturePath, 'utf8');
  const store = await readFile(furnitureOrderPath, 'utf8');
  assert.match(page, /createFurnitureDemoOrder/);
  assert.match(page, /findFurnitureDemoOrder/);
  assert.match(page, /noValidate/);
  assert.match(page, /resize-none/);
  assert.equal(page.includes('api.createOrder'), false);
  assert.match(store, /localStorage/);
  assert.match(store, /orderNo/);
  assert.match(store, /phone/);
});

test('production storefront implementation remains separate', async () => {
  const productionHome = await readFile(productionHomePath, 'utf8');
  assert.equal(productionHome.includes('furniture-demo'), false);
  assert.equal(productionHome.includes('Rangoon Furniture'), false);
});
