// ---- CORE: Supabase Storage buckets -----------------------------------------
// Infrastructure-level constants and helpers. No domain or feature knowledge.

// Supabase Storage buckets (see supabase/migrations/0003_platform_plan_and_usage.sql).
// Tenant-safe by policy: the FIRST path segment must be the owner's shop_id.
// Exported so UI code can derive a previously-uploaded object's storage path
// from its persisted public URL (see ./imageUpload.ts) without a second,
// hardcoded copy of the bucket name.
export const SHOP_LOGOS_BUCKET = 'shop-logos';
export const PRODUCT_IMAGES_BUCKET = 'product-images';

// Private bucket for seller plan-payment transfer screenshots (0010). Unlike the
// storefront media buckets it is NOT public: proofs are read via a signed URL.
// Path scheme is owner-scoped:  payment-proofs/<owner_id>/<file>.
export const PAYMENT_PROOFS_BUCKET = 'payment-proofs';

// Keep a filename's extension, strip anything policy/URL-unfriendly from the stem.
export function safeFileExt(filename: string): string {
  const m = /\.([a-zA-Z0-9]{1,8})$/.exec(filename);
  return m ? m[1].toLowerCase() : 'bin';
}
