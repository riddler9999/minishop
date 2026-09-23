import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const liveSchemaContract = JSON.parse(
  fs.readFileSync('supabase/live-schema-contract.json', 'utf8'),
) as {
  projectRef: string;
  capturedAt: string;
  shopsColumns: string[];
  appliedMigrations: string[];
};

test('live schema contract records the production project and known pending delivery migrations', () => {
  assert.equal(liveSchemaContract.projectRef, 'fsxdnmnycizjkgstokze');
  assert.ok(liveSchemaContract.capturedAt);
  assert.equal(liveSchemaContract.shopsColumns.includes('delivery_service'), false);
  assert.equal(liveSchemaContract.shopsColumns.includes('origin_region'), false);
  assert.equal(liveSchemaContract.shopsColumns.includes('origin_township'), false);
  assert.equal(liveSchemaContract.appliedMigrations.includes('delivery_services'), false);
  assert.equal(liveSchemaContract.appliedMigrations.includes('ninjavan_production_pricing'), false);
});

test('checked-in generated types do not claim columns absent from the captured live schema', () => {
  const types = fs.readFileSync('src/core/supabase/database.types.ts', 'utf8');
  for (const column of ['delivery_service', 'origin_region', 'origin_township']) {
    assert.doesNotMatch(types, new RegExp('\\b' + column + '\\b'), column);
  }
});
