import {DEFAULT_THEME, THEME_PRESETS, normalizeTheme, resolveThemePresetId, type ThemePresetId} from '../theme.ts';
import {defaultSectionSettings, isStoreSectionType, supportsTemplate} from './registry.ts';
import {
  STORE_DESIGN_SCHEMA_VERSION,
  type BuyNowSettings,
  type ProductSource,
  type ProductSourceRule,
  type PublishValidationError,
  type PublishValidationResult,
  type SectionSettingsByType,
  type StoreDesignDocument,
  type StoreSection,
  type StoreSectionType,
  type StoreTemplateName,
} from './types.ts';

const TEMPLATE_NAMES: readonly StoreTemplateName[] = ['home', 'collection', 'product'];
const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const SOURCE_RULES = new Set<ProductSourceRule>(['best_selling', 'new_arrivals', 'sale', 'category']);

function obj(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function stringValue(value: unknown, fallback: string, max = 240, allowEmpty = true): string {
  if (typeof value !== 'string') return fallback;
  const result = value.trim().slice(0, max);
  return result || allowEmpty ? result : fallback;
}
function boolValue(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}
function imageValue(value: unknown, fallback: string | null): string | null {
  if (value === null || value === '') return null;
  if (typeof value !== 'string') return fallback;
  const result = value.trim();
  return /^https?:\/\//i.test(result) || result.startsWith('/') ? result.slice(0, 2048) : fallback;
}
function colorValue(value: unknown, fallback: string): string {
  return typeof value === 'string' && HEX.test(value.trim()) ? value.trim().toLowerCase() : fallback;
}
function limitValue(value: unknown, fallback = 8): number {
  return typeof value === 'number' && Number.isInteger(value) ? Math.min(24, Math.max(1, value)) : fallback;
}
function uniqueStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim()))].slice(0, 24);
}

function normalizeProductSource(value: unknown, fallback: ProductSource): ProductSource {
  const raw = obj(value);
  if (raw.mode === 'manual') return {mode: 'manual', productIds: uniqueStrings(raw.productIds)};
  if (raw.mode === 'dynamic') {
    const rawRule = raw.rule === 'collection' ? 'category' : raw.rule;
    const rule: ProductSourceRule = typeof rawRule === 'string' && SOURCE_RULES.has(rawRule as ProductSourceRule)
      ? rawRule as ProductSourceRule
      : fallback.mode === 'dynamic' ? fallback.rule : 'new_arrivals';
    const source: ProductSource = {mode: 'dynamic', rule, limit: limitValue(raw.limit, fallback.mode === 'dynamic' ? fallback.limit : 8)};
    if (rule === 'category') source.category = stringValue(raw.category, fallback.mode === 'dynamic' ? fallback.category ?? '' : '', 120, true);
    return source;
  }
  return structuredClone(fallback);
}

function normalizeSettings<T extends StoreSectionType>(type: T, value: unknown): SectionSettingsByType[T] {
  const raw = obj(value);
  const defaults = defaultSectionSettings(type);
  let normalized: SectionSettingsByType[StoreSectionType];

  switch (type) {
    case 'hero': normalized = {
      headline: stringValue(raw.headline, (defaults as SectionSettingsByType['hero']).headline, 120, true),
      subtext: stringValue(raw.subtext, (defaults as SectionSettingsByType['hero']).subtext, 300, true),
      ctaLabel: stringValue(raw.ctaLabel, (defaults as SectionSettingsByType['hero']).ctaLabel, 40, false),
      imageUrl: imageValue(raw.imageUrl, (defaults as SectionSettingsByType['hero']).imageUrl),
    }; break;
    case 'categories': normalized = {title: stringValue(raw.title, (defaults as SectionSettingsByType['categories']).title, 80, false)}; break;
    case 'featured-products':
    case 'best-selling':
    case 'product-collection':
    case 'new-arrivals':
    case 'sale-products': {
      const d = defaults as SectionSettingsByType['featured-products'];
      normalized = {title: stringValue(raw.title, d.title, 80, false), productSource: normalizeProductSource(raw.productSource, d.productSource)};
      break;
    }
    case 'promotion-banner': {
      const d = defaults as SectionSettingsByType['promotion-banner'];
      normalized = {headline: stringValue(raw.headline, d.headline, 120, true), body: stringValue(raw.body, d.body, 300, true), ctaLabel: stringValue(raw.ctaLabel, d.ctaLabel, 40, false)};
      break;
    }
    case 'image-text': {
      const d = defaults as SectionSettingsByType['image-text'];
      normalized = {headline: stringValue(raw.headline, d.headline, 120, true), body: stringValue(raw.body, d.body, 600, true), imageUrl: imageValue(raw.imageUrl, d.imageUrl)};
      break;
    }
    case 'announcement': normalized = {text: stringValue(raw.text, (defaults as SectionSettingsByType['announcement']).text, 200, true)}; break;
    case 'rich-text': normalized = {text: stringValue(raw.text, (defaults as SectionSettingsByType['rich-text']).text, 2000, true)}; break;
    case 'spacer': normalized = {size: raw.size === 'sm' || raw.size === 'lg' ? raw.size : 'md'}; break;
    case 'product-gallery': normalized = {layout: raw.layout === 'stacked' ? 'stacked' : 'carousel'}; break;
    case 'product-info': normalized = {showPrice: true}; break;
    case 'product-description': normalized = {heading: stringValue(raw.heading, (defaults as SectionSettingsByType['product-description']).heading, 80, false)}; break;
    case 'related-products': {
      const d = defaults as SectionSettingsByType['related-products'];
      normalized = {title: stringValue(raw.title, d.title, 80, false), productSource: normalizeProductSource(raw.productSource, d.productSource)};
      break;
    }
  }
  return normalized as SectionSettingsByType[T];
}

