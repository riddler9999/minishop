import type {
  SectionSettingsByType,
  StoreSectionType,
  StoreTemplateName,
} from './types.ts';

export interface SectionDefinition<T extends StoreSectionType = StoreSectionType> {
  type: T;
  label: string;
  supportedTemplates: readonly StoreTemplateName[];
  removable: boolean;
  hideable: boolean;
  productSource: boolean;
  rendererKey: string;
}

const HOME_ONLY = ['home'] as const;
const HOME_COLLECTION = ['home', 'collection'] as const;
const PRODUCT_ONLY = ['product'] as const;

export const SECTION_REGISTRY: {[K in StoreSectionType]: SectionDefinition<K>} = {
  hero: {type: 'hero', label: 'Hero', supportedTemplates: HOME_ONLY, removable: true, hideable: true, productSource: false, rendererKey: 'hero'},
  categories: {type: 'categories', label: 'Categories', supportedTemplates: HOME_ONLY, removable: true, hideable: true, productSource: false, rendererKey: 'categories'},
  'featured-products': {type: 'featured-products', label: 'Featured Products', supportedTemplates: HOME_COLLECTION, removable: true, hideable: true, productSource: true, rendererKey: 'product-list'},
  'best-selling': {type: 'best-selling', label: 'Best Selling', supportedTemplates: HOME_COLLECTION, removable: true, hideable: true, productSource: true, rendererKey: 'product-list'},
  'promotion-banner': {type: 'promotion-banner', label: 'Promotion Banner', supportedTemplates: HOME_COLLECTION, removable: true, hideable: true, productSource: false, rendererKey: 'promotion-banner'},
  'image-text': {type: 'image-text', label: 'Image + Text', supportedTemplates: HOME_COLLECTION, removable: true, hideable: true, productSource: false, rendererKey: 'image-text'},
  'product-collection': {type: 'product-collection', label: 'Product Collection', supportedTemplates: HOME_COLLECTION, removable: true, hideable: true, productSource: true, rendererKey: 'product-list'},
  'new-arrivals': {type: 'new-arrivals', label: 'New Arrivals', supportedTemplates: HOME_COLLECTION, removable: true, hideable: true, productSource: true, rendererKey: 'product-list'},
  'sale-products': {type: 'sale-products', label: 'Sale Products', supportedTemplates: HOME_COLLECTION, removable: true, hideable: true, productSource: true, rendererKey: 'product-list'},
  announcement: {type: 'announcement', label: 'Announcement', supportedTemplates: HOME_ONLY, removable: true, hideable: true, productSource: false, rendererKey: 'announcement'},
  'rich-text': {type: 'rich-text', label: 'Rich Text', supportedTemplates: HOME_COLLECTION, removable: true, hideable: true, productSource: false, rendererKey: 'rich-text'},
  spacer: {type: 'spacer', label: 'Spacer', supportedTemplates: HOME_COLLECTION, removable: true, hideable: true, productSource: false, rendererKey: 'spacer'},
  'product-gallery': {type: 'product-gallery', label: 'Product Gallery', supportedTemplates: PRODUCT_ONLY, removable: false, hideable: false, productSource: false, rendererKey: 'product-gallery'},
  'product-info': {type: 'product-info', label: 'Product Info', supportedTemplates: PRODUCT_ONLY, removable: false, hideable: false, productSource: false, rendererKey: 'product-info'},
  'product-description': {type: 'product-description', label: 'Description', supportedTemplates: PRODUCT_ONLY, removable: true, hideable: true, productSource: false, rendererKey: 'product-description'},
  'related-products': {type: 'related-products', label: 'Related Products', supportedTemplates: PRODUCT_ONLY, removable: true, hideable: true, productSource: true, rendererKey: 'related-products'},
};

export function isStoreSectionType(value: unknown): value is StoreSectionType {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(SECTION_REGISTRY, value);
}

export function getSectionDefinition<T extends StoreSectionType>(type: T): SectionDefinition<T> {
  return SECTION_REGISTRY[type] as SectionDefinition<T>;
}

export function supportsTemplate(type: StoreSectionType, template: StoreTemplateName): boolean {
  return SECTION_REGISTRY[type].supportedTemplates.includes(template);
}

export function defaultSectionSettings<T extends StoreSectionType>(type: T): SectionSettingsByType[T] {
  const value: SectionSettingsByType = {
    hero: {headline: '', subtext: '', ctaLabel: 'ပစ္စည်းများကြည့်ရန်', imageUrl: null},
    categories: {title: 'အမျိုးအစားများ'},
    'featured-products': {title: 'ရွေးချယ်ထားသော ပစ္စည်းများ', productSource: {mode: 'manual', productIds: []}},
    'best-selling': {title: 'အရောင်းရဆုံး', productSource: {mode: 'dynamic', rule: 'best_selling', limit: 8}},
    'promotion-banner': {headline: '', body: '', ctaLabel: 'ကြည့်ရန်'},
    'image-text': {headline: '', body: '', imageUrl: null},
    'product-collection': {title: 'စုစည်းမှု', productSource: {mode: 'dynamic', rule: 'category', category: '', limit: 8}},
    'new-arrivals': {title: 'အသစ်ရောက်', productSource: {mode: 'dynamic', rule: 'new_arrivals', limit: 8}},
    'sale-products': {title: 'လျှော့ဈေးပစ္စည်းများ', productSource: {mode: 'dynamic', rule: 'sale', limit: 8}},
    announcement: {text: ''},
    'rich-text': {text: ''},
    spacer: {size: 'md'},
    'product-gallery': {layout: 'carousel'},
    'product-info': {showPrice: true},
    'product-description': {heading: 'ပစ္စည်းအကြောင်း'},
    'related-products': {title: 'ဆက်စပ်ပစ္စည်းများ', productSource: {mode: 'dynamic', rule: 'category', category: '', limit: 6}},
  };
  return value[type] as SectionSettingsByType[T];
}
