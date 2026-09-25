import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

assert.ok(url, 'SUPABASE_URL is required');
assert.ok(anonKey, 'SUPABASE_ANON_KEY is required');
assert.ok(serviceKey, 'SUPABASE_SERVICE_ROLE_KEY is required');
assert.match(url, /^http:\/\/(127\.0\.0\.1|localhost):\d+$/, 'runtime must target local Supabase only');

type Plan = 'free_trial' | 'starter' | 'business';
type Seller = {
  id: string;
  email: string;
  password: string;
  client: SupabaseClient;
};

const options = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
};

const service = createClient(url, serviceKey, options);
const anon = createClient(url, anonKey, options);

let ipCounter = 10;
function apiClient(key: string, ip?: string) {
  const syntheticIp = ip ?? `198.51.100.${ipCounter++}`;
  return createClient(url!, key, {
    ...options,
    global: { headers: { 'x-forwarded-for': syntheticIp } },
  });
}

function ok<T>(result: { data: T; error: unknown }, label: string): T {
  assert.equal(result.error, null, `${label}: ${JSON.stringify(result.error)}`);
  return result.data;
}

function errorText(error: unknown): string {
  if (!error) return '';
  if (typeof error === 'string') return error;
  if (typeof error === 'object') {
    const record = error as Record<string, unknown>;
    return [record.message, record.details, record.hint, record.code].filter(Boolean).join(' ');
  }
  return String(error);
}

async function expectBlocked(promise: Promise<{ data: unknown; error: unknown }>, label: string) {
  const result = await promise;
  assert.ok(result.error || (Array.isArray(result.data) && result.data.length === 0), `${label}: operation unexpectedly succeeded`);
  return result;
}

async function race<T>(ops: Array<() => Promise<T>>): Promise<PromiseSettledResult<T>[]> {
  let release!: () => void;
  const barrier = new Promise<void>((resolve) => { release = resolve; });
  const tasks = ops.map((operation) => (async () => {
    await barrier;
    return operation();
  })());
  release();
  return Promise.allSettled(tasks);
}

async function createSeller(label: string): Promise<Seller> {
  const suffix = randomUUID().slice(0, 8);
  const email = `runtime-${label}-${suffix}@example.test`;
  const password = `Runtime-${suffix}-Pass!23`;
  const created = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  assert.equal(created.error, null, `create ${label} auth user: ${created.error?.message}`);
  const id = created.data.user!.id;
  const client = apiClient(anonKey!);
  const signedIn = await client.auth.signInWithPassword({ email, password });
  assert.equal(signedIn.error, null, `sign in ${label}: ${signedIn.error?.message}`);
  return { id, email, password, client };
}

async function createShop(ownerId: string, plan: Plan, label: string) {
  const id = randomUUID();
  const safeLabel = label.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 20).replace(/-+$/g, '') || 'shop';
  const slug = `rt-${safeLabel}-${randomUUID().slice(0, 8)}`;
  const result = await service.from('shops').insert({
    id,
    owner_id: ownerId,
    slug,
    name: `Runtime ${label}`,
    plan,
    is_active: true,
    default_delivery_fee: 2500,
    delivery_service: 'custom',
  }).select('id,slug,plan').single();
  return ok(result, `create ${label} shop`);
}

async function setEntitlement(shopId: string, plan: Plan, quota: number, used = 0, purchased = 0) {
  const values: Record<string, unknown> = {
    plan,
    active: true,
    monthly_quota: quota,
    monthly_used: used,
    purchased_balance: purchased,
    cycle_start: new Date().toISOString(),
    cycle_end: plan === 'free_trial' ? null : new Date(Date.now() + 86_400_000 * 30).toISOString(),
  };
  const result = await service.from('shop_entitlements').update(values).eq('shop_id', shopId).select().single();
  return ok(result, `set entitlement ${shopId}`);
}

async function createProduct(shopId: string, label: string, opts: Record<string, unknown> = {}) {
  const payload = {
    id: randomUUID(),
    shop_id: shopId,
    name: `Runtime ${label}`,
    price: 10000,
    stock: 20,
    status: 'active',
    ...opts,
  };
  const result = await service.from('products').insert(payload).select().single();
  return ok(result, `create ${label} product`);
}

