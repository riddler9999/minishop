import type {MiniShopCapability, McpToolName} from './contracts.js';
import {THEME_PRESETS} from '../../src/domain/theme.js';
import {z} from 'zod';
import {McpError} from './errors.js';

const template=z.enum(['home','collection','product']);
const pageSize=z.number().int().min(1).max(100).optional();
const empty=z.object({}).strict();
const argsSchemas={
  get_store_design:empty,
  update_store_theme:z.object({themeId:z.enum(Object.keys(THEME_PRESETS) as [string,...string[]])}).strict(),
  add_store_section:z.object({template,type:z.string().min(1)}).strict(),
  update_store_section:z.object({template,sectionId:z.string().min(1),settings:z.record(z.string(),z.unknown()),enabled:z.boolean().optional()}).strict(),
  move_store_section:z.object({template,sectionId:z.string().min(1),toIndex:z.number().int().min(0)}).strict(),
  remove_store_section:z.object({template,sectionId:z.string().min(1)}).strict(),
  publish_store:empty,
  rollback_store_design:empty,
  get_shop_profile:empty,
  update_shop_profile:z.object({name:z.string().nullable().optional(),phone:z.string().nullable().optional(),logoUrl:z.string().nullable().optional(),defaultDeliveryFee:z.number().finite().nonnegative().optional(),originRegion:z.string().nullable().optional(),originTownship:z.string().nullable().optional(),deliveryService:z.string().nullable().optional()}).strict().refine(value=>Object.keys(value).length>0),
  list_products:z.object({limit:pageSize,cursor:z.string().optional(),category:z.string().optional()}).strict(),
  get_product:z.object({id:z.string().min(1)}).strict(),
  list_orders:z.object({limit:pageSize,cursor:z.string().optional()}).strict(),
  get_order:z.object({id:z.string().min(1)}).strict(),
  get_inventory_summary:empty,
  list_low_stock_products:z.object({threshold:z.number().finite().min(0).max(100000).optional(),limit:pageSize}).strict(),
  get_sales_summary:z.object({start:z.string().min(1),end:z.string().min(1)}).strict(),
  get_best_selling_products:z.object({start:z.string().min(1),end:z.string().min(1),limit:pageSize}).strict(),
} satisfies Record<McpToolName,z.ZodType>;

export function parseToolArguments(name:McpToolName,input:unknown):Record<string,unknown>{
  const result=argsSchemas[name].safeParse(input);
  if(!result.success) throw new McpError('INVALID_ARGUMENTS',400,'Invalid MCP tool arguments.');
  return result.data as Record<string,unknown>;
}

export interface ToolDefinition {
  capability: MiniShopCapability;
  description: string;
  inputSchema: Record<string, unknown>;
}

export const TOOL_REGISTRY: Record<McpToolName, ToolDefinition> = {
  get_store_design: {capability:'store:read',description:'Read the seller Store Design lifecycle.',inputSchema:{type:'object',properties:{},additionalProperties:false}},
  update_store_theme: {capability:'store:write',description:'Update the Draft Store Design theme.',inputSchema:{type:'object',properties:{themeId:{type:'string',enum:Object.keys(THEME_PRESETS)}},required:['themeId'],additionalProperties:false}},
  add_store_section: {capability:'store:write',description:'Add a registered section to Draft.',inputSchema:{type:'object',properties:{template:{enum:['home','collection','product']},type:{type:'string'}},required:['template','type'],additionalProperties:false}},
  update_store_section: {capability:'store:write',description:'Update one Draft section.',inputSchema:{type:'object',properties:{template:{enum:['home','collection','product']},sectionId:{type:'string'},settings:{type:'object'},enabled:{type:'boolean'}},required:['template','sectionId','settings'],additionalProperties:false}},
  move_store_section: {capability:'store:write',description:'Move one Draft section.',inputSchema:{type:'object',properties:{template:{enum:['home','collection','product']},sectionId:{type:'string'},toIndex:{type:'integer',minimum:0}},required:['template','sectionId','toIndex'],additionalProperties:false}},
  remove_store_section: {capability:'store:write',description:'Remove one removable Draft section.',inputSchema:{type:'object',properties:{template:{enum:['home','collection','product']},sectionId:{type:'string'}},required:['template','sectionId'],additionalProperties:false}},
  publish_store: {capability:'store:publish',description:'Publish the current Draft Store Design.',inputSchema:{type:'object',properties:{},additionalProperties:false}},
  rollback_store_design: {capability:'store:publish',description:'Restore Previous Published Store Design.',inputSchema:{type:'object',properties:{},additionalProperties:false}},
  get_shop_profile: {capability:'profile:read',description:'Read the seller storefront profile.',inputSchema:{type:'object',properties:{},additionalProperties:false}},
  update_shop_profile: {capability:'profile:write',description:'Update whitelisted storefront profile fields.',inputSchema:{type:'object',properties:{name:{type:['string','null']},phone:{type:['string','null']},logoUrl:{type:['string','null']},defaultDeliveryFee:{type:'number',minimum:0},originRegion:{type:['string','null']},originTownship:{type:['string','null']},deliveryService:{type:['string','null']}},additionalProperties:false,minProperties:1}},
  list_products: {capability:'products:read',description:'List seller products.',inputSchema:{type:'object',properties:{limit:{type:'integer'},cursor:{type:'string'},category:{type:'string'}},additionalProperties:false}},
  get_product: {capability:'products:read',description:'Get one seller product.',inputSchema:{type:'object',properties:{id:{type:'string'}},required:['id'],additionalProperties:false}},
  list_orders: {capability:'orders:read',description:'List seller orders.',inputSchema:{type:'object',properties:{limit:{type:'integer'},cursor:{type:'string'}},additionalProperties:false}},
  get_order: {capability:'orders:read',description:'Get one seller order.',inputSchema:{type:'object',properties:{id:{type:'string'}},required:['id'],additionalProperties:false}},
  get_inventory_summary: {capability:'inventory:read',description:'Summarize seller inventory.',inputSchema:{type:'object',properties:{},additionalProperties:false}},
  list_low_stock_products: {capability:'inventory:read',description:'List low-stock seller products.',inputSchema:{type:'object',properties:{threshold:{type:'number'},limit:{type:'integer'}},additionalProperties:false}},
  get_sales_summary: {capability:'analytics:read',description:'Get bounded historical sales summary.',inputSchema:{type:'object',properties:{start:{type:'string'},end:{type:'string'}},required:['start','end'],additionalProperties:false}},
  get_best_selling_products: {capability:'analytics:read',description:'Get bounded best-selling products.',inputSchema:{type:'object',properties:{start:{type:'string'},end:{type:'string'},limit:{type:'integer'}},required:['start','end'],additionalProperties:false}},
};
