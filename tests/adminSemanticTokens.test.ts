import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');
const scope = css.match(/\/\* ---- Admin V2 scoped semantic tokens[\s\S]*?\*\/\s*\.admin-shell\s*\{([^}]+)\}/)?.[1];

describe('Admin V2 semantic tokens', () => {
  it('defines approved palette and admin-only semantics on admin-shell', () => {
    assert.ok(scope, 'Admin semantic tokens must be scoped to .admin-shell');
    const expected = {
      'admin-canvas': '#faf7ff',
      'admin-surface': '#ffffff',
      'admin-border': '#e7dff2',
      'admin-text': '#1f1633',
      'admin-muted': '#756b86',
      'admin-primary': '#6d28d9',
      'admin-primary-hover': '#5b21b6',
      'admin-primary-soft': '#ede9fe',
      'admin-lavender': '#c4b5fd',
      'admin-sidebar': '#1f1633',
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
    assert.match(root, /--minishop-pink:\s*#ec1f62/i);
    assert.match(commerce, /--commerce-canvas:/);
    assert.match(css, /\[data-demo-store\]\s*\{/);
  });
});
