// ---- SHOP: legacy Store Design preview compatibility -------------------------
// Home / collection / product rendering is delegated to the catalog-owned shared
// renderer. Checkout remains a small compatibility preview because checkout is
// outside the Store Design document templates.

import type {Product} from '@/domain/product';
import {createDefaultStoreDesign, type StoreDesignDocument, type StoreSection} from '@/domain/storeDesign';
import {getThemeVisual, type StorefrontTheme} from '@/domain/theme';
import {StorefrontRenderer} from '@/features/catalog/storeDesign/StorefrontRenderer';
import {ks} from '@/shared/lib/format';

export type PreviewPage = 'home' | 'category' | 'product' | 'checkout';

interface PreviewProps {
  theme: StorefrontTheme;
  page: PreviewPage;
  products: Product[];
  categories: string[];
  shopName: string;
  logoUrl: string | null;
}

function withSection(
  document: StoreDesignDocument,
  template: 'home' | 'collection' | 'product',
  type: StoreSection['type'],
  update: (section: StoreSection) => StoreSection,
) {
  document.templates[template].sections = document.templates[template].sections.map((section) =>
    section.type === type ? update(section) : section,
  );
}

function legacyThemeToStoreDesign(theme: StorefrontTheme): StoreDesignDocument {
  const document = createDefaultStoreDesign(theme.presetId);
  document.globalSettings.accentColor = theme.accentColor;
  document.globalSettings.fontPairing = theme.fontPairing;
  document.globalSettings.buyNow.label = theme.product.buyNowLabel;

  withSection(document, 'home', 'announcement', (section) => ({
    ...section,
    enabled: theme.announcement.enabled,
    settings: {...section.settings, text: theme.announcement.text},
  } as StoreSection));
  withSection(document, 'home', 'hero', (section) => ({
    ...section,
    enabled: theme.home.heroEnabled,
    settings: {
      ...section.settings,
      headline: theme.home.heroHeadline,
      subtext: theme.home.heroSubtext,
      ctaLabel: theme.home.heroCtaLabel,
      imageUrl: theme.home.heroImageUrl,
    },
  } as StoreSection));
  withSection(document, 'home', 'categories', (section) => ({
    ...section,
    enabled: theme.home.categoriesEnabled,
  } as StoreSection));
  withSection(document, 'home', 'featured-products', (section) => ({
    ...section,
    settings: {...section.settings, title: theme.home.featuredTitle},
  } as StoreSection));
  withSection(document, 'collection', 'product-collection', (section) => ({
    ...section,
    settings: {...section.settings, title: theme.category.heading},
  } as StoreSection));
  withSection(document, 'product', 'related-products', (section) => ({
    ...section,
    enabled: theme.product.relatedEnabled,
  } as StoreSection));

  return document;
}

function CheckoutPreview({theme, products}: Pick<PreviewProps, 'theme' | 'products'>) {
  const visual = getThemeVisual(theme);
  const first = products[0];
  return (
    <div className="space-y-2.5 px-3 py-3" style={{backgroundColor: visual.canvas, color: visual.text}}>
      <p className="text-[14px] font-bold">Order တင်မယ်</p>
      <div className="rounded-lg border p-2.5" style={{backgroundColor: visual.surface, borderColor: visual.border}}>
        <p className="text-[9px] font-bold">လက်ခံမည့်သူအမည်</p>
        <p className="mt-2 text-[8px]" style={{color: visual.muted}}>လိပ်စာ</p>
      </div>
      <div className="rounded-lg border p-2.5" style={{backgroundColor: visual.surface, borderColor: visual.border}}>
        <p className="text-[9px] font-bold">အော်ဒါ အကျဉ်း</p>
        <div className="mt-2 flex justify-between text-[8px]">
          <span>{first?.name ?? 'ပစ္စည်းအမည်'}</span>
          <b>{ks(first?.price ?? 0)}</b>
        </div>
      </div>
    </div>
  );
}

export default function StorePreview({theme, page, products, categories}: PreviewProps) {
  if (page === 'checkout') return <CheckoutPreview theme={theme} products={products} />;

  const document = legacyThemeToStoreDesign(theme);
  const template = page === 'category' ? 'collection' : page;
  return (
    <div className="mx-auto w-full max-w-[360px] overflow-hidden rounded-[28px] border-[6px] border-slate-900 shadow-xl">
      <StorefrontRenderer
        document={document}
        template={template}
        products={products}
        categories={categories}
        product={page === 'product' ? products[0] ?? null : null}
        renderProductCard={(product) => (
          <div className="p-2 text-xs">
            <p className="font-semibold">{product.name}</p>
            <p>{ks(product.isPromotion && product.promoPrice ? product.promoPrice : product.price)}</p>
          </div>
        )}
        renderRequiredCommerce={(buyNow) => (
          <button type="button" className="m-3 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white">
            {buyNow.label}
          </button>
        )}
      />
    </div>
  );
}
