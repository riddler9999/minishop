import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {DEFAULT_THEME, THEME_PRESETS, normalizeTheme, themeFromPreset, type StorefrontTheme} from '../src/domain/theme.ts';

// normalizeTheme() is the storefront's fail-safe boundary: it takes an untrusted
// value of ANY shape (raw jsonb, null, a partial/old blob, garbage) and must
// always return a complete, valid StorefrontTheme. These tests pin that
// contract — a regression here could render a broken buyer storefront.

describe('normalizeTheme — fail-safe coercion', () => {
  it('returns the full default for non-object inputs', () => {
    for (const bad of [null, undefined, '', 'x', 0, 1, true, [], [1, 2], NaN]) {
      assert.deepEqual(normalizeTheme(bad as unknown), DEFAULT_THEME);
    }
  });

  it('produces a complete theme (every default key present) from {}', () => {
    const t = normalizeTheme({});
    assert.deepEqual(t, DEFAULT_THEME);
    // structural completeness — no missing nested field
    assert.deepEqual(Object.keys(t).sort(), Object.keys(DEFAULT_THEME).sort());
    assert.deepEqual(Object.keys(t.home).sort(), Object.keys(DEFAULT_THEME.home).sort());
  });

  it('merges a partial object over the defaults', () => {
    const t = normalizeTheme({home: {heroHeadline: 'ဟယ်လို'}});
    assert.equal(t.home.heroHeadline, 'ဟယ်လို');
    assert.equal(t.home.heroSubtext, DEFAULT_THEME.home.heroSubtext);
    assert.equal(t.category.heading, DEFAULT_THEME.category.heading);
  });

  it('ignores unknown keys', () => {
    const t = normalizeTheme({evil: 'x', home: {evil: 'y', heroEnabled: false}} as unknown);
    assert.equal(t.home.heroEnabled, false);
    assert.equal((t as Record<string, unknown>).evil, undefined);
  });

  it('validates the accent colour and lowercases it', () => {
    assert.equal(normalizeTheme({accentColor: '#ABCDEF'}).accentColor, '#abcdef');
    assert.equal(normalizeTheme({accentColor: '#FFF'}).accentColor, '#fff');
    // bad colours fall back
    for (const bad of ['red', '#ggg', '#12', 'rgb(0,0,0)', 42, null]) {
      assert.equal(normalizeTheme({accentColor: bad as unknown}).accentColor, DEFAULT_THEME.accentColor);
    }
  });

  it('coerces booleans strictly (non-bool falls back)', () => {
    assert.equal(normalizeTheme({home: {heroEnabled: false}}).home.heroEnabled, false);
    assert.equal(normalizeTheme({home: {heroEnabled: 'true'}} as unknown).home.heroEnabled, true); // fallback to default (true)
    assert.equal(normalizeTheme({category: {searchEnabled: 0}} as unknown).category.searchEnabled, DEFAULT_THEME.category.searchEnabled);
  });

  it('allows blank copy fields but snaps blank labels back to default', () => {
    // subtext/headline may be intentionally cleared
    assert.equal(normalizeTheme({home: {heroSubtext: ''}}).home.heroSubtext, '');
    // a button label must never be empty
    assert.equal(normalizeTheme({home: {heroCtaLabel: '   '}}).home.heroCtaLabel, DEFAULT_THEME.home.heroCtaLabel);
    assert.equal(normalizeTheme({product: {buyNowLabel: ''}}).product.buyNowLabel, DEFAULT_THEME.product.buyNowLabel);
    assert.equal(normalizeTheme({category: {heading: ''}}).category.heading, DEFAULT_THEME.category.heading);
  });

  it('clamps over-long strings', () => {
    const long = 'x'.repeat(1000);
    assert.equal(normalizeTheme({home: {heroHeadline: long}}).home.heroHeadline.length, 120);
    assert.equal(normalizeTheme({announcement: {text: long}}).announcement.text.length, 200);
  });

  it('accepts safe image URLs and rejects dangerous ones', () => {
    assert.equal(normalizeTheme({home: {heroImageUrl: 'https://cdn.example/x.webp'}}).home.heroImageUrl, 'https://cdn.example/x.webp');
    assert.equal(normalizeTheme({home: {heroImageUrl: '/api/storefront/shop-logos/a.webp'}}).home.heroImageUrl, '/api/storefront/shop-logos/a.webp');
    assert.equal(normalizeTheme({home: {heroImageUrl: null}}).home.heroImageUrl, null);
    assert.equal(normalizeTheme({home: {heroImageUrl: ''}}).home.heroImageUrl, null);
    for (const bad of ['javascript:alert(1)', 'data:text/html,x', 'ftp://x', 123]) {
      assert.equal(normalizeTheme({home: {heroImageUrl: bad as unknown}}).home.heroImageUrl, DEFAULT_THEME.home.heroImageUrl);
    }
  });

  it('validates fontPairing against the known id set', () => {
    assert.equal(normalizeTheme({fontPairing: 'classic'}).fontPairing, 'classic');
    assert.equal(normalizeTheme({fontPairing: 'minimal'}).fontPairing, 'minimal');
    assert.equal(normalizeTheme({fontPairing: 'boutique'}).fontPairing, 'boutique');
    for (const bad of ['luxury', '', 123, null, undefined, {}]) {
      assert.equal(normalizeTheme({fontPairing: bad as unknown}).fontPairing, DEFAULT_THEME.fontPairing);
    }
  });

  it('ships exactly five valid storefront presets', () => {
    assert.deepEqual(Object.keys(THEME_PRESETS).sort(), ['clean-minimal', 'dark-modern', 'grid-catalog', 'soft-elegant', 'street-bold']);
    for (const [id, preset] of Object.entries(THEME_PRESETS)) {
      assert.equal(preset.theme.presetId, id);
      assert.deepEqual(normalizeTheme(preset.theme), preset.theme);
    }
  });

  it('applies a preset while preserving an existing hero image', () => {
    const current = normalizeTheme({home: {heroImageUrl: 'https://cdn.example/hero.webp'}});
    const next = themeFromPreset('dark-modern', current);
    assert.equal(next.presetId, 'dark-modern');
    assert.equal(next.home.heroImageUrl, current.home.heroImageUrl);
    assert.equal(next.accentColor, THEME_PRESETS['dark-modern'].theme.accentColor);
  });

  it('migrates legacy preset ids to the new aesthetic families', () => {
    assert.equal(normalizeTheme({presetId: 'minimal'}).presetId, 'clean-minimal');
    assert.equal(normalizeTheme({presetId: 'fashion'}).presetId, 'soft-elegant');
    assert.equal(normalizeTheme({presetId: 'dark-luxury'}).presetId, 'dark-modern');
    assert.equal(normalizeTheme({presetId: 'fresh-market'}).presetId, 'grid-catalog');
    assert.equal(normalizeTheme({presetId: 'modern-shop'}).presetId, 'street-bold');
  });

  it('falls back to the default preset id for unknown persisted values', () => {
    assert.equal(normalizeTheme({presetId: 'unknown'}).presetId, DEFAULT_THEME.presetId);
  });

  it('is idempotent (normalize∘normalize === normalize)', () => {
    const once: StorefrontTheme = normalizeTheme({accentColor: '#123456', home: {heroEnabled: false, heroImageUrl: 'https://x/y.webp'}, announcement: {enabled: true, text: 'Sale'}});
    assert.deepEqual(normalizeTheme(once), once);
  });
});
