import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import fs from 'node:fs';

const page = fs.readFileSync(new URL('../src/features/catalog/pages/AdminProducts.tsx', import.meta.url), 'utf8');
const table = fs.existsSync(new URL('../src/features/catalog/components/AdminProductTable.tsx', import.meta.url))
  ? fs.readFileSync(new URL('../src/features/catalog/components/AdminProductTable.tsx', import.meta.url), 'utf8')
  : '';
const filters = fs.existsSync(new URL('../src/features/catalog/components/AdminProductFilters.tsx', import.meta.url))
  ? fs.readFileSync(new URL('../src/features/catalog/components/AdminProductFilters.tsx', import.meta.url), 'utf8')
  : '';
const editor = fs.existsSync(new URL('../src/features/catalog/components/AdminProductEditor.tsx', import.meta.url))
  ? fs.readFileSync(new URL('../src/features/catalog/components/AdminProductEditor.tsx', import.meta.url), 'utf8')
  : '';

describe('Admin Products V2 workspace', () => {
  it('exposes English-first product workspace actions and filter/sort affordances', () => {
    assert.match(page, /Products/);
    assert.match(page, /Add Product/);
    assert.match(filters, /Search products/);
    assert.match(filters, /Status/);
    assert.match(filters, /Stock/);
    assert.match(filters, /Category/);
    assert.match(filters, /Sort/);
  });

  it('provides truthful product sub-navigation without exposing fake destinations', () => {
    // Navigation should only expose truthful views (All Products / status views)
    assert.doesNotMatch(page, /to=["']\/admin\/collections["']/);
    assert.doesNotMatch(page, /to=["']\/admin\/inventory["']/);
  });

  it('renders required product workspace columns and deliberate mobile card layout', () => {
    for (const label of ['Product', 'Status', 'Stock', 'Category', 'Price', 'Visibility']) {
      assert.match(table, new RegExp(label), `missing product column: ${label}`);
    }
    // Deliberate desktop vs mobile responsive representations
    assert.match(table, /hidden\s+md:block/);
    assert.match(table, /md:hidden/);
    assert.match(table, /AdminStatusBadge/);
  });

  it('defines deliberate empty, loading, and recoverable error states using shared admin primitives', () => {
    assert.match(page, /No products yet|No products match your filters/);
    assert.match(page, /Products could not be loaded/);
    assert.match(page, /AdminLoadingState/);
    assert.match(page, /AdminEmptyState/);
    assert.match(page, /AdminErrorState/);
    assert.match(page, /onRetry=/);
  });

  it('organizes the editor into required groups without inventing unsupported features', () => {
    for (const section of ['General', 'Media', 'Pricing', 'Product Variants', 'Inventory', 'Product Organization', 'Store Visibility']) {
      assert.match(editor, new RegExp(section), `missing editor group: ${section}`);
    }
    // Does not invent unsupported features
    assert.doesNotMatch(editor, /Collections/);
    assert.doesNotMatch(editor, /Tags/);
    assert.doesNotMatch(editor + page + filters + table, /Barcode/i);
    assert.doesNotMatch(editor + page + filters + table, /CSV Import|CSV Export/i);
    assert.doesNotMatch(editor + page + filters + table, /Bulk Actions/i);
  });

  it('follows Charcoal + Mint design tokens and uses Admin primitives without obsolete violet styling', () => {
    const combined = page + table + filters + editor;
    assert.doesNotMatch(combined, /text-violet|bg-violet|border-violet|ring-violet/);
    assert.match(page, /AdminButton/);
    assert.match(page, /AdminPageHeader/);
    assert.match(table, /AdminButton/);
    assert.match(editor, /AdminButton/);
  });

  it('preserves existing product create, update, delete, media upload, and plan limit behavior', () => {
    assert.match(editor, /confirm\(/);
    assert.match(editor, /adminApi\.deleteProduct\(product\.id\)/);
    assert.match(editor, /adminApi\.uploadProductImage\(/);
    assert.match(editor, /features\.promotions/);
    assert.match(page, /current\.filter\(\(item\) => item\.id !== product\.id\)/);
  });

  it('keeps product data behind the existing admin API boundary', () => {
    assert.match(page, /adminApi\.listProducts/);
    assert.doesNotMatch(page + table + filters + editor, /createClient|supabase\.from|from\(['"]products['"]\)/);
  });
});

