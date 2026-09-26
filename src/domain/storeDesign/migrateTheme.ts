import type {ThemePresetId} from '../theme.ts';
import {createDefaultStoreDesign, normalizeStoreDesign} from './normalize.ts';
import type {StoreDesignDocument, StoreSection, StoreSectionType} from './types.ts';

const COPY_FIELDS: Partial<Record<StoreSectionType, readonly string[]>> = {
  hero: ['headline', 'subtext', 'ctaLabel', 'imageUrl'],
  announcement: ['text'],
  'featured-products': ['title', 'productSource'],
  'best-selling': ['title', 'productSource'],
  'product-collection': ['title', 'productSource'],
  'new-arrivals': ['title', 'productSource'],
  'sale-products': ['title', 'productSource'],
  categories: ['title'],
  'promotion-banner': ['headline', 'body', 'ctaLabel'],
  'image-text': ['headline', 'body', 'imageUrl'],
  'rich-text': ['text'],
  'product-description': ['heading'],
  'related-products': ['title', 'productSource'],
};

function copyCompatibleSettings(target: StoreSection, source: StoreSection): StoreSection {
  if (target.type !== source.type) return target;
  const fields = COPY_FIELDS[target.type] ?? [];
  const next = structuredClone(target) as StoreSection;
  const targetSettings = next.settings as unknown as Record<string, unknown>;
  const sourceSettings = source.settings as unknown as Record<string, unknown>;
  for (const field of fields) {
    if (Object.prototype.hasOwnProperty.call(sourceSettings, field)) targetSettings[field] = structuredClone(sourceSettings[field]);
  }
  return next;
}

export function createThemeDraft(current: StoreDesignDocument, targetThemeId: ThemePresetId): StoreDesignDocument {
  const source = normalizeStoreDesign(current);
  const target = createDefaultStoreDesign(targetThemeId);

  for (const templateName of ['home', 'collection', 'product'] as const) {
    target.templates[templateName].sections = target.templates[templateName].sections.map((targetSection) => {
      const sourceSection = source.templates[templateName].sections.find((section) => section.type === targetSection.type);
      return sourceSection ? copyCompatibleSettings(targetSection, sourceSection) : targetSection;
    });
  }

  // CTA language is seller-authored semantic content. Visual values come from target defaults.
  target.globalSettings.buyNow.label = source.globalSettings.buyNow.label;
  return normalizeStoreDesign(target);
}
