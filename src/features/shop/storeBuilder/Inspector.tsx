import type {Product} from '@/domain/product';
import type {ProductSource, StoreSection} from '@/domain/storeDesign';
import {ProductSourceInspector} from './ProductSourceInspector';
import {SECTION_LABELS} from './sectionCopy';

type Props = {section: StoreSection | null; products: Product[]; categories: string[]; blocked: boolean; onChange: (section: StoreSection) => void};
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

export function Inspector({section, products, categories, blocked, onChange}: Props) {
  if (!section) return <p className="text-sm text-ink-soft">ကဏ္ဍစာရင်း သို့မဟုတ် အစမ်းမြင်ကွင်းမှ ကဏ္ဍတစ်ခုရွေးပါ။</p>;
  const field = (label: string, value: string, change: (value: string) => void, multiline = false) => (
    <TextField key={label} label={label} value={value} disabled={blocked} multiline={multiline} onChange={change} />
  );

  let controls;
  switch (section.type) {
    case 'hero':
      controls = <>
        {field('ခေါင်းစဉ်', section.settings.headline, (headline) => onChange({...section, settings: {...section.settings, headline}}))}
        {field('စာတန်းငယ်', section.settings.subtext, (subtext) => onChange({...section, settings: {...section.settings, subtext}}), true)}
      </>;
      break;
    case 'categories':
      controls = field('ခေါင်းစဉ်', section.settings.title, (title) => onChange({...section, settings: {title}}));
      break;
    case 'featured-products':
    case 'best-selling':
    case 'product-collection':
    case 'new-arrivals':
    case 'sale-products':
    case 'related-products':
      controls = <>
        {field('ခေါင်းစဉ်', section.settings.title, (title) => onChange({...section, settings: {...section.settings, title}}))}
        <ProductSourceInspector source={section.settings.productSource} products={products} categories={categories} blocked={blocked} onChange={(productSource: ProductSource) => onChange({...section, settings: {...section.settings, productSource}})} />
      </>;
      break;
    case 'promotion-banner':
      controls = <>
        {field('ခေါင်းစဉ်', section.settings.headline, (headline) => onChange({...section, settings: {...section.settings, headline}}))}
        {field('စာသား', section.settings.body, (body) => onChange({...section, settings: {...section.settings, body}}), true)}
      </>;
      break;
    case 'image-text':
      controls = <>
        {field('ခေါင်းစဉ်', section.settings.headline, (headline) => onChange({...section, settings: {...section.settings, headline}}))}
        {field('စာသား', section.settings.body, (body) => onChange({...section, settings: {...section.settings, body}}), true)}
      </>;
      break;
    case 'announcement':
      controls = field('စာသား', section.settings.text, (text) => onChange({...section, settings: {text}}));
      break;
    case 'rich-text':
      controls = field('စာသား', section.settings.text, (text) => onChange({...section, settings: {text}}), true);
      break;
    case 'spacer':
      controls = (
        <label className="block text-xs font-semibold text-ink-soft">အရွယ်အစား
          <select value={section.settings.size} disabled={blocked} onChange={(event) => onChange({...section, settings: {size: event.target.value as 'sm' | 'md' | 'lg'}})} className="mt-1 w-full rounded-lg border border-cream-300 px-3 py-2 text-sm">
            <option value="sm">အသေး</option><option value="md">အလယ်</option><option value="lg">အကြီး</option>
          </select>
        </label>
      );
      break;
    case 'product-gallery':
      controls = (
        <label className="block text-xs font-semibold text-ink-soft">ပုံစံ
          <select value={section.settings.layout} disabled={blocked} onChange={(event) => onChange({...section, settings: {layout: event.target.value as 'stacked' | 'carousel'}})} className="mt-1 w-full rounded-lg border border-cream-300 px-3 py-2 text-sm">
            <option value="carousel">ဘေးတိုက်ကြည့်ရန်</option><option value="stacked">အပေါ်အောက်စီရန်</option>
          </select>
        </label>
      );
      break;
    case 'product-info':
      controls = <p className="rounded-lg bg-cream-100 p-3 text-xs leading-5 text-ink-soft">ပစ္စည်းအမည်၊ ဈေးနှုန်းနဲ့ ဝယ်မည်ခလုတ်တွေက မဖယ်ရှားနိုင်တဲ့ အရောင်းလုပ်ဆောင်ချက်တွေဖြစ်တယ်။</p>;
      break;
    case 'product-description':
      controls = field('ခေါင်းစဉ်', section.settings.heading, (heading) => onChange({...section, settings: {heading}}));
      break;
  }

  return <div className="space-y-3"><h2 className="text-sm font-bold">{SECTION_LABELS[section.type]}</h2>{controls}</div>;
}
