// ---- DOMAIN: product ---------------------------------------------------------
// Pure shapes shared by every layer (live Supabase backend, demo backend, UI).
// This module is dependency-free on purpose: `domain/` is the leaf of the import
// graph, so no data-access or React concern can leak into it.

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
}
