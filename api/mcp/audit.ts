import type {SupabaseClient} from '@supabase/supabase-js';
import type {AuditEntry, AuditSink, SellerContext} from './contracts.js';
import {McpError} from './errors.js';

export function createAuditSink(client: SupabaseClient, context: SellerContext): AuditSink {
  return {
    async record(entry: AuditEntry) {
      const {error}=await client.from('mcp_audit_log').insert({
        actor_user_id: context.userId,
        shop_id: context.shopId,
        mcp_tool: entry.mcpTool,
        action: entry.action,
        before_revision: entry.beforeRevision,
        after_revision: entry.afterRevision,
        request_id: entry.requestId,
        created_at: entry.timestamp,
      });
      if(error) throw new McpError('INTERNAL_ERROR',500,'MCP audit write failed.');
    },
  };
}
