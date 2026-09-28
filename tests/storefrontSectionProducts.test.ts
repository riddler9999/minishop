import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import type {Product} from '../src/domain/product.ts';
import {createDefaultStoreDesign, type ProductSource} from '../src/domain/storeDesign/index.ts';
import {loadStorefrontSectionProducts, resolveSectionProductList} from '../src/features/catalog/storeDesign/sectionProducts.ts';
import {removeManualProductId, unavailableManualProductIds} from '../src/features/shop/storeBuilder/manualProductSelection.ts';

function product(id: string, category = 'General'): Product {
  return {
    id,
    itemCode: id,
    name: id,
    category,
    color: null,
    size: null,
    price: 1000,
    promoPrice: null,
    isPromotion: false,
    stock: 1,
    inStock: true,
    status: 'active',
    images: [],
    image: null,
    description: '',
    arrivalDate: null,
    createdAt: null,
  };
}

describe('Store Builder product-source rendering', () => {
  it('applies the typed source to preview fallback products', () => {
    const document = createDefaultStoreDesign();
    const section = document.templates.home.sections.find((candidate) => candidate.type === 'featured-products');
    if (!section || section.type !== 'featured-products') throw new Error('Expected featured products section');
    section.settings.productSource = {mode: 'manual', productIds: ['b', 'a']};

    assert.deepEqual(resolveSectionProductList(section, [product('a'), product('b'), product('c')]).map((item) => item.id), ['b', 'a']);
  });

  it('loads each buyer section through the existing source gateway and honors resolved results', async () => {
    const document = createDefaultStoreDesign();
    const calls: ProductSource[] = [];
    const resolved = await loadStorefrontSectionProducts(document, 'home', async (source) => {
      calls.push(source);
      return {products: [product(source.mode === 'manual' ? 'manual' : source.rule)]};
    });
    const section = document.templates.home.sections.find((candidate) => candidate.type === 'best-selling');
    if (!section) throw new Error('Expected best-selling section');

    assert.ok(calls.some((source) => source.mode === 'dynamic' && source.rule === 'best_selling'));
    assert.deepEqual(resolveSectionProductList(section, [product('fallback')], resolved).map((item) => item.id), ['best_selling']);
  });

  it('keeps stale manual IDs removable even when all visible choices are at the limit', () => {
    const source = {mode: 'manual', productIds: ['deleted', 'active']} as const;
    assert.deepEqual(unavailableManualProductIds(source, [product('active')]), ['deleted']);
    assert.deepEqual(removeManualProductId(source, 'deleted'), {mode: 'manual', productIds: ['active']});
  });
});
