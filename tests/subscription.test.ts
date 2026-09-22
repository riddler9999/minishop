import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {
  PLAN_PRICE_KS,
  SUBSCRIPTION_PAYMENT_METHODS,
  PAYMENT_METHOD_LABEL,
  PLATFORM_PAYMENT_RECIPIENT,
  resolveOnboardingGate,
  type ApplicationStatus,
} from '../src/domain/subscription.ts';

describe('resolveOnboardingGate', () => {
  it('an existing shop always lands on the admin console, whatever the application', () => {
    const statuses: ApplicationStatus[] = ['none', 'pending', 'approved', 'rejected'];
    for (const applicationStatus of statuses) {
      assert.equal(resolveOnboardingGate({hasShop: true, applicationStatus}), 'admin', applicationStatus);
    }
  });

  it('an approved application with no shop yet goes to onboarding (shop creation)', () => {
    assert.equal(resolveOnboardingGate({hasShop: false, applicationStatus: 'approved'}), 'onboarding');
  });

  it('none / pending / rejected (no shop) all route to the subscribe screen', () => {
    for (const applicationStatus of ['none', 'pending', 'rejected'] as ApplicationStatus[]) {
      assert.equal(resolveOnboardingGate({hasShop: false, applicationStatus}), 'subscribe', applicationStatus);
    }
  });
});

describe('subscription pricing + payment config', () => {
  it('prices match the finalized pricing V1 monthly fees', () => {
    assert.equal(PLAN_PRICE_KS.free_trial, 0);
    assert.equal(PLAN_PRICE_KS.starter, 30000);
    assert.equal(PLAN_PRICE_KS.business, 60000);
  });

  it('the three payment methods each have a label', () => {
    assert.deepEqual(SUBSCRIPTION_PAYMENT_METHODS, ['kpay', 'wave', 'aya']);
    for (const m of SUBSCRIPTION_PAYMENT_METHODS) {
      assert.ok(PAYMENT_METHOD_LABEL[m], m);
    }
  });

  it('exposes the platform collection account', () => {
    assert.equal(PLATFORM_PAYMENT_RECIPIENT.phone, '09969222535');
    assert.equal(PLATFORM_PAYMENT_RECIPIENT.name, 'MOE HTET KYAW');
  });
});
