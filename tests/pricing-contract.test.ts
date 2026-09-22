import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {describe, it} from 'node:test';
import {PLAN_PRICE_KS} from '../src/domain/subscription.ts';

const sql = readFileSync(new URL('../supabase/migrations/0017_reconcile_payment_activation.sql', import.meta.url), 'utf8');
const paymentDoc = readFileSync(new URL('../docs/PAYMENT-AUTO-PLAN.md', import.meta.url), 'utf8');

describe('Pricing V1 payment activation contract', () => {
  it('keeps current seller plan prices at 30k / 60k', () => {
    assert.equal(PLAN_PRICE_KS.free_trial, 0);
    assert.equal(PLAN_PRICE_KS.starter, 30000);
    assert.equal(PLAN_PRICE_KS.business, 60000);
  });

  it('latest SQL reconciliation validates the same paid amounts', () => {
    assert.match(sql, /p_amount not in \(30000, 60000\)/);
    assert.match(sql, /p_amount = 30000/);
    assert.doesNotMatch(sql, /p_amount not in \(50000, 80000\)/);
  });

  it('activates through the entitlement-aware subscription seam', () => {
    assert.match(sql, /admin_activate_subscription/);
    assert.doesNotMatch(sql, /update public\.shops\s+set plan/);
  });

  it('documents the current pricing instead of the superseded screenshot example', () => {
    assert.match(paymentDoc, /Starter: 30,000 Ks/);
    assert.match(paymentDoc, /Business: 60,000 Ks/);
    assert.doesNotMatch(paymentDoc, /"amount": 80000/);
  });
});
