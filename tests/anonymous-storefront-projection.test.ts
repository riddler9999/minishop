import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {describe, it} from 'node:test';

const migrationUrl = new URL('../supabase/migrations/0027_anonymous_storefront_projection.sql', import.meta.url);

describe('anonymous storefront projection', () => {
  it('revokes anonymous base-table reads and exposes only buyer-safe views', async () => {
    const sql = await readFile(migrationUrl, 'utf8');

    for (const table of ['shops', 'products', 'payment_accounts', 'shipping_zones']) {
      assert.match(sql, new RegExp(`revoke\\s+select\\s+on\\s+public\\.${table}\\s+from\\s+anon`, 'i'));
    }

    for (const view of ['buyer_public_shops', 'buyer_public_products', 'buyer_public_payment_accounts', 'buyer_public_shipping_zones']) {
      assert.match(sql, new RegExp(`grant\\s+select\\s+on\\s+public\\.${view}\\s+to\\s+anon`, 'i'));
    }

    assert.match(sql, /buyer_public_shops[\s\S]*?select[\s\S]*?id[\s\S]*?slug[\s\S]*?name[\s\S]*?logo_url[\s\S]*?default_delivery_fee[\s\S]*?delivery_service[\s\S]*?origin_region[\s\S]*?origin_township[\s\S]*?theme/i);
    assert.doesNotMatch(sql, /buyer_public_shops[\s\S]*?owner_id/i);
    assert.doesNotMatch(sql, /buyer_public_shops[\s\S]*?\bplan\b/i);
    assert.doesNotMatch(sql, /buyer_public_products[\s\S]*?item_code/i);
  });

  it('routes buyer APIs through buyer-safe relations with missing-view-only legacy fallback', async () => {
    const relations = await readFile(new URL('../server/_buyer-relations.ts', import.meta.url), 'utf8');
    const storefront = await readFile(new URL('../api/storefront.ts', import.meta.url), 'utf8');
    const checkout = await readFile(new URL('../api/checkout.ts', import.meta.url), 'utf8');
    const design = await readFile(new URL('../server/storefront-design.ts', import.meta.url), 'utf8');
    const health = await readFile(new URL('../api/health.ts', import.meta.url), 'utf8');

    for (const view of ['buyer_public_shops', 'buyer_public_products', 'buyer_public_payment_accounts', 'buyer_public_shipping_zones']) {
      assert.match(relations, new RegExp(view));
    }
    for (const table of ['shops', 'products', 'payment_accounts', 'shipping_zones']) {
      assert.match(relations, new RegExp(`\\b${table}\\b`));
    }
    assert.match(relations, /PGRST205/);
    assert.match(relations, /42P01/);

    assert.match(storefront, /BUYER_SAFE_RELATIONS/);
    assert.match(storefront, /BUYER_LEGACY_RELATIONS/);
    assert.match(storefront, /isMissingBuyerProjection/);
    assert.match(checkout, /BUYER_SAFE_RELATIONS/);
    assert.match(checkout, /BUYER_LEGACY_RELATIONS/);
    assert.match(health, /BUYER_SAFE_RELATIONS/);
    assert.match(health, /BUYER_LEGACY_RELATIONS/);
    assert.match(design, /shopRelation/);
  });
});
