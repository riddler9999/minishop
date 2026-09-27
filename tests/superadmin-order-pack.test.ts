import test from 'node:test';
import assert from 'node:assert/strict';
import {createSuperadminHandler} from '../api/superadmin.ts';
import {buildCreditPackRequest, ORDER_PACK_TRANSACTION_ID_MAX_LENGTH} from '../src/features/superadmin/orderPackApproval.ts';

function makeResponse() {
  let body = '';
  return {
    statusCode: 0,
    headers: new Map<string,string>(),
    setHeader(name:string, value:string){ this.headers.set(name,value); },
    end(chunk?:string){ body = chunk ?? ''; },
    json(){ return body ? JSON.parse(body) : null; },
  };
}

function makeAdmin(options?: {rpcError?: {message:string}|null}) {
  const rpcCalls:any[] = [];
  const admin:any = {
    rpc: async (name:string, args:any) => {
      rpcCalls.push({name,args});
      return {error: options?.rpcError ?? null};
    },
  };
  return {admin, rpcCalls};
}

test('credit-pack rejects missing transactionId before RPC', async () => {
  const {admin, rpcCalls} = makeAdmin();
  const handler = createSuperadminHandler({requireAccess: async () => ({admin, user:{}} as any)} as any);
  const res:any = makeResponse();
  await handler({method:'POST', body:{action:'credit-pack', purchaseId:'purchase-1'}}, res);
  assert.equal(res.statusCode, 400);
  assert.equal(rpcCalls.length, 0);
});

test('credit-pack rejects whitespace-only transactionId before RPC', async () => {
  const {admin, rpcCalls} = makeAdmin();
  const handler = createSuperadminHandler({requireAccess: async () => ({admin, user:{}} as any)} as any);
  const res:any = makeResponse();
  await handler({method:'POST', body:{action:'credit-pack', purchaseId:'purchase-1', transactionId:'   '}}, res);
  assert.equal(res.statusCode, 400);
  assert.equal(rpcCalls.length, 0);
});

test('credit-pack trims and forwards valid transactionId to hardened RPC', async () => {
  const {admin, rpcCalls} = makeAdmin();
  const handler = createSuperadminHandler({requireAccess: async () => ({admin, user:{}} as any)} as any);
  const res:any = makeResponse();
  await handler({method:'POST', body:{action:'credit-pack', purchaseId:' purchase-1 ', transactionId:'  TX-12345  '}}, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(rpcCalls, [{
    name:'admin_credit_order_pack',
    args:{p_purchase_id:'purchase-1', p_transaction_id:'TX-12345'},
  }]);
});

test('credit-pack maps unknown DB errors to safe domain fallback', async () => {
  const {admin} = makeAdmin({rpcError:{message:'column secret_internal does not exist at character 42'}});
  const handler = createSuperadminHandler({requireAccess: async () => ({admin, user:{}} as any)} as any);
  const res:any = makeResponse();
  await handler({method:'POST', body:{action:'credit-pack', purchaseId:'purchase-1', transactionId:'TX-123'}}, res);
  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.json(), {error:'Action failed'});
});

test('GET pack projection stays pre-0023 compatible and does not request transaction_id', async () => {
  const selected:string[] = [];
  const query = () => ({
    order(){ return this; },
    limit: async () => ({data:[], error:null}),
  });
  const admin:any = {
    from(table:string) {
      return {
        select(selection:string) {
          if (table === 'order_pack_purchases') selected.push(selection);
          return query();
        },
      };
    },
    storage: {from(){ return {createSignedUrl: async () => ({data:{signedUrl:null}})}; }},
  };
  const handler = createSuperadminHandler({requireAccess: async () => ({admin, user:{}} as any)} as any);
  const res:any = makeResponse();
  await handler({method:'GET'}, res);
  assert.equal(res.statusCode, 200);
  assert.equal(selected.length, 1);
  assert.doesNotMatch(selected[0], /transaction_id/);
});


test('frontend approval request rejects missing or whitespace-only transaction id', () => {
  assert.equal(buildCreditPackRequest('purchase-1', ''), null);
  assert.equal(buildCreditPackRequest('purchase-1', '   '), null);
});

test('frontend approval request includes purchaseId and trimmed transactionId', () => {
  assert.deepEqual(buildCreditPackRequest(' purchase-1 ', '  TX-778899  '), {
    action: 'credit-pack',
    purchaseId: 'purchase-1',
    transactionId: 'TX-778899',
  });
});

test('frontend approval request rejects transaction id above max length', () => {
  assert.equal(
    buildCreditPackRequest('purchase-1', 'X'.repeat(ORDER_PACK_TRANSACTION_ID_MAX_LENGTH + 1)),
    null,
  );
});

test('credit-pack rejects overlong transactionId before RPC instead of truncating identity', async () => {
  const {admin, rpcCalls} = makeAdmin();
  const handler = createSuperadminHandler({requireAccess: async () => ({admin, user:{}} as any)} as any);
  const res:any = makeResponse();
  await handler({
    method:'POST',
    body:{
      action:'credit-pack',
      purchaseId:'purchase-1',
      transactionId:'X'.repeat(ORDER_PACK_TRANSACTION_ID_MAX_LENGTH + 1),
    },
  }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(rpcCalls.length, 0);
});
