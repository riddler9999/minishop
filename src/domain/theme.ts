// ---- DOMAIN: storefront theme (Store Design) --------------------------------
// Seller-editable storefront customization. Theme presets describe visual
// aesthetics, not product niches: any merchant can pick any preset regardless of
// what they sell. The preset controls layout + visual language while individual
// copy/colour fields remain editable overrides.
//
// This module is pure domain code. Theme data is cosmetic only; authorization,
// RLS, validation and commerce rules live elsewhere.

import {type FontPairingId, DEFAULT_FONT_PAIRING, isFontPairingId} from './fontPairing.ts';

export type ThemePresetId =
  | 'clean-minimal'
  | 'street-bold'
  | 'soft-elegant'
  | 'grid-catalog'
  | 'dark-modern';

export type ThemeLayoutStyle = 'editorial' | 'poster' | 'boutique' | 'catalog' | 'tech';

export interface ThemeVisualProfile {
  layout: ThemeLayoutStyle;
  canvas: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
  accent: string;
  accentText: string;
  radius: 'none' | 'soft' | 'rounded' | 'compact';
  productGrid: 'editorial-2' | 'bold-2' | 'boutique-2' | 'dense-3' | 'tech-2';
  hero: 'split' | 'poster' | 'centered' | 'utility' | 'glass';
}

export type HexColor = string;

export interface AnnouncementTheme {
  enabled: boolean;
  text: string;
}

export interface HomeTheme {
  heroEnabled: boolean;
  heroHeadline: string;
  heroSubtext: string;
  heroCtaLabel: string;
  heroImageUrl: string | null;
  categoriesEnabled: boolean;
  featuredTitle: string;
  featuredSubtitle: string;
}

export interface CategoryTheme {
  heading: string;
  searchEnabled: boolean;
}

export interface ProductTheme {
  relatedEnabled: boolean;
  addToCartLabel: string;
  buyNowLabel: string;
}

export interface StorefrontTheme {
  presetId: ThemePresetId;
  fontPairing: FontPairingId;
  accentColor: HexColor;
  announcement: AnnouncementTheme;
  home: HomeTheme;
  category: CategoryTheme;
  product: ProductTheme;
}

export interface ThemePresetDefinition {
  label: string;
  shortLabel: string;
  description: string;
  bestFor: string;
  visual: ThemeVisualProfile;
  theme: StorefrontTheme;
}

export const DEFAULT_THEME: StorefrontTheme = {
  // Soft Elegant is the closest migration target to the previous fashion-first
  // default, avoiding an abrupt visual jump for shops that never saved a preset.
  presetId: 'soft-elegant',
  fontPairing: DEFAULT_FONT_PAIRING,
  accentColor: '#b56b7a',
  announcement: {
    enabled: false,
    text: '',
  },
  home: {
    heroEnabled: true,
    heroHeadline: 'ကိုယ့်ဆိုင်ရဲ့ အကောင်းဆုံးပစ္စည်းတွေကို လှလှပပ ရွေးချယ်ပါ။',
    heroSubtext: 'Brand ရဲ့ mood ကို မပျက်စေဘဲ ပစ္စည်းတွေကို ရှင်းရှင်းလင်းလင်း ကြည့်နိုင်ပါတယ်။',
    heroCtaLabel: 'ပစ္စည်းများကြည့်ရန်',
    heroImageUrl: null,
    categoriesEnabled: true,
    featuredTitle: 'ရွေးချယ်ထားသော ပစ္စည်းများ',
    featuredSubtitle: 'ဆိုင်မှာ လက်ရှိရရှိနိုင်တဲ့ ပစ္စည်းများ။',
  },
  category: {
    heading: 'ပစ္စည်းများ',
    searchEnabled: true,
  },
  product: {
    relatedEnabled: true,
    addToCartLabel: 'ခြင်းထဲထည့်မည်',
    buyNowLabel: 'ဝယ်မည်',
  },
};

function preset(
  id: ThemePresetId,
  partial: Partial<StorefrontTheme>,
  meta: Omit<ThemePresetDefinition, 'theme'>,
): ThemePresetDefinition {
  return {
    ...meta,
    theme: {
      ...DEFAULT_THEME,
      ...partial,
      presetId: id,
      announcement: {...DEFAULT_THEME.announcement, ...(partial.announcement ?? {})},
      home: {...DEFAULT_THEME.home, ...(partial.home ?? {})},
      category: {...DEFAULT_THEME.category, ...(partial.category ?? {})},
      product: {...DEFAULT_THEME.product, ...(partial.product ?? {})},
    },
  };
}

