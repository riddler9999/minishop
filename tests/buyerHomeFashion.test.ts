import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const homePath = new URL('../src/features/catalog/pages/Home.tsx', import.meta.url);
const layoutPath = new URL('../src/shared/ui/Layout.tsx', import.meta.url);
const storefrontPath = new URL('../src/app/routes/Storefront.tsx', import.meta.url);
const cartDrawerPath = new URL('../src/features/cart/components/CartDrawer.tsx', import.meta.url);
const cartPagePath = new URL('../src/features/cart/pages/Cart.tsx', import.meta.url);
const productCardPath = new URL('../src/features/catalog/components/ProductCard.tsx', import.meta.url);
const checkoutPath = new URL('../src/features/checkout/pages/Checkout.tsx', import.meta.url);
const onboardingPath = new URL('../src/features/auth/pages/Onboarding.tsx', import.meta.url);
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

test('buyer home keeps the simplified discovery flow without cart shortcuts', async () => {
  const source = await readHome();

  assert.match(source, /to="\/products"/);
  assert.match(source, /\/products\?category=/);
  assert.equal(source.includes("to: '/cart'"), false);
  assert.equal(source.includes('useShopNavigate'), false);
});

test('buyer storefront uses Burmese fashion copy and removes jewellery presentation', async () => {
  const source = ((await readHome()) + (await readFile(layoutPath, 'utf8'))).toLowerCase();

  assert.match(source, /အသစ်ရောက် ပစ္စည်းများ/);
  assert.match(source, /ပစ္စည်းများကြည့်ရန်/);
  assert.match(source, /အွန်လိုင်းဖက်ရှင်ဆိုင်/);

  for (const forbidden of [
    'fine jewellery',
    'fine jewelry',
    'traditional gold',
    'diamond jewellery',
    'crafted with meaning',
    'shop the collection',
    'online fashion store',
    'jewel-cta',
  ]) {
    assert.equal(source.includes(forbidden), false, `unexpected jewellery/English copy: ${forbidden}`);
  }
});

test('landing stylesheet does not leak generic nav or grid selectors into storefront', async () => {
  const css = await readFile(landingCssPath, 'utf8');

  assert.equal(/(^|})\.nav\{/.test(css), false, 'landing .nav must not override storefront navigation');
  assert.equal(/(^|})\.grid\{/.test(css), false, 'landing .grid must not override Tailwind grid utility');
});

test('buyer shell keeps the responsive header and no mobile bottom navigation', async () => {
  const source = await readFile(layoutPath, 'utf8');

  assert.match(source, /grid-cols-\[48px_minmax\(0,1fr\)_48px\]/);
  assert.match(source, /sm:grid-cols-\[112px_minmax\(0,1fr\)_112px\]/);
  assert.match(source, /lg:grid-cols-\[180px_minmax\(0,1fr\)_180px\]/);
  assert.match(source, /overflow-x-clip/);
  assert.match(source, /<CartDrawer \/>/);

  assert.equal(source.includes('pb-[calc(68px+env(safe-area-inset-bottom))]'), false);
  assert.equal(source.includes('h-[calc(68px+env(safe-area-inset-bottom))]'), false);
  assert.equal(source.includes('grid-cols-3 grid-rows-1'), false);
  assert.equal(source.includes('h-[68px]'), false);
});

test('cart is drawer-only and the standalone cart page is removed', async () => {
  const storefront = await readFile(storefrontPath, 'utf8');
  const drawer = await readFile(cartDrawerPath, 'utf8');

  assert.equal(storefront.includes('path="cart"'), false);
  assert.equal(storefront.includes("features/cart/pages/Cart"), false);
  assert.equal(drawer.includes("go('/cart')"), false);
  assert.equal(drawer.includes('စျေးခြင်း အပြည့်ကြည့်ရန်'), false);
  await assert.rejects(readFile(cartPagePath, 'utf8'));
});

test('product cards use compact stacked buyer actions', async () => {
  const source = await readFile(productCardPath, 'utf8');

  assert.match(source, /flex flex-col gap-1\.5 pt-3/);
  assert.match(source, /min-h-8/);
  assert.match(source, /ခြင်းထဲထည့်မည်/);
  assert.match(source, /ဝယ်မည်/);
  assert.equal(source.includes('grid grid-cols-2 gap-2 pt-4'), false);
});

test('cart drawer checkout and admin onboarding contain no legacy brown cream or gold theme tokens', async () => {
  const sources = await Promise.all([
    readFile(cartDrawerPath, 'utf8'),
    readFile(checkoutPath, 'utf8'),
    readFile(onboardingPath, 'utf8'),
  ]);

  for (const source of sources) {
    for (const forbidden of ['brand-', 'cream-', 'gold-']) {
      assert.equal(source.includes(forbidden), false, `legacy theme token remains: ${forbidden}`);
    }
  }

  const onboarding = sources[2];
  assert.match(onboarding, /bg-\[#e11d48\].*text-white/);
});
