export const MAX_PUBLIC_MEDIA_BYTES = 5 * 1024 * 1024;

/** Accept only browser image responses from the public product/logo buckets. */
export function allowedPublicImageContentType(value: string | null): string | null {
  const type = value?.trim().toLowerCase() ?? '';
  return new Set(['image/webp', 'image/png', 'image/jpeg']).has(type) ? type : null;
}

/** A missing Content-Length is permitted; the downloaded buffer is checked too. */
export function isPublicMediaLengthAllowed(value: string | null): boolean {
  if (!value) return true;
  const length = Number(value);
  return Number.isFinite(length) && length >= 0 && length <= MAX_PUBLIC_MEDIA_BYTES;
}
