// ---- Seller's plan application — lookup + submit -----------------------------
// Kept at the feature top level (not under api/) for the same reason as
// features/shop/sellerShop.ts: it is needed BEFORE a shop row exists, by the
// pre-shop route guards (RequireAdmin, Onboarding) and the Subscribe page — so
// it must be importable across the feature boundary, which the lint rule allows
// for a feature's non-api/ module. It reaches Supabase directly (like
// sellerShop.ts), not through @/data/dataSource, because this is an admin-side
// pre-onboarding concern, never a storefront read.

import {requireSupabase} from '@/core/supabase/client';
import type {TablesInsert} from '@/core/supabase/database.types';
import {mapDbError} from '@/domain/dbError';
import type {Plan} from '@/domain/plan';
import {getOwnShop} from '@/features/shop/sellerShop';
import {
  resolveOnboardingGate,
  type ApplicationStatus,
  type OnboardingGate,
  type SubscriptionPaymentMethod,
} from '@/domain/subscription';

export interface ShopApplication {
  ownerId: string;
  plan: string;
  paymentMethod: string;
  paymentRefTail: string | null;
  transactionId: string | null;
  screenshotPath: string;
  amount: number;
  status: ApplicationStatus;
  reviewNote: string | null;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
}

type ApplicationRow = {
  owner_id: string;
  plan: string;
  payment_method: string;
  payment_ref_tail: string | null;
  transaction_id: string | null;
  screenshot_path: string;
  amount: number;
  status: string;
  review_note: string | null;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
};

const APPLICATION_COLUMNS =
  'owner_id, plan, payment_method, payment_ref_tail, transaction_id, screenshot_path, amount, status, review_note, created_at, updated_at, reviewed_at';

function normalizeStatus(raw: string): ApplicationStatus {
  return raw === 'approved' || raw === 'rejected' || raw === 'pending' ? raw : 'pending';
}

function mapApplication(r: ApplicationRow): ShopApplication {
  return {
    ownerId: r.owner_id,
    plan: r.plan,
    paymentMethod: r.payment_method,
    paymentRefTail: r.payment_ref_tail,
    transactionId: r.transaction_id,
    screenshotPath: r.screenshot_path,
    amount: r.amount,
    status: normalizeStatus(r.status),
    reviewNote: r.review_note,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    reviewedAt: r.reviewed_at,
  };
}

/** Null means this seller has not applied yet — not an error. */
export async function getMyApplication(userId: string): Promise<ShopApplication | null> {
  const sb = requireSupabase();
  const {data, error} = await sb
    .from('shop_applications')
    .select(APPLICATION_COLUMNS)
    .eq('owner_id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapApplication(data as ApplicationRow) : null;
}

export interface SubmitApplicationInput {
  plan: Plan;
  paymentMethod: SubscriptionPaymentMethod;
  paymentRefTail: string | null;
  // Null only for a free-trial application, which carries no payment (the DB
  // CHECK `plan = 'free_trial' or screenshot_path is not null` enforces this).
  screenshotPath: string | null;
  amount: number;
}

/**
 * Insert (first apply) or update (resubmit a rejected application) the seller's
 * application. For a paid plan `status` stays 'pending' until the owner
 * approves (the trigger rejects any seller-set 'approved'/'rejected'); a
 * free-trial application is AUTO-APPROVED by the trigger (0016), so the seller
 * proceeds straight to onboarding. Upsert on the owner_id PK covers both paths.
 */
export async function submitApplication(
  userId: string,
  input: SubmitApplicationInput,
): Promise<ShopApplication> {
  const sb = requireSupabase();
  const row: TablesInsert<'shop_applications'> = {
    owner_id: userId,
    plan: input.plan,
    payment_method: input.paymentMethod,
    payment_ref_tail: input.paymentRefTail,
    screenshot_path: input.screenshotPath,
    amount: input.amount,
    status: 'pending',
    // Clear any prior review verdict when resubmitting.
    review_note: null,
    reviewed_at: null,
  };
  const {data, error} = await sb
    .from('shop_applications')
    .upsert(row, {onConflict: 'owner_id'})
    .select(APPLICATION_COLUMNS)
    .single();
  if (error || !data) throw new Error(mapDbError(error?.message, 'လျှောက်လွှာ တင်၍မရပါ — ပြန်ကြိုးစားပါ။'));
  return mapApplication(data as ApplicationRow);
}

// ---- Combined pre-onboarding gate resolution --------------------------------
export type SellerGateResult =
  | {status: 'ready'; gate: OnboardingGate; hasShop: boolean; application: ShopApplication | null}
  | {status: 'error'};

/**
 * Resolve where a signed-in seller belongs, from both their shop and their
 * application. Shared by RequireAdmin, Onboarding and Subscribe so the routing
 * decision lives in one place. Any thrown lookup is a RETRYABLE error (never
 * collapsed into a redirect) — see settleOwnShopLookup's rationale in
 * shopAccess.ts.
 */
export async function resolveSellerGate(userId: string): Promise<SellerGateResult> {
  try {
    const [shop, application] = await Promise.all([getOwnShop(userId), getMyApplication(userId)]);
    const hasShop = Boolean(shop);
    const gate = resolveOnboardingGate({
      hasShop,
      applicationStatus: application?.status ?? 'none',
    });
    return {status: 'ready', gate, hasShop, application};
  } catch {
    return {status: 'error'};
  }
}