function normalizeBuyNow(value: unknown, fallback: BuyNowSettings): BuyNowSettings {
  const raw = obj(value);
  return {
    label: stringValue(raw.label, fallback.label, 40, false),
    style: raw.style === 'outline' ? 'outline' : 'solid',
    width: raw.width === 'content' ? 'content' : 'full',
    disabled: false,
  };
}

function normalizeSection(value: unknown, template: StoreTemplateName, index: number): StoreSection | null {
  const raw = obj(value);
  if (!isStoreSectionType(raw.type) || !supportsTemplate(raw.type, template)) return null;
  const type = raw.type;
  const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim().slice(0, 120) : `${template}-${type}-${index + 1}`;
  return {
    id,
    type,
    enabled: boolValue(raw.enabled, true),
    settings: normalizeSettings(type, raw.settings),
  } as StoreSection;
}

function defaultSections(themeId: ThemePresetId): StoreDesignDocument['templates'] {
  const theme = THEME_PRESETS[themeId].theme;
  return {
    home: {sections: [
      {id: 'home-announcement-1', type: 'announcement', enabled: theme.announcement.enabled, settings: {text: theme.announcement.text}},
      {id: 'home-hero-2', type: 'hero', enabled: theme.home.heroEnabled, settings: {headline: theme.home.heroHeadline, subtext: theme.home.heroSubtext, ctaLabel: theme.home.heroCtaLabel, imageUrl: theme.home.heroImageUrl}},
      {id: 'home-categories-3', type: 'categories', enabled: theme.home.categoriesEnabled, settings: {title: 'အမျိုးအစားများ'}},
      {id: 'home-featured-products-4', type: 'featured-products', enabled: true, settings: {title: theme.home.featuredTitle, productSource: {mode: 'manual', productIds: []}}},
      {id: 'home-best-selling-5', type: 'best-selling', enabled: true, settings: {title: 'အရောင်းရဆုံး', productSource: {mode: 'dynamic', rule: 'best_selling', limit: 8}}},
    ]},
    collection: {sections: [
      {id: 'collection-rich-text-1', type: 'rich-text', enabled: true, settings: {text: ''}},
      {id: 'collection-product-collection-2', type: 'product-collection', enabled: true, settings: {title: theme.category.heading, productSource: {mode: 'dynamic', rule: 'category', category: '', limit: 12}}},
    ]},
    product: {sections: [
      {id: 'product-product-gallery-1', type: 'product-gallery', enabled: true, settings: {layout: 'carousel'}},
      {id: 'product-product-info-2', type: 'product-info', enabled: true, settings: {showPrice: true}},
      {id: 'product-product-description-3', type: 'product-description', enabled: true, settings: {heading: 'ပစ္စည်းအကြောင်း'}},
      {id: 'product-related-products-4', type: 'related-products', enabled: theme.product.relatedEnabled, settings: {title: 'ဆက်စပ်ပစ္စည်းများ', productSource: {mode: 'dynamic', rule: 'category', category: '', limit: 6}}},
    ]},
  };
}

export function createDefaultStoreDesign(themeId: ThemePresetId = DEFAULT_THEME.presetId): StoreDesignDocument {
  const theme = THEME_PRESETS[themeId].theme;
  return {
    schemaVersion: STORE_DESIGN_SCHEMA_VERSION,
    themeId,
    globalSettings: {
      accentColor: theme.accentColor,
      fontPairing: theme.fontPairing,
      buyNow: {label: theme.product.buyNowLabel, style: 'solid', width: 'full', disabled: false},
    },
    templates: defaultSections(themeId),
  };
}

