import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql = fs.readFileSync(
  'supabase/migrations/0023_database_rls_concurrency_reconciliation.sql',
  'utf8',
);

test('public storefront table policies apply only to anon, not authenticated sellers', () => {
  for (const policy of ['shops_public_read', 'payacc_public_read', 'ship_public_read', 'products_public_read']) {
    assert.match(
      sql,
      new RegExp(`create policy ${policy}[\\s\\S]*?for select to anon`, 'i'),
      `${policy} must target anon only`,
    );
  }
});

test('branding storage write policies remain owner-path scoped without a Business plan gate', () => {
  for (const policy of ['tenant_media_owner_insert', 'tenant_media_owner_update', 'tenant_media_owner_delete']) {
    const start = sql.indexOf(`create policy ${policy}`);
    assert.ok(start >= 0, `${policy} missing`);
    const next = sql.indexOf('create policy ', start + 20);
    const block = sql.slice(start, next < 0 ? sql.length : next);
    assert.match(block, /bucket_id = 'shop-logos'/);
    assert.match(block, /s\.owner_id = \(select auth\.uid\(\)\)/);
    assert.match(block, /s\.id::text = \(storage\.foldername\(name\)\)\[1\]/);
    assert.doesNotMatch(block, /s\.plan\s*=\s*'business'/);
  }
});

test('Extra Order purchases gain normalized full transaction identity with uniqueness', () => {
  assert.match(sql, /alter table public\.order_pack_purchases[\s\S]*add column if not exists transaction_id text/i);
  assert.match(
    sql,
    /create unique index if not exists order_pack_purchases_transaction_id_uidx[\s\S]*btrim\(transaction_id\)[\s\S]*where transaction_id is not null/i,
  );
});

test('pack credit requires payment identity and preserves retry idempotency', () => {
  const start = sql.indexOf('create or replace function public.admin_credit_order_pack');
  assert.ok(start >= 0);
  const block = sql.slice(start);
  assert.match(block, /transaction_id_required/);
  assert.match(block, /duplicate_transaction_id/);
  assert.match(block, /for update/);
  assert.match(block, /on conflict \(shop_id, source_type, source_id\)/);
});

test('migration does not apply destructive data operations', () => {
  assert.doesNotMatch(sql, /\btruncate\b/i);
  assert.doesNotMatch(sql, /\bdrop table\b/i);
  assert.doesNotMatch(sql, /\bdelete from\b/i);
});
