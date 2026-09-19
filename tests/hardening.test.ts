import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {readFile} from 'node:fs/promises';

const migrationPath = new URL('../supabase/migrations/0007_production_hardening.sql', import.meta.url);

describe('production hardening migration', () => {
  it('keeps inventory updates atomic and locked', async () => {
    const sql = await readFile(migrationPath, 'utf8');
    assert.match(sql, /for update;/i);
    assert.match(sql, /set stock = stock - v_qty/i);
    assert.match(sql, /insufficient_stock/i);
  });

  it('protects commercial fields and anonymous RPCs', async () => {
    const sql = await readFile(migrationPath, 'utf8');
    assert.match(sql, /plan_is_platform_managed/i);
    assert.match(sql, /billing_fields_are_platform_managed/i);
    assert.match(sql, /enforce_rate_limit\('place_order'/i);
    assert.match(sql, /revoke all on function public\.rls_auto_enable/i);
  });

  it('enforces storage limits server-side', async () => {
    const sql = await readFile(migrationPath, 'utf8');
    assert.match(sql, /file_size_limit = 5242880/i);
    assert.match(sql, /image\/png/i);
    assert.match(sql, /image\/webp/i);
  });
});
