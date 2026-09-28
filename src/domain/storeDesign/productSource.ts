import type {Product} from '../product.ts';
import type {ProductSource, StoreSection} from './types.ts';

export const MAX_PRODUCT_SOURCE_PRODUCTS = 24;

export interface ProductSourceResolutionContext {
  demandByProductId?: ReadonlyMap<string, number>;
}

export function getSectionProductSource(section: StoreSection): ProductSource | null {
  switch (section.type) {
    case 'featured-products':
    case 'best-selling':
    case 'product-collection':
    case 'new-arrivals':
    case 'sale-products':
    case 'related-products':
      return section.settings.productSource;
    default:
      return null;
  }
}

function isActive(product: Product): boolean {
  return product.status === 'active';
}

function productTimestamp(product: Product): number {
  const raw = product.createdAt ?? product.arrivalDate;
  if (!raw) return 0;
  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function newestFirst(a: Product, b: Product): number {
  const timeDelta = productTimestamp(b) - productTimestamp(a);
  if (timeDelta !== 0) return timeDelta;
  return a.id.localeCompare(b.id);
}

function isSaleProduct(product: Product): boolean {
  return product.isPromotion === true && product.promoPrice != null && product.promoPrice > 0;
}

export function resolveProductSource(
  source: ProductSource,
  products: readonly Product[],
  context: ProductSourceResolutionContext = {},
): Product[] {
  const active = products.filter(isActive);

  if (source.mode === 'manual') {
    const byId = new Map(active.map((product) => [product.id, product]));
    return source.productIds.flatMap((id) => {
      const product = byId.get(id);
      return product ? [product] : [];
    });
  }

  let resolved: Product[];
  switch (source.rule) {
    case 'new_arrivals':
      resolved = [...active].sort(newestFirst);
      break;
    case 'sale':
      resolved = active.filter(isSaleProduct).sort(newestFirst);
      break;
    case 'category':
      resolved = active.filter((product) => product.category === source.category);
      break;
    case 'best_selling': {
      const demand = context.demandByProductId ?? new Map<string, number>();
      resolved = [...active].sort((a, b) => {
        const quantityDelta = (demand.get(b.id) ?? 0) - (demand.get(a.id) ?? 0);
        if (quantityDelta !== 0) return quantityDelta;
        return newestFirst(a, b);
      });
      break;
    }
  }

  return resolved.slice(0, source.limit);
}
