import {getSectionDefinition, type StoreSection} from '@/domain/storeDesign';

type Props = {section: StoreSection | null; blocked: boolean; onChange: (section: StoreSection) => void};
type FieldProps = {label: string; value: string; disabled: boolean; multiline?: boolean; onChange: (value: string) => void};

function TextField({label, value, disabled, multiline, onChange}: FieldProps) {
  const className = 'mt-1 w-full rounded-lg border border-cream-300 px-3 py-2 text-sm';
  return (
    <label className="block text-xs font-semibold text-ink-soft">
      {label}
      {multiline
        ? <textarea value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className={className} rows={4} />
        : <input value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className={className} />}
    </label>
  );
}

export function Inspector({section, blocked, onChange}: Props) {
  if (!section) return <p className="text-sm text-ink-soft">Select a section from the tree or preview.</p>;
  const definition = getSectionDefinition(section.type);
  const field = (label: string, key: string, value: string, multiline = false) => (
    <TextField key={key} label={label} value={value} disabled={blocked} multiline={multiline} onChange={(next) => onChange({...section, settings: {...section.settings, [key]: next}} as StoreSection)} />
  );

  let controls;
  switch (section.type) {
    case 'hero':
      controls = <>{field('Headline', 'headline', section.settings.headline)}{field('Subtext', 'subtext', section.settings.subtext, true)}{field('Button label', 'ctaLabel', section.settings.ctaLabel)}{field('Image URL', 'imageUrl', section.settings.imageUrl ?? '')}</>;
      break;
    case 'categories':
    case 'featured-products':
    case 'best-selling':
    case 'product-collection':
    case 'new-arrivals':
    case 'sale-products':
    case 'related-products':
      controls = field('Title', 'title', section.settings.title);
      break;
    case 'promotion-banner':
      controls = <>{field('Headline', 'headline', section.settings.headline)}{field('Body', 'body', section.settings.body, true)}{field('Button label', 'ctaLabel', section.settings.ctaLabel)}</>;
      break;
    case 'image-text':
      controls = <>{field('Headline', 'headline', section.settings.headline)}{field('Body', 'body', section.settings.body, true)}{field('Image URL', 'imageUrl', section.settings.imageUrl ?? '')}</>;
      break;
    case 'announcement':
      controls = field('Text', 'text', section.settings.text);
      break;
    case 'rich-text':
      controls = field('Text', 'text', section.settings.text, true);
      break;
    case 'spacer':
      controls = (
        <label className="block text-xs font-semibold text-ink-soft">Size
          <select value={section.settings.size} disabled={blocked} onChange={(event) => onChange({...section, settings: {size: event.target.value as 'sm' | 'md' | 'lg'}})} className="mt-1 w-full rounded-lg border border-cream-300 px-3 py-2 text-sm">
            <option value="sm">Small</option><option value="md">Medium</option><option value="lg">Large</option>
          </select>
        </label>
      );
      break;
    case 'product-gallery':
      controls = (
        <label className="block text-xs font-semibold text-ink-soft">Layout
          <select value={section.settings.layout} disabled={blocked} onChange={(event) => onChange({...section, settings: {layout: event.target.value as 'stacked' | 'carousel'}})} className="mt-1 w-full rounded-lg border border-cream-300 px-3 py-2 text-sm">
            <option value="carousel">Carousel</option><option value="stacked">Stacked</option>
          </select>
        </label>
      );
      break;
    case 'product-info':
      controls = <p className="rounded-lg bg-cream-100 p-3 text-xs leading-5 text-ink-soft">Product title, price and Buy Now are protected commerce content.</p>;
      break;
    case 'product-description':
      controls = field('Heading', 'heading', section.settings.heading);
      break;
  }

  return <div className="space-y-3"><h2 className="text-sm font-bold">{definition.label}</h2>{controls}</div>;
}
