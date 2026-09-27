import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {
  aggregateBestSellingDemand,
  MAX_BEST_SELLING_ORDER_ITEMS,
  MAX_PRODUCT_SOURCE_LIMIT,
  normalizeProductSourceLimit,
} from '../api/storefront-product-source.ts';

describe('Store Builder #110 best-selling gateway aggregation', () => {
  it('aggregates created historical demand without subtracting later order statuses', () => {
    const rows = [
      {product_id: 'a', qty: 2},
      {product_id: 'b', qty: 4},
      {product_id: 'a', qty: 3},
    ];
    const result = aggregateBestSellingDemand(rows);
    assert.deepEqual([...result.entries()], [['a', 5], ['b', 4]]);
  });

  it('ignores malformed rows and remains bounded by caller-provided query results', () => {
    const rows = [
      {product_id: 'a', qty: 2},
      {product_id: null, qty: 99},
      {product_id: 'b', qty: 0},
      {product_id: 'c', qty: -1},
    ];
    const result = aggregateBestSellingDemand(rows);
    assert.deepEqual([...result.entries()], [['a', 2]]);
  });

  it('clamps dynamic product-source limits at the buyer gateway boundary', () => {
    assert.equal(normalizeProductSourceLimit(undefined), 12);
    assert.equal(normalizeProductSourceLimit(0), 1);
    assert.equal(normalizeProductSourceLimit(8), 8);
    assert.equal(normalizeProductSourceLimit(999), MAX_PRODUCT_SOURCE_LIMIT);
  });

  it('keeps historical demand reads explicitly bounded', () => {
    assert.ok(MAX_BEST_SELLING_ORDER_ITEMS > MAX_PRODUCT_SOURCE_LIMIT);
    assert.ok(MAX_BEST_SELLING_ORDER_ITEMS <= 5000);
  });
});

describe('Store Builder #110 storefront gateway query contract', () => {
  it('uses bounded set queries instead of per-product N+1 reads', async () => {
    const fs = await import('node:fs');
    const source = fs.readFileSync('api/storefront.ts', 'utf8');

    assert.match(source, /action === 'section-products'/);
    assert.match(source, /normalizeProductSourceLimit/);
    assert.match(source, /order_items/);
    assert.match(source, /\.limit\(MAX_BEST_SELLING_ORDER_ITEMS\)/);
    assert.doesNotMatch(source, /for\s*\([^)]*product[^)]*\)[\s\S]{0,300}sb\.from\(/);
  });
});
