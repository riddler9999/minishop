import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import fs from 'node:fs';
import {createDefaultStoreDesign, type ProductSource} from '../src/domain/storeDesign/index.ts';
import {applyLocalEdit, createEditorState, persistEditorState} from '../src/features/shop/storeBuilder/editorState.ts';
import {updateSectionSettings} from '../src/features/shop/storeBuilder/sectionOperations.ts';

const inspectorPath = new URL('../src/features/shop/storeBuilder/ProductSourceInspector.tsx', import.meta.url);
const shellPath = new URL('../src/features/shop/storeBuilder/StoreBuilderShell.tsx', import.meta.url);

function updateFeaturedSource(source: ProductSource) {
  const document = createDefaultStoreDesign();
  const featured = document.templates.home.sections.find((section) => section.type === 'featured-products');
  if (!featured || featured.type !== 'featured-products') throw new Error('Expected featured products section');
  return updateSectionSettings(document, 'home', featured.id, featured.type, {...featured.settings, productSource: source});
}

describe('Store Builder #115 Product Source controls', () => {
  it('persists Manual product IDs in typed Draft form', async () => {
    const initial = createDefaultStoreDesign();
    const edited = updateFeaturedSource({mode: 'manual', productIds: ['product-b', 'product-a']});
    const dirty = applyLocalEdit(createEditorState(initial, 20), edited);
    let saved = initial;
    await persistEditorState(dirty, async ({document}) => {
      saved = document;
      return {revision: 21, document};
    });
    const featured = saved.templates.home.sections.find((section) => section.type === 'featured-products');
    assert.deepEqual(featured?.type === 'featured-products' ? featured.settings.productSource : null, {mode: 'manual', productIds: ['product-b', 'product-a']});
  });

  it('persists Dynamic rule, category, and limit in typed Draft form', () => {
    const edited = updateFeaturedSource({mode: 'dynamic', rule: 'category', category: 'အဝတ်အစား', limit: 12});
    const featured = edited.templates.home.sections.find((section) => section.type === 'featured-products');
    assert.deepEqual(featured?.type === 'featured-products' ? featured.settings.productSource : null, {mode: 'dynamic', rule: 'category', category: 'အဝတ်အစား', limit: 12});
  });

  it('exposes typed Manual and Dynamic controls without raw JSON', () => {
    const source = fs.readFileSync(inspectorPath, 'utf8');
    assert.match(source, /mode.*manual/);
    assert.match(source, /mode.*dynamic/);
    assert.match(source, /productIds/);
    assert.match(source, /best_selling|new_arrivals/);
    assert.match(source, /category/);
    assert.match(source, /limit/);
    assert.doesNotMatch(source, /JSON\.stringify|JSON\.parse|textarea/);
    assert.match(fs.readFileSync(shellPath, 'utf8'), /products={products} categories={categories}/);
  });
});
