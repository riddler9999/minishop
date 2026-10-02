import type {ReactNode} from 'react';
import type {Product} from '@/domain/product';
import type {ProductSource, StoreSection} from '@/domain/storeDesign';
import {ProductSourceInspector} from './ProductSourceInspector';
import {SECTION_LABELS} from './sectionCopy';

type Props = {section: StoreSection | null; products: Product[]; categories: string[]; blocked: boolean; onChange: (section: StoreSection) => void};
type FieldProps = {label: string; value: string; disabled: boolean; multiline?: boolean; onChange: (value: string) => void};
type ProductSection = Extract<StoreSection, {type: 'featured-products' | 'best-selling' | 'product-collection' | 'new-arrivals' | 'sale-products' | 'related-products'}>;

function TextField({label, value, disabled, multiline, onChange}: FieldProps) {
  const className = 'mt-1 min-h-11 w-full rounded-lg border border-[#E1E7E3] bg-white px-3 py-2 text-sm text-[#1F2421] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35B99D]';
  return (
    <label className="block text-sm font-medium leading-6 text-[#1F2421]">
      {label}
      {multiline
        ? <textarea aria-label={label} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className={className} rows={4} />
        : <input aria-label={label} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className={className} />}
    </label>
  );
}

function Group({title, children}: {title: string; children: ReactNode}) {
  return <section aria-labelledby={`inspector-${title.toLowerCase().replace(/ /g, '-')}`} className="space-y-3 border-b border-[#E1E7E3] pb-4"><h3 id={`inspector-${title.toLowerCase().replace(/ /g, '-')}`} className="text-sm font-bold text-[#1F2421]">{title}</h3>{children}</section>;
}

export function Inspector({section, products, categories, blocked, onChange}: Props) {
  if (!section) return <p className="text-sm leading-6 text-[#66706C]">Select a section from Pages &amp; Sections or the preview.</p>;
  const field = (label: string, value: string, change: (value: string) => void, multiline = false) => (
    <TextField key={label} label={label} value={value} disabled={blocked} multiline={multiline} onChange={change} />
  );

  let content: ReactNode;
  let layout: ReactNode = <p className="text-sm leading-6 text-[#66706C]">This section uses its default layout.</p>;
  let productSection: ProductSection | null = null;

  switch (section.type) {
    case 'hero':
      content = <>{field('Headline', section.settings.headline, (headline) => onChange({...section, settings: {...section.settings, headline}}))}{field('Subtext', section.settings.subtext, (subtext) => onChange({...section, settings: {...section.settings, subtext}}), true)}</>;
      break;
    case 'categories':
      content = field('Title', section.settings.title, (title) => onChange({...section, settings: {title}}));
      break;
    case 'featured-products':
    case 'best-selling':
    case 'product-collection':
    case 'new-arrivals':
    case 'sale-products':
    case 'related-products':
      content = field('Title', section.settings.title, (title) => onChange({...section, settings: {...section.settings, title}}));
      productSection = section;
      break;
    case 'promotion-banner':
      content = <>{field('Headline', section.settings.headline, (headline) => onChange({...section, settings: {...section.settings, headline}}))}{field('Body', section.settings.body, (body) => onChange({...section, settings: {...section.settings, body}}), true)}</>;
      break;
    case 'image-text':
      content = <>{field('Headline', section.settings.headline, (headline) => onChange({...section, settings: {...section.settings, headline}}))}{field('Body', section.settings.body, (body) => onChange({...section, settings: {...section.settings, body}}), true)}</>;
      break;
    case 'announcement':
      content = field('Text', section.settings.text, (text) => onChange({...section, settings: {text}}));
      break;
    case 'rich-text':
      content = field('Text', section.settings.text, (text) => onChange({...section, settings: {text}}), true);
      break;
    case 'spacer':
      content = <p className="text-sm leading-6 text-[#66706C]">Spacer content is controlled by the section preset.</p>;
      layout = <label className="block text-sm font-medium leading-6 text-[#1F2421]">Size<select aria-label="Size" value={section.settings.size} disabled={blocked} onChange={(event) => onChange({...section, settings: {size: event.target.value as 'sm' | 'md' | 'lg'}})} className="mt-1 min-h-11 w-full rounded-lg border border-[#E1E7E3] bg-white px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35B99D]"><option value="sm">Small</option><option value="md">Medium</option><option value="lg">Large</option></select></label>;
      break;
    case 'product-gallery':
      content = <p className="text-sm leading-6 text-[#66706C]">Gallery content is provided by the selected products.</p>;
      layout = <label className="block text-sm font-medium leading-6 text-[#1F2421]">Layout<select aria-label="Layout" value={section.settings.layout} disabled={blocked} onChange={(event) => onChange({...section, settings: {layout: event.target.value as 'stacked' | 'carousel'}})} className="mt-1 min-h-11 w-full rounded-lg border border-[#E1E7E3] bg-white px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35B99D]"><option value="carousel">Carousel</option><option value="stacked">Stacked</option></select></label>;
      break;
    case 'product-info':
      content = <p data-protected-commerce-action="buy-now" className="rounded-lg bg-[#D8F1EA] p-3 text-sm leading-6 text-[#1F2421]">Product title, price, and the Buy Now action are always enabled and cannot be removed.</p>;
      break;
    case 'product-description':
      content = field('Heading', section.settings.heading, (heading) => onChange({...section, settings: {heading}}));
      break;
  }

  return (
    <div className="space-y-4">
      <div><p className="text-xs font-semibold uppercase tracking-wide text-[#66706C]">Selected section</p><h2 className="mt-1 text-base font-bold text-[#1F2421]">{SECTION_LABELS[section.type]}</h2></div>
      <Group title="Content">{content}</Group>
      <Group title="Style"><p className="text-sm leading-6 text-[#66706C]">Style follows the selected Store Design theme. Only schema-backed section settings are editable here.</p></Group>
      <Group title="Layout">{layout}</Group>
      {productSection && <Group title="Product Source"><ProductSourceInspector source={productSection.settings.productSource} products={products} categories={categories} blocked={blocked} onChange={(nextSource: ProductSource) => onChange({...productSection, settings: {...productSection.settings, productSource: nextSource}})} /></Group>}
    </div>
  );
}
