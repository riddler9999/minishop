import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('cart storage follows the active storefront route instead of a one-time global provider slug', () => {
  const state = fs.readFileSync('src/features/cart/state.tsx', 'utf8');
  const main = fs.readFileSync('src/main.tsx', 'utf8');
  const app = fs.readFileSync('src/app/App.tsx', 'utf8');

  assert.doesNotMatch(main, /<CartProvider>/);
  assert.match(app, /RouteScopedCartProvider/);
  assert.match(state, /useLocation/);
  assert.match(state, /routeCartScope/);
  assert.match(state, /minishop_cart:/);
});

test('route cart scope distinguishes live shops and demo surfaces', async () => {
  const source = fs.readFileSync('src/features/cart/state.tsx', 'utf8');

  assert.match(source, /pathname\.match\(\/\^\\\/s\\\/\(\[\^\/\]\+\)/);
  assert.match(source, /fashion-demo/);
  assert.match(source, /furniture-demo/);
  assert.match(source, /mobile-store-demo/);
  assert.match(source, /demo/);
});

test('cart provider remounts when the route-derived storage scope changes', () => {
  const source = fs.readFileSync('src/features/cart/state.tsx', 'utf8');

  assert.match(source, /const scope = routeCartScope\(pathname\)/);
  assert.match(source, /<CartProvider key=\{scope\} storageScope=\{scope\}>/);
});

test('cart operations remain present after route scoping', () => {
  const source = fs.readFileSync('src/features/cart/state.tsx', 'utf8');

  assert.match(source, /add:/);
  assert.match(source, /setQty:/);
  assert.match(source, /remove:/);
  assert.match(source, /clear:/);
});
