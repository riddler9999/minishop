export const ORDER_PACK_TRANSACTION_ID_MAX_LENGTH = 160;

export type CreditPackRequest = {
  action: 'credit-pack';
  purchaseId: string;
  transactionId: string;
};

export function buildCreditPackRequest(
  purchaseId: string,
  transactionId: string,
): CreditPackRequest | null {
  const cleanPurchaseId = purchaseId.trim();
  const cleanTransactionId = transactionId.trim();
  if (!cleanPurchaseId || !cleanTransactionId) return null;
  if (cleanTransactionId.length > ORDER_PACK_TRANSACTION_ID_MAX_LENGTH) return null;
  return {
    action: 'credit-pack',
    purchaseId: cleanPurchaseId,
    transactionId: cleanTransactionId,
  };
}
