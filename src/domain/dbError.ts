// ---- SHARED DB-ERROR CATALOG ------------------------------------------------
// Single source of truth for the typed exceptions the Supabase backend raises
// (`place_order()` / `lookup_order()` RPCs + the platform-managed-field triggers
// in 0007_production_hardening.sql). Postgres `raise exception '<code>'` surfaces
// through supabase-js as `error.message` — raw, English, and not buyer/seller
// friendly. This module is the ONE place that turns each code into Burmese UI
// copy, so the storefront and admin console never drift or show a raw code.
//
// Pure leaf (domain layer): no React, no I/O, no other layer — matches the
// `orderStatus.ts` pattern. Every feature `api/` module maps at its boundary via
// `mapDbError()` instead of surfacing `error.message` directly.

// Every typed code the DB may raise. Two codes carry a `:<uuid>` suffix
// (`raise exception 'product_unavailable:%'`); `mapDbError` strips it.
export type DbErrorCode =
  // Rate limiting (private.enforce_rate_limit)
  | 'rate_limit_exceeded'
  // Platform-managed field guards (shops / orders triggers)
  | 'plan_is_platform_managed'
  | 'owner_is_platform_managed'
  | 'business_plan_required'
  | 'billing_fields_are_platform_managed'
  // Shop-application gate guards (shop_applications trigger, 0010)
  | 'application_status_is_platform_managed'
  | 'application_owner_is_immutable'
  | 'application_already_approved'
  // Payment-proof verification (0011)
  | 'transaction_id_required'
  | 'unsupported_plan_amount'
  | 'receiver_name_mismatch'
  | 'verification_confidence_too_low'
  | 'payment_proof_not_found'
  | 'duplicate_transaction_id'
  | 'purchase_already_approved'
  | 'transaction_id_is_platform_managed'
  // Entitlements / pricing V1 (place_order + product/entitlement guards, 0016)
  | 'order_quota_exhausted'
  | 'subscription_inactive'
  | 'product_limit_reached'
  | 'extra_orders_not_available'
  // Owner-only entitlement RPC guards (service_role; sellers rarely see these)
  | 'duplicate_payment'
  | 'invalid_credit_quantity'
  | 'unknown_purchase'
  | 'unknown_shop'
  | 'invalid_plan'
  // place_order() validation
  | 'invalid_payment_method'
  | 'invalid_cart'
  | 'invalid_customer'
  | 'invalid_payment_reference'
  | 'shop_not_found'
  | 'duplicate_order_limit'
  | 'ninjavan_origin_missing'
  | 'ninjavan_route_unavailable'
  | 'ninjavan_rates_missing'
  | 'invalid_cart_item'
  | 'invalid_quantity'
  | 'product_unavailable'
  | 'insufficient_stock'
  | 'empty_cart'
  // lookup_order() validation
  | 'invalid_lookup'
  | 'order_not_found';