function orderArgs(shopSlug: string, productId: string, key: string, phone: string, qty = 1) {
  return {
    p_shop_slug: shopSlug,
    p_customer_name: 'Runtime Buyer',
    p_customer_phone: phone,
    p_street: '1 Runtime Street',
    p_region: 'Yangon',
    p_township: 'Runtime',
    p_payment_method: 'cod',
    p_payment_ref_tail: null,
    p_items: [{ product_id: productId, qty }],
    p_idempotency_key: key,
  };
}

async function callOrder(client: SupabaseClient, args: ReturnType<typeof orderArgs>) {
  const result = await client.rpc('place_order', args);
  if (result.error) throw new Error(errorText(result.error));
  return result.data as Record<string, unknown>;
}

function countFulfilled<T>(results: PromiseSettledResult<T>[]) {
  return results.filter((r) => r.status === 'fulfilled').length;
}

function countRejected<T>(results: PromiseSettledResult<T>[]) {
  return results.filter((r) => r.status === 'rejected').length;
}

const evidence: Record<string, unknown> = {
  runtime: 'local_supabase',
  connections: {},
};

async function main() {
  console.log('DATABASE_RUNTIME_EVIDENCE_BEGIN');
  console.log(JSON.stringify({ runtime: url, production_credentials_used: false }));

  const sellerA = await createSeller('seller-a');
  const sellerB = await createSeller('seller-b');
  const shopA = await createShop(sellerA.id, 'starter', 'seller-a');
  const shopB = await createShop(sellerB.id, 'starter', 'seller-b');
  await setEntitlement(shopA.id, 'starter', 60);
  await setEntitlement(shopB.id, 'starter', 60);
  const productA = await createProduct(shopA.id, 'seller-a');
  const productB = await createProduct(shopB.id, 'seller-b');

  // RLS SELECT: authenticated Seller A must not inherit anonymous storefront visibility.
  {
    const result = await sellerA.client.from('shops').select('id').eq('id', shopB.id);
    assert.equal(result.error, null, errorText(result.error));
    assert.deepEqual(result.data, []);
    const productResult = await sellerA.client.from('products').select('id').eq('id', productB.id);
    assert.equal(productResult.error, null, errorText(productResult.error));
    assert.deepEqual(productResult.data, []);
    evidence.cross_tenant_select = 'PASS';
  }

  // Cross-tenant INSERT/UPDATE/DELETE on owner-scoped rows.
  {
    await expectBlocked(
      sellerA.client.from('products').insert({
        shop_id: shopB.id,
        name: 'Cross Tenant Insert',
        price: 1000,
        stock: 1,
        status: 'active',
      }).select(),
      'cross-tenant product insert',
    );

    const update = await sellerA.client.from('products').update({ name: 'HACKED' }).eq('id', productB.id).select('id,name');
    assert.equal(update.error, null, errorText(update.error));
    assert.deepEqual(update.data, []);

    const deletion = await sellerA.client.from('products').delete().eq('id', productB.id).select('id');
    assert.equal(deletion.error, null, errorText(deletion.error));
    assert.deepEqual(deletion.data, []);

    const preserved = ok(
      await service.from('products').select('name').eq('id', productB.id).single(),
      'verify cross-tenant target preserved',
    );
    assert.notEqual(preserved.name, 'HACKED');
    evidence.cross_tenant_insert = 'PASS';
    evidence.cross_tenant_update = 'PASS';
    evidence.cross_tenant_delete = 'PASS';
  }

  // Anonymous buyer boundary: public catalog yes; private seller/order tables no direct writes.
  {
    const publicProduct = await anon.from('products').select('id').eq('id', productA.id);
    assert.equal(publicProduct.error, null, errorText(publicProduct.error));
    assert.equal(publicProduct.data?.length, 1);

    const privateOrders = await anon.from('orders').select('id').eq('shop_id', shopA.id);
    assert.equal(privateOrders.error, null, errorText(privateOrders.error));
    assert.deepEqual(privateOrders.data, []);

    await expectBlocked(
      anon.from('orders').insert({
        shop_id: shopA.id,
        order_no: `FORGED-${Date.now()}`,
        customer_name: 'Anon',
        customer_phone: '099999999',
        payment_method: 'cod',
      }).select(),
      'anonymous direct order insert',
    );
    evidence.anonymous_boundary = 'PASS';
  }

  // Authoritative pricing: RPC ignores client pricing because only product_id + qty cross the boundary.
  {
    const pricingProduct = await createProduct(shopA.id, 'pricing', {
      price: 15000,
      promo_price: 9000,
      is_promotion: true,
      stock: 5,
    });
    const result = await callOrder(
      apiClient(anonKey!, '198.51.100.31'),
      orderArgs(shopA.slug, pricingProduct.id, randomUUID(), '0900000031'),
    );
    assert.equal(result.item_total, 9000);
    const order = ok(
      await service.from('orders').select('id').eq('order_no', result.order_no).single(),
      'authoritative pricing order',
    );
    const item = ok(
      await service.from('order_items').select('unit_price,qty').eq('order_id', order.id).single(),
      'authoritative pricing order item',
    );
    assert.equal(item.unit_price, 9000);
    evidence.authoritative_pricing = 'PASS';
  }

  // Same idempotency key: independent API clients hit PostgREST simultaneously.
  {
    const raceProduct = await createProduct(shopA.id, 'idem-race', { stock: 4 });
    const key = randomUUID();
    const before = ok(await service.from('shop_entitlements').select('monthly_used').eq('shop_id', shopA.id).single(), 'idem before');
    const clients = [apiClient(anonKey!, '198.51.100.41'), apiClient(anonKey!, '198.51.100.42')];
    const results = await race(clients.map((client, index) => () =>
      callOrder(client, orderArgs(shopA.slug, raceProduct.id, key, `090000004${index}`)),
    ));
    assert.equal(countFulfilled(results), 2, JSON.stringify(results));
    const orders = ok(await service.from('orders').select('id').eq('shop_id', shopA.id).eq('idempotency_key', key), 'idem orders');
    assert.equal(orders.length, 1);
    const after = ok(await service.from('shop_entitlements').select('monthly_used').eq('shop_id', shopA.id).single(), 'idem after');
    assert.equal(after.monthly_used, before.monthly_used + 1);
    evidence.connections = { ...(evidence.connections as object), idempotency: 2 };
    evidence.order_idempotency_concurrency = 'PASS';
  }

  // Unknown-result retry: discard first response and retry exact key; result remains single-order/single-consume.
  {
    const retryProduct = await createProduct(shopA.id, 'unknown-retry', { stock: 3 });
    const key = randomUUID();
    const before = ok(await service.from('shop_entitlements').select('monthly_used').eq('shop_id', shopA.id).single(), 'retry before');
    await callOrder(apiClient(anonKey!, '198.51.100.51'), orderArgs(shopA.slug, retryProduct.id, key, '0900000051'));
    const retry = await callOrder(apiClient(anonKey!, '198.51.100.52'), orderArgs(shopA.slug, retryProduct.id, key, '0900000051'));
    assert.ok(retry.order_no);
    const orders = ok(await service.from('orders').select('id').eq('shop_id', shopA.id).eq('idempotency_key', key), 'retry orders');
    assert.equal(orders.length, 1);
    const after = ok(await service.from('shop_entitlements').select('monthly_used').eq('shop_id', shopA.id).single(), 'retry after');
    assert.equal(after.monthly_used, before.monthly_used + 1);
    evidence.unknown_result_retry = 'PASS';
  }

  // Final stock race: stock=1, two different order keys -> exactly one successful order.
  {
    const stockShop = await createShop(sellerA.id, 'starter', 'stock-race').catch(() => null);
    // one-shop-per-owner is enforced; use Seller B's existing shop with isolated fixture reset.
    const targetShop = stockShop ?? shopB;
    await setEntitlement(targetShop.id, 'starter', 60, 0, 0);
    const stockProduct = await createProduct(targetShop.id, 'stock-race', { stock: 1 });
    const clients = [apiClient(anonKey!, '198.51.100.61'), apiClient(anonKey!, '198.51.100.62')];
    const results = await race(clients.map((client, index) => () =>
      callOrder(client, orderArgs(targetShop.slug, stockProduct.id, randomUUID(), `090000006${index}`)),
    ));
    assert.equal(countFulfilled(results), 1, JSON.stringify(results));
    assert.equal(countRejected(results), 1, JSON.stringify(results));
    const product = ok(await service.from('products').select('stock').eq('id', stockProduct.id).single(), 'stock race final');
    assert.equal(product.stock, 0);
    const ent = ok(await service.from('shop_entitlements').select('monthly_used').eq('shop_id', targetShop.id).single(), 'stock race ent');
    assert.equal(ent.monthly_used, 1);
    evidence.connections = { ...(evidence.connections as object), stock_race: 2 };
    evidence.stock_concurrency = 'PASS';
  }

  // Final entitlement race: one remaining quota slot and enough stock -> exactly one success.
  {
    const entSeller = await createSeller('ent-race');
    const entShop = await createShop(entSeller.id, 'starter', 'ent-race');
    await setEntitlement(entShop.id, 'starter', 60, 59, 0);
    const entProduct = await createProduct(entShop.id, 'ent-race', { stock: 4 });
    const clients = [apiClient(anonKey!, '198.51.100.71'), apiClient(anonKey!, '198.51.100.72')];
    const results = await race(clients.map((client, index) => () =>
      callOrder(client, orderArgs(entShop.slug, entProduct.id, randomUUID(), `090000007${index}`)),
    ));
    assert.equal(countFulfilled(results), 1, JSON.stringify(results));
    assert.equal(countRejected(results), 1, JSON.stringify(results));
    const ent = ok(await service.from('shop_entitlements').select('monthly_used').eq('shop_id', entShop.id).single(), 'ent race final');
    assert.equal(ent.monthly_used, 60);
    const product = ok(await service.from('products').select('stock').eq('id', entProduct.id).single(), 'ent race stock');
    assert.equal(product.stock, 3);
    evidence.connections = { ...(evidence.connections as object), entitlement_race: 2 };
    evidence.entitlement_concurrency = 'PASS';
  }

  // RPC transaction rollback: first line would consume stock, second line fails. Nothing persists.
  {
    const rollSeller = await createSeller('rollback');
    const rollShop = await createShop(rollSeller.id, 'starter', 'rollback');
    await setEntitlement(rollShop.id, 'starter', 60, 0, 0);
    const good = await createProduct(rollShop.id, 'rollback-good', { stock: 2 });
    const bad = await createProduct(rollShop.id, 'rollback-bad', { stock: 0 });
    const key = randomUUID();
    const client = apiClient(anonKey!, '198.51.100.81');
    const result = await client.rpc('place_order', {
      ...orderArgs(rollShop.slug, good.id, key, '0900000081'),
      p_items: [
        { product_id: good.id, qty: 1 },
        { product_id: bad.id, qty: 1 },
      ],
    });
    assert.ok(result.error, 'rollback fixture unexpectedly succeeded');
    const orders = ok(await service.from('orders').select('id').eq('shop_id', rollShop.id).eq('idempotency_key', key), 'rollback orders');
    assert.equal(orders.length, 0);
    const goodAfter = ok(await service.from('products').select('stock').eq('id', good.id).single(), 'rollback stock');
    assert.equal(goodAfter.stock, 2);
    const ent = ok(await service.from('shop_entitlements').select('monthly_used').eq('shop_id', rollShop.id).single(), 'rollback entitlement');
    assert.equal(ent.monthly_used, 0);
    evidence.transaction_rollback = 'PASS';
  }

  // Product-cap concurrency at 10 / 100 / 500. Seed to limit-1 with service role,
  // then let two authenticated seller sessions race through the real trigger/RLS path.
  {
    for (const [plan, limit] of [['free_trial', 10], ['starter', 100], ['business', 500]] as const) {
      const seller = await createSeller(`product-cap-${plan}`);
      const shop = await createShop(seller.id, plan, `product-cap-${plan}`);
      const rows = Array.from({ length: limit - 1 }, (_, i) => ({
        shop_id: shop.id,
        name: `seed-${plan}-${i}`,
        price: 1000,
        stock: 1,
        status: 'active',
      }));
      if (rows.length) {
        const inserted = await service.from('products').insert(rows);
        assert.equal(inserted.error, null, errorText(inserted.error));
      }
      const client2 = apiClient(anonKey!, `203.0.113.${ipCounter++}`);
      const signIn = await client2.auth.signInWithPassword({ email: seller.email, password: seller.password });
      assert.equal(signIn.error, null, errorText(signIn.error));
      const results = await race([seller.client, client2].map((client, index) => async () => {
        const response = await client.from('products').insert({
          shop_id: shop.id,
          name: `race-${plan}-${index}`,
          price: 1000,
          stock: 1,
          status: 'active',
        }).select('id').single();
        if (response.error) throw new Error(errorText(response.error));
        return response.data;
      }));
      assert.equal(countFulfilled(results), 1, `${plan}: ${JSON.stringify(results)}`);
      assert.equal(countRejected(results), 1, `${plan}: ${JSON.stringify(results)}`);
      const counted = ok(await service.from('products').select('id', { count: 'exact', head: false }).eq('shop_id', shop.id), `${plan} product count`);
      assert.equal(counted.length, limit);
    }
    evidence.connections = { ...(evidence.connections as object), product_cap_races: '2 each' };
    evidence.product_cap_concurrency = 'PASS';
  }

  // Product deletion preserves order history snapshot through ON DELETE SET NULL.
  {
    const seller = await createSeller('history');
    const shop = await createShop(seller.id, 'starter', 'history');
    await setEntitlement(shop.id, 'starter', 60);
    const product = await createProduct(shop.id, 'history', { price: 4200, stock: 2 });
    const orderResult = await callOrder(apiClient(anonKey!, '198.51.100.91'), orderArgs(shop.slug, product.id, randomUUID(), '0900000091'));
    const order = ok(await service.from('orders').select('id').eq('order_no', orderResult.order_no).single(), 'history order');
    const before = ok(await service.from('order_items').select('id,product_id,name,unit_price,qty').eq('order_id', order.id).single(), 'history before delete');
    assert.equal(before.product_id, product.id);
    const deleted = await seller.client.from('products').delete().eq('id', product.id).select('id');
    assert.equal(deleted.error, null, errorText(deleted.error));
    assert.equal(deleted.data?.length, 1);
    const after = ok(await service.from('order_items').select('product_id,name,unit_price,qty').eq('id', before.id).single(), 'history after delete');
    assert.equal(after.product_id, null);
    assert.equal(after.name, before.name);
    assert.equal(after.unit_price, before.unit_price);
    assert.equal(after.qty, before.qty);
    evidence.product_deletion_history = 'PASS';
  }

  // Commercial plan boundaries: 20 / 60 / 200 created orders are the hard caps.
  {
    for (const [plan, quota] of [['free_trial', 20], ['starter', 60], ['business', 200]] as const) {
      const seller = await createSeller(`quota-${plan}`);
      const shop = await createShop(seller.id, plan, `quota-${plan}`);
      await setEntitlement(shop.id, plan, quota, quota - 1, 0);
      const product = await createProduct(shop.id, `quota-${plan}`, { stock: 3 });
      await callOrder(apiClient(anonKey!), orderArgs(shop.slug, product.id, randomUUID(), `09${quota}000001`));
      const blocked = await apiClient(anonKey!).rpc('place_order', orderArgs(shop.slug, product.id, randomUUID(), `09${quota}000002`));
      assert.ok(blocked.error, `${plan} quota+1 should fail`);
      assert.match(errorText(blocked.error), /order_quota_exhausted/);
      const ent = ok(await service.from('shop_entitlements').select('monthly_used').eq('shop_id', shop.id).single(), `${plan} final usage`);
      assert.equal(ent.monthly_used, quota);
    }
    evidence.plan_boundaries = { free_trial: 20, starter: 60, business: 200, result: 'PASS' };
  }

  // Cancellation/rejection/RTO/refund do not have restoration hooks. Runtime-proof
  // the represented seller cancellation transition and verify consumption remains.
  {
    const seller = await createSeller('cancel-no-restore');
    const shop = await createShop(seller.id, 'starter', 'cancel-no-restore');
    await setEntitlement(shop.id, 'starter', 60, 0, 0);
    const product = await createProduct(shop.id, 'cancel-no-restore', { stock: 3 });
    const placed = await callOrder(apiClient(anonKey!), orderArgs(shop.slug, product.id, randomUUID(), '0900000101'));
    const order = ok(await service.from('orders').select('id').eq('order_no', placed.order_no).single(), 'cancel order');
    const updated = await seller.client.from('orders').update({ status: 'cancelled' }).eq('id', order.id).select('id,status').single();
    assert.equal(updated.error, null, errorText(updated.error));
    const ent = ok(await service.from('shop_entitlements').select('monthly_used').eq('shop_id', shop.id).single(), 'cancel entitlement');
    assert.equal(ent.monthly_used, 1);
    evidence.cancellation_non_restoration = 'PASS';
    evidence.rejection_rto_refund_non_restoration = 'PARTIAL: domain rule has no distinct persisted order statuses to transition in current schema';
  }

  // Renewal resets paid-plan monthly_used while preserving purchased balance.
  {
    const seller = await createSeller('renewal');
    const shop = await createShop(seller.id, 'starter', 'renewal');
    await setEntitlement(shop.id, 'starter', 60, 37, 9);
    const renewed = await service.rpc('admin_renew_subscription', {
      p_shop_id: shop.id,
      p_payment_ref: `renew-${randomUUID()}`,
    });
    assert.equal(renewed.error, null, errorText(renewed.error));
    const ent = ok(await service.from('shop_entitlements').select('monthly_quota,monthly_used,purchased_balance,active').eq('shop_id', shop.id).single(), 'renewed entitlement');
    assert.equal(ent.monthly_quota, 60);
    assert.equal(ent.monthly_used, 0);
    assert.equal(ent.purchased_balance, 9);
    assert.equal(ent.active, true);
    evidence.renewal_behavior = 'PASS';
  }

  // Subscription activation payment identity is race-safe and duplicate payment is rejected.
  {
    const seller = await createSeller('billing-race');
    const shop = await createShop(seller.id, 'free_trial', 'billing-race');
    const paymentRef = `activation-${randomUUID()}`;
    const clients = [apiClient(serviceKey!, '198.51.100.111'), apiClient(serviceKey!, '198.51.100.112')];
    const results = await race(clients.map((client) => async () => {
      const response = await client.rpc('admin_activate_subscription', {
        p_shop_id: shop.id,
        p_plan: 'starter',
        p_payment_ref: paymentRef,
      });
      if (response.error) throw new Error(errorText(response.error));
      return response.data;
    }));
    assert.equal(countFulfilled(results), 1, JSON.stringify(results));
    assert.equal(countRejected(results), 1, JSON.stringify(results));
    const ledger = ok(await service.from('entitlement_ledger').select('id').eq('shop_id', shop.id).eq('source_type', 'manual').eq('source_id', paymentRef), 'activation ledger');
    assert.equal(ledger.length, 1);
    evidence.connections = { ...(evidence.connections as object), billing_activation_race: 2 };
    evidence.billing_idempotency = 'PASS';
  }

  // Payment-proof activation retry returns the already-approved outcome without a new cycle.
  {
    const seller = await createSeller('activation-retry');
    const shop = await createShop(seller.id, 'free_trial', 'activation-retry');
    const proofId = randomUUID();
    const seeded = await service.from('payment_proofs').insert({
      id: proofId,
      shop_id: shop.id,
      owner_id: seller.id,
      screenshot_url: 'local-test/proof.png',
      status: 'pending',
    });
    assert.equal(seeded.error, null, errorText(seeded.error));
    const transactionId = `TX-${randomUUID()}`;
    const args = {
      p_payment_id: proofId,
      p_transaction_id: transactionId,
      p_amount: 29000,
      p_receiver_name: 'Moe Htet Kyaw',
      p_sender_name: 'Runtime Seller',
      p_paid_at: new Date().toISOString(),
      p_confidence: 0.99,
      p_raw_extraction: {},
    };
    const first = await service.rpc('activate_plan_from_verified_payment', args);
    assert.equal(first.error, null, errorText(first.error));
    const before = ok(await service.from('shop_entitlements').select('cycle_start,monthly_used').eq('shop_id', shop.id).single(), 'activation first state');
    const second = await service.rpc('activate_plan_from_verified_payment', args);
    assert.equal(second.error, null, errorText(second.error));
    assert.equal((second.data as Record<string, unknown>).replayed, true);
    const after = ok(await service.from('shop_entitlements').select('cycle_start,monthly_used').eq('shop_id', shop.id).single(), 'activation retry state');
    assert.equal(after.cycle_start, before.cycle_start);
    assert.equal(after.monthly_used, before.monthly_used);
    evidence.activation_retry = 'PASS';
  }

  // Extra Order: same-purchase retry exactly once.
  {
    const seller = await createSeller('pack-retry');
    const shop = await createShop(seller.id, 'starter', 'pack-retry');
    await setEntitlement(shop.id, 'starter', 60, 0, 0);
    const purchaseId = randomUUID();
    const seeded = await service.from('order_pack_purchases').insert({
      id: purchaseId,
      shop_id: shop.id,
      qty: 5,
      amount: 2500,
      payment_method: 'kpay',
      screenshot_path: 'local-test/pack.png',
      status: 'pending',
    });
    assert.equal(seeded.error, null, errorText(seeded.error));
    const tx = `PACK-${randomUUID()}`;
    for (let i = 0; i < 2; i++) {
      const result = await service.rpc('admin_credit_order_pack', { p_purchase_id: purchaseId, p_transaction_id: tx });
      assert.equal(result.error, null, errorText(result.error));
    }
    const ent = ok(await service.from('shop_entitlements').select('purchased_balance').eq('shop_id', shop.id).single(), 'pack retry balance');
    assert.equal(ent.purchased_balance, 5);
    const ledger = ok(await service.from('entitlement_ledger').select('id').eq('shop_id', shop.id).eq('source_type', 'order_pack').eq('source_id', purchaseId), 'pack retry ledger');
    assert.equal(ledger.length, 1);
    evidence.extra_order_same_purchase_retry = 'PASS';
  }

  // Extra Order: two purchase rows race with the same payment transaction -> exactly one credit.
  {
    const seller = await createSeller('pack-payment-race');
    const shop = await createShop(seller.id, 'starter', 'pack-payment-race');
    await setEntitlement(shop.id, 'starter', 60, 0, 0);
    const purchaseIds = [randomUUID(), randomUUID()];
    const seeded = await service.from('order_pack_purchases').insert(purchaseIds.map((id, i) => ({
      id,
      shop_id: shop.id,
      qty: 5,
      amount: 2500,
      payment_method: 'wave',
      screenshot_path: `local-test/pack-${i}.png`,
      status: 'pending',
    })));
    assert.equal(seeded.error, null, errorText(seeded.error));
    const tx = `PACK-RACE-${randomUUID()}`;
    const clients = [apiClient(serviceKey!, '198.51.100.121'), apiClient(serviceKey!, '198.51.100.122')];
    const results = await race(clients.map((client, i) => async () => {
      const response = await client.rpc('admin_credit_order_pack', {
        p_purchase_id: purchaseIds[i],
        p_transaction_id: tx,
      });
      if (response.error) throw new Error(errorText(response.error));
      return response.data;
    }));
    assert.equal(countFulfilled(results), 1, JSON.stringify(results));
    assert.equal(countRejected(results), 1, JSON.stringify(results));
    const ent = ok(await service.from('shop_entitlements').select('purchased_balance').eq('shop_id', shop.id).single(), 'pack payment race balance');
    assert.equal(ent.purchased_balance, 5);
    const approved = ok(await service.from('order_pack_purchases').select('id').eq('shop_id', shop.id).eq('status', 'approved'), 'pack approved rows');
    assert.equal(approved.length, 1);
    evidence.connections = { ...(evidence.connections as object), extra_order_payment_race: 2 };
    evidence.extra_order_duplicate_payment = 'PASS';
  }

  // Seller-forged transaction ID is cleared on INSERT; direct update remains unavailable.
  {
    const seller = await createSeller('pack-forge');
    const shop = await createShop(seller.id, 'starter', 'pack-forge');
    const purchase = await seller.client.from('order_pack_purchases').insert({
      shop_id: shop.id,
      qty: 1,
      amount: 500,
      payment_method: 'kpay',
      screenshot_path: 'local-test/forged.png',
      status: 'pending',
      transaction_id: 'FORGED-BY-SELLER',
    }).select('id,transaction_id').single();
    assert.equal(purchase.error, null, errorText(purchase.error));
    assert.equal(purchase.data!.transaction_id, null);
    await expectBlocked(
      seller.client.from('order_pack_purchases').update({ transaction_id: 'SECOND-FORGE' }).eq('id', purchase.data!.id).select(),
      'seller transaction id update',
    );
    evidence.seller_forged_transaction_id = 'PASS';
  }

  // SECURITY DEFINER / privileged RPC permissions.
  {
    const seller = await createSeller('rpc-permissions');
    const shop = await createShop(seller.id, 'starter', 'rpc-permissions');
    const unauth = await anon.rpc('admin_renew_subscription', { p_shop_id: shop.id, p_payment_ref: 'forbidden-anon' });
    assert.ok(unauth.error, 'anon privileged RPC unexpectedly succeeded');
    const authenticated = await seller.client.rpc('admin_renew_subscription', { p_shop_id: shop.id, p_payment_ref: 'forbidden-auth' });
    assert.ok(authenticated.error, 'authenticated privileged RPC unexpectedly succeeded');
    evidence.security_definer_rpc_permissions = 'PASS';
  }

  // Storage RLS: logo writes are Core on every plan; cross-tenant paths blocked;
  // payment proof bucket remains private and owner scoped.
  {
    const storageFixtures: Array<{ seller: Seller; shop: { id: string; slug: string; plan: string } }> = [];
    for (const plan of ['free_trial', 'starter', 'business'] as const) {
      const seller = await createSeller(`storage-${plan}`);
      const shop = await createShop(seller.id, plan, `storage-${plan}`);
      storageFixtures.push({ seller, shop });
      const upload = await seller.client.storage.from('shop-logos').upload(
        `${shop.id}/logo-${plan}.png`,
        new Blob([new Uint8Array([137, 80, 78, 71])], { type: 'image/png' }),
        { contentType: 'image/png', upsert: false },
      );
      assert.equal(upload.error, null, `${plan} logo upload: ${upload.error?.message}`);
    }

    const [a, b] = storageFixtures;
    const cross = await a.seller.client.storage.from('shop-logos').upload(
      `${b.shop.id}/cross-tenant.png`,
      new Blob([new Uint8Array([137, 80, 78, 71])], { type: 'image/png' }),
      { contentType: 'image/png', upsert: false },
    );
    assert.ok(cross.error, 'cross-tenant logo write unexpectedly succeeded');

    const proofPath = `${a.seller.id}/proof-${randomUUID()}.png`;
    const proofUpload = await a.seller.client.storage.from('payment-proofs').upload(
      proofPath,
      new Blob([new Uint8Array([137, 80, 78, 71])], { type: 'image/png' }),
      { contentType: 'image/png', upsert: false },
    );
    assert.equal(proofUpload.error, null, proofUpload.error?.message);
    const anonRead = await anon.storage.from('payment-proofs').download(proofPath);
    assert.ok(anonRead.error, 'anonymous payment proof read unexpectedly succeeded');
    const otherRead = await b.seller.client.storage.from('payment-proofs').download(proofPath);
    assert.ok(otherRead.error, 'other seller payment proof read unexpectedly succeeded');
    const ownerRead = await a.seller.client.storage.from('payment-proofs').download(proofPath);
    assert.equal(ownerRead.error, null, ownerRead.error?.message);
    evidence.storage_rls = 'PASS';
  }

  console.log(JSON.stringify(evidence, null, 2));
  console.log('DATABASE_RUNTIME_EVIDENCE_END');
}

main().catch((error) => {
  console.error('DATABASE_RUNTIME_AUDIT_FAILED');
  console.error(error);
  process.exitCode = 1;
});
