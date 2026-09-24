import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const apiSource = readFileSync(
  new URL('../src/features/catalog/api/admin.ts', import.meta.url),
  'utf8',
);
const pageSource = readFileSync(
  new URL('../src/features/catalog/pages/AdminProducts.tsx', import.meta.url),
  'utf8',
);

test('seller catalog exposes tenant-scoped permanent product deletion', () => {
  assert.match(apiSource, /async deleteProduct\(id: string\)/);
  assert.match(
    apiSource,
    /from\('products'\)[\s\S]*?\.delete\(\)[\s\S]*?\.eq\('id', id\)[\s\S]*?\.eq\('shop_id', shopId\)/,
  );
});

test('product admin requires confirmation, deletes the row, and frees the local slot', () => {
  assert.match(pageSource, /confirm\(/);
  assert.match(pageSource, /adminApi\.deleteProduct\(product\.id\)/);
  assert.match(pageSource, /prev\.filter\(\(p\) => p\.id !== product\.id\)/);
});

test('product images are cleaned only after the product row delete succeeds', () => {
  const deleteRow = pageSource.indexOf('adminApi.deleteProduct(product.id)');
  const deleteImage = pageSource.indexOf('adminApi.deleteProductImage(path)', deleteRow);
  assert.ok(deleteRow >= 0, 'row delete must exist');
  assert.ok(deleteImage > deleteRow, 'storage cleanup must occur after row delete');
});
