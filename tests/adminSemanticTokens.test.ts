import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');
const scope = css.match(/\/\* ---- Admin\/editor semantic tokens[\s\S]*?\*\/\s*\.admin-shell,\s*\.store-builder-workspace\s*\{([^}]+)\}/)?.[1];

describe('Admin V3 semantic admin/editor tokens', () => {
  it('defines approved palette and shared admin/editor semantics', () => {
    assert.ok(scope, 'Admin semantic tokens must be shared by .admin-shell and .store-builder-workspace');
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
      'admin-sidebar': '#1f2421',
    };
    for (const [token, value] of Object.entries(expected)) {
      assert.match(scope!, new RegExp('--' + token + ':\\s*' + value + '\\s*;', 'i'));
    }
  });

  it('keeps buyer and demo tokens independent of the admin token scope', () => {
    assert.ok(scope);
    const root = css.match(/:root\s*\{([^}]+)\}/)?.[1] ?? '';
    const platform = css.match(/\.platform-shell\s*\{([^}]+)\}/)?.[1] ?? '';
    const commerce = css.match(/\[data-store-theme\],\s*\[data-demo-store\]\s*\{([^}]+)\}/)?.[1] ?? '';
    assert.doesNotMatch(root + platform + commerce, /--admin-/);
    assert.match(root, /--minishop-mint:\s*#35b99d/i);
    assert.match(commerce, /--commerce-canvas:/);
    assert.match(css, /\[data-demo-store\]\s*\{/);
  });
});
