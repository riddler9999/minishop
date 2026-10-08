export type StoreMediaMimeType = 'image/jpeg' | 'image/png' | 'image/webp';

export interface StoreMedia {
  id: string;
  shopId: string;
  storagePath: string;
  mimeType: StoreMediaMimeType;
  width?: number;
  height?: number;
  byteSize: number;
  checksum?: string;
  createdAt: string;
  url?: string;
}

export const MAX_MEDIA_BYTE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_MEDIA_MIME_TYPES: ReadonlyArray<StoreMediaMimeType> = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

export function isAllowedMimeType(mimeType: string): mimeType is StoreMediaMimeType {
  return ALLOWED_MEDIA_MIME_TYPES.includes(mimeType as StoreMediaMimeType);
}

export function validateMediaFileHeader(bytes: Uint8Array): StoreMediaMimeType | null {
  if (bytes.length < 12) return null;

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return 'image/png';
  }

  // WebP: RIFF (bytes 0-3) and WEBP (bytes 8-11)
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x41 &&
    bytes[10] === 0x56 &&
    bytes[11] === 0x45
  ) {
    return 'image/webp';
  }

  return null;
}

export function buildMediaStoragePath(shopId: string, filename: string): string {
  const sanitized = filename.toLowerCase().replace(/[^a-z0-9.-]/g, '_');
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `shops/${shopId}/media/${timestamp}_${randomSuffix}_${sanitized}`;
}

export function resolveMediaDeliveryUrl(media: Pick<StoreMedia, 'storagePath' | 'url'>): string {
  if (media.url?.startsWith('/api/storefront/')) return media.url;
  if (!media.storagePath) return '';
  if (/^(?:https?:|data:)/i.test(media.storagePath)) return '';
  const encoded = media.storagePath.split('/').map(encodeURIComponent).join('/');
  return `/api/storefront/product-images/${encoded}`;
}
