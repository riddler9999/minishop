import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import type {StoreSection} from '../src/domain/storeDesign/index.ts';
import {THEME_PRESETS, type ThemePresetId} from '../src/domain/theme.ts';
import {groupProductTemplateSections, heroLayoutClass, productDetailGridClass} from '../src/features/catalog/storeDesign/layout.ts';

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

test('product template keeps adjacent gallery and info in one commerce shell', async () => {
  const source = await readFile(rendererPath, 'utf8');

  assert.match(source, /product-detail-shell/);
  assert.match(source, /groupProductTemplateSections/);
  assert.match(source, /renderRequiredCommerce\(buyNow\)/);
  assert.match(source, /function ProductGallery/);
  assert.match(source, /ChevronLeft/);
  assert.match(source, /ChevronRight/);
  assert.match(source, /commerce-price/);
  assert.match(source, /product\.isPromotion/);
});

test('product template grouping preserves seller-defined section order', () => {
  const gallery = {id: 'gallery', type: 'product-gallery', enabled: true, settings: {layout: 'carousel'}} satisfies StoreSection;
  const info = {id: 'info', type: 'product-info', enabled: true, settings: {showPrice: true}} satisfies StoreSection;
  const description = {id: 'description', type: 'product-description', enabled: true, settings: {heading: 'Details'}} satisfies StoreSection;
  const related = {
    id: 'related',
    type: 'related-products',
    enabled: true,
    settings: {title: 'Related', productSource: {mode: 'manual', productIds: []}},
  } satisfies StoreSection;

  const defaultGroups = groupProductTemplateSections([gallery, info, description, related]);
  assert.deepEqual(defaultGroups.map((group) => group.kind), ['pair', 'single', 'single']);
  assert.deepEqual(defaultGroups.flatMap((group) => group.sections.map((section) => section.id)), ['gallery', 'info', 'description', 'related']);

  const reorderedGroups = groupProductTemplateSections([info, description, gallery, related]);
  assert.deepEqual(reorderedGroups.map((group) => group.kind), ['single', 'single', 'single', 'single']);
  assert.deepEqual(reorderedGroups.flatMap((group) => group.sections.map((section) => section.id)), ['info', 'description', 'gallery', 'related']);
});

test('cart drawer keeps item totals, subtotal and continue-shopping affordance visible', async () => {
  const source = await readFile(cartPath, 'utf8');

  assert.match(source, /ပစ္စည်းစုစုပေါင်း/);
  assert.match(source, /စုစုပေါင်း/);
  assert.match(source, /ဆက်ဝယ်မယ်/);
  assert.match(source, /commerce-secondary/);
});
