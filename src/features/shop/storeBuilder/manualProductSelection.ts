import type {Product} from '@/domain/product';
import type {ProductSource} from '@/domain/storeDesign';

export function unavailableManualProductIds(source: ProductSource, products: readonly Product[]): string[] {
  if (source.mode !== 'manual') return [];
  const availableIds = new Set(products.map((product) => product.id));
  return source.productIds.filter((productId) => !availableIds.has(productId));
}

export function removeManualProductId(source: Extract<ProductSource, {mode: 'manual'}>, productId: string): ProductSource {
  return {mode: 'manual', productIds: source.productIds.filter((id) => id !== productId)};
}
