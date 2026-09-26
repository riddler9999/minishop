import type {ReactNode} from 'react';
import type {Product} from '@/domain/product';
import type {StoreDesignDocument, StoreSection, StoreTemplateName} from '@/domain/storeDesign';
import {buildStorefrontRenderPlan} from './renderPlan';

type Props = {
  document: StoreDesignDocument;
  template: StoreTemplateName;
  products?: Product[];
  categories?: string[];
  product?: Product | null;
  renderProductCard?: (product: Product) => ReactNode;
  renderRequiredCommerce?: (buyNow: StoreDesignDocument['globalSettings']['buyNow']) => ReactNode;
};

function sectionContent(section: StoreSection, props: Props): ReactNode {
  switch (section.type) {
    case 'announcement':
      return section.settings.text ? <div>{section.settings.text}</div> : null;
    case 'hero':
      return (
        <section>
          {section.settings.imageUrl && <img src={section.settings.imageUrl} alt="" />}
          <h1>{section.settings.headline}</h1>
          {section.settings.subtext && <p>{section.settings.subtext}</p>}
        </section>
      );
    case 'categories':
      return (
        <section>
          <h2>{section.settings.title}</h2>
          <div>{(props.categories ?? []).map((category) => <span key={category}>{category}</span>)}</div>
        </section>
      );
    case 'featured-products':
    case 'best-selling':
    case 'product-collection':
    case 'new-arrivals':
    case 'sale-products':
      return (
        <section>
          <h2>{section.settings.title}</h2>
          <div>{(props.products ?? []).map((product) => <div key={product.id}>{props.renderProductCard?.(product)}</div>)}</div>
        </section>
      );
    case 'promotion-banner':
      return <section><h2>{section.settings.headline}</h2><p>{section.settings.body}</p></section>;
    case 'image-text':
      return <section>{section.settings.imageUrl && <img src={section.settings.imageUrl} alt="" />}<h2>{section.settings.headline}</h2><p>{section.settings.body}</p></section>;
    case 'rich-text':
      return section.settings.text ? <section><p>{section.settings.text}</p></section> : null;
    case 'spacer':
      return <div aria-hidden="true" data-size={section.settings.size} />;
    case 'product-gallery':
      return props.product ? <section>{props.product.images.map((image) => <img key={image} src={image} alt={props.product?.name ?? ''} />)}</section> : null;
    case 'product-info':
      return props.product ? <section><h1>{props.product.name}</h1>{section.settings.showPrice && <p>{props.product.price}</p>}</section> : null;
    case 'product-description':
      return props.product?.description ? <section><h2>{section.settings.heading}</h2><p>{props.product.description}</p></section> : null;
    case 'related-products':
      return (
        <section>
          <h2>{section.settings.title}</h2>
          <div>{(props.products ?? []).map((product) => <div key={product.id}>{props.renderProductCard?.(product)}</div>)}</div>
        </section>
      );
  }
}

export function StorefrontRenderer(props: Props) {
  const plan = buildStorefrontRenderPlan(props.document, props.template);
  return (
    <>
      {plan.sections.map((section) => <div key={section.id} data-store-section-id={section.id}>{sectionContent(section, props)}</div>)}
      {props.template === 'product' && props.renderRequiredCommerce?.(plan.requiredCommerce.buyNow)}
    </>
  );
}
