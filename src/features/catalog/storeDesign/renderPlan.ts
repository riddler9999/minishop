import {
  normalizeStoreDesign,
  type StoreDesignDocument,
  type StoreSection,
  type StoreTemplateName,
} from '../../../domain/storeDesign/index.ts';

export interface StorefrontRenderPlan {
  template: StoreTemplateName;
  themeId: StoreDesignDocument['themeId'];
  accentColor: StoreDesignDocument['globalSettings']['accentColor'];
  sections: StoreSection[];
  requiredCommerce: {
    buyNow: StoreDesignDocument['globalSettings']['buyNow'];
  };
}

export function buildStorefrontRenderPlan(
  document: StoreDesignDocument,
  template: StoreTemplateName,
): StorefrontRenderPlan {
  const normalized = normalizeStoreDesign(document);

  return {
    template,
    themeId: normalized.themeId,
    accentColor: normalized.globalSettings.accentColor,
    sections: normalized.templates[template].sections.filter((section) => section.enabled),
    requiredCommerce: {
      buyNow: normalized.globalSettings.buyNow,
    },
  };
}
