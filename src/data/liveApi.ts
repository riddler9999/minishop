// ---- DATA: live (Supabase) API composition ----------------------------------
// The storefront `api` and seller `adminApi` are assembled here from each
// feature's own data-access module — no feature imports another feature's
// queries, and no single file owns the whole backend surface any more.
//
// This is the ONLY module allowed to reach across every feature boundary; the
// ESLint boundary rules in eslint.config.js enforce that. Pages never import it
// directly either: they go through src/data/dataSource.ts, which decides at
// each property access whether the live or the demo backend answers.

import {billingApi} from '@/features/billing/api';
import {catalogAdminApi} from '@/features/catalog/api/admin';
import {catalogStorefrontApi} from '@/features/catalog/api/storefront';
import {checkoutApi} from '@/features/checkout/api';
import {orderAdminApi} from '@/features/orders/api/admin';
import {orderLookupApi} from '@/features/orders/api/storefront';
import {shippingAdminApi} from '@/features/shipping/api';
import {paymentAccountsApi} from '@/features/shop/api/paymentAccounts';
import {shopSettingsApi} from '@/features/shop/api/settings';
import {shopStorageApi} from '@/features/shop/api/storage';

/** Buyer-facing surface: catalog reads, checkout, order lookup. */
export const api = {
  ...catalogStorefrontApi,
  ...checkoutApi,
  ...orderLookupApi,
};

/** Seller-facing surface: everything behind RequireAdmin. */
export const adminApi = {
  ...catalogAdminApi,
  ...orderAdminApi,
  ...shippingAdminApi,
  ...shopSettingsApi,
  ...paymentAccountsApi,
  ...shopStorageApi,
  ...billingApi,
};
