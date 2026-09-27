import assert from 'node:assert/strict';
import test from 'node:test';
import {EXTRA_ORDER_UNIT_PRICE_KS, PLAN_MONTHLY_QUOTA, PLAN_PRODUCT_LIMIT} from '../src/domain/entitlement.ts';
import {PLAN_PRICE_KS} from '../src/domain/subscription.ts';
import {pricingPlans, signupHref} from '../src/features/landing/pricing.ts';

test('landing pricing consumes the canonical commercial contract for every plan', () => {
  assert.deepEqual(pricingPlans.map(({plan, price}) => ({plan, price})), [
    {plan: 'free_trial', price: PLAN_PRICE_KS.free_trial},
    {plan: 'starter', price: PLAN_PRICE_KS.starter},
    {plan: 'business', price: PLAN_PRICE_KS.business},
  ]);

  for (const pricingPlan of pricingPlans) {
    assert.ok(pricingPlan.features.some((feature) => feature.includes(String(PLAN_MONTHLY_QUOTA[pricingPlan.plan]))));
    assert.ok(pricingPlan.features.some((feature) => feature.includes(String(PLAN_PRODUCT_LIMIT[pricingPlan.plan]))));
  }

  assert.ok(pricingPlans.find(({plan}) => plan === 'starter')?.features.includes(`Extra Orders = ${EXTRA_ORDER_UNIT_PRICE_KS.toLocaleString()} Ks / order`));
  assert.equal(pricingPlans.find(({plan}) => plan === 'starter')?.priceSuffix, '/ လ');
  assert.equal(pricingPlans.find(({plan}) => plan === 'business')?.priceSuffix, '/ လ');
});

test('landing pricing sends each CTA through signup to the matching subscription route', () => {
  assert.equal(signupHref('free_trial'), '/admin/login?mode=signup&from=%2Fadmin%2Fsubscribe%3Fplan%3Dfree_trial');
  assert.equal(signupHref('starter'), '/admin/login?mode=signup&from=%2Fadmin%2Fsubscribe%3Fplan%3Dstarter');
  assert.equal(signupHref('business'), '/admin/login?mode=signup&from=%2Fadmin%2Fsubscribe%3Fplan%3Dbusiness');
  assert.equal(signupHref(), '/admin/login?mode=signup&from=%2Fadmin%2Fsubscribe');
});