function fromLegacy(input: unknown): StoreDesignDocument {
  const legacy = normalizeTheme(input);
  const doc = createDefaultStoreDesign(legacy.presetId);
  doc.globalSettings.accentColor = legacy.accentColor;
  doc.globalSettings.fontPairing = legacy.fontPairing;
  doc.globalSettings.buyNow.label = legacy.product.buyNowLabel;
  const announcement = doc.templates.home.sections.find((section) => section.type === 'announcement');
  if (announcement?.type === 'announcement') {
    announcement.enabled = legacy.announcement.enabled;
    announcement.settings.text = legacy.announcement.text;
  }
  const hero = doc.templates.home.sections.find((section) => section.type === 'hero');
  if (hero?.type === 'hero') {
    hero.enabled = legacy.home.heroEnabled;
    hero.settings = {
      headline: legacy.home.heroHeadline,
      subtext: legacy.home.heroSubtext,
      ctaLabel: legacy.home.heroCtaLabel,
      imageUrl: legacy.home.heroImageUrl,
    };
  }
  const categories = doc.templates.home.sections.find((section) => section.type === 'categories');
  if (categories) categories.enabled = legacy.home.categoriesEnabled;
  const featured = doc.templates.home.sections.find((section) => section.type === 'featured-products');
  if (featured?.type === 'featured-products') featured.settings.title = legacy.home.featuredTitle;
  const collection = doc.templates.collection.sections.find((section) => section.type === 'product-collection');
  if (collection?.type === 'product-collection') collection.settings.title = legacy.category.heading;
  return doc;
}

export function normalizeStoreDesign(input: unknown): StoreDesignDocument {
  const raw = obj(input);
  if (raw.schemaVersion !== STORE_DESIGN_SCHEMA_VERSION) return fromLegacy(input);
  const themeId = resolveThemePresetId(raw.themeId) ?? DEFAULT_THEME.presetId;
  const defaults = createDefaultStoreDesign(themeId);
  const global = obj(raw.globalSettings);
  const templates = obj(raw.templates);
  const normalized: StoreDesignDocument = {
    schemaVersion: STORE_DESIGN_SCHEMA_VERSION,
    themeId,
    globalSettings: {
      accentColor: colorValue(global.accentColor, defaults.globalSettings.accentColor),
      fontPairing: global.fontPairing === 'classic' || global.fontPairing === 'minimal' || global.fontPairing === 'boutique'
        ? global.fontPairing
        : defaults.globalSettings.fontPairing,
      buyNow: normalizeBuyNow(global.buyNow, defaults.globalSettings.buyNow),
    },
    templates: {home: {sections: []}, collection: {sections: []}, product: {sections: []}},
  };
  for (const templateName of TEMPLATE_NAMES) {
    const template = obj(templates[templateName]);
    const values = Array.isArray(template.sections) ? template.sections : defaults.templates[templateName].sections;
    normalized.templates[templateName].sections = values
      .map((section, index) => normalizeSection(section, templateName, index))
      .filter((section): section is StoreSection => section !== null);
  }
  return normalized;
}

export function validatePublishableStoreDesign(document: StoreDesignDocument): PublishValidationResult {
  const errors: PublishValidationError[] = [];
  if (document.schemaVersion !== STORE_DESIGN_SCHEMA_VERSION) {
    errors.push({code: 'invalid_schema', path: 'schemaVersion', message: 'Unsupported Store Design schema version.'});
  }
  if (document.globalSettings.buyNow.disabled || !document.globalSettings.buyNow.label.trim()) {
    errors.push({code: 'buy_now_required', path: 'globalSettings.buyNow', message: 'Product Buy Now must remain enabled and labelled.'});
  }
  const ids = new Set<string>();
  for (const templateName of TEMPLATE_NAMES) {
    for (const section of document.templates[templateName].sections) {
      if (ids.has(section.id)) errors.push({code: 'duplicate_section_id', path: `templates.${templateName}`, message: `Duplicate section id: ${section.id}`});
      ids.add(section.id);
      if (!supportsTemplate(section.type, templateName)) {
        errors.push({code: 'unsupported_section', path: `templates.${templateName}.${section.id}`, message: `${section.type} is not supported in ${templateName}.`});
      }
    }
  }
  return errors.length === 0 ? {ok: true, errors: []} : {ok: false, errors};
}
