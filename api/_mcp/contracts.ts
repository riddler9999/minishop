import {randomUUID} from 'node:crypto';

export const MINI_SHOP_CAPABILITIES = [
  'store:read',
  'store:write',
  'store:publish',
  'profile:read',
  'profile:write',
  'products:read',
  'orders:read',
  'inventory:read',
  'analytics:read',
] as const;

export type MiniShopCapability = typeof MINI_SHOP_CAPABILITIES[number];

export const MCP_TOOL_NAMES = [
  'get_store_design',
  'update_store_theme',
  'add_store_section',
  'update_store_section',
  'move_store_section',
  'remove_store_section',
  'publish_store',
  'rollback_store_design',
  'get_shop_profile',
  'update_shop_profile',
  'list_products',
  'get_product',
  'list_orders',
  'get_order',
  'get_inventory_summary',
  'list_low_stock_products',
  'get_sales_summary',
  'get_best_selling_products',
] as const;

export type McpToolName = typeof MCP_TOOL_NAMES[number];

export interface SellerContext {
  userId: string;
  shopId: string;
  capabilities: ReadonlySet<MiniShopCapability>;
}

export interface AuditEntry {
  actorUserId: string;
  shopId: string;
  mcpTool: McpToolName;
  action: string;
  beforeRevision: number | null;
  afterRevision: number | null;
  timestamp: string;
  requestId: string;
}

export interface AuditSink {
  record(entry: AuditEntry): Promise<void>;
}

export function createRequestId(): string {
  return randomUUID();
}
