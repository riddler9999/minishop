import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {describe, it} from 'node:test';

describe('first-class product variant migration contract', () => {
  it('creates tenant-scoped variants, order-line identity and repeat-safe legacy backfill', async () => {
    const schema = await readFile('supabase/migrations/0039_product_variants_ai_security.sql', 'utf8');
    assert.match(schema, /create table public\.product_variants/i);
    assert.match(schema, /shop_id uuid not null references public\.shops/i);
    assert.match(schema, /product_id uuid not null references public\.products/i);
    assert.match(schema, /add column variant_id uuid/i);
    assert.match(schema, /on conflict \(product_id, legacy_key\) do nothing/i);
    assert.match(schema, /regexp_replace\(description, '<!--VARIANTS:/i);
    assert.match(schema, /valid_payload := false/i);
    assert.match(schema, /when unique_violation or check_violation or numeric_value_out_of_range/i);
    assert.match(schema, /product_variants_owner_all/i);
  });

  it('keeps credentials server-only and media tenant-controlled', async () => {
    const schema = await readFile('supabase/migrations/0039_product_variants_ai_security.sql', 'utf8');
    assert.match(schema, /create table public\.ai_provider_credentials/i);
    assert.match(schema, /revoke all on public\.ai_provider_credentials from public, anon, authenticated/i);
    assert.match(schema, /create table public\.store_media/i);
    assert.match(schema, /byte_size bigint not null check \(byte_size between 1 and 10485760\)/i);
  });

  it('uses variant rows for authoritative quote, price, stock and order persistence', async () => {
    const checkout = await readFile('supabase/migrations/0040_variant_checkout_inventory.sql', 'utf8');
    assert.match(checkout, /v_item->>'variant_id'/i);
    assert.match(checkout, /from public\.product_variants[\s\S]*for update/i);
    assert.match(checkout, /update public\.product_variants set stock = stock - v_qty/i);
    assert.match(checkout, /variant_id, name, variant_name, variant_sku, unit_price/i);
    assert.match(checkout, /if v_has_variants then[\s\S]*variant_required/i);
  });
});
