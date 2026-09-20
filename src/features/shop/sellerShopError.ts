import {mapDbError} from '@/domain/dbError';

/** Map the Settings write boundary's DB failure to seller-facing Burmese copy. */
export function mapUpdateOwnShopError(rawMessage: string | null | undefined): string {
  return mapDbError(rawMessage, 'ဆိုင် အချက်အလက် ပြင်၍မရပါ။');
}
