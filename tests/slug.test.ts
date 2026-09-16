import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {isValidSlug} from '../src/lib/slug.ts';

describe('isValidSlug', () => {
  it('accepts valid shop slugs', () => {
    for (const slug of ['abc', 'mini-shop', 'shop-2026', 'a'.repeat(40)]) {
      assert.equal(isValidSlug(slug), true, slug);
    }
  });

  it('rejects invalid values and malformed slugs', () => {
    for (const slug of [
      undefined,
      null,
      '',
      'ab',
      'a'.repeat(41),
      '-mini-shop',
      'mini-shop-',
      'Mini-Shop',
      'mini_shop',
      'mini shop',
    ]) {
      assert.equal(isValidSlug(slug), false, String(slug));
    }
  });
});
