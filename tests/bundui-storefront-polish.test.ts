import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {THEME_PRESETS, type ThemePresetId} from '../src/domain/theme.ts';
import {heroLayoutClass, productDetailGridClass} from '../src/features/catalog/storeDesign/layout.ts';

const rendererPath = new URL('../src/features/catalog/storeDesign/StorefrontRenderer.tsx', import.meta.url);
const cartPath = new URL('../src/features/cart/components/CartDrawer.tsx', import.meta.url);

const THEME_IDS: ThemePresetId[] = ['clean-minimal', 'street-bold', 'soft-elegant', 'grid-catalog', 'dark-modern'];

test('storefront hero preserves five materially distinct theme compositions', () => {
  const classes = THEME_IDS.map((id) => heroLayoutClass(THEME_PRESETS[id].visual.hero));

  assert.equal(new Set(classes).size, THEME_IDS.length);
  assert.match(classes[0], /hero-split/);
  assert.match(classes[1], /hero-poster/);
  assert.match(classes[2], /hero-centered/);
  assert.match(classes[3], /hero-utility/);
  assert.match(classes[4], /hero-glass/);
});

test('product detail keeps a theme-specific responsive two-column desktop composition', () => {
  const classes = THEME_IDS.map((id) => productDetailGridClass(THEME_PRESETS[id].visual.layout));

  assert.equal(new Set(classes).size, THEME_IDS.length);
  for (const className of classes) assert.match(className, /md:grid-cols/);
});

test('product template groups gallery, buying information and commerce actions in one shell', async () => {
  const source = await readFile(rendererPath, 'utf8');

  assert.match(source, /product-detail-shell/);
  assert.match(source, /sectionFrame\(gallery/);
  assert.match(source, /sectionFrame\(info/);
  assert.match(source, /renderRequiredCommerce\(buyNow\)/);
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
