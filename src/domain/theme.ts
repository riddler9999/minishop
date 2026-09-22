// ---- DOMAIN: storefront theme (Store Design) --------------------------------
// The seller-editable customization blob for the buyer storefront — copy,
// section toggles, a hero image and an accent colour for the Homepage, Category
// page and Product page. Purely COSMETIC: it decides what the storefront
// renders, never what the backend allows (RLS + the 0007 triggers remain the
// security boundary). Stored as `shops.theme` (jsonb, migration 0009).
//
// This is a pure leaf module (no React, no I/O, no other layer), mirroring the
// fail-safe philosophy of `plan.ts` and `orderStatus.ts`: `normalizeTheme()`
// takes an untrusted value of ANY shape (a raw jsonb blob, `null`, a partial
// object written by an older app version, or garbage) and always returns a
// complete, valid `StorefrontTheme`. A missing/unknown/malformed field falls
// back to its default, so the storefront can never render a broken page — and
// so a shop with no theme (or before migration 0009 is applied) simply shows
// the original hardcoded copy.

import {type FontPairingId, DEFAULT_FONT_PAIRING, isFontPairingId} from './fontPairing.ts';

/** A hex colour string, e.g. `#e11d48`. */
export type HexColor = string;

export interface AnnouncementTheme {
  /** Show the announcement bar across every storefront page. */
  enabled: boolean;
  /** The bar's text (empty ⇒ bar is hidden even when `enabled`). */
  text: string;
}

export interface HomeTheme {
  /** Render the hero band at the top of the Homepage. */
  heroEnabled: boolean;
  heroHeadline: string;
  heroSubtext: string;
  /** Label of the hero's call-to-action button. */
  heroCtaLabel: string;
  /**
   * A custom hero image URL (else the first product image is used). Stored as
   * the raw Supabase public URL; the storefront rewrites it to the first-party
   * `/api/storefront/shop-logos/…` proxy path at read time (see shopResolver).
   */
  heroImageUrl: string | null;
  /** Render the horizontal category rail below the hero. */
  categoriesEnabled: boolean;
  featuredTitle: string;
  featuredSubtitle: string;
}

export interface CategoryTheme {
  heading: string;
  /** Show the search box on the Category (products) page. */
  searchEnabled: boolean;
}

export interface ProductTheme {
  /** Show the "related products" rail on the Product detail page. */
  relatedEnabled: boolean;
  addToCartLabel: string;
  buyNowLabel: string;
}

export interface StorefrontTheme {
  /** Latin display/body font pairing for storefront headings and copy (see `domain/fontPairing`). */
  fontPairing: FontPairingId;
  /** Accent colour for the Homepage hero + its call-to-action buttons. */
  accentColor: HexColor;
  announcement: AnnouncementTheme;
  home: HomeTheme;
  category: CategoryTheme;
  product: ProductTheme;
}

// Defaults deliberately mirror the storefront's ORIGINAL hardcoded copy, so a
// shop that has never opened Store Design (theme = {}) looks exactly as before.
// `fontPairing` is the one exception: it follows the app-wide typography
// baseline (see PROJECT.md D54), the same way an unopened shop already
// inherits the app's global color/spacing tokens rather than some frozen
// snapshot — a seller who wants the original system-font look picks `minimal`.
export const DEFAULT_THEME: StorefrontTheme = {
  fontPairing: DEFAULT_FONT_PAIRING,
  accentColor: '#e11d48',
  announcement: {
    enabled: false,
    text: '',
  },
  home: {
    heroEnabled: true,
    heroHeadline: 'ကိုယ်နှစ်သက်မယ့် ဖက်ရှင်ကို ရှာဖွေလိုက်ပါ။',
    heroSubtext:
      'ဒီဆိုင်ရဲ့ နောက်ဆုံးရောက် ဖက်ရှင်ပစ္စည်းတွေကို တစ်နေရာတည်းမှာ လွယ်လွယ်ကူကူ ကြည့်နိုင်ပါတယ်။',
    heroCtaLabel: 'ပစ္စည်းများကြည့်ရန်',
    heroImageUrl: null,
    categoriesEnabled: true,
    featuredTitle: 'အသစ်ရောက် ပစ္စည်းများ',
    featuredSubtitle: 'ဆိုင်မှာ လက်ရှိရရှိနိုင်တဲ့ နောက်ဆုံးပေါ်ပစ္စည်းများ။',
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

// ---- field validators (each falls back to `fallback` on any bad input) -------

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function bool(v: unknown, fallback: boolean): boolean {
  return typeof v === 'boolean' ? v : fallback;
}

/**
 * A free-text field. `allowEmpty` decides whether a seller may blank it out
 * (headlines/subtexts ⇒ true, so clearing hides the copy) or whether an empty
 * value snaps back to the default (button labels/headings ⇒ false, so a button
 * is never label-less). Length is clamped so a pathological value can't blow up
 * the layout.
 */
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
  // Only accept same-origin (/api/…, /storage/…) or http(s) URLs — never a
  // javascript:/data: string that could smuggle a payload into an <img src>.
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')) return trimmed.slice(0, 2048);
  return fallback;
}

/**
 * Coerce any untrusted value into a complete, valid `StorefrontTheme`. Never
 * throws; unknown keys are ignored and every missing/invalid field falls back
 * to `DEFAULT_THEME`.
 */
export function normalizeTheme(raw: unknown): StorefrontTheme {
  if (!isObject(raw)) return DEFAULT_THEME;
  const d = DEFAULT_THEME;
  const announcement = isObject(raw.announcement) ? raw.announcement : {};
  const home = isObject(raw.home) ? raw.home : {};
  const category = isObject(raw.category) ? raw.category : {};
  const product = isObject(raw.product) ? raw.product : {};
  return {
    fontPairing: isFontPairingId(raw.fontPairing) ? raw.fontPairing : d.fontPairing,
    accentColor: hexColor(raw.accentColor, d.accentColor),
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
