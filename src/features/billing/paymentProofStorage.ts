// ---- Billing payment-proof storage ------------------------------------------
// Deep storage seam shared by plan applications and Extra Orders purchases.
// It owns validation plus the upload -> persist -> cleanup ordering invariant so
// pages cannot accidentally orphan a new proof or delete the previous proof
// before the database row points at the replacement.

import {requireSupabase} from '@/core/supabase/client';
import {PAYMENT_PROOFS_BUCKET, safeFileExt} from '@/core/storage/buckets';

const PROOF_MIME = new Set(['image/png', 'image/webp', 'image/jpeg']);
const PROOF_EXT = new Set(['png', 'webp', 'jpg', 'jpeg']);
export const MAX_PROOF_BYTES = 5 * 1024 * 1024;

export function validatePaymentProof(file: File): string | null {
  const ext = safeFileExt(file.name);
  if (!PROOF_MIME.has(file.type) && !PROOF_EXT.has(ext)) {
    return 'ပုံဖိုင် (PNG / JPG / WebP) သာ တင်နိုင်ပါသည်။';
  }
  if (file.size > MAX_PROOF_BYTES) {
    return `ပုံဖိုင် အရွယ်အစား ${Math.round(MAX_PROOF_BYTES / 1024 / 1024)}MB ထက် မကျော်ရပါ။`;
  }
  return null;
}

async function uploadPaymentProof(userId: string, file: File): Promise<string> {
  const sb = requireSupabase();
  const ext = safeFileExt(file.name);
  const unique = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const path = `${userId}/proof-${unique}.${ext}`;
  const {error} = await sb.storage
    .from(PAYMENT_PROOFS_BUCKET)
    .upload(path, file, {upsert: false, contentType: file.type || undefined});
  if (error) throw new Error(error.message);
  return path;
}

async function deletePaymentProof(path: string): Promise<void> {
  const sb = requireSupabase();
  const {error} = await sb.storage.from(PAYMENT_PROOFS_BUCKET).remove([path]);
  if (error) throw new Error(error.message);
}

export interface PersistWithPaymentProofInput<T> {
  userId: string;
  file: File;
  previousPath?: string | null;
  persist: (screenshotPath: string) => Promise<T>;
}

/**
 * Upload the new proof, persist its DB reference, roll back the new object on a
 * failed write, then best-effort delete the old object only after DB success.
 */
export async function persistWithPaymentProof<T>({
  userId,
  file,
  previousPath = null,
  persist,
}: PersistWithPaymentProofInput<T>): Promise<T> {
  const validationError = validatePaymentProof(file);
  if (validationError) throw new Error(validationError);

  const path = await uploadPaymentProof(userId, file);
  try {
    const result = await persist(path);
    if (previousPath && previousPath !== path) {
      await deletePaymentProof(previousPath).catch(() => {});
    }
    return result;
  } catch (error) {
    await deletePaymentProof(path).catch(() => {});
    throw error;
  }
}
