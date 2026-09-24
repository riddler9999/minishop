import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const plan = fs.readFileSync('src/features/billing/plan.tsx', 'utf8');
const design = fs.readFileSync('src/features/shop/pages/StoreDesign.tsx', 'utf8');

test('Store Design is enabled for free trial, starter, and business', () => {
  assert.match(plan, /free_trial: CORE/);
  assert.match(plan, /starter: CORE/);
  assert.match(plan, /storeDesign: true/);
  assert.doesNotMatch(design, /if \(!features\.branding\)/);
  assert.match(design, /features\.storeDesign/);
});

test('logo and extended branding remain Business-only', () => {
  assert.match(plan, /branding: false/);
  assert.match(plan, /branding: true/);
});
