import type {
  StoreDesignDocument,
  StoreSection,
  StoreTemplateName,
} from '../../../domain/storeDesign/index.ts';

export interface StorefrontRenderPlan {
  template: StoreTemplateName;
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
    sections: document.templates[template].sections.filter((section) => section.enabled),
    requiredCommerce: {
      buyNow: document.globalSettings.buyNow,
    },
  };
}
