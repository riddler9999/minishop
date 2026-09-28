// ---- CATALOG: Published-only Store Design buyer adapter ----------------------
import {normalizeStoreDesign, type StoreDesignDocument} from '@/domain/storeDesign';
import {getShopSlug} from '@/features/tenancy/shopContext';

async function requestPublishedDesign(): Promise<{document: unknown}> {
  const slug = getShopSlug();
  if (!slug) throw new Error('ဆိုင် အချက်အလက် မတွေ့ပါ။');
  const qs = new URLSearchParams({slug, action: 'store-design'});
  const response = await fetch(`/api/storefront?${qs}`);
  if (!response.ok) throw new Error('ဆိုင်ဒီဇိုင်း ရယူ၍မရပါ။');
  return response.json() as Promise<{document: unknown}>;
}

export const catalogStoreDesignApi = {
  async loadPublishedStoreDesign(): Promise<StoreDesignDocument> {
    const {document} = await requestPublishedDesign();
    return normalizeStoreDesign(document);
  },
};
