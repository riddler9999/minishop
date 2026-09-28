import {useState, type ReactNode} from 'react';
import {ChevronLeft, ChevronRight, ImageOff} from 'lucide-react';
import type {Product} from '@/domain/product';
import type {StoreDesignDocument, StoreSection, StoreTemplateName} from '@/domain/storeDesign';
import {getThemeVisual, type ThemeVisualProfile} from '@/domain/theme';
import {ks} from '@/shared/lib/format';
import {buildStorefrontRenderPlan} from './renderPlan';
import {resolveSectionProductList, type SectionProductsById} from './sectionProducts';
import {heroCopyClass, heroLayoutClass, heroMediaClass, productDetailGridClass} from './layout';

export type StorefrontRendererProps = {
  document: StoreDesignDocument;
  template: StoreTemplateName;
  products?: Product[];
  sectionProductsById?: SectionProductsById;
  categories?: string[];
  product?: Product | null;
  renderProductCard?: (product: Product) => ReactNode;
  renderRequiredCommerce?: (buyNow: StoreDesignDocument['globalSettings']['buyNow']) => ReactNode;
  selectedSectionId?: string | null;
  onSectionSelect?: (sectionId: string) => void;
};

function scrollToProducts() {
  document.querySelector('[data-store-products="true"]')?.scrollIntoView({behavior: 'smooth', block: 'start'});
}

