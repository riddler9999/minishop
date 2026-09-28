import {sendJson} from './_http.js';
import {authenticateSeller} from './mcp/auth.js';
import {requireCapability} from './mcp/capabilities.js';
import {MCP_TOOL_NAMES, createRequestId, type McpToolName} from './mcp/contracts.js';
import {McpError, toSafeMcpError} from './mcp/errors.js';
import {TOOL_REGISTRY} from './mcp/tool-registry.js';
import {createStoreDesignLifecycleAdapter} from '../src/features/shop/api/storeDesignAdapter.js';
import {createStoreDesignMcpService} from './mcp/store-design.js';
import {createShopProfileService} from './mcp/shop-profile.js';
import {createBusinessReadService} from './mcp/read-models.js';
import {createAuditSink} from './mcp/audit.js';
import {defaultMcpRateLimiter} from './mcp/rate-limit.js';

function jsonRpcResult(id: unknown, result: unknown) { return {jsonrpc:'2.0',id,result}; }
function jsonRpcError(id: unknown, error: McpError) {
  return {jsonrpc:'2.0',id,error:{code:-32000,message:error.message,data:{code:error.code,request_id:error.requestId}}};
}
function toolList() {
  return MCP_TOOL_NAMES.map((name)=>({name,description:TOOL_REGISTRY[name].description,inputSchema:TOOL_REGISTRY[name].inputSchema}));
}
function rejectTenantSelectors(args: Record<string,unknown>) {
  for(const key of ['shop_id','shopId','owner_id','ownerId','user_id','userId']) {
    if(key in args) throw new McpError('INSUFFICIENT_SCOPE',403,'Tenant identifiers are resolved by MiniShop.');
  }
}
function isMutation(tool:McpToolName){
  return ['update_store_theme','add_store_section','update_store_section','move_store_section','remove_store_section','publish_store','rollback_store_design','update_shop_profile'].includes(tool);
}

export default async function handler(req:any,res:any) {
  const requestId=createRequestId();
  const id=req.body?.id ?? null;
  try{
    if(req.method!=='POST') throw new McpError('RESOURCE_NOT_FOUND',405,'MCP requires POST.');
    const method=String(req.body?.method||'');
    if(method==='initialize') {
      return sendJson(res,200,jsonRpcResult(id,{protocolVersion:'2025-06-18',serverInfo:{name:'minishop-seller-mcp',version:'1.0.0'},capabilities:{tools:{}}}));
    }

    const {context,supabase}=await authenticateSeller(req);

    if(method==='tools/list') return sendJson(res,200,jsonRpcResult(id,{tools:toolList()}));
    if(method!=='tools/call') throw new McpError('RESOURCE_NOT_FOUND',404,'Unknown MCP method.');

    const name=String(req.body?.params?.name||'') as McpToolName;
    if(!MCP_TOOL_NAMES.includes(name)) throw new McpError('RESOURCE_NOT_FOUND',404,'Unknown MCP tool.');
    const args=(req.body?.params?.arguments && typeof req.body.params.arguments==='object' ? req.body.params.arguments : {}) as Record<string,unknown>;
    rejectTenantSelectors(args);
    requireCapability(context,TOOL_REGISTRY[name].capability);
    defaultMcpRateLimiter.check(context,name);

    const storeAdapter=createStoreDesignLifecycleAdapter({rpc(fn,args){return supabase.rpc(fn as never,args as never) as any;}});
    const store=createStoreDesignMcpService(storeAdapter);
    const profile=createShopProfileService(supabase,context);
    const reads=createBusinessReadService(supabase,context);
    const before=isMutation(name)&&name!=='update_shop_profile' ? await store.getStoreDesign() : null;

    const callMap: Record<McpToolName,()=>Promise<unknown>> = {
      get_store_design:()=>store.getStoreDesign(),
      update_store_theme:()=>store.updateStoreTheme(args as any),
      add_store_section:()=>store.addStoreSection(args as any),
      update_store_section:()=>store.updateStoreSection(args as any),
      move_store_section:()=>store.moveStoreSection(args as any),
      remove_store_section:()=>store.removeStoreSection(args as any),
      publish_store:()=>store.publishStore(),
      rollback_store_design:()=>store.rollbackStoreDesign(),
      get_shop_profile:()=>profile.getShopProfile(),
      update_shop_profile:()=>profile.updateShopProfile(args),
      list_products:()=>reads.listProducts(args as any),
      get_product:()=>reads.getProduct(args as any),
      list_orders:()=>reads.listOrders(args as any),
      get_order:()=>reads.getOrder(args as any),
      get_inventory_summary:()=>reads.getInventorySummary(),
      list_low_stock_products:()=>reads.listLowStockProducts(args as any),
      get_sales_summary:()=>reads.getSalesSummary(args as any),
      get_best_selling_products:()=>reads.getBestSellingProducts(args as any),
    };

    const result=await callMap[name]();
    if(isMutation(name)){
      const after=(name==='update_shop_profile')?null:await store.getStoreDesign();
      await createAuditSink(supabase,context).record({
        actorUserId:context.userId,shopId:context.shopId,mcpTool:name,action:name,
        beforeRevision:before?.draftRevision??null,afterRevision:after?.draftRevision??null,
        timestamp:new Date().toISOString(),requestId,
      });
    }
    return sendJson(res,200,jsonRpcResult(id,{content:[{type:'text',text:JSON.stringify(result)}],structuredContent:result}));
  }catch(error){
    const safe=toSafeMcpError(error,requestId);
    return sendJson(res,safe.status,jsonRpcError(id,safe));
  }
}
