// ---- SHOP: KBZPay / WavePay payout accounts ---------------------------------
// The accounts a buyer is told to transfer to. Manual verification for MVP:
// the buyer types the transfer's last 5 digits, the seller matches it.

import {requireSupabase} from '@/core/supabase/client';
import type {TablesInsert, TablesUpdate} from '@/core/supabase/database.types';
import type {PaymentAccount, PaymentAccountInput, PaymentAccountPatch} from '@/domain/shop';
import {resolveOwnShopId} from '@/features/tenancy/ownShop';

function mapPaymentAccount(row: {
  id: string;
  provider: string;
  account_name: string;
  phone: string;
  is_active: boolean;
}): PaymentAccount {
  return {
    id: row.id,
    provider: row.provider as 'kpay' | 'wave',
    accountName: row.account_name,
    phone: row.phone,
    isActive: row.is_active,
  };
}

export const paymentAccountsApi = {
  // ---- payment accounts (KBZPay / WavePay, owner self-service) ---------------
  async listPaymentAccounts(): Promise<{accounts: PaymentAccount[]}> {
    const shopId = await resolveOwnShopId();
    const sb = requireSupabase();
    const {data, error} = await sb
      .from('payment_accounts')
      .select('id, provider, account_name, phone, is_active')
      .eq('shop_id', shopId)
      .order('provider', {ascending: true});
    if (error) throw new Error(error.message);
    return {accounts: (data ?? []).map(mapPaymentAccount)};
  },

  async createPaymentAccount(input: PaymentAccountInput): Promise<{account: PaymentAccount}> {
    const shopId = await resolveOwnShopId();
    const sb = requireSupabase();
    const row: TablesInsert<'payment_accounts'> = {
      shop_id: shopId,
      provider: input.provider,
      account_name: input.accountName,
      phone: input.phone,
      is_active: input.isActive ?? true,
    };
    const {data, error} = await sb
      .from('payment_accounts')
      .insert(row)
      .select('id, provider, account_name, phone, is_active')
      .maybeSingle();
    if (error || !data) throw new Error(error?.message || 'ငွေပေးချေမှုအကောင့် ဖန်တီး၍မရပါ။');
    return {account: mapPaymentAccount(data)};
  },

  async updatePaymentAccount(id: string, patch: PaymentAccountPatch): Promise<{account: PaymentAccount}> {
    const shopId = await resolveOwnShopId();
    const sb = requireSupabase();
    const dbPatch: TablesUpdate<'payment_accounts'> = {};
    if (patch.accountName !== undefined) dbPatch.account_name = patch.accountName;
    if (patch.phone !== undefined) dbPatch.phone = patch.phone;
    if (patch.isActive !== undefined) dbPatch.is_active = patch.isActive;
    const {data, error} = await sb
      .from('payment_accounts')
      .update(dbPatch)
      .eq('id', id)
      .eq('shop_id', shopId)
      .select('id, provider, account_name, phone, is_active')
      .maybeSingle();
    if (error || !data) throw new Error(error?.message || 'ငွေပေးချေမှုအကောင့် ရှာမတွေ့ပါ။');
    return {account: mapPaymentAccount(data)};
  },

  async deletePaymentAccount(id: string): Promise<{ok: true}> {
    const shopId = await resolveOwnShopId();
    const sb = requireSupabase();
    const {data, error} = await sb
      .from('payment_accounts')
      .delete()
      .eq('id', id)
      .eq('shop_id', shopId)
      .select('id')
      .maybeSingle();
    if (error || !data) throw new Error(error?.message || 'ငွေပေးချေမှုအကောင့် ရှာမတွေ့ပါ။');
    return {ok: true};
  },
};
