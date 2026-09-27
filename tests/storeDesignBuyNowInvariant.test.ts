import {describe, expect, it} from 'vitest';
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

    expect(normalized.globalSettings.buyNow).toEqual({
      label: 'Order Now',
      style: 'outline',
      width: 'content',
      disabled: false,
    });
    expect(Object.keys(normalized.globalSettings.buyNow).sort()).toEqual(['disabled', 'label', 'style', 'width']);
    expect(validatePublishableStoreDesign(normalized)).toEqual({ok: true, errors: []});
  });

  it('restores a non-empty Buy Now label instead of allowing the CTA to disappear', () => {
    const raw = structuredClone(createDefaultStoreDesign()) as unknown as Record<string, any>;
    raw.globalSettings.buyNow.label = '   ';

    const normalized = normalizeStoreDesign(raw);

    expect(normalized.globalSettings.buyNow.label.trim().length).toBeGreaterThan(0);
    expect(normalized.globalSettings.buyNow.disabled).toBe(false);
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

    expect(plan.sections).toEqual([]);
    expect(plan.requiredCommerce.buyNow.disabled).toBe(false);
    expect(plan.requiredCommerce.buyNow.label.trim().length).toBeGreaterThan(0);
  });

  it('sanitizes an untrusted document at the renderer boundary before composing required commerce', () => {
    const malicious = structuredClone(createDefaultStoreDesign()) as any;
    malicious.globalSettings.buyNow = {label: '', style: 'ghost', width: 'zero', disabled: true, hidden: true};
    malicious.templates.product.sections = [];

    const plan = buildStorefrontRenderPlan(malicious, 'product');

    expect(plan.requiredCommerce.buyNow.disabled).toBe(false);
    expect(plan.requiredCommerce.buyNow.label.trim().length).toBeGreaterThan(0);
    expect(['solid', 'outline']).toContain(plan.requiredCommerce.buyNow.style);
    expect(['full', 'content']).toContain(plan.requiredCommerce.buyNow.width);
  });
});
