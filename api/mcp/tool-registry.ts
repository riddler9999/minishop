import type {MiniShopCapability, McpToolName} from './contracts.ts';

export interface ToolDefinition {
  capability: MiniShopCapability;
  description: string;
  inputSchema: Record<string, unknown>;
}

export const TOOL_REGISTRY: Record<McpToolName, ToolDefinition> = {
  get_store_design: {capability:'store:read',description:'Read the seller Store Design lifecycle.',inputSchema:{type:'object',properties:{},additionalProperties:false}},
  update_store_theme: {capability:'store:write',description:'Update the Draft Store Design theme.',inputSchema:{type:'object',properties:{themeId:{type:'string'}},required:['themeId'],additionalProperties:false}},
  add_store_section: {capability:'store:write',description:'Add a registered section to Draft.',inputSchema:{type:'object',properties:{template:{enum:['home','collection','product']},type:{type:'string'}},required:['template','type'],additionalProperties:false}},
  update_store_section: {capability:'store:write',description:'Update one Draft section.',inputSchema:{type:'object',properties:{template:{enum:['home','collection','product']},sectionId:{type:'string'},settings:{type:'object'},enabled:{type:'boolean'}},required:['template','sectionId','settings'],additionalProperties:false}},
  move_store_section: {capability:'store:write',description:'Move one Draft section.',inputSchema:{type:'object',properties:{template:{enum:['home','collection','product']},sectionId:{type:'string'},toIndex:{type:'integer',minimum:0}},required:['template','sectionId','toIndex'],additionalProperties:false}},
  remove_store_section: {capability:'store:write',description:'Remove one removable Draft section.',inputSchema:{type:'object',properties:{template:{enum:['home','collection','product']},sectionId:{type:'string'}},required:['template','sectionId'],additionalProperties:false}},
  publish_store: {capability:'store:publish',description:'Publish the current Draft Store Design.',inputSchema:{type:'object',properties:{},additionalProperties:false}},
  rollback_store_design: {capability:'store:publish',description:'Restore Previous Published Store Design.',inputSchema:{type:'object',properties:{},additionalProperties:false}},
  get_shop_profile: {capability:'profile:read',description:'Read the seller storefront profile.',inputSchema:{type:'object',properties:{},additionalProperties:false}},
  update_shop_profile: {capability:'profile:write',description:'Update whitelisted storefront profile fields.',inputSchema:{type:'object',additionalProperties:true}},
  list_products: {capability:'products:read',description:'List seller products.',inputSchema:{type:'object',properties:{limit:{type:'integer'},cursor:{type:'string'},category:{type:'string'}},additionalProperties:false}},
  get_product: {capability:'products:read',description:'Get one seller product.',inputSchema:{type:'object',properties:{id:{type:'string'}},required:['id'],additionalProperties:false}},
  list_orders: {capability:'orders:read',description:'List seller orders.',inputSchema:{type:'object',properties:{limit:{type:'integer'},cursor:{type:'string'}},additionalProperties:false}},
  get_order: {capability:'orders:read',description:'Get one seller order.',inputSchema:{type:'object',properties:{id:{type:'string'}},required:['id'],additionalProperties:false}},
  get_inventory_summary: {capability:'inventory:read',description:'Summarize seller inventory.',inputSchema:{type:'object',properties:{},additionalProperties:false}},
  list_low_stock_products: {capability:'inventory:read',description:'List low-stock seller products.',inputSchema:{type:'object',properties:{threshold:{type:'number'},limit:{type:'integer'}},additionalProperties:false}},
  get_sales_summary: {capability:'analytics:read',description:'Get bounded historical sales summary.',inputSchema:{type:'object',properties:{start:{type:'string'},end:{type:'string'}},required:['start','end'],additionalProperties:false}},
  get_best_selling_products: {capability:'analytics:read',description:'Get bounded best-selling products.',inputSchema:{type:'object',properties:{start:{type:'string'},end:{type:'string'},limit:{type:'integer'}},required:['start','end'],additionalProperties:false}},
};
