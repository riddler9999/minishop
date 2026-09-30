import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {createSuperadminHandler} from '../api/superadmin.ts';

function responseRecorder() {
  const state: {status?: number; body?: any} = {};
  const res = {
    statusCode: 200,
    setHeader() { return res; },
    end(body?: string) {
      state.status = res.statusCode;
      state.body = body ? JSON.parse(body) : undefined;
      return res;
    },
  };
  return {res, state};
}

function makePagedQuery(rows: any[], calls: any[]) {
  const filters: Array<[string, string, unknown]> = [];
  let countMode = false;
  let head = false;
  let limit = 50;
  const q: any = {
    select(_selection: string, opts?: {count?: string; head?: boolean}) {
      countMode = !!opts?.count;
      head = !!opts?.head;
      return q;
    },
    eq(column: string, value: unknown) {
      filters.push(['eq', column, value]);
      return q;
    },
    lt(column: string, value: unknown) {
      filters.push(['lt', column, value]);
      return q;
    },
    or(expr: string) {
      filters.push(['or', expr, true]);
      return q;
    },
    in(column: string, values: unknown[]) {
      filters.push(['in', column, values]);
      return q;
    },
    order() { return q; },
    limit(value: number) { limit = value; return execute(); },
  };
  async function execute() {
    calls.push({filters:[...filters], limit, countMode, head});
    let filtered = [...rows];
    for (const [op, column, value] of filters) {
      if (op === 'eq') filtered = filtered.filter((r) => r[column] === value);
      if (op === 'lt') filtered = filtered.filter((r) => String(r[column]) < String(value));
      if (op === 'in') filtered = filtered.filter((r) => (value as unknown[]).includes(r[column]));
    }
    const data = head ? null : filtered.slice(0, limit);
    return {data, error:null, count: countMode ? filtered.length : null};
  }
  return q;
}

