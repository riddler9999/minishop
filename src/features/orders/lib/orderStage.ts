// ---- ORDERS: Admin V3 Stage Presentation Mapping -----------------------------
// Maps canonical backend OrderStatus to seller-facing Admin V3 stages:
// Pending -> Confirmed -> Delivered -> Return.
// Backend validation, RPCs and Row Level Security remain authoritative.

import type {AdminOrder} from '@/domain/order';
import type {OrderStatus} from '@/domain/orderStatus';

export type OrderStage = 'pending' | 'confirmed' | 'delivered' | 'return' | 'cancelled';

export interface StageTab {
  id: 'all' | OrderStage;
  label: string;
}

export const ORDER_STAGE_TABS: StageTab[] = [
  {id: 'all', label: 'All'},
  {id: 'pending', label: 'Pending'},
  {id: 'confirmed', label: 'Confirmed'},
  {id: 'delivered', label: 'Delivered'},
  {id: 'return', label: 'Return'},
];

/**
 * Deterministically maps canonical backend status to seller-facing Admin V3 order stage.
 */
export function getOrderStage(status: string): OrderStage {
  switch (status) {
    case 'cod_pending':
    case 'pending_payment':
    case 'partial_checked':
      return 'pending';
    case 'checked':
    case 'shipped':
      return 'confirmed';
    case 'completed':
      return 'delivered';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'pending';
  }
}

/**
 * Returns clean English label for the seller-facing order stage.
 */
export function getOrderStageLabel(stage: OrderStage): string {
  switch (stage) {
    case 'pending':
      return 'Pending';
    case 'confirmed':
      return 'Confirmed';
    case 'delivered':
      return 'Delivered';
    case 'return':
      return 'Return';
    case 'cancelled':
      return 'Cancelled';
  }
}

/**
 * Returns badge tone for AdminStatusBadge matching the Charcoal + Mint design system.
 */
export function getOrderStageTone(stage: OrderStage): 'warning' | 'info' | 'success' | 'neutral' | 'danger' {
  switch (stage) {
    case 'pending':
      return 'warning';
    case 'confirmed':
      return 'info';
    case 'delivered':
      return 'success';
    case 'return':
      return 'neutral';
    case 'cancelled':
      return 'danger';
  }
}

export function getPaymentMethodLabel(method: string): string {
  if (method === 'kpay') return 'KBZPay';
  if (method === 'wave') return 'WavePay';
  if (method === 'cod') return 'Cash on Delivery';
  return method;
}

export interface PaymentDisplayInfo {
  label: string;
  tone: 'warning' | 'info' | 'success' | 'neutral' | 'danger';
  refTail: string | null;
  methodLabel: string;
}

export function getPaymentDisplayInfo(order: Pick<AdminOrder, 'payment_method' | 'status' | 'paymentRefTail'>): PaymentDisplayInfo {
  const methodLabel = getPaymentMethodLabel(order.payment_method);
  const isOnline = order.payment_method === 'kpay' || order.payment_method === 'wave';

  if (!isOnline) {
    if (order.status === 'completed') {
      return {label: 'Paid (COD)', tone: 'success', refTail: null, methodLabel};
    }
    if (order.status === 'cancelled') {
      return {label: 'Cancelled', tone: 'danger', refTail: null, methodLabel};
    }
    return {label: 'Pay on Delivery', tone: 'neutral', refTail: null, methodLabel};
  }

  if (order.status === 'pending_payment') {
    return {label: 'Pending verification', tone: 'warning', refTail: order.paymentRefTail ?? null, methodLabel};
  }
  if (order.status === 'partial_checked') {
    return {label: 'Deposit verified', tone: 'info', refTail: order.paymentRefTail ?? null, methodLabel};
  }
  if (order.status === 'checked' || order.status === 'shipped' || order.status === 'completed') {
    return {label: 'Verified & Paid', tone: 'success', refTail: order.paymentRefTail ?? null, methodLabel};
  }
  if (order.status === 'cancelled') {
    return {label: 'Cancelled', tone: 'danger', refTail: order.paymentRefTail ?? null, methodLabel};
  }

  return {label: 'Pending', tone: 'warning', refTail: order.paymentRefTail ?? null, methodLabel};
}

export interface FulfillmentDisplayInfo {
  label: string;
  tone: 'warning' | 'info' | 'success' | 'neutral' | 'danger';
}

export function getFulfillmentDisplayInfo(status: string): FulfillmentDisplayInfo {
  switch (status) {
    case 'shipped':
      return {label: 'Shipped (In transit)', tone: 'info'};
    case 'completed':
      return {label: 'Delivered', tone: 'success'};
    case 'cancelled':
      return {label: 'Cancelled', tone: 'danger'};
    case 'checked':
      return {label: 'Ready to ship', tone: 'warning'};
    case 'cod_pending':
    case 'pending_payment':
    case 'partial_checked':
    default:
      return {label: 'Unfulfilled', tone: 'neutral'};
  }
}

