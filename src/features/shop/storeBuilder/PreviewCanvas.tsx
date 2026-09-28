import type {Product} from '@/domain/product';
import type {StoreDesignDocument, StoreTemplateName} from '@/domain/storeDesign';
import {getThemeVisual} from '@/domain/theme';
import ProductCard from '@/features/catalog/components/ProductCard';
import {StorefrontRenderer} from '@/features/catalog/storeDesign/StorefrontRenderer';

type Props = {
  document: StoreDesignDocument;
  template: StoreTemplateName;
  products: Product[];
  categories: string[];
  shopName: string;
  viewport: 'desktop' | 'mobile';
  selectedSectionId: string | null;
  onSectionSelect: (sectionId: string) => void;
};

export function PreviewCanvas({document, template, products, categories, shopName, viewport, selectedSectionId, onSectionSelect}: Props) {
  const visual = getThemeVisual({presetId: document.themeId, accentColor: document.globalSettings.accentColor});
  return (
    <div className="h-[calc(100dvh-174px)] max-w-full overflow-auto bg-[#f6f6f7] px-3 pb-8 pt-4 sm:px-6 lg:h-full lg:p-7" data-preview-viewport={viewport}>
      <div className="mx-auto mb-3 flex max-w-5xl items-center justify-between gap-2 text-[11px] font-medium text-slate-500"><span>အစမ်းမြင်ကွင်း · မူကြမ်း</span><span>ကဏ္ဍတစ်ခုကို နှိပ်ပြီး ပြင်ဆင်ပါ</span></div>
      <div className={viewport === 'mobile' ? 'store-builder-preview store-builder-preview--mobile mx-auto min-h-[560px] w-full max-w-[390px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_16px_45px_rgba(15,23,42,0.10)]' : 'store-builder-preview store-builder-preview--desktop mx-auto min-h-[650px] w-full max-w-5xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_16px_45px_rgba(15,23,42,0.10)]'}>
        <style>{`
          .store-builder-preview--mobile [data-store-section-id] section > div:has(> div > article) { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          .store-builder-preview--desktop [data-store-section-id] section > div:has(> div > article) { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
        `}</style>
        <div className="flex min-h-16 items-center justify-between gap-3 border-b border-black/5 px-5 sm:px-7" style={{backgroundColor: visual.canvas, color: visual.text}}>
          <span className="truncate text-sm font-bold">{shopName}</span><span className="text-xs font-medium opacity-60">☰</span>
        </div>
        <StorefrontRenderer
          document={document}
          template={template}
          products={products}
          categories={categories}
          product={products[0] ?? null}
          renderProductCard={(product) => <ProductCard product={product} variant={document.themeId} />}
          renderRequiredCommerce={(buyNow) => <div className="px-5 pb-6"><div className="rounded-lg px-4 py-3 text-center text-sm font-semibold text-white" style={{backgroundColor: visual.accent}}>{buyNow.label}</div></div>}
          selectedSectionId={selectedSectionId}
          onSectionSelect={onSectionSelect}
        />
        {products.length === 0 && <p className="border-t border-slate-100 px-5 py-6 text-center text-xs text-slate-500">ပစ္စည်းထည့်ပြီးတာနဲ့ ဒီနေရာမှာ အစမ်းမြင်ရပါမယ်။</p>}
      </div>
    </div>
  );
}