// Burmese, user-facing. Keep these buyer/seller-readable, not diagnostic.
export const DB_ERROR_MESSAGES: Record<DbErrorCode, string> = {
  rate_limit_exceeded: 'တောင်းဆိုမှုများလွန်းနေပါတယ်။ ခဏနားပြီး ပြန်ကြိုးစားပါ။',
  plan_is_platform_managed: 'Plan ပြောင်းရန် Platform Admin ကိုဆက်သွယ်ပါ။',
  owner_is_platform_managed: 'ဆိုင်ပိုင်ရှင် အချက်အလက်ကို ပြောင်းလဲ၍မရပါ — Platform Admin ကိုဆက်သွယ်ပါ။',
  business_plan_required: 'ဒီလုပ်ဆောင်ချက်ကို Business Plan မှာသာ အသုံးပြုနိုင်ပါတယ်။',
  billing_fields_are_platform_managed:
    'ငွေတောင်းခံမှုဆိုင်ရာ အချက်အလက်ကို ပြောင်းလဲ၍မရပါ — Platform မှ စီမံခန့်ခွဲပါသည်။',
  application_status_is_platform_managed:
    'အတည်ပြုမှု အခြေအနေကို ကိုယ်တိုင် ပြောင်းလဲ၍မရပါ — Platform Admin မှ စိစစ်အတည်ပြုပါသည်။',
  application_owner_is_immutable: 'လျှောက်လွှာ ပိုင်ရှင်ကို ပြောင်းလဲ၍မရပါ။',
  application_already_approved:
    'သင့်လျှောက်လွှာကို အတည်ပြုပြီးဖြစ်ပါသည် — ဆိုင်ဖွင့်ရန် ဆက်လက်လုပ်ဆောင်ပါ။',
  transaction_id_required: 'ငွေလွှဲ Transaction ID မတွေ့ပါ — ငွေလွှဲအထောက်အထားကို ပြန်စစ်ပါ။',
  unsupported_plan_amount: 'ငွေလွှဲပမာဏသည် ရွေးထားသော Plan ဈေးနှုန်းနှင့် မကိုက်ညီပါ။',
  receiver_name_mismatch: 'ငွေလက်ခံသူအမည် မကိုက်ညီပါ — ငွေလွှဲအထောက်အထားကို ပြန်စစ်ပါ။',
  verification_confidence_too_low: 'ငွေလွှဲအထောက်အထားကို အလိုအလျောက် အတည်ပြုရန် မသေချာသေးပါ — လူကိုယ်တိုင် စစ်ဆေးရန် လိုအပ်ပါသည်။',
  payment_proof_not_found: 'ငွေလွှဲအထောက်အထား ရှာမတွေ့ပါ — ပြန်တင်ပြီး ထပ်ကြိုးစားပါ။',
  duplicate_transaction_id: 'ဒီ Transaction ID ကို အသုံးပြုပြီးဖြစ်ပါသည်။',
  purchase_already_approved: 'ဒီ Extra Orders ဝယ်ယူမှုကို အတည်ပြုပြီးဖြစ်ပါသည်။',
  transaction_id_is_platform_managed: 'Transaction ID ကို ကိုယ်တိုင် ပြောင်းလဲ၍မရပါ — Platform မှ စီမံခန့်ခွဲပါသည်။',
  order_quota_exhausted:
    'ဆိုင်၏ order လက်ခံနိုင်မှု ကန့်သတ်ချက် ပြည့်သွားပါပြီ — ဆိုင်ရှင်ကို ဆက်သွယ်ပါ။',
  subscription_inactive:
    'ဆိုင်သည် ယာယီ order လက်ခံနိုင်ခြင်း မရှိသေးပါ — ဆိုင်ရှင်ကို ဆက်သွယ်ပါ။',
  product_limit_reached:
    'လက်ရှိ Plan ၏ Product အရေအတွက် ကန့်သတ်ချက် ပြည့်သွားပါပြီ — မလိုတော့သော Product ကို ဖျက်ပါ သို့မဟုတ် Plan upgrade လုပ်ပါ။',
  extra_orders_not_available:
    'Extra Orders ဝယ်ယူခြင်းကို Starter / Business plan (active) တွင်သာ အသုံးပြုနိုင်ပါသည်။',
  duplicate_payment: 'ဤငွေပေးချေမှုကို ထည့်သွင်းပြီးဖြစ်ပါသည်။',
  invalid_credit_quantity: 'Extra Orders အရေအတွက် မမှန်ပါ။',
  unknown_purchase: 'Extra Orders ဝယ်ယူမှု ရှာမတွေ့ပါ။',
  unknown_shop: 'ဆိုင် ရှာမတွေ့ပါ။',
  invalid_plan: 'Plan အမျိုးအစား မမှန်ပါ။',
  invalid_payment_method: 'ငွေပေးချေမှုနည်းလမ်း မမှန်ပါ။',
  invalid_cart: 'Shopping Cart အချက်အလက် မမှန်ပါ။',
  invalid_customer: 'ဝယ်ယူသူ အချက်အလက် (အမည် / ဖုန်း / လိပ်စာ) မမှန်ပါ။',
  invalid_payment_reference: 'ငွေလွှဲ လုပ်ဆောင်မှုနံပါတ်၏ နောက်ဆုံး ဂဏန်း ၅ လုံးကို မှန်ကန်စွာ ဖြည့်ပါ။',
  shop_not_found: 'ဆိုင် ရှာမတွေ့ပါ။',
  duplicate_order_limit: 'ဒီ Order ကို ထပ်တင်ထားပြီးဖြစ်နိုင်ပါတယ်။',
  ninjavan_origin_missing: 'ဆိုင်၏ Ninja Van ပို့မည့်နေရာ မသတ်မှတ်ရသေးပါ။',
  ninjavan_route_unavailable: 'ဒီနေရာအတွက် Ninja Van ပို့ခ မရရှိသေးပါ — အခြားပို့ဆောင်မှုကို ရွေးပါ။',
  ninjavan_rates_missing: 'Ninja Van ပို့ခဒေတာ မရရှိသေးပါ — Platform Admin ကိုဆက်သွယ်ပါ။',
  invalid_cart_item: 'ခြင်းထဲက ပစ္စည်း အချက်အလက် မမှန်ပါ။',
  invalid_quantity: 'ပစ္စည်း အရေအတွက် မမှန်ပါ။',
  product_unavailable: 'ပစ္စည်းအချို့ မရရှိတော့ပါ — refresh လုပ်ပြီး ပြန်စမ်းကြည့်ပါ။',
  insufficient_stock: 'ပစ္စည်းအချို့ လက်ကျန် မလုံလောက်တော့ပါ — အရေအတွက် လျှော့ပြီး ပြန်ကြိုးစားပါ။',
  empty_cart: 'ခြင်းထဲတွင် ပစ္စည်းမရှိပါ။',
  invalid_lookup: 'ရှာဖွေမှု အချက်အလက် မမှန်ပါ — ဖုန်းနံပါတ်နှင့် Order နံပါတ် စစ်ဆေးပါ။',
  order_not_found: 'Order ရှာမတွေ့ပါ။',
};

