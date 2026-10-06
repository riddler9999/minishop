export function mapProductRow(row: any) {
  const media = (url: string) => {
    const m = url?.match(/\/storage\/v1\/object\/public\/(product-images|shop-logos)\/(.+)$/);
    return m ? `/api/storefront/${m[1]}/${m[2]}` : url;
  };
  const images = (row.images || []).map(media);
  return {
    id: row.id,
    itemCode: '',
    name: row.name,
    category: row.category,
    color: row.color,
    size: row.size,
    price: row.price,
    promoPrice: row.promo_price,
    isPromotion: row.is_promotion,
    stock: Array.isArray(row.variants) && row.variants.length
      ? row.variants.reduce((sum: number, variant: any) => sum + Math.max(0, Number(variant.stock) || 0), 0)
      : row.stock,
    inStock: Array.isArray(row.variants) && row.variants.length
      ? row.variants.some((variant: any) => Number(variant.stock) > 0)
      : row.stock > 0,
    status: row.status,
    images,
    image: images[0] ?? null,
    description: row.description,
    arrivalDate: row.arrival_date,
    createdAt: row.created_at,
    variants: (row.variants || []).map((variant: any) => ({
      id: variant.id,
      name: variant.name,
      sku: variant.sku,
      size: variant.size,
      color: variant.color,
      price: variant.price,
      promoPrice: variant.promo_price,
      stock: variant.stock,
      status: variant.status,
    })),
  };
}
