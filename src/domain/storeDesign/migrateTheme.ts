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
    if (Object.prototype.hasOwnProperty.call(sourceSettings, field)) {
      targetSettings[field] = structuredClone(sourceSettings[field]);
    }
  }
  return next;
}

export function createThemeDraft(current: StoreDesignDocument, targetThemeId: ThemePresetId): StoreDesignDocument {
  const source = normalizeStoreDesign(current);
  const target = createDefaultStoreDesign(targetThemeId);

  for (const templateName of ['home', 'collection', 'product'] as const) {
    const sourceSections = source.templates[templateName].sections;
    const consumedByType = new Map<StoreSectionType, number>();

    target.templates[templateName].sections = target.templates[templateName].sections.map((targetSection) => {
      const consumed = consumedByType.get(targetSection.type) ?? 0;
      const matching = sourceSections.filter((section) => section.type === targetSection.type);
      const sourceSection = matching[consumed];
      if (!sourceSection) return targetSection;
      consumedByType.set(targetSection.type, consumed + 1);
      return copyCompatibleSettings(targetSection, sourceSection);
    });

    for (const sourceSection of sourceSections) {
      const matching = sourceSections.filter((section) => section.type === sourceSection.type);
      const sourceIndex = matching.findIndex((section) => section.id === sourceSection.id);
      const consumed = consumedByType.get(sourceSection.type) ?? 0;
      if (sourceIndex >= consumed) {
        target.templates[templateName].sections.push(structuredClone(sourceSection));
      }
    }
  }

  // CTA language is seller-authored semantic content. Visual values come from target defaults.
  target.globalSettings.buyNow.label = source.globalSettings.buyNow.label;
  return normalizeStoreDesign(target);
}
