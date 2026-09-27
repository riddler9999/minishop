import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {aggregateBestSellingDemand} from '../api/storefront-product-source.ts';

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
});
