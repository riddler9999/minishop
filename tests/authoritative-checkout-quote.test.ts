import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

test('Task 5 exposes one server-authoritative quote contract for Ninja Van, custom zones, default fee and unavailable routes', async () => {
  const sql = await readFile(
    new URL('../supabase/migrations/0029_authoritative_checkout_quote.sql', import.meta.url),
    'utf8',
  );

  assert.match(sql, /create or replace function public\.quote_order\(/i);
  assert.match(sql, /public\.resolve_delivery_fee\(v_shop\.id, p_region, p_township\)/i);
  assert.match(sql, /ninjavan_route_unavailable/i);
  assert.match(sql, /shipping_zones/i);
  assert.match(sql, /default_delivery_fee/i);
  assert.match(sql, /item_total/i);
  assert.match(sql, /delivery_fee/i);
  assert.match(sql, /grand_total/i);
  assert.match(sql, /shipping_zones_serialize_quote_change/i);
  assert.match(sql, /for update/i);
});

test('place_order validates the accepted server quote inside the same order transaction', async () => {
  const sql = await readFile(
    new URL('../supabase/migrations/0029_authoritative_checkout_quote.sql', import.meta.url),
    'utf8',
  );

  assert.match(sql, /p_expected_item_total bigint/i);
  assert.match(sql, /p_expected_delivery_fee bigint/i);
  assert.match(sql, /quote_stale/i);
  assert.match(sql, /\(v_quote->>'item_total'\)::bigint <> p_expected_item_total/i);
  assert.match(sql, /\(v_quote->>'delivery_fee'\)::bigint <> p_expected_delivery_fee/i);
});

test('checkout API has a quote action and maps stale quotes to HTTP 409 with the fresh authoritative quote', async () => {
  const source = await readFile(new URL('../api/checkout.ts', import.meta.url), 'utf8');

  assert.match(source, /quote_order/);
  assert.match(source, /quote_stale/);
  assert.match(source, /409/);
  assert.match(source, /freshQuote/);
});

test('live checkout displays server quote totals and submits the accepted quote instead of a client-computed shipping total', async () => {
  const source = await readFile(
    new URL('../src/features/checkout/pages/Checkout.tsx', import.meta.url),
    'utf8',
  );

  assert.match(source, /api\.quoteOrder/);
  assert.match(source, /expectedItemTotal/);
  assert.match(source, /expectedDeliveryFee/);
  assert.match(source, /quote\?\.grandTotal/);
  assert.doesNotMatch(source, /shippingFee:\s*fee/);
});


test('same idempotency key returns the committed order before stale-quote validation', async () => {
  const sql = await readFile(
    new URL('../supabase/migrations/0029_authoritative_checkout_quote.sql', import.meta.url),
    'utf8',
  );
  const retryLookup = sql.indexOf('where shop_id = v_shop.id and idempotency_key = p_idempotency_key');
  const staleCheck = sql.indexOf("raise exception 'quote_stale'");
  assert.ok(retryLookup >= 0);
  assert.ok(staleCheck > retryLookup);
});
