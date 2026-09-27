import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {
  MAX_PRODUCT_SOURCE_LIMIT,
  normalizeProductSourceLimit,
} from '../api/storefront-product-source.ts';

describe('Store Builder #110 buyer product-source gateway', () => {
  it('clamps dynamic product-source limits at the buyer gateway boundary', () => {
    assert.equal(normalizeProductSourceLimit(undefined), 12);
    assert.equal(normalizeProductSourceLimit(0), 1);
    assert.equal(normalizeProductSourceLimit(8), 8);
    assert.equal(normalizeProductSourceLimit(999), MAX_PRODUCT_SOURCE_LIMIT);
  });

  it('uses bounded set queries and a public aggregate RPC instead of per-product N+1 reads', async () => {
    const fs = await import('node:fs');
    const source = fs.readFileSync('api/storefront.ts', 'utf8');

    assert.match(source, /action === 'section-products'/);
    assert.match(source, /normalizeProductSourceLimit/);
    assert.match(source, /\.rpc\(\s*'load_best_selling_product_ids'/);
    assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE_KEY|service.?role/i);
    assert.doesNotMatch(source, /for\s*\([^)]*product[^)]*\)[\s\S]{0,300}sb\.from\(/);
  });

  it('defines the best-selling aggregate in the additive Store Design migration', async () => {
    const fs = await import('node:fs');
    const sql = fs.readFileSync('supabase/migrations/0024_store_design_lifecycle.sql', 'utf8');

    assert.match(sql, /create or replace function public\.load_best_selling_product_ids\(\s*p_shop_slug text,\s*p_limit integer/i);
    assert.match(sql, /sum\(oi\.qty\)/i);
    assert.match(sql, /group by oi\.product_id/i);
    assert.match(sql, /least\(greatest\(p_limit,\s*1\),\s*24\)/i);
    assert.doesNotMatch(sql, /o\.status\s*(=|<>|in|not in)/i);
    assert.match(sql, /grant execute on function public\.load_best_selling_product_ids\(text,integer\)\s+to anon, authenticated/i);
  });
});
