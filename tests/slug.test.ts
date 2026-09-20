import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {isValidSlug, slugify} from '../src/domain/slug.ts';

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

describe('slugify', () => {
  it('lowercases and hyphenates a free-text name', () => {
    assert.equal(slugify('Su Su Fashion'), 'su-su-fashion');
    assert.equal(slugify('  Mini Shop!!  '), 'mini-shop');
  });

  it('does not leave a trailing hyphen when truncating at the 40-char boundary', () => {
    // 39 alphanumerics then a space then more: the slice(0,40) lands on the
    // hyphen produced from the space; the post-slice trim must remove it.
    const name = `${'a'.repeat(39)} tail`;
    const result = slugify(name);
    assert.equal(result.length <= 40, true, `length ${result.length}`);
    assert.equal(result.endsWith('-'), false, result);
    assert.equal(isValidSlug(result), true, result);
    assert.equal(result, 'a'.repeat(39));
  });

  it('also trims a leading hyphen', () => {
    assert.equal(slugify('!!! hello'), 'hello');
  });
});
