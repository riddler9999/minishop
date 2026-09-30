import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {McpError} from '../server/mcp/errors.ts';
import {createAuditSink} from '../server/mcp/audit.ts';
import {createRateLimiter} from '../server/mcp/rate-limit.ts';

describe('MCP audit and rate limiting',()=>{
  it('records only safe audit metadata',async()=>{
    let inserted:any=null;
    const client:any={from(table:string){assert.equal(table,'mcp_audit_log');return{insert:async(row:any)=>{inserted=row;return{error:null};}}}};
    const sink=createAuditSink(client,{userId:'seller-a',shopId:'shop-a',capabilities:new Set()});
    await sink.record({actorUserId:'seller-a',shopId:'shop-a',mcpTool:'update_store_theme',action:'update_store_theme',beforeRevision:1,afterRevision:2,timestamp:'2026-09-28T00:00:00Z',requestId:'req-1'});
    assert.equal(inserted.actor_user_id,'seller-a');
    assert.equal(inserted.shop_id,'shop-a');
    assert.equal(inserted.request_id,'req-1');
    assert.equal('authorization' in inserted,false);
    assert.equal('token' in inserted,false);
    assert.equal('prompt' in inserted,false);
    assert.equal('payload' in inserted,false);
  });

  it('maps over-limit requests to RATE_LIMITED',()=>{
    const limiter=createRateLimiter({max:2,windowMs:60000,now:()=>1000});
    const ctx={userId:'seller-a',shopId:'shop-a',capabilities:new Set()};
    assert.doesNotThrow(()=>limiter.check(ctx as any,'list_products'));
    assert.doesNotThrow(()=>limiter.check(ctx as any,'list_products'));
    assert.throws(()=>limiter.check(ctx as any,'list_products'),(e:unknown)=>e instanceof McpError&&e.code==='RATE_LIMITED');
  });
});