export const THEME_PRESETS: Record<ThemePresetId, ThemePresetDefinition> = {
  'clean-minimal': preset(
    'clean-minimal',
    {
      fontPairing: 'minimal',
      accentColor: '#111111',
      home: {
        heroHeadline: 'Less noise. More product.',
        heroSubtext: 'ပစ္စည်းပုံနဲ့ အရေးကြီးတဲ့အချက်အလက်တွေကိုပဲ ထင်းထင်းရှင်းရှင်း ပြပါ။',
        featuredTitle: 'Featured',
        featuredSubtitle: 'Curated essentials from the store.',
      },
    },
    {
      label: 'Clean & Minimal',
      shortLabel: 'Minimal',
      description: 'အဖြူ/အနက်၊ whitespace များများ၊ product-first editorial storefront.',
      bestFor: 'Brand တိုင်းအတွက် — ရိုးရှင်းပြီး premium ဖြစ်ချင်တဲ့ဆိုင်',
      visual: {
        layout: 'editorial',
        canvas: '#ffffff',
        surface: '#ffffff',
        text: '#111111',
        muted: '#6b7280',
        border: '#e5e7eb',
        accent: '#111111',
        accentText: '#ffffff',
        radius: 'none',
        productGrid: 'editorial-2',
        hero: 'split',
      },
    },
  ),
  'street-bold': preset(
    'street-bold',
    {
      fontPairing: 'minimal',
      accentColor: '#ff4d00',
      announcement: {enabled: true, text: 'DROP LIVE — SHOP NOW'},
      home: {
        heroHeadline: 'MAKE IT LOUD.',
        heroSubtext: 'High contrast, oversized type, bold promo energy.',
        featuredTitle: 'LATEST DROP',
        featuredSubtitle: 'Fresh pieces. Limited attention span.',
      },
    },
    {
      label: 'Street & Bold',
      shortLabel: 'Bold',
      description: 'High contrast၊ oversized type၊ poster-style composition နဲ့ aggressive CTA.',
      bestFor: 'ထင်းလင်းချင်တဲ့ brand တိုင်း — youth, sport, creator-led stores',
      visual: {
        layout: 'poster',
        canvas: '#f2ff00',
        surface: '#111111',
        text: '#111111',
        muted: '#3f3f46',
        border: '#111111',
        accent: '#ff4d00',
        accentText: '#ffffff',
        radius: 'none',
        productGrid: 'bold-2',
        hero: 'poster',
      },
    },
  ),
  'soft-elegant': preset(
    'soft-elegant',
    {
      fontPairing: 'boutique',
      accentColor: '#b56b7a',
      home: {
        heroHeadline: 'Thoughtfully chosen, beautifully presented.',
        heroSubtext: 'နူးညံ့တဲ့ pastel tone နဲ့ premium boutique feeling ကို အဓိကထားတဲ့ storefront.',
        featuredTitle: 'Our Edit',
        featuredSubtitle: 'A softer way to discover what you love.',
      },
    },
    {
      label: 'Soft & Elegant',
      shortLabel: 'Elegant',
      description: 'Pastel palette၊ rounded surfaces၊ centered boutique composition.',
      bestFor: 'နူးညံ့ပြီး refined ဖြစ်ချင်တဲ့ brand တိုင်း',
      visual: {
        layout: 'boutique',
        canvas: '#f8f1ec',
        surface: '#fffaf7',
        text: '#4a3337',
        muted: '#8a7378',
        border: '#eadbd5',
        accent: '#b56b7a',
        accentText: '#ffffff',
        radius: 'rounded',
        productGrid: 'boutique-2',
        hero: 'centered',
      },
    },
  ),
  'grid-catalog': preset(
    'grid-catalog',
    {
      fontPairing: 'minimal',
      accentColor: '#0f6fff',
      home: {
        heroHeadline: 'ရှာမယ်။ နှိုင်းမယ်။ မြန်မြန်ရွေးမယ်။',
        heroSubtext: 'SKU များများကို screen တစ်ခုတည်းမှာ အမြန် browse လုပ်ဖို့ optimize လုပ်ထားတယ်။',
        featuredTitle: 'ပစ္စည်းအားလုံး',
        featuredSubtitle: 'အများကြီးကို မြန်မြန်ကြည့်၊ filter လုပ်၊ ရွေးချယ်ပါ။',
      },
    },
    {
      label: 'Grid & Catalog',
      shortLabel: 'Catalog',
      description: 'Dense grid၊ utility controls၊ quick scanning အတွက် marketplace-inspired layout.',
      bestFor: 'SKU များတဲ့ဆိုင်တိုင်း — general retail, catalog-heavy stores',
      visual: {
        layout: 'catalog',
        canvas: '#f5f7fb',
        surface: '#ffffff',
        text: '#111827',
        muted: '#667085',
        border: '#dbe2ea',
        accent: '#0f6fff',
        accentText: '#ffffff',
        radius: 'compact',
        productGrid: 'dense-3',
        hero: 'utility',
      },
    },
  ),
  'dark-modern': preset(
    'dark-modern',
    {
      fontPairing: 'minimal',
      accentColor: '#73fbd3',
      announcement: {enabled: true, text: 'NEW RELEASES AVAILABLE'},
      home: {
        heroHeadline: 'Built for the next scroll.',
        heroSubtext: 'Dark surfaces, luminous accents and a tech-forward product experience.',
        featuredTitle: 'Featured Systems',
        featuredSubtitle: 'Modern picks with a high-contrast presentation.',
      },
    },
    {
      label: 'Dark Modern',
      shortLabel: 'Dark',
      description: 'Full dark UI၊ neon accent၊ glass panels နဲ့ futuristic layout language.',
      bestFor: 'Modern / premium / tech-forward ဖြစ်ချင်တဲ့ brand တိုင်း',
      visual: {
        layout: 'tech',
        canvas: '#09090b',
        surface: '#151518',
        text: '#f8fafc',
        muted: '#a1a1aa',
        border: '#2a2a30',
        accent: '#73fbd3',
        accentText: '#08110e',
        radius: 'soft',
        productGrid: 'tech-2',
        hero: 'glass',
      },
    },
  ),
};

