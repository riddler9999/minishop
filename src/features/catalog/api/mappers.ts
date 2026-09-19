// ---- CATALOG: row mappers ----------------------------------------------------
// snake_case Postgres rows -> camelCase domain Product. Kept beside the catalog
// queries that use them so the mapping never drifts from the select list.

import type {Product} from '@/domain/product';

export type ProductRow = {
  id: string;
  item_code: string | null;
  name: string;
  category: string | null;
  color: string | null;
  size: string | null;
  price: number;
  promo_price: number | null;
  is_promotion: boolean;
  stock: number;
  status: string;
  images: string[];
  description: string;
  arrival_date: string | null;
  created_at: string;
};

export function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    itemCode: row.item_code ?? '',
    name: row.name,
    category: row.category,
    color: row.color,
    size: row.size,
    price: row.price,
    promoPrice: row.promo_price,
    isPromotion: row.is_promotion,
    stock: row.stock,
    inStock: row.stock > 0,
    status: row.status,
    images: row.images,
    image: row.images[0] ?? null,
    description: row.description,
    arrivalDate: row.arrival_date,
    createdAt: row.created_at,
  };
}

// Escape PostgREST `.or()` filter-list syntax (comma separates conditions,
// parens group them) so a search term containing them can't break the query.
export function escapeOrFilter(s: string): string {
  // Escape backslash FIRST, then the PostgREST filter-list metachars, so a
  // literal `\` in the search term can't perturb the `or=(...)` grouping.
  return s.replace(/[\\,()]/g, '\\$&');
}
