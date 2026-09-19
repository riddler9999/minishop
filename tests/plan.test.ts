import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {normalizePlan, resolvePlanValue} from '../src/lib/planRules.ts';

describe('plan rules', () => {
  it('only unlocks business for an explicit business value', () => {
    assert.equal(normalizePlan('business'), 'business');
    assert.equal(normalizePlan(' BUSINESS '), 'business');
    for (const value of [undefined, null, '', 'starter', 'enterprise', 'typo']) {
      assert.equal(normalizePlan(value), 'starter');
    }
  });

  it('prefers the database plan and otherwise fails closed', () => {
    assert.equal(resolvePlanValue('starter', 'business'), 'starter');
    assert.equal(resolvePlanValue('business', 'starter'), 'business');
    assert.equal(resolvePlanValue(null, 'business'), 'business');
    assert.equal(resolvePlanValue(null, undefined), 'starter');
  });
});
