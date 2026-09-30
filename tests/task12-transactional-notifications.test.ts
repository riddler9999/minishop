import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const migration = readFileSync(
  new URL('../supabase/migrations/0033_transactional_notifications.sql', import.meta.url),
  'utf8',
);
const worker = readFileSync(new URL('../api/notifications.ts', import.meta.url), 'utf8');
const checkout = readFileSync(new URL('../api/checkout.ts', import.meta.url), 'utf8');
const ordersAdmin = readFileSync(new URL('../src/features/orders/api/admin.ts', import.meta.url), 'utf8');
const superadmin = readFileSync(new URL('../api/superadmin.ts', import.meta.url), 'utf8');

test('notification outbox is durable, deduplicated, retryable, and observable', () => {
  assert.match(migration, /create table if not exists public\.notification_outbox/i);
  assert.match(migration, /unique\s*\(event_key\)/i);
  assert.match(migration, /status text not null default 'pending'/i);
  assert.match(migration, /attempt_count integer not null default 0/i);
  assert.match(migration, /next_attempt_at timestamptz/i);
  assert.match(migration, /last_error text/i);
  assert.match(migration, /delivered_at timestamptz/i);
  assert.match(migration, /lease_until timestamptz/i);
  assert.match(migration, /blocked/);
});

test('order and payment lifecycle events enqueue stable notification types', () => {
  assert.match(migration, /order_created/);
  assert.match(migration, /order_status_changed/);
  assert.match(migration, /payment_approved/);
  assert.match(migration, /payment_rejected/);
  assert.doesNotMatch(checkout, /enqueue_notification/);
  assert.match(migration, /orders_notification_outbox/);
  assert.match(migration, /buyer_delivery_channel_unconfigured/);
  assert.match(migration, /owner_id = auth\.uid\(\)/);
  assert.match(ordersAdmin, /update_order_status_and_notify/);
  assert.match(superadmin, /review_application_and_notify/);
});

test('email worker uses bounded retries and does not mark failed delivery as sent', () => {
  assert.match(worker, /MAX_ATTEMPTS/);
  assert.match(worker, /next_attempt_at/);
  assert.match(worker, /last_error/);
  assert.match(worker, /delivered_at/);
  assert.match(worker, /status:\s*'failed'/);
  assert.match(worker, /status:\s*'sent'/);
});

test('notification content avoids full payment identity and unnecessary buyer PII', () => {
  assert.doesNotMatch(worker, /customer_address/);
  assert.doesNotMatch(worker, /payment_identity/);
  assert.doesNotMatch(worker, /transaction_id/);
});