// Generic fallback when the code is unknown (or the failure isn't a typed code
// at all — network, RLS denial, etc.). Callers pass a context-specific fallback.
export const DEFAULT_DB_ERROR_MESSAGE = 'တစ်ခုခု မှားယွင်းနေပါသည် — ပြန်လည်ကြိုးစားပါ။';

// Longer codes first so a substring scan matches `invalid_cart_item` before
// `invalid_cart`, and `insufficient_stock` before any shorter prefix.
const CODES_BY_LENGTH = (Object.keys(DB_ERROR_MESSAGES) as DbErrorCode[]).sort(
  (a, b) => b.length - a.length,
);

// Resolve a raw supabase-js `error.message` to Burmese UI copy.
//
// Postgres `raise exception '<code>'` normally surfaces the bare code as the
// message; the two stock-related codes append `:<product_id>`. We first try an
// exact match on the token before any `:`, then fall back to scanning for a
// known code as a substring (defensive against any wrapping/prefixing the client
// adds). Anything unrecognised returns `fallback`.
export function mapDbError(rawMessage: string | null | undefined, fallback = DEFAULT_DB_ERROR_MESSAGE): string {
  const raw = (rawMessage ?? '').trim();
  if (!raw) return fallback;

  // Exact code (with the `:<uuid>` suffix, if any, stripped).
  const head = raw.split(':', 1)[0].trim();
  if (head in DB_ERROR_MESSAGES) {
    return DB_ERROR_MESSAGES[head as DbErrorCode];
  }

  // Defensive substring scan (longest code wins).
  for (const code of CODES_BY_LENGTH) {
    if (raw.includes(code)) return DB_ERROR_MESSAGES[code];
  }

  return fallback;
}


/** Map the Settings write boundary's DB failure to seller-facing Burmese copy. */
export function mapUpdateOwnShopError(rawMessage: string | null | undefined): string {
  return mapDbError(rawMessage, 'ဆိုင် အချက်အလက် ပြင်၍မရပါ။');
}
