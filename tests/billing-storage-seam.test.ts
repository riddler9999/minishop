import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {readFile} from 'node:fs/promises';

const storagePath = new URL('../src/features/billing/paymentProofStorage.ts', import.meta.url);
const applicationPath = new URL('../src/features/billing/application.ts', import.meta.url);
const orderPacksPath = new URL('../src/features/billing/orderPacks.ts', import.meta.url);
const subscribePath = new URL('../src/features/billing/pages/Subscribe.tsx', import.meta.url);
const billingPath = new URL('../src/features/billing/pages/Billing.tsx', import.meta.url);

describe('billing payment-proof storage seam', () => {
  it('owns validation, upload, rollback, and old-proof cleanup in one module', async () => {
    const storage = await readFile(storagePath, 'utf8');
    assert.match(storage, /validatePaymentProof/);
    assert.match(storage, /upload\(path, file/);
    assert.match(storage, /deletePaymentProof\(path\).*catch/s);
    assert.match(storage, /previousPath[\s\S]*deletePaymentProof\(previousPath\)/);
  });

  it('keeps billing persistence modules free of storage plumbing', async () => {
    const [application, orderPacks] = await Promise.all([
      readFile(applicationPath, 'utf8'),
      readFile(orderPacksPath, 'utf8'),
    ]);
    assert.doesNotMatch(application, /PAYMENT_PROOFS_BUCKET|\.storage\./);
    assert.doesNotMatch(orderPacks, /PAYMENT_PROOFS_BUCKET|\.storage\./);
  });

  it('routes both payment flows through persistWithPaymentProof', async () => {
    const [subscribe, billing] = await Promise.all([
      readFile(subscribePath, 'utf8'),
      readFile(billingPath, 'utf8'),
    ]);
    assert.match(subscribe, /persistWithPaymentProof/);
    assert.match(billing, /persistWithPaymentProof/);
    assert.doesNotMatch(subscribe, /uploadPaymentProof|deletePaymentProof/);
    assert.doesNotMatch(billing, /uploadPaymentProof|deletePaymentProof/);
  });
});
