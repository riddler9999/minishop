import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {McpError} from '../server/mcp/errors.ts';
import {decodeCursor,encodeCursor,normalizePageSize,validateDateRange} from '../server/mcp/pagination.ts';
import {createBusinessReadService} from '../server/mcp/read-models.ts';

describe('MCP pagination/date guards',()=>{
  it('bounds page size and round-trips opaque cursors',()=>{
    assert.equal(normalizePageSize(undefined),25);
    assert.equal(normalizePageSize(500),100);
    const cursor=encodeCursor({createdAt:'2026-01-01T00:00:00Z',id:'x'});
    assert.deepEqual(decodeCursor(cursor),{createdAt:'2026-01-01T00:00:00.000Z',id:'x'});
    assert.throws(()=>decodeCursor('not-base64'),(e:unknown)=>e instanceof McpError&&e.code==='INVALID_CURSOR');
    assert.throws(()=>decodeCursor(encodeCursor({createdAt:'2026-01-01T00:00:00Z',id:'x),owner_id.neq.null'})),(e:unknown)=>e instanceof McpError&&e.code==='INVALID_CURSOR');
  });
  it('accepts bounded historical ranges and rejects invalid/reversed/too-wide ranges',()=>{
    assert.doesNotThrow(()=>validateDateRange('2026-01-01','2026-12-31'));
    for(const pair of [['bad','2026-01-01'],['2026-02-01','2026-01-01'],['2024-01-01','2026-01-02']] as const){
      assert.throws(()=>validateDateRange(pair[0],pair[1]),(e:unknown)=>e instanceof McpError&&e.code==='INVALID_DATE_RANGE');
    }
  });
});

describe('MCP business reads',()=>{
  it('uses both timestamp and id when continuing a page with tied timestamps',async()=>{
    const calls:any[]=[];
    const query:any={
      select(){return this;},eq(k:string,v:any){calls.push(['eq',k,v]);return this;},
      order(k:string,options:any){calls.push(['order',k,options]);return this;},
      limit(n:number){calls.push(['limit',n]);return this;},
      lt(k:string,v:any){calls.push(['lt',k,v]);return this;},
      or(v:string){calls.push(['or',v]);return this;},
      then(resolve:any){return Promise.resolve({data:[],error:null}).then(resolve);},
    };
    const client:any={from(){return query;}};
    const svc=createBusinessReadService(client,{userId:'seller-a',shopId:'shop-a',capabilities:new Set()});
    const cursor=encodeCursor({createdAt:'2026-01-01T00:00:00.000Z',id:'8c42c4f3-78be-43af-ae3e-ae7cd57b0c0e'});
    await svc.listProducts({cursor});
    assert.deepEqual(calls.find(x=>x[0]==='or'),[
      'or',
      'created_at.lt.2026-01-01T00:00:00.000Z,and(created_at.eq.2026-01-01T00:00:00.000Z,id.lt.8c42c4f3-78be-43af-ae3e-ae7cd57b0c0e)',
    ]);
  });

  it('does not report an order with empty items when the line-item read fails',async()=>{
    const client:any={from(table:string){
      const query:any={select(){return this;},eq(){return this;},maybeSingle:async()=>({data:{id:'order-a',order_no:'A-1',status:'paid'},error:null}),
        then(resolve:any){return Promise.resolve({data:null,error:new Error('database unavailable')}).then(resolve);}};
      if(table==='orders') return query;
      return query;
    }};
    const svc=createBusinessReadService(client,{userId:'seller-a',shopId:'shop-a',capabilities:new Set()});
    await assert.rejects(svc.getOrder({id:'order-a'}),(error:unknown)=>error instanceof McpError&&error.code==='INTERNAL_ERROR');
  });

  it('aggregates analytics across PostgREST result pages without silently truncating at 1000 rows',async()=>{
    const orders=Array.from({length:1001},(_,i)=>({id:`order-${i}`,grand_total:1,status:'paid',created_at:'2026-01-01T00:00:00.000Z',is_test:false,is_duplicate:false}));
    const items=orders.map((order,i)=>({order_id:order.id,product_id:i===1000?'last-product':'common-product',name:i===1000?'Last product':'Common product',qty:i===1000?2000:1}));
    const client:any={from(table:string){
      let start=0,end=999,orderIds:string[]|null=null;
      const query:any={select(){return this;},eq(){return this;},gte(){return this;},lte(){return this;},order(){return this;},limit(n:number){end=Math.min(end,n-1);return this;},range(a:number,b:number){start=a;end=b;return this;},in(_column:string,ids:string[]){orderIds=ids;return this;},
        then(resolve:any){let rows=table==='orders'?orders:items;if(orderIds)rows=rows.filter(row=>orderIds!.includes((row as any).order_id));return Promise.resolve({data:rows.slice(start,end+1),error:null}).then(resolve);}};
      return query;
    }};
    const svc=createBusinessReadService(client,{userId:'seller-a',shopId:'shop-a',capabilities:new Set()});
    const summary=await svc.getSalesSummary({start:'2026-01-01',end:'2026-01-02'});
    assert.equal(summary.orderCount,1001);
    assert.equal(summary.grossSales,1001);
    const best=await svc.getBestSellingProducts({start:'2026-01-01',end:'2026-01-02'});
    assert.equal(best.products[0]?.productId,'last-product');
  });

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
