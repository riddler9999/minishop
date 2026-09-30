export type BuyerRelations = {
  shops: string;
  products: string;
  paymentAccounts: string;
  shippingZones: string;
};

export const BUYER_SAFE_RELATIONS: BuyerRelations = {
  shops: 'buyer_public_shops',
  products: 'buyer_public_products',
  paymentAccounts: 'buyer_public_payment_accounts',
  shippingZones: 'buyer_public_shipping_zones',
};

export const BUYER_LEGACY_RELATIONS: BuyerRelations = {
  shops: 'shops',
  products: 'products',
  paymentAccounts: 'payment_accounts',
  shippingZones: 'shipping_zones',
};

export function isMissingBuyerProjection(error: any): boolean {
  const code = String(error?.code ?? '');
  return code === 'PGRST205' || code === '42P01';
}
