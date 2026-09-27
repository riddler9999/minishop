import type {
  StoreDesignDocument,
  StoreSection,
  StoreTemplateName,
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
  return {
    template,
    themeId: document.themeId,
    accentColor: document.globalSettings.accentColor,
    sections: document.templates[template].sections.filter((section) => section.enabled),
    requiredCommerce: {
      buyNow: document.globalSettings.buyNow,
    },
  };
}
