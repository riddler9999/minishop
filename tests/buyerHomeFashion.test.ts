import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const homePath = new URL('../src/features/catalog/pages/Home.tsx', import.meta.url);
const aestheticHomePath = new URL('../src/features/catalog/components/AestheticHome.tsx', import.meta.url);
const layoutPath = new URL('../src/shared/ui/Layout.tsx', import.meta.url);
// The buyer-facing default copy now lives in the storefront theme defaults
// (Store Design). Home.tsx renders it via theme.home.* instead of hardcoding
// the strings, so the copy guard reads the theme module too.
const themePath = new URL('../src/domain/theme.ts', import.meta.url);
const storefrontPath = new URL('../src/app/routes/Storefront.tsx', import.meta.url);
const cartDrawerPath = new URL('../src/features/cart/components/CartDrawer.tsx', import.meta.url);
const cartPagePath = new URL('../src/features/cart/pages/Cart.tsx', import.meta.url);
const productCardPath = new URL('../src/features/catalog/components/ProductCard.tsx', import.meta.url);
const checkoutPath = new URL('../src/features/checkout/pages/Checkout.tsx', import.meta.url);
const onboardingPath = new URL('../src/features/auth/pages/Onboarding.tsx', import.meta.url);
const shopLinkPath = new URL('../src/features/tenancy/ShopLink.tsx', import.meta.url);
const demoContextPath = new URL('../src/features/demo/DemoStoreContext.tsx', import.meta.url);
const demoCartPath = new URL('../src/features/cart/pages/DemoCart.tsx', import.meta.url);
const landingCssPath = new URL('../src/features/landing/pages/landing.css', import.meta.url);

async function readHome() {
  return readFile(homePath, 'utf8');
}

test('buyer home keeps real tenant catalog and navigation contracts', async () => {
  const source = await readHome();

  assert.match(source, /api\.products\(\{scope: 'active', limit: 12\}\)/);
  assert.match(source, /api\.categories\(\)/);
  assert.match(source, /ProductCard/);
  assert.match(source, /ShopLink/);
  assert.match(source, /useShopSlugParam/);
  assert.match(source, /\/products\?category=/);
  assert.match(source, /encodeURIComponent/);
});

