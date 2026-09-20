// ---- Pure helpers for the seller's own-shop lookup + creation flow ----------
// Extracted from features/shop/sellerShop.ts so the branching that the admin
// route guards (RequireAdmin) and onboarding depend on is unit-testable without
// a live Supabase client. Generic over the shop shape to stay a domain leaf
// (no imports, no I/O) — the caller injects the actual lookup.

export type OwnShopLookup<T> = {status: 'ready'; shop: T | null} | {status: 'error'};

/**
 * Settle an own-shop lookup into a state the route guards branch on. A resolved
 * value is `ready` (a shop, or `null` = no shop created yet); a thrown error is
 * `error` — a RETRYABLE failure that must never be collapsed into "no shop".
 * Collapsing it would bounce an already-onboarded seller back into onboarding on
 * a transient network/RLS blip, as if their shop had vanished.
 */
export async function settleOwnShopLookup<T>(lookup: () => Promise<T | null>): Promise<OwnShopLookup<T>> {
  try {
    return {status: 'ready', shop: await lookup()};
  } catch {
    return {status: 'error'};
  }
}

/** Postgres unique-violation SQLSTATE. */
export const UNIQUE_VIOLATION = '23505';

export const SLUG_TAKEN_MESSAGE = 'ဤ link (slug) ကို အသုံးပြုပြီးသားဖြစ်ပါသည် — တခြား link ရွေးပါ။';
export const SLUG_FORMAT_MESSAGE =
  'Link format မှားနေပါသည် — အင်္ဂလိပ်စာလုံးအသေး/နံပါတ်/(-) ဖြင့်၊ ၃ လုံးအထက် ဖြစ်ရပါမည်။';

/**
 * Decide how a failed shop insert resolves. A unique violation (`23505`) can come
 * from either the slug index (`0001`) or `shops_owner_unique` (`0008`); a
 * double-submit with the same slug trips BOTH at once and Postgres reports only
 * one — often the older slug index — so we cannot key off the constraint name.
 * Instead, on ANY `23505`, first look up this owner's shop: if they already own
 * one, recover to it idempotently; only if they own none is it a genuine slug
 * clash. Non-unique errors surface their (already-mapped or raw) message. Returns
 * the recovered shop, or throws on every non-recoverable case.
 */
export async function recoverCreateShopError<T>(
  error: {code?: string | null; message: string},
  lookupOwnShop: () => Promise<T | null>,
): Promise<T> {
  if (error.code === UNIQUE_VIOLATION) {
    const existing = await lookupOwnShop();
    if (existing) return existing;
    throw new Error(SLUG_TAKEN_MESSAGE);
  }
  if (error.message.includes('shops_slug_format')) {
    throw new Error(SLUG_FORMAT_MESSAGE);
  }
  throw new Error(error.message);
}
