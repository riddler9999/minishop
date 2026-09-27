import {useEffect, useState} from 'react';
import type {Product} from '@/domain/product';
import type {ProductSource} from '@/domain/storeDesign';
import {loadStorefrontSectionProducts} from './sectionProducts';
import {StorefrontRenderer, type StorefrontRendererProps} from './StorefrontRenderer';

type Props = Omit<StorefrontRendererProps, 'sectionProductsById'> & {
  loadSectionProducts: (source: ProductSource) => Promise<{products: Product[]}>;
  excludeProductId?: string;
};

export function ResolvedStorefrontRenderer({loadSectionProducts, excludeProductId, ...rendererProps}: Props) {
  const [sectionProductsById, setSectionProductsById] = useState<Record<string, Product[]>>({});

  useEffect(() => {
    let alive = true;
    setSectionProductsById({});
    void loadStorefrontSectionProducts(rendererProps.document, rendererProps.template, loadSectionProducts, excludeProductId).then((productsById) => {
      if (alive) setSectionProductsById(productsById);
    });

    return () => { alive = false; };
  }, [excludeProductId, loadSectionProducts, rendererProps.document, rendererProps.template]);

  return <StorefrontRenderer {...rendererProps} sectionProductsById={sectionProductsById} />;
}
