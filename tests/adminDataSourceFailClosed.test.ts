import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import fs from 'node:fs';
const source = fs.readFileSync(new URL('../src/data/dataSource.ts', import.meta.url), 'utf8');
describe('admin data source fail-closed behavior', () => {
  it('preserves only the explicit demo-admin switch', () => {
    assert.match(source, /localStorage\.getItem\(['"]minishop_demo_admin['"]\) === ['"]true['"]/);
    assert.doesNotMatch(source, /\|\|\s*!isSupabaseConfigured/);
  });
  it('never catches live admin failures and substitutes demo admin data', () => {
    assert.doesNotMatch(source, /Promise<unknown>\)\.catch\(\(\) =>[\s\S]*demoAdminApi/);
    assert.doesNotMatch(source, /catch\s*\{[\s\S]*demoAdminApi/);
  });
  it('never substitutes demo methods for missing live admin properties', () => {
    assert.doesNotMatch(source, /if\s*\(value === undefined\)[\s\S]*demoAdminApi/);
  });
});
