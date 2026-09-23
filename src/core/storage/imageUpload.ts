// ---- Client-side image prep for Storage uploads -----------------------------
// Shared browser-side validation/conversion for storefront media.
// JPG/JPEG and PNG are converted to WebP; WebP input is uploaded as-is.

const ACCEPTED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ACCEPTED_EXT = new Set(['jpg', 'jpeg', 'png', 'webp']);

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function extOf(filename: string): string {
  const m = /\.([a-zA-Z0-9]+)$/.exec(filename);
  return m ? m[1].toLowerCase() : '';
}

export function validateImageFile(file: File): string | null {
  const ext = extOf(file.name);
  const type = file.type || (ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : '');
  const mimeMatchesExt =
    (type === 'image/jpeg' && (ext === 'jpg' || ext === 'jpeg')) ||
    (type === 'image/png' && ext === 'png') ||
    (type === 'image/webp' && ext === 'webp');
  if (!ACCEPTED_MIME.has(type) || !ACCEPTED_EXT.has(ext) || !mimeMatchesExt) {
    return 'JPG, JPEG, PNG သို့မဟုတ် WebP ပုံဖိုင်သာ တင်နိုင်ပါသည်။';
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `ပုံဖိုင် အရွယ်အစား ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)}MB ထက် မကျော်ရပါ။`;
  }
  return null;
}

function isWebp(file: File): boolean {
  return file.type === 'image/webp' || (!file.type && extOf(file.name) === 'webp');
}

async function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('ပုံ ပြောင်း၍မရပါ။'))), type, quality);
  });
}

export async function prepareImageForUpload(file: File): Promise<File> {
  if (isWebp(file)) return file;
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('ပုံ ပြောင်း၍မရပါ။');
    ctx.drawImage(bitmap, 0, 0);
    const webpBlob = await canvasToBlob(canvas, 'image/webp', 0.9);
    const webpName = file.name.replace(/\.(jpe?g|png)$/i, '.webp');
    return new File([webpBlob], webpName, {type: 'image/webp'});
  } finally {
    bitmap.close();
  }
}

export function deriveStoragePath(url: string, bucket: string): string | null {
  const marker = `/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  const path = url.slice(idx + marker.length);
  return path || null;
}
