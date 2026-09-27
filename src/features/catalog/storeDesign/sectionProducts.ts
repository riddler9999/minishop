import type {Product} from '@/domain/product';
import {getSectionProductSource, resolveProductSource, type ProductSource, type StoreDesignDocument, type StoreSection, type StoreTemplateName} from '@/domain/storeDesign';
import {buildStorefrontRenderPlan} from './renderPlan.ts';

export type SectionProductsById = Readonly<Record<string, Product[]>>;

export function resolveSectionProductList(
  section: StoreSection,
  fallbackProducts: readonly Product[],
  resolvedBySectionId?: SectionProductsById,
): Product[] {
  const source = getSectionProductSource(section);
  if (!source) return [...fallbackProducts];
  return resolvedBySectionId?.[section.id] ?? resolveProductSource(source, fallbackProducts);
}

export async function loadStorefrontSectionProducts(
  document: StoreDesignDocument,
  template: StoreTemplateName,
  load: (source: ProductSource) => Promise<{products: Product[]}>,
  excludeProductId?: string,
): Promise<Record<string, Product[]>> {
  const productSections = buildStorefrontRenderPlan(document, template).sections.flatMap((section) => {
    const source = getSectionProductSource(section);
    return source ? [{id: section.id, source}] : [];
  });
  const entries = await Promise.all(productSections.map(async ({id, source}) => {
    try {
      const result = await load(source);
      const products = excludeProductId
        ? result.products.filter((product) => product.id !== excludeProductId)
        : result.products;
      return [id, products] as const;
    } catch {
      return [id, []] as const;
    }
  }));
  return Object.fromEntries(entries);
}