function ProductGallery({product}: {product: Product}) {
  const [active, setActive] = useState(0);
  const images = product.images ?? [];
  const image = images[active];

  if (images.length === 0) {
    return (
      <section className="h-full">
        <div className="commerce-panel grid aspect-[4/5] h-full place-items-center overflow-hidden md:aspect-square">
          <ImageOff className="commerce-muted h-10 w-10" aria-hidden="true" />
        </div>
      </section>
    );
  }

  const previous = () => setActive((index) => (index - 1 + images.length) % images.length);
  const next = () => setActive((index) => (index + 1) % images.length);

  return (
    <section>
      <div className="relative overflow-hidden bg-[var(--commerce-surface-soft)]">
        <div className="aspect-[4/5] md:aspect-square">
          <img src={image} alt={`${product.name} — ပုံ ${active + 1}`} className="h-full w-full object-contain p-3 sm:p-6" />
        </div>
        {images.length > 1 && (
          <>
            <button type="button" onClick={previous} aria-label="ယခင်ပုံ" className="commerce-secondary absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center p-0 sm:left-4">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" onClick={next} aria-label="နောက်ပုံ" className="commerce-secondary absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center p-0 sm:right-4">
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((thumbnail, index) => (
            <button
              key={`${thumbnail}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`ပုံ ${index + 1} ကြည့်ရန်`}
              aria-pressed={active === index}
              className={`h-16 w-16 shrink-0 overflow-hidden border bg-[var(--commerce-surface)] transition sm:h-20 sm:w-20 ${active === index ? 'border-[var(--commerce-accent)]' : 'border-[var(--commerce-border)]'}`}
            >
              <img src={thumbnail} alt="" className="h-full w-full object-contain p-1" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function sectionContent(section: StoreSection, props: StorefrontRendererProps, visual: ThemeVisualProfile): ReactNode {
  switch (section.type) {
    case 'announcement':
      return section.settings.text ? (
        <div className="bg-[var(--commerce-text)] px-4 py-2.5 text-center text-xs font-semibold tracking-wide text-[var(--commerce-surface)] sm:text-sm">
          {section.settings.text}
        </div>
      ) : null;
    case 'hero':
      return (
        <section className={`storefront-bundui-hero mx-auto max-w-[1320px] px-4 py-10 sm:px-8 sm:py-14 lg:py-20 ${heroLayoutClass(visual.hero)}`}>
          <div className={heroCopyClass(visual.hero)}>
            <p className="commerce-kicker mb-3 text-xs font-bold uppercase tracking-[0.18em]">MiniShop Store</p>
            <h1 className="commerce-title text-4xl font-black leading-[1.04] tracking-[-0.045em] sm:text-5xl lg:text-6xl">
              {section.settings.headline}
            </h1>
            {section.settings.subtext && (
              <p className="commerce-muted mt-5 max-w-lg text-sm leading-7 sm:text-base sm:leading-8">{section.settings.subtext}</p>
            )}
            {section.settings.ctaLabel && (
              <button type="button" onClick={scrollToProducts} className="commerce-primary mt-7 inline-flex min-h-12 items-center justify-center px-6 py-3 text-sm font-bold sm:px-7">
                {section.settings.ctaLabel}
              </button>
            )}
          </div>
          <div className={heroMediaClass(visual.hero)}>
            {section.settings.imageUrl ? (
              <img src={section.settings.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 grid place-items-center px-8 text-center">
                <span className="commerce-muted text-sm">Hero image</span>
              </div>
            )}
          </div>
        </section>
      );
    case 'categories':
      return (
        <section className="mx-auto max-w-[1320px] px-4 py-8 sm:px-8 sm:py-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <h2 className="commerce-heading text-xl font-bold sm:text-2xl">{section.settings.title}</h2>
          </div>
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {(props.categories ?? []).map((category) => (
              <span key={category} className="commerce-choice inline-flex min-h-10 shrink-0 items-center px-4 text-sm font-semibold">{category}</span>
            ))}
          </div>
        </section>
      );
    case 'featured-products':
    case 'best-selling':
    case 'product-collection':
    case 'new-arrivals':
    case 'sale-products':
      return (
        <section data-store-products="true" className="mx-auto max-w-[1320px] px-4 py-8 sm:px-8 sm:py-12">
          <h2 className="commerce-heading mb-5 text-xl font-bold sm:text-2xl">{section.settings.title}</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {resolveSectionProductList(section, props.products ?? [], props.sectionProductsById).map((product) => (
              <div key={product.id}>{props.renderProductCard?.(product)}</div>
            ))}
          </div>
        </section>
      );
    case 'promotion-banner':
      return (
        <section className="mx-auto max-w-[1320px] px-4 py-8 sm:px-8">
          <div className="commerce-panel px-5 py-8 text-center sm:px-10 sm:py-12">
            <h2 className="commerce-heading text-2xl font-black sm:text-3xl">{section.settings.headline}</h2>
            {section.settings.body && <p className="commerce-muted mx-auto mt-3 max-w-2xl text-sm leading-7 sm:text-base">{section.settings.body}</p>}
            {section.settings.ctaLabel && <span className="commerce-accent mt-5 inline-block text-sm font-bold">{section.settings.ctaLabel}</span>}
          </div>
        </section>
      );
    case 'image-text':
      return (
        <section className="mx-auto grid max-w-[1320px] items-center gap-7 px-4 py-8 sm:px-8 md:grid-cols-2 md:gap-12">
          {section.settings.imageUrl && <img src={section.settings.imageUrl} alt="" className="aspect-[4/3] h-full w-full object-cover" />}
          <div>
            <h2 className="commerce-heading text-2xl font-black sm:text-3xl">{section.settings.headline}</h2>
            <p className="commerce-muted mt-3 text-sm leading-7 sm:text-base">{section.settings.body}</p>
          </div>
        </section>
      );
    case 'rich-text':
      return section.settings.text ? <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6"><p className="commerce-muted whitespace-pre-line text-sm leading-7 sm:text-base">{section.settings.text}</p></section> : null;
    case 'spacer':
      return <div aria-hidden="true" data-size={section.settings.size} className={section.settings.size === 'sm' ? 'h-4' : section.settings.size === 'lg' ? 'h-16' : 'h-8'} />;
    case 'product-gallery':
      return props.product ? <ProductGallery product={props.product} /> : null;
    case 'product-info': {
      if (!props.product) return null;
      const currentPrice = props.product.isPromotion && props.product.promoPrice != null ? props.product.promoPrice : props.product.price;
      return (
        <section className="product-info-panel">
          {props.product.category && <p className="commerce-kicker text-xs font-bold uppercase tracking-[0.15em]">{props.product.category}</p>}
          <h1 className="commerce-title mt-2 text-3xl font-black leading-tight tracking-[-0.035em] sm:text-4xl">{props.product.name}</h1>
          {section.settings.showPrice && (
            <div className="mt-4 flex flex-wrap items-baseline gap-3">
              <p className="commerce-price text-2xl font-black sm:text-3xl">{ks(currentPrice)}</p>
              {props.product.isPromotion && props.product.promoPrice != null && (
                <p className="commerce-muted text-sm line-through">{ks(props.product.price)}</p>
              )}
            </div>
          )}
          <p className={`mt-3 text-sm font-semibold ${props.product.inStock ? 'text-emerald-600' : 'text-rose-600'}`}>
            {props.product.inStock ? 'လက်ကျန်ရှိ' : 'လက်ကျန်မရှိ'}
          </p>
        </section>
      );
    }
    case 'product-description':
      return props.product?.description ? (
        <section className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6 sm:py-9">
          <div className="commerce-divider border-t pt-7">
            <h2 className="commerce-heading text-lg font-bold">{section.settings.heading}</h2>
            <p className="commerce-muted mt-3 whitespace-pre-line text-sm leading-7 sm:max-w-3xl sm:text-base sm:leading-8">{props.product.description}</p>
          </div>
        </section>
      ) : null;
    case 'related-products':
      return (
        <section data-store-products="true" className="mx-auto max-w-[1320px] px-4 py-9 sm:px-8 sm:py-12">
          <h2 className="commerce-heading mb-5 text-xl font-bold sm:text-2xl">{section.settings.title}</h2>
          <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:px-0 lg:grid-cols-4">
            {resolveSectionProductList(section, props.products ?? [], props.sectionProductsById).map((product) => (
              <div key={product.id} className="w-[72vw] max-w-[280px] shrink-0 snap-start sm:w-auto sm:max-w-none">{props.renderProductCard?.(product)}</div>
            ))}
          </div>
        </section>
      );
  }
}

function sectionFrame(section: StoreSection, props: StorefrontRendererProps, content: ReactNode) {
  return (
    <div
      key={section.id}
      data-store-section-id={section.id}
      data-selected={props.selectedSectionId === section.id || undefined}
      role={props.onSectionSelect ? 'button' : undefined}
      tabIndex={props.onSectionSelect ? 0 : undefined}
      aria-label={props.onSectionSelect ? `${section.type} ကဏ္ဍကို ရွေးမည်` : undefined}
      onClick={props.onSectionSelect ? () => props.onSectionSelect?.(section.id) : undefined}
      onKeyDown={props.onSectionSelect ? (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          props.onSectionSelect?.(section.id);
        }
      } : undefined}
      className={props.selectedSectionId === section.id ? 'outline outline-2 outline-offset-2 outline-brand-500' : undefined}
    >
      {content}
    </div>
  );
}

function ProductTemplate({props, sections, visual, buyNow}: {props: StorefrontRendererProps; sections: StoreSection[]; visual: ThemeVisualProfile; buyNow: StoreDesignDocument['globalSettings']['buyNow']}) {
  const gallery = sections.find((section) => section.type === 'product-gallery');
  const info = sections.find((section) => section.type === 'product-info');
  const primaryIds = new Set([gallery?.id, info?.id].filter((id): id is string => Boolean(id)));
  const remaining = sections.filter((section) => !primaryIds.has(section.id));

  return (
    <>
      {(gallery || info) && (
        <div className={`product-detail-shell mx-auto grid max-w-[1180px] gap-8 px-4 pb-8 pt-6 sm:px-6 sm:pt-10 ${productDetailGridClass(visual.layout)}`}>
          <div>
            {gallery ? sectionFrame(gallery, props, sectionContent(gallery, props, visual)) : null}
          </div>
          <div className="self-start md:sticky md:top-24">
            {info ? sectionFrame(info, props, sectionContent(info, props, visual)) : null}
            {props.renderRequiredCommerce && (
              <div className="mt-6">
                {props.renderRequiredCommerce(buyNow)}
              </div>
            )}
          </div>
        </div>
      )}
      {remaining.map((section) => sectionFrame(section, props, sectionContent(section, props, visual)))}
    </>
  );
}

export function StorefrontRenderer(props: StorefrontRendererProps) {
  const plan = buildStorefrontRenderPlan(props.document, props.template);
  const visual = getThemeVisual({presetId: plan.themeId, accentColor: plan.accentColor});

  return (
    <div
      data-store-theme={plan.themeId}
      style={{backgroundColor: visual.canvas, color: visual.text}}
      className="min-h-full"
    >
      {props.template === 'product'
        ? <ProductTemplate props={props} sections={plan.sections} visual={visual} buyNow={plan.requiredCommerce.buyNow} />
        : plan.sections.map((section) => sectionFrame(section, props, sectionContent(section, props, visual)))}
    </div>
  );
}
