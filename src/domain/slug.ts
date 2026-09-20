// ---- Shop slug validation --------------------------------------------------
// Mirrors the DB check constraint `shops_slug_format` and the client-side check
// in @/features/auth/pages/Onboarding.tsx: lowercase a-z / 0-9 / hyphen, must
// start and end alphanumeric, 3-40 chars total. Format check ONLY — it does not
// prove the shop exists (that lookup is resolveShop() in
// @/features/tenancy/shopResolver.ts).
export const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;

export function isValidSlug(slug: string | undefined | null): slug is string {
  return typeof slug === 'string' && SLUG_RE.test(slug);
}
