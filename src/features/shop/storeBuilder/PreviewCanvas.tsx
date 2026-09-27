import type {Product} from '@/domain/product';
import type {StoreDesignDocument, StoreTemplateName} from '@/domain/storeDesign';
import {StorefrontRenderer} from '@/features/catalog/storeDesign/StorefrontRenderer';

type Props = {
  document: StoreDesignDocument;
  template: StoreTemplateName;
  products: Product[];
  categories: string[];
  viewport: 'desktop' | 'mobile';
};

export function PreviewCanvas({document, template, products, categories, viewport}: Props) {
  return (
    <div className="h-full overflow-auto bg-cream-100 p-4" data-preview-viewport={viewport}>
      <div className={viewport === 'mobile' ? 'mx-auto min-h-[720px] max-w-[390px] overflow-hidden rounded-2xl bg-white shadow-sm' : 'mx-auto min-h-[720px] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-sm'}>
        <StorefrontRenderer document={document} template={template} products={products} categories={categories} />
      </div>
    </div>
  );
}