describe('superadmin API behavior', () => {
  it('preserves authentication failures from the trusted access boundary', async () => {
    const handler = createSuperadminHandler({
      requireAccess: (async () => ({error: 'Unauthorized', status: 401} as const)) as any,
    });
    const {res, state} = responseRecorder();
    await handler({method: 'GET'}, res);
    assert.equal(state.status, 401);
    assert.deepEqual(state.body, {error: 'Unauthorized'});
  });

  it('sanitizes unknown database errors from privileged mutations', async () => {
    const admin = {
      rpc: async () => ({
        data: null,
        error: {message: 'duplicate key value violates unique constraint "shops_slug_key"'},
      }),
    };
    const handler = createSuperadminHandler({
      requireAccess: (async () => ({admin, user: {id: 'owner'}} as any)) as any,
    });
    const {res, state} = responseRecorder();
    await handler(
      {method: 'POST', body: {action: 'activate', shopId: 'shop-1', plan: 'starter', paymentIdentity: 'TX-UNKNOWN', idempotencyKey: '11111111-1111-4111-8111-111111111111'}},
      res,
    );
    assert.equal(state.status, 400);
    assert.equal(state.body.error, 'Action failed');
    assert.doesNotMatch(state.body.error, /shops_slug_key|duplicate key/i);
  });

  it('maps platform suspend/activate actions to the platform-only suspension field', async () => {
    const updates: Array<Record<string, unknown>> = [];
    const admin = {
      from(table: string) {
        assert.equal(table, 'shops');
        return {
          update(patch: Record<string, unknown>) {
            updates.push(patch);
            return {
              async eq(column: string, value: string) {
                assert.equal(column, 'id');
                assert.equal(value, 'shop-1');
                return {error: null};
              },
            };
          },
        };
      },
    };
    const handler = createSuperadminHandler({
      requireAccess: (async () => ({admin, user: {id: 'owner'}} as any)) as any,
    });

    for (const [active, expectedSuspended] of [[false, true], [true, false]] as const) {
      const {res, state} = responseRecorder();
      await handler(
        {method: 'POST', body: {action: 'toggle-shop', shopId: 'shop-1', active}},
        res,
      );
      assert.equal(state.status, 200);
      assert.deepEqual(state.body, {ok: true});
      assert.deepEqual(updates.at(-1), {platform_suspended: expectedSuspended});
    }
  });

  it('maps known typed database errors without leaking raw diagnostics', async () => {
    const admin = {
      rpc: async () => ({data: null, error: {message: 'duplicate_payment'}}),
    };
    const handler = createSuperadminHandler({
      requireAccess: (async () => ({admin, user: {id: 'owner'}} as any)) as any,
    });
    const {res, state} = responseRecorder();
    await handler(
      {
        method: 'POST',
        body: {
          action: 'credit-pack',
          purchaseId: 'purchase-1',
          paymentIdentity: 'verified-transaction-1',
          idempotencyKey: '22222222-2222-4222-8222-222222222222',
        },
      },
      res,
    );
    assert.equal(state.status, 400);
    assert.equal(state.body.error, 'ဤငွေပေးချေမှုကို ထည့်သွင်းပြီးဖြစ်ပါသည်။');
  });

  it('returns bounded pending queues, global totals, and no eager proof URLs', async () => {
    const now = Date.parse('2026-09-30T00:00:00Z');
    const shops = Array.from({length: 620}, (_, i) => ({id:`shop-${i}`,name:`Shop ${i}`,slug:`s-${i}`,owner_id:`o-${i}`,plan:'starter',is_active:i%2===0,seller_is_active:true,platform_suspended:false,created_at:new Date(now-i*1000).toISOString(),updated_at:new Date(now-i*1000).toISOString()}));
    const applications = Array.from({length: 260}, (_, i) => ({owner_id:`owner-${i}`,plan:'starter',amount:100,status:i<230?'pending':'approved',screenshot_path:`app-${i}.png`,created_at:new Date(now-i*1000).toISOString()}));
    const packs = Array.from({length: 240}, (_, i) => ({id:`pack-${i}`,shop_id:'shop-1',qty:10,amount:50,status:i<220?'pending':'approved',screenshot_path:`pack-${i}.png`,created_at:new Date(now-i*1000).toISOString()}));
    const ents = shops.map((s) => ({shop_id:s.id,plan:'starter',active:true,monthly_quota:60,monthly_used:0,purchased_balance:0,cycle_end:null,pending_plan:null,updated_at:s.updated_at}));
    const calls:any[] = [];
    let signed = 0;
    const admin:any = {
      rpc: async (name:string) => {
        assert.equal(name,'superadmin_platform_metrics');
        return {data:[{shops:620,active_shops:310,pending_applications:230,pending_order_packs:220,recorded_revenue:4000}],error:null};
      },
      from(table:string) {
        const rows:any = table==='shops'?shops:table==='shop_applications'?applications:table==='order_pack_purchases'?packs:ents;
        return {select(selection:string, opts?:any){ return makePagedQuery(rows,calls).select(selection,opts); }};
      },
      storage:{from(){return {createSignedUrl:async()=>{signed++; return {data:{signedUrl:'x'}};}}}},
    };
    const handler=createSuperadminHandler({requireAccess:async()=>({admin,user:{id:'root'}} as any)} as any);
    const {res,state}=responseRecorder();
    await handler({method:'GET',query:{limit:'50'}},res);
    assert.equal(state.status,200);
    assert.equal(state.body.shops.length,50);
    assert.equal(state.body.applications.length,50);
    assert.equal(state.body.packs.length,50);
    assert.equal(state.body.metrics.shops,620);
    assert.equal(state.body.metrics.pendingApplications,230);
    assert.equal(state.body.metrics.pendingOrderPacks,220);
    assert.equal(state.body.metrics.recordedRevenue,4000);
    assert.equal(signed,0);
    assert.equal(typeof state.body.page.shops.nextCursor,'string');
    assert.equal(typeof state.body.page.applications.nextCursor,'string');
    assert.equal(typeof state.body.page.packs.nextCursor,'string');
  });

  it('generates a proof URL only for an explicitly opened queue record', async () => {
    let signed = 0;
    const app={owner_id:'owner-1',status:'pending',screenshot_path:'proof.png',created_at:'2026-09-30T00:00:00Z'};
    const admin:any={
      rpc: async () => ({data:[{shops:0,active_shops:0,pending_applications:1,pending_order_packs:0,recorded_revenue:0}],error:null}),
      from(table:string){
        const rows=table==='shop_applications'?[app]:[];
        return {select(selection:string,opts?:any){ return makePagedQuery(rows,[]).select(selection,opts); }};
      },
      storage:{from(){return {createSignedUrl:async(path:string)=>{signed++; assert.equal(path,'proof.png'); return {data:{signedUrl:'signed-url'}};}}}},
    };
    const handler=createSuperadminHandler({requireAccess:async()=>({admin,user:{id:'root'}} as any)} as any);
    const {res,state}=responseRecorder();
    await handler({method:'GET',query:{proofType:'application',proofId:'owner-1'}},res);
    assert.equal(state.status,200);
    assert.equal(state.body.proofUrl,'signed-url');
    assert.equal(signed,1);
  });
});
