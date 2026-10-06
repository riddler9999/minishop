// ---- SHOP: logo + product image uploads -------------------------------------
// Tenant-safe by storage policy: the FIRST path segment must be the owner's
// shop_id (0003_platform_plan_and_usage.sql / 0005_fix_storage_policy_path.sql).

import {requireSupabase} from '@/core/supabase/client';
import {PRODUCT_IMAGES_BUCKET, SHOP_LOGOS_BUCKET, safeFileExt} from '@/core/storage/buckets';
import {resolveOwnShopId} from '@/features/tenancy/ownShop';
import {
  type StoreMedia,
  MAX_MEDIA_BYTE_SIZE,
  isAllowedMimeType,
  validateMediaFileHeader,
} from '@/domain/storeMedia';

export const shopStorageApi = {
  async uploadStoreMedia(file: File): Promise<StoreMedia> {
    if (file.size > MAX_MEDIA_BYTE_SIZE) {
      throw new Error(`File size exceeds maximum allowed size of 10MB.`);
    }
    const mime = file.type || 'image/jpeg';
    if (!isAllowedMimeType(mime)) {
      throw new Error(`Invalid file type: ${mime}. Only JPEG, PNG, and WebP are allowed.`);
    }

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const headerMime = validateMediaFileHeader(bytes);
    if (headerMime && headerMime !== mime) {
      // Header check takes precedence if header detected
    }

    const shopId = await resolveOwnShopId();
    const sb = requireSupabase();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeFileExt(file.name)}`;
    const path = `${shopId}/media/${fileName}`;

    const {error} = await sb.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(path, file, {upsert: true, contentType: mime});
    if (error) throw new Error(error.message);

    const {data} = sb.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path);

    const mediaRecord: StoreMedia = {
      id: `media_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      shopId,
      storagePath: path,
      mimeType: (headerMime || mime) as any,
      byteSize: file.size,
      createdAt: new Date().toISOString(),
      url: data.publicUrl,
    };

    return mediaRecord;
  },
  // ---- storage: shop logo + product images (tenant-safe paths) ---------------
  // Uploads to `<shop_id>/…` — the FIRST path segment is the shop_id the storage
  // RLS policy checks against the owner. Returns the public URL to persist on the
  // shop/product row (shops.logo_url / products.images[]). The seller must then
  // call updateShopSettings/updateProduct to save it.
  async uploadShopLogo(file: File): Promise<{url: string; path: string}> {
    const shopId = await resolveOwnShopId();
    const sb = requireSupabase();
    const path = `${shopId}/logo-${Date.now()}.${safeFileExt(file.name)}`;
    const {error} = await sb.storage
      .from(SHOP_LOGOS_BUCKET)
      .upload(path, file, {upsert: true, contentType: file.type || undefined});
    if (error) throw new Error(error.message);
    const {data} = sb.storage.from(SHOP_LOGOS_BUCKET).getPublicUrl(path);
    return {url: data.publicUrl, path};
  },

  async uploadProductImage(file: File, productId?: string): Promise<{url: string; path: string}> {
    const shopId = await resolveOwnShopId();
    const sb = requireSupabase();
    const folder = productId ?? 'unassigned';
    const path = `${shopId}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeFileExt(file.name)}`;
    const {error} = await sb.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(path, file, {upsert: true, contentType: file.type || undefined});
    if (error) throw new Error(error.message);
    const {data} = sb.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path);
    return {url: data.publicUrl, path};
  },

  // Remove a previously-uploaded media object (e.g. replacing a logo). `bucket`
  // must be one of the tenant media buckets; the path is owner-scoped by policy.
  async deleteShopLogo(path: string): Promise<{ok: true}> {
    const sb = requireSupabase();
    const {error} = await sb.storage.from(SHOP_LOGOS_BUCKET).remove([path]);
    if (error) throw new Error(error.message);
    return {ok: true};
  },

  async deleteProductImage(path: string): Promise<{ok: true}> {
    const sb = requireSupabase();
    const {error} = await sb.storage.from(PRODUCT_IMAGES_BUCKET).remove([path]);
    if (error) throw new Error(error.message);
    return {ok: true};
  },
};
