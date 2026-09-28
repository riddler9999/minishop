import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {createDefaultStoreDesign, normalizeStoreDesign, validatePublishableStoreDesign} from '../src/domain/storeDesign/index.ts';
import {buildStorefrontRenderPlan} from '../src/features/catalog/storeDesign/renderPlan.ts';

describe('protected Product Buy Now commerce boundary', () => {
  it('keeps Buy Now enabled when malicious visibility and disabled fields are supplied', () => {
    const raw = structuredClone(createDefaultStoreDesign()) as unknown as Record<string, any>;
    raw.globalSettings.buyNow = {
      label: '  Order Now  ',
      style: 'outline',
      width: 'content',
      disabled: true,
      enabled: false,
      hidden: true,
      visible: false,
      removed: true,
    };

    const normalized = normalizeStoreDesign(raw);

    assert.deepEqual(normalized.globalSettings.buyNow, {
      label: 'Order Now',
      style: 'outline',
      width: 'content',
      disabled: false,
    });
    assert.deepEqual(Object.keys(normalized.globalSettings.buyNow).sort(), ['disabled', 'label', 'style', 'width']);
    assert.deepEqual(validatePublishableStoreDesign(normalized), {ok: true, errors: []});
  });

  it('restores a non-empty Buy Now label instead of allowing the CTA to disappear', () => {
    const raw = structuredClone(createDefaultStoreDesign()) as unknown as Record<string, any>;
    raw.globalSettings.buyNow.label = '   ';

    const normalized = normalizeStoreDesign(raw);

    assert.ok(normalized.globalSettings.buyNow.label.trim().length > 0);
    assert.equal(normalized.globalSettings.buyNow.disabled, false);
  });

  it('requires Product commerce even with empty, disabled, or unknown seller sections', () => {
    const raw = structuredClone(createDefaultStoreDesign()) as unknown as Record<string, any>;
    raw.templates.product.sections = [
      {id: 'disabled-description', type: 'product-description', enabled: false, settings: {heading: 'Description'}},
      {id: 'malicious-buy-now', type: 'buy-now', enabled: false, hidden: true, settings: {disabled: true}},
      {id: 'unknown', type: 'unknown-section', enabled: true, settings: {}},
    ];

    const normalized = normalizeStoreDesign(raw);
    const plan = buildStorefrontRenderPlan(normalized, 'product');

    assert.deepEqual(plan.sections, []);
    assert.equal(plan.requiredCommerce.buyNow.disabled, false);
    assert.ok(plan.requiredCommerce.buyNow.label.trim().length > 0);
  });

  it('sanitizes an untrusted document at the renderer boundary before composing required commerce', () => {
    const malicious = structuredClone(createDefaultStoreDesign()) as any;
    malicious.globalSettings.buyNow = {label: '', style: 'ghost', width: 'zero', disabled: true, hidden: true};
    malicious.templates.product.sections = [];

    const plan = buildStorefrontRenderPlan(malicious, 'product');

    assert.equal(plan.requiredCommerce.buyNow.disabled, false);
    assert.ok(plan.requiredCommerce.buyNow.label.trim().length > 0);
    assert.ok(['solid', 'outline'].includes(plan.requiredCommerce.buyNow.style));
    assert.ok(['full', 'content'].includes(plan.requiredCommerce.buyNow.width));
  });
});
