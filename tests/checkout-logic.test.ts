import assert from 'node:assert/strict';
import test from 'node:test';
import {isCheckoutReady, isOnlinePayment, resolveShippingFee} from '../src/features/checkout/checkoutLogic.ts';

test('live checkout uses exact zone fee and falls back to shop default', () => {
  const shippingConfig = {defaultFee: 4000, zones: [{region: 'Yangon', township: 'Bahan', fee: 2500}]};
  assert.equal(resolveShippingFee({region: 'Yangon', township: 'Bahan', live: true, shippingConfig, demoFee: 999}), 2500);
  assert.equal(resolveShippingFee({region: 'Yangon', township: 'Hlaing', live: true, shippingConfig, demoFee: 999}), 4000);
});

test('live checkout never falls back to demo fee while shipping config is unavailable', () => {
  assert.equal(resolveShippingFee({region: 'Yangon', township: 'Bahan', live: true, shippingConfig: null, demoFee: 2500}), null);
});

test('demo checkout uses demo fee and allows zero fee', () => {
  assert.equal(resolveShippingFee({region: 'Yangon', township: 'Bahan', live: false, shippingConfig: null, demoFee: 2500}), 2500);
  assert.equal(resolveShippingFee({region: 'Yangon', township: 'Bahan', live: false, shippingConfig: null, demoFee: null}), 0);
});

test('checkout readiness requires delivery fields, items and a resolved fee', () => {
  const valid = {name: 'Moe', phone: '09123456', street: '1 Main St', region: 'Yangon', township: 'Bahan', fee: 2500, itemCount: 1, method: 'cod' as const, refTail: ''};
  assert.equal(isCheckoutReady(valid), true);
  assert.equal(isCheckoutReady({...valid, phone: '123'}), false);
  assert.equal(isCheckoutReady({...valid, fee: null}), false);
  assert.equal(isCheckoutReady({...valid, itemCount: 0}), false);
});

test('online payment requires exactly five numeric reference digits', () => {
  const valid = {name: 'Moe', phone: '09123456', street: '1 Main St', region: 'Yangon', township: 'Bahan', fee: 2500, itemCount: 1, method: 'kpay' as const, refTail: '12345'};
  assert.equal(isOnlinePayment('kpay'), true);
  assert.equal(isOnlinePayment('wave'), true);
  assert.equal(isOnlinePayment('cod'), false);
  assert.equal(isCheckoutReady(valid), true);
  assert.equal(isCheckoutReady({...valid, refTail: '1234'}), false);
  assert.equal(isCheckoutReady({...valid, refTail: '12a45'}), false);
});