export interface AllowedTransition {
  targetStatus: OrderStatus;
  label: string;
  resultingStage: OrderStage;
  variant: 'primary' | 'mint' | 'secondary' | 'danger';
  confirmationTitle: string;
  confirmationMessage: string;
}

/**
 * Determines allowed safe mutations for the current order state.
 * Return transitions are NOT supported by the database schema (no return status),
 * so they are omitted to prevent database constraint failures.
 */
export function getAllowedStageTransitions(
  order: Pick<AdminOrder, 'status' | 'payment_method'>,
  hasPaymentVerificationFeature = false,
): AllowedTransition[] {
  const transitions: AllowedTransition[] = [];

  switch (order.status) {
    case 'cod_pending':
      transitions.push({
        targetStatus: 'checked',
        label: 'Confirm Order',
        resultingStage: 'confirmed',
        variant: 'mint',
        confirmationTitle: 'Confirm Order',
        confirmationMessage: 'Confirm this COD order? This moves the order stage to Confirmed and readies it for shipping.',
      });
      transitions.push({
        targetStatus: 'cancelled',
        label: 'Cancel Order',
        resultingStage: 'cancelled',
        variant: 'danger',
        confirmationTitle: 'Cancel Order',
        confirmationMessage: 'Are you sure you want to cancel this order? This action cannot be undone.',
      });
      break;

    case 'pending_payment':
      if (hasPaymentVerificationFeature) {
        transitions.push({
          targetStatus: 'checked',
          label: 'Verify Full Payment',
          resultingStage: 'confirmed',
          variant: 'mint',
          confirmationTitle: 'Verify Full Payment',
          confirmationMessage: 'Confirm full payment received? This marks payment as verified and moves the order to Confirmed.',
        });
        transitions.push({
          targetStatus: 'partial_checked',
          label: 'Verify Deposit Only',
          resultingStage: 'pending',
          variant: 'secondary',
          confirmationTitle: 'Verify Partial Deposit',
          confirmationMessage: 'Mark deposit payment verified? The remaining balance will remain pending.',
        });
      } else {
        transitions.push({
          targetStatus: 'checked',
          label: 'Confirm & Mark Paid',
          resultingStage: 'confirmed',
          variant: 'mint',
          confirmationTitle: 'Confirm Order',
          confirmationMessage: 'Confirm payment and approve this order? This moves the order stage to Confirmed.',
        });
      }
      transitions.push({
        targetStatus: 'cancelled',
        label: 'Cancel Order',
        resultingStage: 'cancelled',
        variant: 'danger',
        confirmationTitle: 'Cancel Order',
        confirmationMessage: 'Are you sure you want to cancel this unpaid order? This action cannot be undone.',
      });
      break;

    case 'partial_checked':
      transitions.push({
        targetStatus: 'checked',
        label: 'Verify Remaining Payment',
        resultingStage: 'confirmed',
        variant: 'mint',
        confirmationTitle: 'Verify Remaining Payment',
        confirmationMessage: 'Confirm that the remaining balance has been paid in full? This moves the order to Confirmed.',
      });
      transitions.push({
        targetStatus: 'cancelled',
        label: 'Cancel Order',
        resultingStage: 'cancelled',
        variant: 'danger',
        confirmationTitle: 'Cancel Order',
        confirmationMessage: 'Are you sure you want to cancel this partially-paid order? Note: payments must be refunded manually.',
      });
      break;

    case 'checked':
      transitions.push({
        targetStatus: 'shipped',
        label: 'Mark as Shipped',
        resultingStage: 'confirmed',
        variant: 'secondary',
        confirmationTitle: 'Mark Order as Shipped',
        confirmationMessage: 'Mark this order as shipped? This updates the fulfillment status to in transit.',
      });
      transitions.push({
        targetStatus: 'completed',
        label: 'Mark as Delivered',
        resultingStage: 'delivered',
        variant: 'mint',
        confirmationTitle: 'Mark Order as Delivered',
        confirmationMessage: 'Mark this order as delivered? This completes the order lifecycle.',
      });
      transitions.push({
        targetStatus: 'cancelled',
        label: 'Cancel Order',
        resultingStage: 'cancelled',
        variant: 'danger',
        confirmationTitle: 'Cancel Order',
        confirmationMessage: 'Are you sure you want to cancel this order? Stock is not automatically restocked under current policy.',
      });
      break;

    case 'shipped':
      transitions.push({
        targetStatus: 'completed',
        label: 'Mark as Delivered',
        resultingStage: 'delivered',
        variant: 'mint',
        confirmationTitle: 'Mark Order as Delivered',
        confirmationMessage: 'Mark this order as delivered? This completes the order lifecycle.',
      });
      transitions.push({
        targetStatus: 'cancelled',
        label: 'Cancel Order',
        resultingStage: 'cancelled',
        variant: 'danger',
        confirmationTitle: 'Cancel Order',
        confirmationMessage: 'Are you sure you want to cancel this shipped order? Stock is not automatically restocked.',
      });
      break;

    case 'completed':
    case 'cancelled':
      // Terminal states; no further transitions allowed by database state machine.
      break;
  }

  return transitions;
}
