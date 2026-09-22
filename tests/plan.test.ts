import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {normalizePlan, resolvePlanValue} from '../src/domain/plan.ts';

describe('plan rules', () => {
  it('only unlocks business for an explicit business value', () => {
    assert.equal(normalizePlan('business'), 'business');
    assert.equal(normalizePlan(' BUSINESS '), 'business');
  });

  it('recognises each explicit tier, and fails closed to free_trial otherwise', () => {
    assert.equal(normalizePlan('starter'), 'starter');
    assert.equal(normalizePlan('free_trial'), 'free_trial');
    // Anything unknown/missing/malformed must never unlock a higher tier — it
    // fails closed to the least-privileged tier (free_trial), smaller quota than
    // starter and no paid features/add-ons.
    for (const value of [undefined, null, '', 'enterprise', 'typo']) {
      assert.equal(normalizePlan(value), 'free_trial');
    }
  });

  it('prefers the database plan and otherwise fails closed', () => {
    assert.equal(resolvePlanValue('starter', 'business'), 'starter');
    assert.equal(resolvePlanValue('business', 'starter'), 'business');
    assert.equal(resolvePlanValue(null, 'business'), 'business');
    assert.equal(resolvePlanValue(null, undefined), 'free_trial');
  });
});