const LEGACY_PRESET_MAP: Record<string, ThemePresetId> = {
  minimal: 'clean-minimal',
  fashion: 'soft-elegant',
  'dark-luxury': 'dark-modern',
  'fresh-market': 'grid-catalog',
  'modern-shop': 'street-bold',
};

export function resolveThemePresetId(value: unknown): ThemePresetId | null {
  if (typeof value !== 'string') return null;
  if (Object.prototype.hasOwnProperty.call(THEME_PRESETS, value)) return value as ThemePresetId;
  return LEGACY_PRESET_MAP[value] ?? null;
}

export function isThemePresetId(value: unknown): value is ThemePresetId {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(THEME_PRESETS, value);
}

export function getThemePreset(id: ThemePresetId): ThemePresetDefinition {
  return THEME_PRESETS[id];
}

export function getThemeVisual(theme: Pick<StorefrontTheme, 'presetId' | 'accentColor'>): ThemeVisualProfile {
  const base = THEME_PRESETS[theme.presetId].visual;
  return {...base, accent: theme.accentColor};
}

export function themeFromPreset(id: ThemePresetId, current?: StorefrontTheme): StorefrontTheme {
  const presetTheme = THEME_PRESETS[id].theme;
  return {
    ...presetTheme,
    home: {
      ...presetTheme.home,
      heroImageUrl: current?.home.heroImageUrl ?? presetTheme.home.heroImageUrl,
    },
  };
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function bool(v: unknown, fallback: boolean): boolean {
  return typeof v === 'boolean' ? v : fallback;
}

function text(v: unknown, fallback: string, max: number, allowEmpty: boolean): string {
  if (typeof v !== 'string') return fallback;
  const trimmed = v.trim().slice(0, max);
  if (!trimmed && !allowEmpty) return fallback;
  return trimmed;
}

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
function hexColor(v: unknown, fallback: HexColor): HexColor {
  return typeof v === 'string' && HEX_COLOR.test(v.trim()) ? v.trim().toLowerCase() : fallback;
}

function imageUrl(v: unknown, fallback: string | null): string | null {
  if (v === null) return null;
  if (typeof v !== 'string') return fallback;
  const trimmed = v.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')) return trimmed.slice(0, 2048);
  return fallback;
}

export function normalizeTheme(raw: unknown): StorefrontTheme {
  if (!isObject(raw)) return DEFAULT_THEME;
  const d = DEFAULT_THEME;
  const announcement = isObject(raw.announcement) ? raw.announcement : {};
  const home = isObject(raw.home) ? raw.home : {};
  const category = isObject(raw.category) ? raw.category : {};
  const product = isObject(raw.product) ? raw.product : {};
  const presetId = resolveThemePresetId(raw.presetId) ?? d.presetId;
  return {
    presetId,
    fontPairing: isFontPairingId(raw.fontPairing) ? raw.fontPairing : d.fontPairing,
    accentColor: hexColor(raw.accentColor, THEME_PRESETS[presetId].theme.accentColor),
    announcement: {
      enabled: bool(announcement.enabled, d.announcement.enabled),
      text: text(announcement.text, d.announcement.text, 200, true),
    },
    home: {
      heroEnabled: bool(home.heroEnabled, d.home.heroEnabled),
      heroHeadline: text(home.heroHeadline, d.home.heroHeadline, 120, true),
      heroSubtext: text(home.heroSubtext, d.home.heroSubtext, 300, true),
      heroCtaLabel: text(home.heroCtaLabel, d.home.heroCtaLabel, 40, false),
      heroImageUrl: imageUrl(home.heroImageUrl, d.home.heroImageUrl),
      categoriesEnabled: bool(home.categoriesEnabled, d.home.categoriesEnabled),
      featuredTitle: text(home.featuredTitle, d.home.featuredTitle, 80, true),
      featuredSubtitle: text(home.featuredSubtitle, d.home.featuredSubtitle, 160, true),
    },
    category: {
      heading: text(category.heading, d.category.heading, 60, false),
      searchEnabled: bool(category.searchEnabled, d.category.searchEnabled),
    },
    product: {
      relatedEnabled: bool(product.relatedEnabled, d.product.relatedEnabled),
      addToCartLabel: text(product.addToCartLabel, d.product.addToCartLabel, 40, false),
      buyNowLabel: text(product.buyNowLabel, d.product.buyNowLabel, 40, false),
    },
  };
}
