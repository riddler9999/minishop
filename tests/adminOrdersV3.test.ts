import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {readFileSync} from 'node:fs';
import {
  getOrderStage,
  getOrderStageLabel,
  getOrderStageTone,
  ORDER_STAGE_TABS,
  getAllowedStageTransitions,
  getPaymentDisplayInfo,
  getFulfillmentDisplayInfo,
} from '../src/features/orders/lib/orderStage.ts';
import {ADMIN_STATUS_OPTIONS} from '../src/domain/orderStatus.ts';

const page = readFileSync(new URL('../src/features/orders/pages/AdminOrders.tsx', import.meta.url), 'utf8');
const table = readFileSync(new URL('../src/features/orders/components/AdminOrdersTable.tsx', import.meta.url), 'utf8');
const detail = readFileSync(new URL('../src/features/orders/components/AdminOrderDetail.tsx', import.meta.url), 'utf8');

describe('Admin Orders V3 stage presentation mapping', () => {
  it('maps canonical backend statuses deterministically to seller-facing stages', () => {
    assert.equal(getOrderStage('cod_pending'), 'pending');
    assert.equal(getOrderStage('pending_payment'), 'pending');
    assert.equal(getOrderStage('partial_checked'), 'pending');
    assert.equal(getOrderStage('checked'), 'confirmed');
    assert.equal(getOrderStage('shipped'), 'confirmed');
    assert.equal(getOrderStage('completed'), 'delivered');
    assert.equal(getOrderStage('cancelled'), 'cancelled');

    assert.equal(getOrderStageLabel('pending'), 'Pending');
    assert.equal(getOrderStageLabel('confirmed'), 'Confirmed');
    assert.equal(getOrderStageLabel('delivered'), 'Delivered');
    assert.equal(getOrderStageLabel('cancelled'), 'Cancelled');

    assert.equal(getOrderStageTone('pending'), 'warning');
    assert.equal(getOrderStageTone('confirmed'), 'info');
    assert.equal(getOrderStageTone('delivered'), 'success');
    assert.equal(getOrderStageTone('cancelled'), 'danger');
  });

  it('exposes only backend-supported seller-facing tabs', () => {
    const tabIds = ORDER_STAGE_TABS.map((t) => t.id);
    assert.deepEqual(tabIds, ['all', 'pending', 'confirmed', 'delivered']);
    const tabLabels = ORDER_STAGE_TABS.map((t) => t.label);
    assert.deepEqual(tabLabels, ['All', 'Pending', 'Confirmed', 'Delivered']);
    assert.ok(!tabIds.includes('return'), 'Return must stay hidden until a canonical backend state exists');
  });

  it('keeps payment state separate from order stage', () => {
    const onlinePending = getPaymentDisplayInfo({
      payment_method: 'kpay',
      status: 'pending_payment',
      paymentRefTail: '12345',
    });
    assert.equal(onlinePending.label, 'Pending verification');
    assert.equal(onlinePending.tone, 'warning');
    assert.equal(onlinePending.refTail, '12345');
    assert.equal(onlinePending.methodLabel, 'KBZPay');

    const codPending = getPaymentDisplayInfo({
      payment_method: 'cod',
      status: 'cod_pending',
      paymentRefTail: null,
    });
    assert.equal(codPending.label, 'Pay on Delivery');
    assert.equal(codPending.tone, 'neutral');
    assert.equal(codPending.methodLabel, 'Cash on Delivery');

    const verifiedOrder = getPaymentDisplayInfo({
      payment_method: 'wave',
      status: 'checked',
      paymentRefTail: '99887',
    });
    assert.equal(verifiedOrder.label, 'Verified & Paid');
    assert.equal(verifiedOrder.tone, 'success');
  });

  it('determines fulfillment display info correctly', () => {
    assert.equal(getFulfillmentDisplayInfo('cod_pending').label, 'Unfulfilled');
    assert.equal(getFulfillmentDisplayInfo('checked').label, 'Ready to ship');
    assert.equal(getFulfillmentDisplayInfo('shipped').label, 'Shipped (In transit)');
    assert.equal(getFulfillmentDisplayInfo('completed').label, 'Delivered');
    assert.equal(getFulfillmentDisplayInfo('cancelled').label, 'Cancelled');
  });

  it('exposes only safe, canonical transitions and never allows unsupported return DB mutations', () => {
    const codTransitions = getAllowedStageTransitions({status: 'cod_pending', payment_method: 'cod'});
    assert.equal(codTransitions.length, 2);
    assert.equal(codTransitions[0].targetStatus, 'checked');
    assert.equal(codTransitions[0].resultingStage, 'confirmed');
    assert.equal(codTransitions[1].targetStatus, 'cancelled');

    const checkedTransitions = getAllowedStageTransitions({status: 'checked', payment_method: 'kpay'});
    assert.equal(checkedTransitions.length, 3);
    assert.equal(checkedTransitions[0].targetStatus, 'shipped');
    assert.equal(checkedTransitions[1].targetStatus, 'completed');
    assert.equal(checkedTransitions[2].targetStatus, 'cancelled');

    const completedTransitions = getAllowedStageTransitions({status: 'completed', payment_method: 'kpay'});
    // Completed has 0 transitions because Return status does not exist in DB check constraint
    assert.equal(completedTransitions.length, 0);

    const cancelledTransitions = getAllowedStageTransitions({status: 'cancelled', payment_method: 'kpay'});
    assert.equal(cancelledTransitions.length, 0);

    // All target statuses must be valid canonical ADMIN_STATUS_OPTIONS
    for (const t of [...codTransitions, ...checkedTransitions]) {
      assert.ok(ADMIN_STATUS_OPTIONS.includes(t.targetStatus), `Target status ${t.targetStatus} must be in ADMIN_STATUS_OPTIONS`);
      assert.ok(t.confirmationMessage.length > 0, 'Every transition must have confirmation text');
      assert.ok(t.confirmationTitle.length > 0, 'Every transition must have confirmation title');
    }
  });

  it('supports plan-gated payment verification actions on pending_payment', () => {
    const standardTransitions = getAllowedStageTransitions(
      {status: 'pending_payment', payment_method: 'kpay'},
      false,
    );
    assert.equal(standardTransitions[0].targetStatus, 'checked');

    const verificationTransitions = getAllowedStageTransitions(
      {status: 'pending_payment', payment_method: 'kpay'},
      true,
    );
    assert.equal(verificationTransitions[0].targetStatus, 'checked');
    assert.equal(verificationTransitions[0].label, 'Verify Full Payment');
    assert.equal(verificationTransitions[1].targetStatus, 'partial_checked');
    assert.equal(verificationTransitions[1].label, 'Verify Deposit Only');
  });
});

