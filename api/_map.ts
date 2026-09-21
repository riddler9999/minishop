export function mapProductRow(row: any) {
  const media = (url: string) => {
    const m = url?.match(/\/storage\/v1\/object\/public\/(product-images|shop-logos)\/(.+)$/);
    return m ? `/api/storefront/${m[1]}/${m[2]}` : url;
  };
  const images = (row.images || []).map(media);
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
    images,
    image: images[0] ?? null,
    description: row.description,
    arrivalDate: row.arrival_date,
    createdAt: row.created_at,
  };
}
