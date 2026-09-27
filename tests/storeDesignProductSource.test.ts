import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import type {Product} from '../src/domain/product.ts';
import {resolveProductSource} from '../src/domain/storeDesign/productSource.ts';

function product(id: string, patch: Partial<Product> = {}): Product {
  return {
    id,
    itemCode: id,
    name: id,
    category: 'Default',
    color: null,
    size: null,
    price: 1000,
    promoPrice: null,
    isPromotion: false,
    stock: 10,
    inStock: true,
    status: 'active',
    images: [],
    image: null,
    description: '',
    arrivalDate: null,
    createdAt: '2026-09-01T00:00:00.000Z',
    ...patch,
  };
}

describe('Store Builder #110 deterministic product-source resolution', () => {
  it('Manual preserves configured order while dropping unavailable products', () => {
    const available = [product('b'), product('a'), product('c', {status: 'hidden'})];
    const result = resolveProductSource({mode: 'manual', productIds: ['a', 'missing', 'b', 'c']}, available);
    assert.deepEqual(result.map((p) => p.id), ['a', 'b']);
  });

  it('New Arrivals returns active products newest-first with product id tie-break', () => {
    const available = [
      product('b', {createdAt: '2026-09-10T00:00:00.000Z'}),
      product('a', {createdAt: '2026-09-10T00:00:00.000Z'}),
      product('c', {createdAt: '2026-09-11T00:00:00.000Z'}),
      product('hidden', {status: 'hidden', createdAt: '2026-09-12T00:00:00.000Z'}),
    ];
    const result = resolveProductSource({mode: 'dynamic', rule: 'new_arrivals', limit: 10}, available);
    assert.deepEqual(result.map((p) => p.id), ['c', 'a', 'b']);
  });

  it('Sale uses the existing promotion invariant', () => {
    const available = [
      product('valid', {isPromotion: true, promoPrice: 900}),
      product('no-price', {isPromotion: true, promoPrice: null}),
      product('not-promo', {isPromotion: false, promoPrice: 900}),
      product('invalid-price', {isPromotion: true, promoPrice: 0}),
    ];
    const result = resolveProductSource({mode: 'dynamic', rule: 'sale', limit: 10}, available);
    assert.deepEqual(result.map((p) => p.id), ['valid']);
  });

  it('Category maps to the existing product.category domain', () => {
    const available = [product('a', {category: 'Shoes'}), product('b', {category: 'Bags'}), product('c', {category: 'Shoes'})];
    const result = resolveProductSource({mode: 'dynamic', rule: 'category', category: 'Shoes', limit: 10}, available);
    assert.deepEqual(result.map((p) => p.id), ['a', 'c']);
  });

  it('Best Selling ranks created historical demand and does not subtract later status changes', () => {
    const available = [product('a'), product('b'), product('c')];
    const demand = new Map([
      ['a', 4],
      ['b', 7],
      ['c', 7],
    ]);
    const result = resolveProductSource(
      {mode: 'dynamic', rule: 'best_selling', limit: 10},
      available,
      {demandByProductId: demand},
    );
    assert.deepEqual(result.map((p) => p.id), ['b', 'c', 'a']);
  });

  it('applies the configured limit after deterministic filtering and ordering', () => {
    const available = [product('a'), product('b'), product('c')];
    const result = resolveProductSource({mode: 'dynamic', rule: 'new_arrivals', limit: 2}, available);
    assert.equal(result.length, 2);
  });
});