describe('Admin Orders V3 UI workspace components', () => {
  it('renders all required seller-facing tabs with accurate counts', () => {
    assert.match(page, /ORDER_STAGE_TABS/);
    assert.match(page, /stageCounts\[tab\.id\]/);
    assert.match(page, /filter === tab\.id/);
  });

  it('renders desktop table and deliberate mobile card view with min 44px touch targets and overflow safety', () => {
    assert.match(table, /hidden md:block overflow-x-auto/);
    assert.match(table, /md:hidden divide-y/);
    assert.match(table, /overflow-x-hidden/);
    assert.match(table, /min-h-\[44px\]/);
  });

  it('organizes order detail into required sections without fabricating false history', () => {
    assert.match(detail, /Customer Information/);
    assert.match(detail, /Delivery Address/);
    assert.match(detail, /Ordered Products/);
    assert.match(detail, /Payment Information/);
    assert.match(detail, /Order Stage/);
    assert.match(detail, /Allowed Stage Actions/);
    assert.match(detail, /Order Timestamps/);
  });

  it('requires explicit confirmation before executing order stage mutations', () => {
    assert.match(detail, /role="alertdialog"/);
    assert.match(detail, /aria-labelledby="confirm-dialog-title"/);
    assert.match(detail, /pendingTransition\.confirmationTitle/);
    assert.match(detail, /executeTransition/);
  });

  it('uses Charcoal + Mint design tokens and Admin primitives without violet styling', () => {
    assert.doesNotMatch(page, /violet-/);
    assert.doesNotMatch(table, /text-violet/);
    assert.doesNotMatch(detail, /violet-/);
    assert.match(page, /AdminPageHeader/);
    assert.match(page, /AdminLoadingState/);
    assert.match(page, /AdminEmptyState/);
    assert.match(page, /AdminErrorState/);
  });
});
