import assert from 'node:assert/strict';
import {describe, it, before} from 'node:test';
import {readFile} from 'node:fs/promises';

// Structural guard on migration 0013: the SQL is the real enforcement boundary
// (place_order() consumption, product limit, RLS un-gating), so assert its key
// invariants are present. This is not a substitute for the live DB apply, but it
// stops an accidental removal of a security- or billing-critical clause.
const url = new URL('../supabase/migrations/0016_entitlements_and_pricing.sql', import.meta.url);
let sql = '';

describe('0016 entitlements migration', () => {
  before(async () => {
    sql = await readFile(url, 'utf8');
  });

  it('adds the free_trial tier to shops + applications', () => {
    assert.match(sql, /shops_plan_check check \(plan in \('free_trial','starter','business'\)\)/);
    assert.match(sql, /shop_applications_plan_check check \(plan in \('free_trial','starter','business'\)\)/);
  });

  it('creates the four separate entitlement concepts (not one number)', () => {
    assert.match(sql, /create table if not exists public\.shop_entitlements/);
    assert.match(sql, /monthly_quota\s+integer/);
    assert.match(sql, /monthly_used\s+integer/);
    assert.match(sql, /purchased_balance integer/);
    assert.match(sql, /create table if not exists public\.entitlement_ledger/);
    assert.match(sql, /create table if not exists public\.order_pack_purchases/);
  });

  it('protects money-in events with an idempotency unique index (duplicate-payment)', () => {
    assert.match(sql, /entitlement_ledger_source_uniq[\s\S]*?\(shop_id, source_type, source_id\)/);
  });

  it('makes place_order idempotent per shop via orders.idempotency_key', () => {
    assert.match(sql, /alter table public\.orders add column if not exists idempotency_key uuid/);
    assert.match(sql, /orders_shop_idempotency_uniq[\s\S]*?\(shop_id, idempotency_key\)/);
    assert.match(sql, /p_idempotency_key uuid default null/);
  });

  it('consumes monthly quota FIRST, then purchased balance', () => {
    // The order of the branches encodes "monthly first, then purchased".
    const monthlyIdx = sql.indexOf("v_consume := 'monthly'");
    const purchasedIdx = sql.indexOf("v_consume := 'purchased'");
    assert.ok(monthlyIdx > 0 && purchasedIdx > 0);
    assert.ok(monthlyIdx < purchasedIdx, 'monthly must be chosen before purchased');
    assert.match(sql, /v_ent\.monthly_used < v_ent\.monthly_quota/);
  });

  it('preserves server-side delivery pricing from the Ninja Van/custom delivery layer', () => {
    assert.match(sql, /v_delivery := public\.resolve_delivery_fee\(v_shop\.id, p_region, p_township\)/);
    assert.match(sql, /delivery_service, origin_township, idempotency_key/);
  });

  it('rejects expired paid cycles even when active=true', () => {
    assert.match(sql, /v_ent\.cycle_end is null or v_ent\.cycle_end <= now\(\)/);
  });

  it('enforces Extra Orders quantity presets and 500 Ks\/order server-side', () => {
    assert.match(sql, /qty\s+integer not null check \(qty in \(1,5,10,20,30,50\)\)/);
    assert.match(sql, /amount\s+integer not null check \(amount = qty \* 500\)/);
  });

  it('locks the entitlement row FOR UPDATE (concurrency safety)', () => {
    assert.match(sql, /from public\.shop_entitlements\s*\n\s*where shop_id = v_shop\.id for update/);
  });

  it('blocks the 11th free-trial product server-side', () => {
    assert.match(sql, /enforce_product_limit/);
    assert.match(sql, /if v_count >= 10 then\s*\n\s*raise exception 'product_limit_reached'/);
  });

  it('makes township shipping core (owner-scoped, not Business-only)', () => {
    assert.match(sql, /drop policy if exists ship_business_insert/);
    assert.match(sql, /create policy ship_owner_insert on public\.shipping_zones/);
    // The new write policies must NOT re-introduce a plan = 'business' gate.
    const shippingBlock = sql.slice(sql.indexOf('create policy ship_owner_insert'), sql.indexOf('place_order(): consume'));
    assert.ok(!/plan = 'business'/.test(shippingBlock), 'township shipping must not be Business-gated');
  });

  it('never DELETEs a shop/product/order row (downgrade preserves data)', () => {
    assert.ok(!/delete from public\.(products|orders|shops)\b/i.test(sql));
  });

  it('keeps owner entitlement RPCs off the anon/authenticated roles', () => {
    for (const fn of ['admin_activate_subscription', 'admin_credit_order_pack', 'admin_upgrade_plan']) {
      assert.match(sql, new RegExp(`revoke all on function public\\.${fn}\\([^)]*\\) from public, anon, authenticated`));
      assert.match(sql, new RegExp(`grant execute on function public\\.${fn}\\([^)]*\\) to service_role`));
    }
  });
});
