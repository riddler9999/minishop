export const ORDER_PACK_TRANSACTION_ID_MAX_LENGTH = 160;

export type CreditPackRequest = {
  action: 'credit-pack';
  purchaseId: string;
  paymentIdentity: string;
  idempotencyKey: string;
};

export function buildCreditPackRequest(
  purchaseId: string,
  transactionId: string,
  idempotencyKey = crypto.randomUUID(),
): CreditPackRequest | null {
  const cleanPurchaseId = purchaseId.trim();
  const cleanTransactionId = transactionId.trim();
  const cleanIdempotencyKey = idempotencyKey.trim();
  if (!cleanPurchaseId || !cleanTransactionId || !cleanIdempotencyKey) return null;
  if (cleanTransactionId.length > ORDER_PACK_TRANSACTION_ID_MAX_LENGTH) return null;
  return {
    action: 'credit-pack',
    purchaseId: cleanPurchaseId,
    paymentIdentity: cleanTransactionId,
    idempotencyKey: cleanIdempotencyKey,
  };
}
