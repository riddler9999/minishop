import test from 'node:test';
import assert from 'node:assert/strict';
import {firstPartyMediaUrl} from '../src/features/catalog/api/mappers.ts';

test('rewrites Supabase product images to same-origin media path', () => {
  assert.equal(firstPartyMediaUrl('https://x.supabase.co/storage/v1/object/public/product-images/shop/p.webp'), '/api/storefront/product-images/shop/p.webp');
});

test('leaves unrelated media URLs unchanged', () => {
  assert.equal(firstPartyMediaUrl('https://example.com/p.webp'), 'https://example.com/p.webp');
});
