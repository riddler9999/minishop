import {useState, type ReactNode} from 'react';
import {Image, Upload, Trash2} from 'lucide-react';
import type {Product} from '@/domain/product';
import type {ProductSource, StoreSection} from '@/domain/storeDesign';
import {ProductSourceInspector} from './ProductSourceInspector';
import {SECTION_LABELS} from './sectionCopy';
import {adminApi} from '@/data/dataSource';

type Props = {section: StoreSection | null; products: Product[]; categories: string[]; blocked: boolean; onChange: (section: StoreSection) => void};
type FieldProps = {label: string; value: string; disabled: boolean; multiline?: boolean; onChange: (value: string) => void};
type ProductSection = Extract<StoreSection, {type: 'featured-products' | 'best-selling' | 'product-collection' | 'new-arrivals' | 'sale-products' | 'related-products'}>;

function MediaUploadControl({
  label,
  imageUrl,
  disabled,
  onChange,
}: {
  label: string;
  imageUrl: string | null;
  disabled: boolean;
  onChange: (url: string | null) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const media = await adminApi.uploadStoreMedia(file);
      onChange(media.url ?? media.storagePath);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to upload media');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[var(--admin-text)]">{label}</label>
      {imageUrl ? (
        <div className="relative rounded-lg border border-[var(--admin-border)] p-2 bg-[var(--admin-surface-muted)]">
          <img src={imageUrl} alt="Section media" className="h-28 w-full object-cover rounded" />
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="truncate text-xs text-[var(--admin-muted)]">{imageUrl}</span>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange(null)}
              className="flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 focus-visible:outline-none">
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border-2 border-dashed border-[var(--admin-border)] p-4 text-center hover:border-[var(--admin-primary)]">
          <Image className="mx-auto h-6 w-6 text-[var(--admin-muted)]" />
          <p className="mt-1 text-xs text-[var(--admin-muted)]">No image selected</p>
          <label className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[var(--admin-primary)] px-3 py-1.5 text-xs font-bold text-[var(--admin-text)] cursor-pointer hover:bg-[var(--admin-primary-hover)]">
            <Upload className="h-3.5 w-3.5" />
            {uploading ? 'Uploading...' : 'Upload Image'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={disabled || uploading}
              onChange={handleFileSelect}
              className="sr-only"
            />
          </label>
        </div>
      )}
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

function TextField({label, value, disabled, multiline, onChange}: FieldProps) {
  const className = 'mt-1 min-h-11 w-full rounded-lg border border-[var(--admin-border)] bg-white px-3 py-2 text-sm text-[var(--admin-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-focus)]';
  return (
    <label className="block text-sm font-medium leading-6 text-[var(--admin-text)]">
      {label}
      {multiline
        ? <textarea aria-label={label} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className={className} rows={4} />
        : <input aria-label={label} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className={className} />}
    </label>
  );
}

function Group({title, children}: {title: string; children: ReactNode}) {
  return <section aria-labelledby={`inspector-${title.toLowerCase().replace(/ /g, '-')}`} className="space-y-3 border-b border-[var(--admin-border)] pb-4"><h3 id={`inspector-${title.toLowerCase().replace(/ /g, '-')}`} className="text-sm font-bold text-[var(--admin-text)]">{title}</h3>{children}</section>;
}

export function Inspector({section, products, categories, blocked, onChange}: Props) {
  if (!section) return <p className="text-sm leading-6 text-[var(--admin-muted)]">Select a section from Pages &amp; Sections or the preview.</p>;
  const field = (label: string, value: string, change: (value: string) => void, multiline = false) => (
    <TextField key={label} label={label} value={value} disabled={blocked} multiline={multiline} onChange={change} />
  );

  let content: ReactNode;
  let layout: ReactNode = <p className="text-sm leading-6 text-[var(--admin-muted)]">This section uses its default layout.</p>;
  let productSection: ProductSection | null = null;

  switch (section.type) {
    case 'hero':
      content = (
        <div className="space-y-3">
          {field('Headline', section.settings.headline, (headline) => onChange({...section, settings: {...section.settings, headline}}))}
          {field('Subtext', section.settings.subtext, (subtext) => onChange({...section, settings: {...section.settings, subtext}}), true)}
          <MediaUploadControl
            label="Hero Image"
            imageUrl={section.settings.imageUrl}
            disabled={blocked}
            onChange={(url) => onChange({...section, settings: {...section.settings, imageUrl: url}})}
          />
        </div>
      );
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
      content = (
        <div className="space-y-3">
          {field('Headline', section.settings.headline, (headline) => onChange({...section, settings: {...section.settings, headline}}))}
          {field('Body', section.settings.body, (body) => onChange({...section, settings: {...section.settings, body}}), true)}
          <MediaUploadControl
            label="Section Image"
            imageUrl={section.settings.imageUrl}
            disabled={blocked}
            onChange={(url) => onChange({...section, settings: {...section.settings, imageUrl: url}})}
          />
        </div>
      );
      break;
    case 'announcement':
      content = field('Text', section.settings.text, (text) => onChange({...section, settings: {text}}));
      break;
    case 'rich-text':
      content = field('Text', section.settings.text, (text) => onChange({...section, settings: {text}}), true);
      break;
    case 'spacer':
      content = <p className="text-sm leading-6 text-[var(--admin-muted)]">Spacer content is controlled by the section preset.</p>;
      layout = <label className="block text-sm font-medium leading-6 text-[var(--admin-text)]">Size<select aria-label="Size" value={section.settings.size} disabled={blocked} onChange={(event) => onChange({...section, settings: {size: event.target.value as 'sm' | 'md' | 'lg'}})} className="mt-1 min-h-11 w-full rounded-lg border border-[var(--admin-border)] bg-white px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-focus)]"><option value="sm">Small</option><option value="md">Medium</option><option value="lg">Large</option></select></label>;
      break;
    case 'product-gallery':
      content = <p className="text-sm leading-6 text-[var(--admin-muted)]">Gallery content is provided by the selected products.</p>;
      layout = <label className="block text-sm font-medium leading-6 text-[var(--admin-text)]">Layout<select aria-label="Layout" value={section.settings.layout} disabled={blocked} onChange={(event) => onChange({...section, settings: {layout: event.target.value as 'stacked' | 'carousel'}})} className="mt-1 min-h-11 w-full rounded-lg border border-[var(--admin-border)] bg-white px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-focus)]"><option value="carousel">Carousel</option><option value="stacked">Stacked</option></select></label>;
      break;
    case 'product-info':
      content = <p data-protected-commerce-action="buy-now" className="rounded-lg bg-[var(--admin-primary-soft)] p-3 text-sm leading-6 text-[var(--admin-text)]">Product title, price, and the Buy Now action are always enabled and cannot be removed.</p>;
      break;
    case 'product-description':
      content = field('Heading', section.settings.heading, (heading) => onChange({...section, settings: {heading}}));
      break;
  }

  return (
    <div className="space-y-4">
      <div><p className="text-xs font-semibold uppercase tracking-wide text-[var(--admin-muted)]">Selected section</p><h2 className="mt-1 text-base font-bold text-[var(--admin-text)]">{SECTION_LABELS[section.type]}</h2></div>
      <Group title="Content">{content}</Group>
      <Group title="Style"><p className="text-sm leading-6 text-[var(--admin-muted)]">Style follows the selected Store Design theme. Only schema-backed section settings are editable here.</p></Group>
      <Group title="Layout">{layout}</Group>
      {productSection && <Group title="Product Source"><ProductSourceInspector source={productSection.settings.productSource} products={products} categories={categories} blocked={blocked} onChange={(nextSource: ProductSource) => onChange({...productSection, settings: {...productSection.settings, productSource: nextSource}})} /></Group>}
    </div>
  );
}
