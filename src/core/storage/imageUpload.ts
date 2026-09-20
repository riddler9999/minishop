// ---- Client-side image prep for Storage uploads -----------------------------
// Pure browser-side helpers used by the Settings logo picker and the product
// image picker before handing a File to the EXISTING adminApi.uploadShopLogo /
// uploadProductImage methods (@/features/shop/api/storage.ts) — it never talks to
// Supabase itself, so it is not a second storage layer, just shared
// validation/conversion + the inverse of the upload methods' path construction
// (deriving a path back out of a previously-persisted public URL).
//
// Owner decision (PROJECT.md D-log): accept PNG and WebP only, reject
// JPG/JPEG; PNG is converted to WebP client-side before upload, WebP is
// uploaded as-is. This keeps stored objects uniform and shrinks the
// bandwidth-sensitive uploads sellers make from inside TikTok's in-app WebView.

const ACCEPTED_MIME = new Set(['image/png', 'image/webp']);
const ACCEPTED_EXT = new Set(['png', 'webp']);

// Pre-conversion file size cap. Not owner-specified; chosen as a conservative
// default within the ~2-5MB range PROJECT.md flagged for WebView bandwidth —
// revisit if the owner sets a different number.
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function extOf(filename: string): string {
  const m = /\.([a-zA-Z0-9]+)$/.exec(filename);
  return m ? m[1].toLowerCase() : '';
}

/** Returns a Burmese error message, or null if the file is acceptable. */
export function validateImageFile(file: File): string | null {
  const ext = extOf(file.name);
  // Browsers/WebViews sometimes report an empty `type` for a valid file —
  // fall back to the extension in that case rather than rejecting outright.
  const type = file.type || (ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : '');
  if (!ACCEPTED_MIME.has(type) && !ACCEPTED_EXT.has(ext)) {
    return 'PNG သို့မဟုတ် WebP ပုံဖိုင်သာ တင်နိုင်ပါသည် (JPG/JPEG လက်မခံပါ)။';
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `ပုံဖိုင် အရွယ်အစား ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)}MB ထက် မကျော်ရပါ။`;
  }
  return null;
}

function isPng(file: File): boolean {
  return file.type === 'image/png' || (!file.type && extOf(file.name) === 'png');
}

/** PNG -> WebP via canvas. WebP input is returned unchanged (already the
 *  target format — no re-encode). Caller must validate the file first. */
export async function prepareImageForUpload(file: File): Promise<File> {
  if (!isPng(file)) return file;
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('ပုံ ပြောင်း၍မရပါ။');
    ctx.drawImage(bitmap, 0, 0);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('ပုံ ပြောင်း၍မရပါ။'))), 'image/webp', 0.9);
    });
    const webpName = file.name.replace(/\.png$/i, '.webp');
    return new File([blob], webpName, {type: 'image/webp'});
  } finally {
    bitmap.close();
  }
}

/**
 * Recover a Storage object's path from its persisted public URL. Both
 * `products.images` and `shops.logo_url` store only the public URL (no path
 * column — see PROJECT.md Task B point 4), and Supabase Storage public URLs
 * are deterministic: `.../storage/v1/object/public/<bucket>/<path>`. Returns
 * null if the URL doesn't reference the given bucket (e.g. a stale/foreign
 * URL) — callers should skip cleanup rather than guess.
 */
export function deriveStoragePath(url: string, bucket: string): string | null {
  const marker = `/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  const path = url.slice(idx + marker.length);
  return path || null;
}
