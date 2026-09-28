import type {SupabaseClient} from '@supabase/supabase-js';
import type {SellerContext} from './contracts.ts';
import {McpError} from './errors.ts';
import {decodeCursor,encodeCursor,normalizePageSize,validateDateRange} from './pagination.ts';

function asOf(){return new Date().toISOString();}
function mapProduct(row:any){return {id:row.id,itemCode:row.item_code,name:row.name,description:row.description,category:row.category,color:row.color,size:row.size,price:row.price,promoPrice:row.promo_price,isPromotion:row.is_promotion,stock:row.stock,status:row.status,images:row.images,arrivalDate:row.arrival_date,createdAt:row.created_at};}
function mapOrder(row:any){return {id:row.id,orderNo:row.order_no,status:row.status,createdAt:row.created_at,updatedAt:row.updated_at,itemTotal:row.item_total,deliveryFee:row.delivery_fee,grandTotal:row.grand_total,paymentMethod:row.payment_method,customerName:row.customer_name,customerPhone:row.customer_phone,region:row.region,township:row.township};}

export function createBusinessReadService(client: SupabaseClient,context: SellerContext){
  return {
    async listProducts(input:{limit?:number;cursor?:string;category?:string}){
      const limit=normalizePageSize(input.limit);
      let q:any=client.from('products').select('id,item_code,name,description,category,color,size,price,promo_price,is_promotion,stock,status,images,arrival_date,created_at').eq('shop_id',context.shopId).order('created_at',{ascending:false}).order('id',{ascending:false}).limit(limit+1);
      if(input.category) q=q.eq('category',input.category);
      if(input.cursor){const c=decodeCursor(input.cursor);q=q.lt('created_at',c.createdAt);}
      const {data,error}=await q;
      if(error) throw new McpError('INTERNAL_ERROR',500,'Product read failed.');
      const rows=(data||[]).slice(0,limit);
      const tail=rows.at(-1);
      return {products:rows.map(mapProduct),nextCursor:(data||[]).length>limit&&tail?encodeCursor({createdAt:tail.created_at,id:tail.id}):null,asOf:asOf()};
    },
    async getProduct(input:{id:string}){
      const {data,error}=await client.from('products').select('id,item_code,name,description,category,color,size,price,promo_price,is_promotion,stock,status,images,arrival_date,created_at').eq('shop_id',context.shopId).eq('id',input.id).maybeSingle();
      if(error||!data) throw new McpError('RESOURCE_NOT_FOUND',404,'Product not found.');
      return {product:mapProduct(data),asOf:asOf()};
    },
    async listOrders(input:{limit?:number;cursor?:string}){
      const limit=normalizePageSize(input.limit);
      let q:any=client.from('orders').select('id,order_no,status,created_at,updated_at,item_total,delivery_fee,grand_total,payment_method,customer_name,customer_phone,region,township').eq('shop_id',context.shopId).order('created_at',{ascending:false}).order('id',{ascending:false}).limit(limit+1);
      if(input.cursor){const c=decodeCursor(input.cursor);q=q.lt('created_at',c.createdAt);}
      const {data,error}=await q;
      if(error) throw new McpError('INTERNAL_ERROR',500,'Order read failed.');
      const rows=(data||[]).slice(0,limit); const tail=rows.at(-1);
      return {orders:rows.map(mapOrder),nextCursor:(data||[]).length>limit&&tail?encodeCursor({createdAt:tail.created_at,id:tail.id}):null,asOf:asOf()};
    },
    async getOrder(input:{id:string}){
      const {data,error}=await client.from('orders').select('id,order_no,status,created_at,updated_at,item_total,delivery_fee,grand_total,payment_method,customer_name,customer_phone,region,township').eq('shop_id',context.shopId).eq('id',input.id).maybeSingle();
      if(error||!data) throw new McpError('RESOURCE_NOT_FOUND',404,'Order not found.');
      const {data:items,itemError}:any=await client.from('order_items').select('id,order_id,product_id,name,qty,unit_price').eq('order_id',input.id);
      return {order:mapOrder(data),items:items||[],asOf:asOf()};
    },
    async getInventorySummary(){
      const {data,error}=await client.from('products').select('stock,status').eq('shop_id',context.shopId);
      if(error) throw new McpError('INTERNAL_ERROR',500,'Inventory read failed.');
      const rows=data||[];
      return {productCount:rows.length,totalUnits:rows.reduce((n:any,r:any)=>n+Number(r.stock||0),0),outOfStock:rows.filter((r:any)=>Number(r.stock)<=0).length,asOf:asOf()};
    },
    async listLowStockProducts(input:{threshold?:number;limit?:number}){
      const threshold=Math.max(0,Math.min(Number(input.threshold??5),100000)); const limit=normalizePageSize(input.limit);
      const {data,error}=await client.from('products').select('id,item_code,name,stock,status').eq('shop_id',context.shopId).lte('stock',threshold).order('stock',{ascending:true}).limit(limit);
      if(error) throw new McpError('INTERNAL_ERROR',500,'Inventory read failed.');
      return {products:data||[],asOf:asOf()};
    },
    async getSalesSummary(input:{start:string;end:string}){
      const range=validateDateRange(input.start,input.end);
      const {data,error}=await client.from('orders').select('grand_total,status,created_at,is_test,is_duplicate').eq('shop_id',context.shopId).eq('is_test',false).eq('is_duplicate',false).gte('created_at',range.start).lte('created_at',range.end);
      if(error) throw new McpError('INTERNAL_ERROR',500,'Sales summary failed.');
      const rows=data||[]; const gross=rows.reduce((n:any,r:any)=>n+Number(r.grand_total||0),0);
      return {grossSales:gross,orderCount:rows.length,averageOrderValue:rows.length?gross/rows.length:0,paidCount:rows.filter((r:any)=>r.status==='paid'||r.status==='confirmed').length,cancelledCount:rows.filter((r:any)=>r.status==='cancelled').length,asOf:asOf()};
    },
    async getBestSellingProducts(input:{start:string;end:string;limit?:number}){
      const range=validateDateRange(input.start,input.end); const limit=normalizePageSize(input.limit);
      const {data:orders,error}=await client.from('orders').select('id').eq('shop_id',context.shopId).eq('is_test',false).eq('is_duplicate',false).gte('created_at',range.start).lte('created_at',range.end).limit(5000);
      if(error) throw new McpError('INTERNAL_ERROR',500,'Best-selling summary failed.');
      const ids=(orders||[]).map((r:any)=>r.id); if(!ids.length) return {products:[],asOf:asOf()};
      const {data:items,error:itemError}=await client.from('order_items').select('product_id,name,qty').in('order_id',ids).limit(10000);
      if(itemError) throw new McpError('INTERNAL_ERROR',500,'Best-selling summary failed.');
      const counts=new Map<string,{productId:string|null;name:string;qty:number}>();
      for(const r of items||[]){const k=String(r.product_id||r.name);const v=counts.get(k)||{productId:r.product_id,name:r.name,qty:0};v.qty+=Number(r.qty||0);counts.set(k,v);}
      return {products:[...counts.values()].sort((a,b)=>b.qty-a.qty).slice(0,limit),asOf:asOf()};
    }
  };
}
