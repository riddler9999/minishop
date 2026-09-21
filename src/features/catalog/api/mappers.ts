// ---- CATALOG: row mappers ----------------------------------------------------
import type {Product} from '@/domain/product';

export type ProductRow = {
  id: string; item_code: string | null; name: string; category: string | null;
  color: string | null; size: string | null; price: number; promo_price: number | null;
  is_promotion: boolean; stock: number; status: string; images: string[];
  description: string; arrival_date: string | null; created_at: string;
};

export function firstPartyMediaUrl(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/\/storage\/v1\/object\/public\/(product-images|shop-logos)\/(.+)$/);
  return match ? `/api/storefront/${match[1]}/${match[2]}` : url;
}

export function mapProduct(row: ProductRow): Product {
  const images = (row.images ?? []).map((url) => firstPartyMediaUrl(url) ?? url);
  return {
    id: row.id, itemCode: row.item_code ?? '', name: row.name, category: row.category,
    color: row.color, size: row.size, price: row.price, promoPrice: row.promo_price,
    isPromotion: row.is_promotion, stock: row.stock, inStock: row.stock > 0,
    status: row.status, images, image: images[0] ?? null, description: row.description,
    arrivalDate: row.arrival_date, createdAt: row.created_at,
  };
}

export function escapeOrFilter(s: string): string { return s.replace(/[\\,()]/g, '\\$&'); }
