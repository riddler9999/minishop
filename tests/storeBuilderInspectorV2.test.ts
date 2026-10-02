import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import fs from 'node:fs';

const inspectorPath = new URL('../src/features/shop/storeBuilder/Inspector.tsx', import.meta.url);
const sourcePath = new URL('../src/features/shop/storeBuilder/ProductSourceInspector.tsx', import.meta.url);

describe('Store Builder V2 contextual inspector', () => {
  it('groups supported controls into Content, Style, Layout, and Product Source', () => {
    const source = fs.readFileSync(inspectorPath, 'utf8');
    for (const label of ['Content', 'Style', 'Layout']) assert.match(source, new RegExp(label));
    assert.match(source, /Product Source/);
    assert.doesNotMatch(source, /JSON\\.stringify|JSON\\.parse|raw JSON/i);
  });

  it('keeps product source controls typed and accessible', () => {
    const source = fs.readFileSync(sourcePath, 'utf8');
    for (const token of ['Product Source', 'Manual', 'Dynamic', 'productIds', 'category', 'limit']) assert.match(source, new RegExp(token));
    assert.match(source, /aria-pressed/);
  });

  it('protects the required Product Detail Buy Now action', () => {
    const source = fs.readFileSync(inspectorPath, 'utf8');
    assert.match(source, /Buy Now/);
    assert.match(source, /protected-commerce-action|cannot.*remove|always.*enabled/i);
  });
});
