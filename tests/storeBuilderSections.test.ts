import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import fs from 'node:fs';
import {createDefaultStoreDesign, validatePublishableStoreDesign} from '../src/domain/storeDesign/index.ts';
import {applyLocalEdit, createEditorState, persistEditorState} from '../src/features/shop/storeBuilder/editorState.ts';
import {
  addSection,
  eligibleSectionTypes,
  removeSection,
  reorderSection,
  setSectionEnabled,
  updateSectionSettings,
} from '../src/features/shop/storeBuilder/sectionOperations.ts';

const shellPath = new URL('../src/features/shop/storeBuilder/StoreBuilderShell.tsx', import.meta.url);
const previewPath = new URL('../src/features/shop/storeBuilder/PreviewCanvas.tsx', import.meta.url);
const inspectorPath = new URL('../src/features/shop/storeBuilder/Inspector.tsx', import.meta.url);
const treePath = new URL('../src/features/shop/storeBuilder/SectionTree.tsx', import.meta.url);
const rendererPath = new URL('../src/features/catalog/storeDesign/StorefrontRenderer.tsx', import.meta.url);

describe('Store Builder #114 section interactions', () => {
  it('uses the same selected-section state for tree, preview, and inspector', () => {
    const shell = fs.readFileSync(shellPath, 'utf8');
    const preview = fs.readFileSync(previewPath, 'utf8');
    assert.match(shell, /selectedSectionId/);
    assert.match(shell, /<SectionTree[\s\S]*onSelect={selectSection}/);
    assert.match(shell, /<PreviewCanvas[\s\S]*onSectionSelect={selectSection}/);
    assert.match(shell, /<Inspector section={selected}/);
    assert.match(preview, /<StorefrontRenderer[\s\S]*onSectionSelect={onSectionSelect}/);
  });

  it('reorders sections deterministically', () => {
    const initial = createDefaultStoreDesign();
    const [first, second] = initial.templates.home.sections;
    const moved = reorderSection(initial, 'home', second.id, -1);
    assert.deepEqual(moved.templates.home.sections.slice(0, 2).map(({id}) => id), [second.id, first.id]);
    assert.strictEqual(reorderSection(moved, 'home', second.id, -1), moved);
  });

  it('hides, shows, and removes only eligible sections', () => {
    const initial = createDefaultStoreDesign();
    const hero = initial.templates.home.sections.find((section) => section.type === 'hero')!;
    const hidden = setSectionEnabled(initial, 'home', hero.id, false);
    assert.equal(hidden.templates.home.sections.find(({id}) => id === hero.id)?.enabled, false);
    const shown = setSectionEnabled(hidden, 'home', hero.id, true);
    assert.equal(shown.templates.home.sections.find(({id}) => id === hero.id)?.enabled, true);
    assert.equal(removeSection(shown, 'home', hero.id).templates.home.sections.some(({id}) => id === hero.id), false);

    const protectedInfo = initial.templates.product.sections.find((section) => section.type === 'product-info')!;
    assert.strictEqual(setSectionEnabled(initial, 'product', protectedInfo.id, false), initial);
    assert.strictEqual(removeSection(initial, 'product', protectedInfo.id), initial);
  });

  it('does not render destructive controls for protected commerce sections', () => {
    const tree = fs.readFileSync(treePath, 'utf8');
    assert.match(tree, /definition\.hideable/);
    assert.match(tree, /definition\.removable/);
    const document = createDefaultStoreDesign();
    assert.deepEqual(validatePublishableStoreDesign(document), {ok: true, errors: []});
    assert.equal(document.globalSettings.buyNow.disabled, false);
  });

  it('adds eligible Commerce V1 sections with typed defaults and stable IDs', () => {
    const initial = createDefaultStoreDesign();
    const result = addSection(initial, 'home', 'promotion-banner', () => 'stable-123');
    assert.equal(result.section.id, 'home-promotion-banner-stable-123');
    assert.equal(result.section.type, 'promotion-banner');
    assert.deepEqual(result.section.settings, {headline: '', body: '', ctaLabel: 'ကြည့်ရန်'});
    assert.equal(result.document.templates.home.sections.at(-1)?.id, result.section.id);
    assert.ok(eligibleSectionTypes('home').includes('sale-products'));
    assert.ok(eligibleSectionTypes('product').includes('related-products'));
    assert.ok(!eligibleSectionTypes('product').includes('product-info'));
  });

  it('mutates inspector settings through the typed section contract without raw JSON', () => {
    const initial = createDefaultStoreDesign();
    const hero = initial.templates.home.sections.find((section) => section.type === 'hero')!;
    assert.equal(hero.type, 'hero');
    if (hero.type !== 'hero') throw new Error('Expected hero section');
    const updated = updateSectionSettings(initial, 'home', hero.id, 'hero', {...hero.settings, headline: 'New headline'});
    const nextHero = updated.templates.home.sections.find(({id}) => id === hero.id);
    assert.equal(nextHero?.type === 'hero' ? nextHero.settings.headline : '', 'New headline');
    assert.doesNotMatch(fs.readFileSync(inspectorPath, 'utf8'), /JSON\.stringify|JSON\.parse|raw JSON/i);
    assert.doesNotMatch(fs.readFileSync(inspectorPath, 'utf8'), /Image URL|Button label/);
  });

  it('renders every addable spacer size as visible space', () => {
    const renderer = fs.readFileSync(rendererPath, 'utf8');
    assert.match(renderer, /section\.settings\.size === 'sm' \? 'h-4'/);
    assert.match(renderer, /section\.settings\.size === 'lg' \? 'h-16' : 'h-8'/);
  });

  it('routes every section edit through the existing Draft autosave state', async () => {
    const initial = createDefaultStoreDesign();
    const added = addSection(initial, 'home', 'rich-text', () => 'autosave').document;
    const dirty = applyLocalEdit(createEditorState(initial, 12), added);
    assert.equal(dirty.status, 'dirty');
    let savedDocument = initial;
    const saved = await persistEditorState(dirty, async ({expectedRevision, document}) => {
      assert.equal(expectedRevision, 12);
      savedDocument = document;
      return {revision: 13, document};
    });
    assert.equal(saved.status, 'saved');
    assert.equal(saved.expectedRevision, 13);
    assert.ok(savedDocument.templates.home.sections.some(({id}) => id === 'home-rich-text-autosave'));
  });
});