test('buyer home keeps search-assisted discovery without cart shortcuts', async () => {
  const source = (await readHome()) + (await readFile(aestheticHomePath, 'utf8'));

  assert.match(source, /to="\/products"/);
  assert.match(source, /\/products\?category=/);
  assert.match(source, /useShopNavigate/);
  assert.match(source, /nav\(`\/products/);
  assert.match(source, /encodeURIComponent\(q\)/);
  assert.equal(source.includes("to: '/cart'"), false);
});

test('buyer storefront theme copy stays category-neutral and removes niche-specific presentation', async () => {
  const source = ((await readHome()) + (await readFile(aestheticHomePath, 'utf8')) + (await readFile(layoutPath, 'utf8')) + (await readFile(themePath, 'utf8'))).toLowerCase();

  assert.match(source, /ပစ္စည်းများကြည့်ရန်/);
  assert.match(source, /clean & minimal/);
  assert.match(source, /street & bold/);
  assert.match(source, /soft & elegant/);
  assert.match(source, /grid & catalog/);
  assert.match(source, /dark modern/);
  assert.match(source, /online store/);

  for (const forbidden of [
    'fine jewellery',
    'fine jewelry',
    'traditional gold',
    'diamond jewellery',
    'crafted with meaning',
    'shop the collection',
    'online fashion store',
    'အွန်လိုင်းဖက်ရှင်ဆိုင်',
    'jewel-cta',
  ]) {
    assert.equal(source.includes(forbidden), false, `unexpected niche-specific copy: ${forbidden}`);
  }
});

test('landing stylesheet does not leak generic nav or grid selectors into storefront', async () => {
  const css = await readFile(landingCssPath, 'utf8');

  assert.equal(/(^|})\.nav\{/.test(css), false, 'landing .nav must not override storefront navigation');
  assert.equal(/(^|})\.grid\{/.test(css), false, 'landing .grid must not override Tailwind grid utility');
});

test('buyer shell matches the reference-style header and mobile bottom navigation', async () => {
  const source = await readFile(layoutPath, 'utf8');

  assert.match(source, /h-\[78px\]/);
  assert.match(source, /Mobile navigation/);
  assert.match(source, /grid-cols-5/);
  assert.match(source, />Home</);
  assert.match(source, />Categories</);
  assert.match(source, />Cart</);
  assert.match(source, />Orders</);
  assert.match(source, />Menu</);
  assert.match(source, /<CartDrawer \/>/);
});

test('storefront exposes privacy and terms routes and footer links', async () => {
  const storefront = await readFile(storefrontPath, 'utf8');
  const layout = await readFile(layoutPath, 'utf8');

  assert.match(storefront, /path="privacy-policy"/);
  assert.match(storefront, /path="terms-of-service"/);
  assert.match(layout, /to="\/privacy-policy"[^>]*>Privacy Policy/);
  assert.match(layout, /to="\/terms-of-service"[^>]*>Terms of Service/);
});

test('tenant storefront remains drawer-first while demo owns an isolated cart page', async () => {
  const storefront = await readFile(storefrontPath, 'utf8');
  const drawer = await readFile(cartDrawerPath, 'utf8');

  assert.match(storefront, /path="cart" element={<DemoCart \/>}/);
  assert.equal(storefront.includes("features/cart/pages/Cart"), false);
  assert.equal(drawer.includes('စျေးခြင်း အပြည့်ကြည့်ရန်'), false);
  await assert.rejects(readFile(cartPagePath, 'utf8'));
  const demoCart = await readFile(demoCartPath, 'utf8');
  assert.match(demoCart, /useDemoStore/);
  assert.match(demoCart, /Navigate to="\/" replace/);
  assert.match(demoCart, /#6d28d9/i);
});

test('compact home product cards match the reference with a cart icon action', async () => {
  const source = await readFile(productCardPath, 'utf8');

  assert.match(source, /aspect-\[0\.86\]/);
  assert.match(source, /aria-label="ခြင်းထဲထည့်မည်"/);
  assert.match(source, /Heart/);
  assert.match(source, /grid h-8 w-8/);
  assert.match(source, /ဝယ်မည်/);
});


test('root demo storefront uses the purple reference design without replacing tenant storefront styling', async () => {
  const home = await readHome();
  const card = await readFile(productCardPath, 'utf8');
  const layout = await readFile(layoutPath, 'utf8');
  const detail = await readFile(new URL('../src/features/catalog/pages/ProductDetail.tsx', import.meta.url), 'utf8');

  assert.match(home, /if \(isDemo\)/);
  assert.match(home, /DemoReferenceHome/);
  assert.match(home, /variant="demo-purple"/);
  assert.match(home, /#eee6ff/i);
  assert.match(card, /demo-purple/);
  assert.match(card, /#6d28d9/i);
  assert.match(layout, /useDemoStore/);
  assert.match(detail, /useDemoStore/);
});

test('cart drawer checkout and admin onboarding contain no legacy brown cream or gold theme tokens', async () => {
  const sources = await Promise.all([
    readFile(cartDrawerPath, 'utf8'),
    readFile(checkoutPath, 'utf8'),
    readFile(onboardingPath, 'utf8'),
  ]);

  for (const source of sources) {
    for (const forbidden of ['cream-', 'gold-']) {
      assert.equal(source.includes(forbidden), false, `legacy theme token remains: ${forbidden}`);
    }
  }

  const onboarding = sources[2];
  assert.match(onboarding, /bg-brand-500.*text-white/);
});


test('demo storefront navigation cannot escape to generic root product routes', async () => {
  const shopLink = await readFile(shopLinkPath, 'utf8');
  const context = await readFile(demoContextPath, 'utf8');
  assert.match(shopLink, /pathname === '\/demo'/);
  assert.match(shopLink, /path === '\/' \? '\/demo'/);
  assert.match(shopLink, /\/demo\$\{path\}/);
  assert.match(context, /pathname\.startsWith\('\/demo\/'\)/);
});

test('demo product listing keeps isolated purple cards while tenant catalog uses aesthetic variants', async () => {
  const products = await readFile(new URL('../src/features/catalog/pages/Products.tsx', import.meta.url), 'utf8');
  const card = await readFile(productCardPath, 'utf8');
  assert.match(products, /variant="demo-purple"/);
  assert.match(products, /variant=\{ui\.card\}/);
  const demoBranch = card.slice(card.indexOf("variant === 'demo-purple'"), card.indexOf("variant === 'clean-minimal'"));
  assert.equal(demoBranch.includes('aria-label="ခြင်းထဲထည့်မည်"'), false);
  for (const id of ['clean-minimal', 'street-bold', 'soft-elegant', 'grid-catalog', 'dark-modern']) {
    assert.match(card, new RegExp(`variant === '${id}'`));
  }
  assert.match(card, /variant = 'default'/);
});

test('demo cart and checkout are scoped by the demo theme without changing tenant contracts', async () => {
  const layout = await readFile(layoutPath, 'utf8');
  const css = await readFile(new URL('../src/index.css', import.meta.url), 'utf8');
  const checkout = await readFile(checkoutPath, 'utf8');
  assert.match(layout, /data-demo-store/);
  assert.match(css, /\[data-demo-store\]/);
  assert.match(css, /--demo-primary: #6d28d9/);
  assert.match(checkout, /api\.createOrder/);
  assert.match(checkout, /idempotencyKey/);
});
