import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
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
  await handler({method:'POST', body:{action:'credit-pack', purchaseId:' purchase-1 ', paymentIdentity:'  TX-12345  ', idempotencyKey:'11111111-1111-4111-8111-111111111111'}}, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(rpcCalls, [{
    name:'admin_credit_order_pack',
    args:{p_purchase_id:'purchase-1', p_payment_identity:'TX-12345', p_idempotency_key:'11111111-1111-4111-8111-111111111111'},
  }]);
});

test('credit-pack maps unknown DB errors to safe domain fallback', async () => {
  const {admin} = makeAdmin({rpcError:{message:'column secret_internal does not exist at character 42'}});
  const handler = createSuperadminHandler({requireAccess: async () => ({admin, user:{}} as any)} as any);
  const res:any = makeResponse();
  await handler({method:'POST', body:{action:'credit-pack', purchaseId:'purchase-1', paymentIdentity:'TX-123', idempotencyKey:'22222222-2222-4222-8222-222222222222'}}, res);
  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.json(), {error:'Action failed'});
});

test('GET pack projection stays pre-0023 compatible and does not request transaction_id', () => {
  const source = readFileSync(new URL('../api/superadmin.ts', import.meta.url), 'utf8');
  const match = source.match(/getPage\(sb,'order_pack_purchases','([^']+)'/);
  assert.ok(match, 'order pack projection should be explicit');
  assert.doesNotMatch(match[1], /transaction_id/);
});


test('frontend approval request rejects missing or whitespace-only transaction id', () => {
  assert.equal(buildCreditPackRequest('purchase-1', '', 'key-1'), null);
  assert.equal(buildCreditPackRequest('purchase-1', '   ', 'key-1'), null);
});

test('frontend approval request includes purchaseId and trimmed transactionId', () => {
  assert.deepEqual(buildCreditPackRequest(' purchase-1 ', '  TX-778899  ', ' request-key '), {
    action: 'credit-pack',
    purchaseId: 'purchase-1',
    paymentIdentity: 'TX-778899',
    idempotencyKey: 'request-key',
  });
});

test('frontend approval request rejects transaction id above max length', () => {
  assert.equal(
    buildCreditPackRequest('purchase-1', 'X'.repeat(ORDER_PACK_TRANSACTION_ID_MAX_LENGTH + 1), 'key-1'),
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
