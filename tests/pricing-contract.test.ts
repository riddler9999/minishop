import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {describe, it} from 'node:test';
import {PLAN_PRICE_KS} from '../src/domain/subscription.ts';

const sql = readFileSync(new URL('../supabase/migrations/0021_final_pricing_packaging_reconciliation.sql', import.meta.url), 'utf8');
const paymentDoc = readFileSync(new URL('../docs/PAYMENT-AUTO-PLAN.md', import.meta.url), 'utf8');

describe('Final pricing payment activation contract', () => {
  it('keeps current seller plan prices at 29k / 79k', () => {
    assert.equal(PLAN_PRICE_KS.free_trial, 0);
    assert.equal(PLAN_PRICE_KS.starter, 29000);
    assert.equal(PLAN_PRICE_KS.business, 79000);
  });

  it('latest SQL reconciliation validates the same paid amounts', () => {
    assert.match(sql, /p_amount not in \(29000, 79000\)/);
    assert.match(sql, /p_amount = 29000/);
    assert.doesNotMatch(sql, /p_amount not in \(30000, 60000\)/);
  });

  it('activates through the entitlement-aware subscription seam', () => {
    assert.match(sql, /admin_activate_subscription/);
  });

  it('documents the final pricing instead of historical amounts', () => {
    assert.match(paymentDoc, /Starter: 29,000 Ks/);
    assert.match(paymentDoc, /Business: 79,000 Ks/);
    assert.doesNotMatch(paymentDoc, /Starter: 30,000 Ks/);
    assert.doesNotMatch(paymentDoc, /Business: 60,000 Ks/);
  });
});
