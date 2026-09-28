import type {McpToolName, SellerContext} from './contracts.ts';
import {McpError} from './errors.ts';

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
export const defaultMcpRateLimiter=createRateLimiter({max:120,windowMs:60_000});
