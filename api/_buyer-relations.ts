export const BUYER_SAFE_RELATIONS = {
  shops: 'buyer_public_shops',
  products: 'buyer_public_products',
  paymentAccounts: 'buyer_public_payment_accounts',
  shippingZones: 'buyer_public_shipping_zones',
} as const;

export const BUYER_LEGACY_RELATIONS = {
  shops: 'shops',
  products: 'products',
  paymentAccounts: 'payment_accounts',
  shippingZones: 'shipping_zones',
} as const;

export function isMissingBuyerProjection(error: any): boolean {
  const code = String(error?.code ?? '');
  return code === 'PGRST205' || code === '42P01';
}
