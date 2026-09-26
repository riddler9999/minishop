import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {createDefaultStoreDesign, normalizeStoreDesign} from '../src/domain/storeDesign/index.ts';
import {buildStorefrontRenderPlan} from '../src/features/catalog/storeDesign/renderPlan.ts';

describe('shared storefront renderer plan', () => {
  it('preserves Home section order and skips hidden sections', () => {
    const doc = createDefaultStoreDesign('clean-minimal');
    doc.templates.home.sections = [
      {id: 'a', type: 'rich-text', enabled: true, settings: {text: 'first'}},
      {id: 'b', type: 'spacer', enabled: false, settings: {size: 'md'}},
      {id: 'c', type: 'announcement', enabled: true, settings: {text: 'third'}},
    ];

    const plan = buildStorefrontRenderPlan(doc, 'home');
    assert.deepEqual(plan.sections.map((section) => section.id), ['a', 'c']);
  });

  it('uses Collection and Product templates independently', () => {
    const doc = createDefaultStoreDesign('soft-elegant');

    assert.ok(buildStorefrontRenderPlan(doc, 'collection').sections.every((section) => section.type !== 'hero'));
    assert.ok(buildStorefrontRenderPlan(doc, 'product').sections.some((section) => section.type === 'product-gallery'));
  });

  it('preserves required Product commerce boundary even for malformed empty product templates', () => {
    const malformed = normalizeStoreDesign({
      schemaVersion: 1,
      themeId: 'dark-modern',
      globalSettings: {
        accentColor: '#73fbd3',
        fontPairing: 'minimal',
        buyNow: {label: 'Buy now', style: 'solid', width: 'full', disabled: false},
      },
      templates: {
        home: {sections: []},
        collection: {sections: []},
        product: {sections: []},
      },
    });

    const plan = buildStorefrontRenderPlan(malformed, 'product');
    assert.equal(plan.requiredCommerce.buyNow.label, 'Buy now');
    assert.equal(plan.requiredCommerce.buyNow.disabled, false);
  });
});
