import type {FontPairingId} from '../fontPairing.ts';
import type {ThemePresetId} from '../theme.ts';

export const STORE_DESIGN_SCHEMA_VERSION = 1 as const;
export type StoreTemplateName = 'home' | 'collection' | 'product';
export type ProductSourceRule = 'best_selling' | 'new_arrivals' | 'sale' | 'category';

export type ProductSource =
  | {mode: 'manual'; productIds: string[]}
  | {mode: 'dynamic'; rule: ProductSourceRule; limit: number; category?: string};

export interface BuyNowSettings {
  label: string;
  style: 'solid' | 'outline';
  width: 'full' | 'content';
  disabled: false;
}

export interface GlobalThemeSettings {
  accentColor: string;
  fontPairing: FontPairingId;
  buyNow: BuyNowSettings;
}

export interface HeroSettings {
  headline: string;
  subtext: string;
  ctaLabel: string;
  imageUrl: string | null;
}
export interface CategoriesSettings {title: string}
export interface ProductListSettings {title: string; productSource: ProductSource}
export interface PromotionBannerSettings {headline: string; body: string; ctaLabel: string}
export interface ImageTextSettings {headline: string; body: string; imageUrl: string | null}
export interface AnnouncementSettings {text: string}
export interface RichTextSettings {text: string}
export interface SpacerSettings {size: 'sm' | 'md' | 'lg'}
export interface ProductGallerySettings {layout: 'stacked' | 'carousel'}
export interface ProductInfoSettings {showPrice: true}
export interface ProductDescriptionSettings {heading: string}
export interface RelatedProductsSettings {title: string; productSource: ProductSource}

export interface SectionSettingsByType {
  hero: HeroSettings;
  categories: CategoriesSettings;
  'featured-products': ProductListSettings;
  'best-selling': ProductListSettings;
  'promotion-banner': PromotionBannerSettings;
  'image-text': ImageTextSettings;
  'product-collection': ProductListSettings;
  'new-arrivals': ProductListSettings;
  'sale-products': ProductListSettings;
  announcement: AnnouncementSettings;
  'rich-text': RichTextSettings;
  spacer: SpacerSettings;
  'product-gallery': ProductGallerySettings;
  'product-info': ProductInfoSettings;
  'product-description': ProductDescriptionSettings;
  'related-products': RelatedProductsSettings;
}

export type StoreSectionType = keyof SectionSettingsByType;
export type StoreSection = {
  [K in StoreSectionType]: {
    id: string;
    type: K;
    enabled: boolean;
    settings: SectionSettingsByType[K];
  }
}[StoreSectionType];

export interface StoreTemplate {
  sections: StoreSection[];
}

export interface StoreDesignDocument {
  schemaVersion: typeof STORE_DESIGN_SCHEMA_VERSION;
  themeId: ThemePresetId;
  globalSettings: GlobalThemeSettings;
  templates: Record<StoreTemplateName, StoreTemplate>;
}

export interface PublishValidationError {
  code: 'duplicate_section_id' | 'unsupported_section' | 'buy_now_required' | 'invalid_schema';
  path: string;
  message: string;
}

export type PublishValidationResult =
  | {ok: true; errors: []}
  | {ok: false; errors: PublishValidationError[]};

export interface StoreDesignLifecycle {
  draft: StoreDesignDocument;
  published: StoreDesignDocument;
  previousPublished: StoreDesignDocument | null;
  draftRevision: number;
  publishedRevision: number;
  updatedAt: string | null;
  publishedAt: string | null;
}
