import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');
const shell = fs.readFileSync(new URL('../src/features/shop/storeBuilder/StoreBuilderShell.tsx', import.meta.url), 'utf8');

const editorScope = css.match(/\/\* ---- Admin\/editor semantic tokens[\s\S]*?\*\/\s*\.admin-shell,\s*\.store-builder-workspace\s*\{([^}]+)\}/)?.[1];

describe('Admin V3 semantic admin/editor token layer', () => {
  it('shares one approved Charcoal + Mint token contract across admin and Store Builder chrome', () => {
    assert.ok(editorScope, 'Expected a shared .admin-shell, .store-builder-workspace semantic token scope');
    const expected = {
      'admin-canvas': '#f4f7f5',
      'admin-surface': '#ffffff',
      'admin-border': '#e1e7e3',
      'admin-text': '#1f2421',
      'admin-muted': '#66706c',
      'admin-primary': '#35b99d',
      'admin-primary-hover': '#29957f',
      'admin-primary-soft': '#d8f1ea',
      'admin-mint': '#8fd7c6',
    };
    for (const [token, value] of Object.entries(expected)) {
      assert.match(editorScope!, new RegExp('--' + token + ':\\s*' + value + '\\s*;', 'i'));
    }
  });

  it('uses semantic variables instead of approved palette hex literals in StoreBuilderShell chrome', () => {
    for (const value of ['#F4F7F5', '#1F2421', '#E1E7E3', '#D8F1EA', '#35B99D', '#66706C', '#29957F']) {
      assert.doesNotMatch(shell, new RegExp(value, 'i'));
    }
    assert.match(shell, /var\(--admin-canvas\)/);
    assert.match(shell, /var\(--admin-primary\)/);
    assert.match(shell, /var\(--admin-border\)/);
  });

  it('keeps storefront theme and commerce token scopes independent', () => {
    const root = css.match(/:root\s*\{([^}]+)\}/)?.[1] ?? '';
    const commerce = css.match(/\[data-store-theme\],\s*\[data-demo-store\]\s*\{([^}]+)\}/)?.[1] ?? '';
    assert.doesNotMatch(root + commerce, /--admin-/);
  });
});
