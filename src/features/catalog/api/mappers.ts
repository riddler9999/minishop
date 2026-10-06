// ---- CATALOG: row mappers ----------------------------------------------------
import type {Product, ProductVariant} from '@/domain/product';

export type ProductRow = {
  id: string; item_code: string | null; name: string; category: string | null;
  color: string | null; size: string | null; price: number; promo_price: number | null;
  is_promotion: boolean; stock: number; status: string; images: string[];
  description: string; arrival_date: string | null; created_at: string;
  variants?: ProductVariant[];
};

export function parseVariants(description: string | null): { cleanDescription: string; variants: ProductVariant[] } {
  if (!description) return { cleanDescription: '', variants: [] };
  const match = description.match(/<!--VARIANTS:(.*?)-->/s);
  if (!match) return { cleanDescription: description, variants: [] };
  try {
    const variants = JSON.parse(match[1]) as ProductVariant[];
    const cleanDescription = description.replace(/<!--VARIANTS:.*?-->/s, '').trim();
    return { cleanDescription, variants: Array.isArray(variants) ? variants : [] };
  } catch {
    return { cleanDescription: description, variants: [] };
  }
}

export function encodeVariants(description: string, variants?: ProductVariant[]): string {
  const clean = description.replace(/<!--VARIANTS:.*?-->/s, '').trim();
  if (!variants || variants.length === 0) return clean;
  return `${clean}\n<!--VARIANTS:${JSON.stringify(variants)}-->`;
}

export function firstPartyMediaUrl(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/\/storage\/v1\/object\/public\/(product-images|shop-logos)\/(.+)$/);
  return match ? `/api/storefront/${match[1]}/${match[2]}` : url;
}

export function mapProduct(row: ProductRow): Product {
  const images = (row.images ?? []).map((url) => firstPartyMediaUrl(url) ?? url);
  const { cleanDescription, variants: parsedVariants } = parseVariants(row.description);
  const finalVariants = row.variants && row.variants.length > 0 ? row.variants : parsedVariants;
  const calculatedStock = finalVariants.length > 0
    ? finalVariants.reduce((sum, v) => sum + Math.max(0, v.stock), 0)
    : row.stock;

  return {
    id: row.id, itemCode: row.item_code ?? '', name: row.name, category: row.category,
    color: row.color, size: row.size, price: row.price, promoPrice: row.promo_price,
    isPromotion: row.is_promotion, stock: calculatedStock, inStock: calculatedStock > 0,
    status: row.status, images, image: images[0] ?? null, description: cleanDescription,
    arrivalDate: row.arrival_date, createdAt: row.created_at,
    variants: finalVariants,
  };
}

export function escapeOrFilter(s: string): string { return s.replace(/[\\,()]/g, '\\$&'); }
