import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import fs from 'node:fs';
const sql = fs.readFileSync(new URL('../supabase/migrations/0036_task5_7_security_remediation.sql', import.meta.url), 'utf8');
describe('Task 5-7 security remediation migration', () => {
  it('keeps buyer projection architecture intact', () => {
    assert.doesNotMatch(sql, /security_invoker\s*=\s*true/i);
    assert.match(sql, /projection views intentionally SECURITY DEFINER-style/i);
  });
  it('keeps internal tables inaccessible', () => {
    assert.match(sql, /revoke all on table public\.financial_admin_requests from public, anon, authenticated/i);
    assert.match(sql, /revoke all on table public\.notification_outbox from public, anon, authenticated/i);
  });
  it('preserves active anonymous checkout overloads', () => {
    assert.match(sql, /quote_order\(text,text,text,jsonb\)[\s\S]*to anon, authenticated/i);
    assert.doesNotMatch(sql, /place_order\(text,text,text,text,text,text,text,text,jsonb\)\s+from/i);
    assert.match(sql, /place_order\(text,text,text,text,text,text,text,text,jsonb,uuid\)[\s\S]*to anon, authenticated/i);
    assert.match(sql, /place_order\(text,text,text,text,text,text,text,text,jsonb,bigint,bigint,uuid\)[\s\S]*to anon, authenticated/i);
  });
  it('keeps seller-only RPCs authenticated-only', () => {
    assert.match(sql, /adjust_own_product_stock\(uuid,integer,text\)[\s\S]*to authenticated/i);
    assert.match(sql, /update_order_status_and_notify\(text,uuid,text\)[\s\S]*to authenticated/i);
  });
  it('adds evidence-backed index and RLS optimizations', () => {
    assert.match(sql, /financial_admin_requests_shop_id_idx/i);
    assert.match(sql, /financial_admin_requests_purchase_id_idx/i);
    assert.match(sql, /s\.owner_id = \(select auth\.uid\(\)\)/i);
  });
});
