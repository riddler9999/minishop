import type {SupabaseClient} from '@supabase/supabase-js';
import type {SellerContext} from './contracts.js';
import {McpError} from './errors.js';

const WRITABLE = new Set([
  'name',
  'phone',
  'logoUrl',
  'defaultDeliveryFee',
  'originRegion',
  'originTownship',
  'deliveryService',
]);

const DB_MAP: Record<string,string> = {
  name:'name',
  phone:'phone',
  logoUrl:'logo_url',
  defaultDeliveryFee:'default_delivery_fee',
  originRegion:'origin_region',
  originTownship:'origin_township',
  deliveryService:'delivery_service',
};

export function createShopProfileService(client: SupabaseClient, context: SellerContext) {
  return {
    async getShopProfile() {
      const {data,error}=await client.from('shops')
        .select('id,name,phone,logo_url,default_delivery_fee,origin_region,origin_township,delivery_service')
        .eq('id',context.shopId)
        .maybeSingle();
      if(error||!data) throw new McpError('SHOP_NOT_FOUND',404,'Shop profile not found.');
      return {
        shop:{
          id:data.id,
          name:data.name,
          phone:data.phone,
          logoUrl:data.logo_url,
          defaultDeliveryFee:data.default_delivery_fee,
          originRegion:data.origin_region,
          originTownship:data.origin_township,
          deliveryService:data.delivery_service,
        }
      };
    },
    async updateShopProfile(input: Record<string,unknown>) {
      for(const key of Object.keys(input)){
        if(!WRITABLE.has(key)) throw new McpError('INSUFFICIENT_SCOPE',403,'This shop profile field cannot be changed through MCP.');
      }
      const patch: Record<string,unknown>={};
      for(const [key,value] of Object.entries(input)) patch[DB_MAP[key]!] = value;
      const {data,error}=await client.from('shops').update(patch).eq('id',context.shopId).select('id').maybeSingle();
      if(error||!data) throw new McpError('INTERNAL_ERROR',500,'Shop profile update failed.');
      return {changed:true as const};
    }
  };
}
