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

  it('renders required product workspace columns', () => {
    for (const label of ['Product', 'Status', 'Stock', 'Category', 'Price', 'Visibility']) {
      assert.match(table, new RegExp(label), `missing product column: ${label}`);
    }
  });

  it('defines deliberate empty and recoverable error states', () => {
    assert.match(page, /No products yet|No products match your filters/);
    assert.match(page, /Products could not be loaded/);
    assert.match(page, /Retry/);
  });

  it('groups the editor without inventing unsupported variants', () => {
    for (const section of ['General', 'Media', 'Pricing', 'Inventory', 'Store Visibility']) {
      assert.match(editor, new RegExp(section), `missing editor group: ${section}`);
    }
    assert.doesNotMatch(editor, /Variants/);
  });

  it('keeps product data behind the existing admin API boundary', () => {
    assert.match(page, /adminApi\.listProducts/);
    assert.doesNotMatch(page + table + filters + editor, /createClient|supabase\.from|from\(['"]products['"]\)/);
  });
});
