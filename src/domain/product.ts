// ---- DOMAIN: product ---------------------------------------------------------
// Pure shapes shared by every layer (live Supabase backend, demo backend, UI).
// This module is dependency-free on purpose: `domain/` is the leaf of the import
// graph, so no data-access or React concern can leak into it.

export interface ProductVariant {
  id: string;
  name: string;
  sku?: string | null;
  color?: string | null;
  size?: string | null;
  price?: number | null;
  promoPrice?: number | null;
  stock: number;
  status?: 'active' | 'hidden';
}

export interface Product {
  id: string;
  itemCode: string;
  name: string;
  category: string | null;
  color: string | null;
  size: string | null;
  price: number;
  promoPrice: number | null;
  isPromotion: boolean;
  stock: number;
  inStock: boolean;
  status: string;
  images: string[];
  image: string | null;
  description: string;
  arrivalDate: string | null;
  createdAt: string | null;
  variants?: ProductVariant[];
}

/** Fields an admin may edit on a product. */
export interface ProductPatch {
  name?: string;
  itemCode?: string;
  category?: string | null;
  color?: string | null;
  size?: string | null;
  price?: number;
  promoPrice?: number | null;
  isPromotion?: boolean;
  stock?: number;
  status?: string; // 'active' | 'hidden'
  images?: string[];
  description?: string;
  arrivalDate?: string | null;
  variants?: ProductVariant[];
}

// Fields for creating a new product (name + price required; rest optional/defaulted).
export interface ProductCreateInput {
  name: string;
  itemCode?: string;
  category?: string | null;
  color?: string | null;
  size?: string | null;
  price: number;
  promoPrice?: number | null;
  isPromotion?: boolean;
  stock?: number;
  status?: string; // 'active' | 'hidden'
  images?: string[];
  description?: string;
  arrivalDate?: string | null;
  variants?: ProductVariant[];
}

/** Helper functions for variant calculations */
export function getProductTotalStock(product: Product): number {
  if (product.variants && product.variants.length > 0) {
    return product.variants.reduce((sum, v) => sum + Math.max(0, v.stock), 0);
  }
  return product.stock;
}

export function getProductPriceRange(product: Product): {
  minPrice: number;
  maxPrice: number;
  hasVariantPrices: boolean;
} {
  const basePrice = product.isPromotion && product.promoPrice != null ? product.promoPrice : product.price;
  if (!product.variants || product.variants.length === 0) {
    return { minPrice: basePrice, maxPrice: basePrice, hasVariantPrices: false };
  }

  let minP = Infinity;
  let maxP = -Infinity;

  for (const v of product.variants) {
    const vBasePrice = v.price != null ? v.price : product.price;
    const vPromoPrice = v.promoPrice != null ? v.promoPrice : (v.price != null ? null : product.promoPrice);
    const effPrice = product.isPromotion && vPromoPrice != null ? vPromoPrice : vBasePrice;

    if (effPrice < minP) minP = effPrice;
    if (effPrice > maxP) maxP = effPrice;
  }

  if (minP === Infinity) {
    minP = basePrice;
    maxP = basePrice;
  }

  return {
    minPrice: minP,
    maxPrice: maxP,
    hasVariantPrices: minP !== maxP,
  };
}

export function resolveVariantPrice(
  product: Product,
  variant?: ProductVariant | null,
): {
  price: number;
  promoPrice: number | null;
  isPromotion: boolean;
  effectivePrice: number;
} {
  if (!variant) {
    const isPromo = product.isPromotion && product.promoPrice != null;
    const eff = isPromo ? product.promoPrice! : product.price;
    return { price: product.price, promoPrice: product.promoPrice, isPromotion: product.isPromotion, effectivePrice: eff };
  }

  const baseP = variant.price != null ? variant.price : product.price;
  const promoP = variant.promoPrice != null ? variant.promoPrice : (variant.price != null ? null : product.promoPrice);
  const isPromo = product.isPromotion && promoP != null;
  const eff = isPromo ? promoP : baseP;

  return { price: baseP, promoPrice: promoP, isPromotion: isPromo, effectivePrice: eff };
}
