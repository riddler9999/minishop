import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {
  PLAN_MONTHLY_QUOTA,
  FREE_TRIAL_PRODUCT_LIMIT,
  PLAN_PRODUCT_LIMIT,
  EXTRA_ORDER_UNIT_PRICE_KS,
  EXTRA_ORDER_PRESETS,
  extraOrdersPriceKs,
  canBuyExtraOrders,
  chooseConsumeSource,
  resolveEntitlementView,
  type EntitlementState,
} from '../src/domain/entitlement.ts';

const base: EntitlementState = {
  plan: 'starter',
  active: true,
  monthlyQuota: 60,
  monthlyUsed: 0,
  purchasedBalance: 0,
};

describe('plan quotas + extra-order pricing', () => {
  it('matches the final pricing quotas and product caps', () => {
    assert.equal(PLAN_MONTHLY_QUOTA.free_trial, 20);
    assert.equal(PLAN_MONTHLY_QUOTA.starter, 60);
    assert.equal(PLAN_MONTHLY_QUOTA.business, 200);
    assert.equal(FREE_TRIAL_PRODUCT_LIMIT, 10);
    assert.deepEqual(PLAN_PRODUCT_LIMIT, {free_trial: 10, starter: 100, business: 500});
  });

  it('prices Extra Orders linearly at 500/order with no volume discount', () => {
    assert.equal(EXTRA_ORDER_UNIT_PRICE_KS, 500);
    assert.deepEqual([...EXTRA_ORDER_PRESETS], [1, 5, 10, 20, 30, 50]);
    for (const n of EXTRA_ORDER_PRESETS) {
      assert.equal(extraOrdersPriceKs(n), n * 500);
    }
    // No discount: 50 costs exactly 50x a single order.
    assert.equal(extraOrdersPriceKs(50), 50 * extraOrdersPriceKs(1));
  });

  it('only paid plans may buy Extra Orders', () => {
    assert.equal(canBuyExtraOrders('free_trial'), false);
    assert.equal(canBuyExtraOrders('starter'), true);
    assert.equal(canBuyExtraOrders('business'), true);
  });
});

describe('chooseConsumeSource — monthly quota is always consumed first', () => {
  it('draws from the monthly quota while it remains', () => {
    assert.equal(chooseConsumeSource({...base, monthlyUsed: 0}), 'monthly');
    assert.equal(chooseConsumeSource({...base, monthlyUsed: 59}), 'monthly');
  });

  it('falls back to the purchased balance only once monthly is exhausted', () => {
    assert.equal(chooseConsumeSource({...base, monthlyUsed: 60, purchasedBalance: 5}), 'purchased');
  });

  it('blocks when both monthly and purchased are exhausted', () => {
    assert.equal(chooseConsumeSource({...base, monthlyUsed: 60, purchasedBalance: 0}), null);
  });

  it('an inactive (cancelled) subscription consumes nothing, even with balance', () => {
    assert.equal(chooseConsumeSource({...base, active: false, monthlyUsed: 0, purchasedBalance: 99}), null);
  });

  it('blocks a paid subscription after its cycle has expired', () => {
    assert.equal(chooseConsumeSource({...base, cycleEnd: '2000-01-01T00:00:00.000Z'}), null);
    const view = resolveEntitlementView({...base, cycleEnd: '2000-01-01T00:00:00.000Z'});
    assert.equal(view.active, false);
    assert.equal(view.totalRemaining, 0);
    assert.equal(view.canBuyExtraOrders, false);
  });

  it('free trial never consumes a purchased balance (it cannot hold one)', () => {
    const free: EntitlementState = {plan: 'free_trial', active: true, monthlyQuota: 20, monthlyUsed: 20, purchasedBalance: 99};
    assert.equal(chooseConsumeSource(free), null);
  });

  it('free trial consumes its lifetime quota until the 20th order', () => {
    assert.equal(chooseConsumeSource({plan: 'free_trial', active: true, monthlyQuota: 20, monthlyUsed: 19, purchasedBalance: 0}), 'monthly');
    assert.equal(chooseConsumeSource({plan: 'free_trial', active: true, monthlyQuota: 20, monthlyUsed: 20, purchasedBalance: 0}), null);
  });
});

describe('resolveEntitlementView', () => {
  it('keeps monthly and purchased separate and totals only usable orders', () => {
    const v = resolveEntitlementView({...base, monthlyUsed: 50, purchasedBalance: 5});
    assert.equal(v.monthlyRemaining, 10);
    assert.equal(v.purchasedBalance, 5);
    assert.equal(v.totalRemaining, 15);
    assert.equal(v.canPlaceOrder, true);
    assert.equal(v.canBuyExtraOrders, true);
  });

  it('reports nothing usable while inactive (purchased retained but frozen)', () => {
    const v = resolveEntitlementView({...base, active: false, monthlyUsed: 0, purchasedBalance: 5});
    assert.equal(v.totalRemaining, 0);
    assert.equal(v.canPlaceOrder, false);
    assert.equal(v.canBuyExtraOrders, false);
  });

  it('marks the free-trial quota as a lifetime cap and hides Extra Orders', () => {
    const v = resolveEntitlementView({plan: 'free_trial', active: true, monthlyQuota: 20, monthlyUsed: 3, purchasedBalance: 0});
    assert.equal(v.quotaIsLifetime, true);
    assert.equal(v.canBuyExtraOrders, false);
    assert.equal(v.monthlyRemaining, 17);
  });
});
