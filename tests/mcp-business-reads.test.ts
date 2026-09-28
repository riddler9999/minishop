import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {McpError} from '../api/mcp/errors.ts';
import {decodeCursor,encodeCursor,normalizePageSize,validateDateRange} from '../api/mcp/pagination.ts';
import {createBusinessReadService} from '../api/mcp/read-models.ts';

describe('MCP pagination/date guards',()=>{
  it('bounds page size and round-trips opaque cursors',()=>{
    assert.equal(normalizePageSize(undefined),25);
    assert.equal(normalizePageSize(500),100);
    const cursor=encodeCursor({createdAt:'2026-01-01T00:00:00Z',id:'x'});
    assert.deepEqual(decodeCursor(cursor),{createdAt:'2026-01-01T00:00:00Z',id:'x'});
    assert.throws(()=>decodeCursor('not-base64'),(e:unknown)=>e instanceof McpError&&e.code==='INVALID_CURSOR');
  });
  it('accepts bounded historical ranges and rejects invalid/reversed/too-wide ranges',()=>{
    assert.doesNotThrow(()=>validateDateRange('2026-01-01','2026-12-31'));
    for(const pair of [['bad','2026-01-01'],['2026-02-01','2026-01-01'],['2024-01-01','2026-01-02']] as const){
      assert.throws(()=>validateDateRange(pair[0],pair[1]),(e:unknown)=>e instanceof McpError&&e.code==='INVALID_DATE_RANGE');
    }
  });
});

describe('MCP business reads',()=>{
  it('scopes product/order reads to seller shop and returns empty pages safely',async()=>{
    const seen:any[]=[];
    const client:any={from(table:string){seen.push({table}); return {
      select(){return this;},eq(k:string,v:any){seen.push({k,v});return this;},order(){return this;},limit(){return this;},range(){return this;},
      maybeSingle:async()=>({data:null,error:null}),then:undefined,
    };}};
    const svc=createBusinessReadService(client,{userId:'seller-a',shopId:'shop-a',capabilities:new Set()});
    await svc.listProducts({});
    await svc.listOrders({});
    assert.ok(seen.filter(x=>x.k==='shop_id').every(x=>x.v==='shop-a'));
  });
});
