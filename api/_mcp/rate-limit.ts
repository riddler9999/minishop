import type {McpToolName, SellerContext} from './contracts.js';
import {McpError} from './errors.js';
import type {SupabaseClient} from '@supabase/supabase-js';

export type McpRateLimiter = {
  check(context: SellerContext, tool: McpToolName, client?: SupabaseClient): void | Promise<void>;
};

export function createRateLimiter(options:{max:number;windowMs:number;now?:()=>number}){
  const now=options.now??Date.now;
  const buckets=new Map<string,{count:number;resetAt:number}>();
  return {
    check(context:SellerContext,tool:McpToolName){
      const key=`${context.userId}:${tool}`;
      const t=now(); const current=buckets.get(key);
      if(!current||t>=current.resetAt){buckets.set(key,{count:1,resetAt:t+options.windowMs});return;}
      if(current.count>=options.max) throw new McpError('RATE_LIMITED',429,'MiniShop MCP rate limit exceeded.');
      current.count+=1;
    }
  };
}

/**
 * Production limiter. The check runs in Supabase so Vercel instances and cold
 * starts share one atomic seller/tool window instead of each keeping a Map.
 */
export const defaultMcpRateLimiter: McpRateLimiter = {
  async check(_context, tool, client) {
    if (!client) throw new McpError('INTERNAL_ERROR', 500, 'MCP rate limiter is unavailable.');
    const {error} = await client.rpc('enforce_own_mcp_rate_limit' as never, {p_action: tool} as never);
    if (!error) return;
    if (String(error.message).includes('mcp_rate_limit_exceeded')) {
      throw new McpError('RATE_LIMITED', 429, 'MiniShop MCP rate limit exceeded.');
    }
    throw new McpError('INTERNAL_ERROR', 500, 'MCP rate limiter is unavailable.');
  },
};
