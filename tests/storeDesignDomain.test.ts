import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {
  STORE_DESIGN_SCHEMA_VERSION,
  createDefaultStoreDesign,
  createThemeDraft,
  getSectionDefinition,
  normalizeStoreDesign,
  validatePublishableStoreDesign,
} from '../src/domain/storeDesign/index.ts';

describe('Store Design domain', () => {
  it('creates complete schema-v1 documents', () => {
    for (const themeId of ['clean-minimal','street-bold','soft-elegant','grid-catalog','dark-modern'] as const) {
      const doc = createDefaultStoreDesign(themeId);
      assert.equal(doc.schemaVersion, STORE_DESIGN_SCHEMA_VERSION);
      assert.equal(doc.themeId, themeId);
      assert.ok(doc.templates.home.sections.length > 0);
      assert.ok(doc.templates.collection.sections.length > 0);
      assert.ok(doc.globalSettings.buyNow.label.trim().length > 0);
    }
  });

  it('converts legacy theme data', () => {
    const doc = normalizeStoreDesign({
      presetId: 'fashion',
      accentColor: '#ABCDEF',
      announcement: {enabled: true, text: 'မင်္ဂလာပါ'},
      home: {heroHeadline: 'Legacy headline', heroImageUrl: 'https://cdn.example/hero.webp'},
      product: {buyNowLabel: 'အခုပဲဝယ်မည်'},
    });
    assert.equal(doc.themeId, 'soft-elegant');
    assert.equal(doc.globalSettings.accentColor, '#abcdef');
    assert.equal(doc.globalSettings.buyNow.label, 'အခုပဲဝယ်မည်');
    const hero = doc.templates.home.sections.find((section) => section.type === 'hero');
    assert.equal(hero?.settings.headline, 'Legacy headline');
  });

  it('creates deterministic ids and preserves valid ids', () => {
    const doc = normalizeStoreDesign({
      schemaVersion: 1,
      themeId: 'clean-minimal',
      globalSettings: {},
      templates: {
        home: {sections: [
          {id: 'seller-hero', type: 'hero', enabled: true, settings: {headline: 'A'}},
          {type: 'rich-text', enabled: true, settings: {text: 'B'}},
        ]},
        collection: {sections: []},
        product: {sections: []},
      },
    });
    assert.equal(doc.templates.home.sections[0]?.id, 'seller-hero');
    assert.equal(doc.templates.home.sections[1]?.id, 'home-rich-text-2');
  });

  it('drops unsupported sections', () => {
    const doc = normalizeStoreDesign({
      schemaVersion: 1,
      themeId: 'clean-minimal',
      globalSettings: {},
      templates: {
        home: {sections: [{type: 'product-gallery', enabled: true, settings: {}}]},
        collection: {sections: []},
        product: {sections: []},
      },
    });
    assert.equal(doc.templates.home.sections.some((section) => section.type === 'product-gallery'), false);
  });

  it('maps collection source alias to category', () => {
    const doc = normalizeStoreDesign({
      schemaVersion: 1,
      themeId: 'clean-minimal',
      globalSettings: {},
      templates: {
        home: {sections: [{
          type: 'product-collection',
          enabled: true,
          settings: {
            title: 'စုစည်းမှု',
            productSource: {mode: 'dynamic', rule: 'collection', category: 'Shoes', limit: 8},
          },
        }]},
        collection: {sections: []},
        product: {sections: []},
      },
    });
    const section = doc.templates.home.sections[0];
    assert.equal(section?.type, 'product-collection');
    if (section?.type !== 'product-collection') return;
    assert.deepEqual(section.settings.productSource, {
      mode: 'dynamic',
      rule: 'category',
      category: 'Shoes',
      limit: 8,
    });
  });

  it('preserves required Buy Now capability for empty Product sections', () => {
    const doc = normalizeStoreDesign({
      schemaVersion: 1,
      themeId: 'dark-modern',
      globalSettings: {buyNow: {label: '', style: 'invalid', width: 'invalid'}},
      templates: {home: {sections: []}, collection: {sections: []}, product: {sections: []}},
    });
    assert.ok(doc.globalSettings.buyNow.label.trim().length > 0);
    assert.equal(doc.globalSettings.buyNow.disabled, false);
    assert.deepEqual(doc.templates.product.sections, []);
    assert.equal(validatePublishableStoreDesign(doc).ok, true);
  });

  it('protects required product building blocks in registry', () => {
    assert.equal(getSectionDefinition('product-info').removable, false);
    assert.equal(getSectionDefinition('product-info').hideable, false);
    assert.equal(getSectionDefinition('product-gallery').removable, false);
  });

  it('preserves content while target theme visual defaults win', () => {
    const current = createDefaultStoreDesign('soft-elegant');
    const hero = current.templates.home.sections.find((section) => section.type === 'hero');
    assert.ok(hero && hero.type === 'hero');
    if (!hero || hero.type !== 'hero') return;
    hero.settings.headline = 'Keep this headline';
    hero.settings.imageUrl = 'https://cdn.example/keep.webp';
    current.globalSettings.accentColor = '#123456';

    const next = createThemeDraft(current, 'street-bold');
    const nextHero = next.templates.home.sections.find((section) => section.type === 'hero');
    assert.ok(nextHero && nextHero.type === 'hero');
    if (!nextHero || nextHero.type !== 'hero') return;
    assert.equal(nextHero.settings.headline, 'Keep this headline');
    assert.equal(nextHero.settings.imageUrl, 'https://cdn.example/keep.webp');
    assert.notEqual(next.globalSettings.accentColor, '#123456');
  });

  it('rejects duplicate ids and disabled Buy Now during publish validation', () => {
    const doc = createDefaultStoreDesign('clean-minimal');
    doc.templates.home.sections.push({...doc.templates.home.sections[0]!, id: doc.templates.home.sections[0]!.id});
    doc.globalSettings.buyNow.disabled = true;
    const result = validatePublishableStoreDesign(doc);
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((error) => error.code === 'duplicate_section_id'));
    assert.ok(result.errors.some((error) => error.code === 'buy_now_required'));
  });
  it('preserves additional compatible seller sections during theme migration', () => {
    const current = createDefaultStoreDesign('clean-minimal');
    current.templates.home.sections.push({
      id: 'seller-rich-text-extra',
      type: 'rich-text',
      enabled: true,
      settings: {text: 'Keep my extra section'},
    });
    current.templates.home.sections.push({
      id: 'seller-new-arrivals',
      type: 'new-arrivals',
      enabled: true,
      settings: {
        title: 'Latest',
        productSource: {mode: 'dynamic', rule: 'new_arrivals', limit: 6},
      },
    });

    const next = createThemeDraft(current, 'dark-modern');

    assert.ok(next.templates.home.sections.some((section) => section.id === 'seller-rich-text-extra'));
    assert.ok(next.templates.home.sections.some((section) => section.id === 'seller-new-arrivals'));
  });

});
