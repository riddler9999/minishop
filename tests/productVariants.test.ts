import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {describe, it} from 'node:test';
import {
  getProductTotalStock,
  getProductPriceRange,
  resolveVariantPrice,
  type Product,
  type ProductVariant,
} from '../src/domain/product.ts';
import {mapProduct, type ProductRow} from '../src/features/catalog/api/mappers.ts';

describe('Product Variants Domain & Mappers', () => {
  const sampleVariants: ProductVariant[] = [
    {
      id: 'v1',
      name: 'Small / Red',
      size: 'S',
      color: 'Red',
      price: 15000,
      promoPrice: 12000,
      stock: 5,
      sku: 'SKU-RED-S',
    },
    {
      id: 'v2',
      name: 'Medium / Red',
      size: 'M',
      color: 'Red',
      price: 18000,
      promoPrice: 14000,
      stock: 12,
      sku: 'SKU-RED-M',
    },
    {
      id: 'v3',
      name: 'Large / Blue',
      size: 'L',
      color: 'Blue',
      price: 20000,
      stock: 0,
      sku: 'SKU-BLUE-L',
    },
  ];

  const baseProduct: Product = {
    id: 'prod_1',
    itemCode: 'SKU-BASE',
    name: 'Sample Apparel Shirt',
    category: 'Tops',
    color: 'Red',
    size: 'M',
    price: 15000,
    promoPrice: 12000,
    isPromotion: true,
    stock: 17,
    inStock: true,
    status: 'active',
    images: ['https://example.com/image.jpg'],
    image: 'https://example.com/image.jpg',
    description: 'A comfortable cotton shirt.',
    arrivalDate: '2026-10-01T00:00:00Z',
    createdAt: '2026-10-01T00:00:00Z',
    variants: sampleVariants,
  };

  it('calculates total stock across variants accurately', () => {
    const total = getProductTotalStock(baseProduct);
    assert.strictEqual(total, 17); // 5 + 12 + 0
  });

  it('calculates price range across variants', () => {
    const range = getProductPriceRange(baseProduct);
    assert.strictEqual(range.minPrice, 12000); // v1 promo price
    assert.strictEqual(range.maxPrice, 20000); // v3 price
    assert.strictEqual(range.hasVariantPrices, true);
  });

  it('resolves effective price and stock for specific variants', () => {
    const v1Price = resolveVariantPrice(baseProduct, sampleVariants[0]);
    assert.strictEqual(v1Price.price, 15000);
    assert.strictEqual(v1Price.promoPrice, 12000);
    assert.strictEqual(v1Price.effectivePrice, 12000);

    const v3Price = resolveVariantPrice(baseProduct, sampleVariants[2]);
    assert.strictEqual(v3Price.price, 20000);
    assert.strictEqual(v3Price.effectivePrice, 20000);
  });

  it('maps product rows with first-class variants and preserves a clean description', () => {
    const row: ProductRow = {
      id: 'prod_99',
      item_code: 'P-99',
      name: 'Designer Jeans',
      category: 'Pants',
      color: 'Blue',
      size: null,
      price: 30000,
      promo_price: null,
      is_promotion: false,
      stock: 0,
      status: 'active',
      images: ['https://example.com/jeans.jpg'],
      description: 'Classic fit jeans.',
      variants: [
        {id: 'var_a', name: 'Size 30', size: '30', stock: 8},
        {id: 'var_b', name: 'Size 32', size: '32', stock: 15},
      ],
      arrival_date: '2026-10-01T00:00:00Z',
      created_at: '2026-10-01T00:00:00Z',
    };

    const mapped = mapProduct(row);
    assert.strictEqual(mapped.description, 'Classic fit jeans.');
    assert.strictEqual(mapped.variants?.length, 2);
    assert.strictEqual(mapped.stock, 23); // 8 + 15
    assert.strictEqual(mapped.inStock, true);
  });

  it('keeps variant selection and variant-aware pricing in designed product templates', async () => {
    const detail = await readFile('src/features/catalog/pages/ProductDetail.tsx', 'utf8');
    const renderer = await readFile('src/features/catalog/storeDesign/StorefrontRenderer.tsx', 'utf8');
    assert.match(detail, /renderProductInfo=\{\(showPrice\)/);
    assert.match(detail, /setSelectedVariant\(variant\)/);
    assert.match(detail, /ks\(price\)/);
    assert.match(renderer, /props\.renderProductInfo\(section\.settings\.showPrice\)/);
  });
});
