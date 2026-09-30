import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const migration = readFileSync(
  new URL('../supabase/migrations/0034_inventory_movements.sql', import.meta.url),
  'utf8',
);
const context = readFileSync(new URL('../CONTEXT.md', import.meta.url), 'utf8');

test('Task 13 creates an auditable inventory movement ledger', () => {
  assert.match(migration, /create table if not exists public\.inventory_movements/i);
  assert.match(migration, /movement_type text not null/i);
  assert.match(migration, /quantity_delta integer not null/i);
  assert.match(migration, /stock_before integer not null/i);
  assert.match(migration, /stock_after integer not null/i);
  assert.match(migration, /source_type text not null/i);
  assert.match(migration, /product_id uuid not null/i);
  assert.doesNotMatch(migration, /product_id uuid[^\n]*references public\.products[^\n]*on delete cascade/i);
  assert.match(migration, /product_name_snapshot text not null/i);
  assert.match(migration, /source_id text/i);
  assert.match(migration, /created_at timestamptz/i);
});

test('automatic product stock mutations are captured without changing checkout semantics', () => {
  assert.match(migration, /capture_product_stock_movement/i);
  assert.match(migration, /after update of stock on public\.products/i);
  assert.match(migration, /order_consume/i);
  assert.match(migration, /manual_adjustment/i);
  assert.match(migration, /set_inventory_order_context/i);
  assert.match(migration, /minishop\.inventory_order_id/i);
  assert.match(migration, /new\.id::text/i);
});

test('manual stock adjustment is seller scoped and requires a reason', () => {
  assert.match(migration, /adjust_own_product_stock/i);
  assert.match(migration, /owner_id = auth\.uid\(\)/i);
  assert.match(migration, /inventory_adjustment_reason_required/i);
  assert.match(migration, /inventory_adjustment_would_go_negative/i);
  assert.match(migration, /seller product editor stock update/i);
  assert.match(migration, /actor_user_id/i);
});

test('refund and cancellation do not silently restock under the current policy', () => {
  assert.match(context, /Reject \/ Cancel \/ buyer no-show \/ RTO \/ later refund do \*\*not\*\* restore quota/i);
  assert.match(migration, /cancellation_does_not_auto_restock/i);
  assert.match(migration, /refund_restock_requires_manual_policy_decision/i);
  assert.doesNotMatch(migration, /status = 'cancelled'[\s\S]*stock = stock \+/i);
});
