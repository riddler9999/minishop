import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql = fs.readFileSync(
  'supabase/migrations/0019_production_safe_ninjavan_verified_seed.sql',
  'utf8',
);

test('seed is gated on the reconciled Ninja Van rate table', () => {
  assert.match(sql, /to_regclass\('public\.ninjavan_rates'\)/);
  assert.match(sql, /raise exception 'ninjavan_rates_missing'/);
});

test('seed contains the approved 11-route Yangon matrix', () => {
  const expected = [
    "('Yangon', 'Yangon', 'Insein', 4000",
    "('Yangon', 'Yangon', 'North Okkalapa', 4000",
    "('Yangon', 'Yangon', 'Mingaladon', 4000",
    "('Yangon', 'Yangon', 'Shwe Pyi Thar', 4000",
    "('Yangon', 'Yangon', 'Hlaing Thar Yar', 4000",
    "('Yangon', 'Yangon', 'Dagon Seikkan', 4000",
    "('Yangon', 'Yangon', 'Thanlyin', 6000",
    "('Yangon', 'Yangon', 'Kyauktan', 6000",
    "('Yangon', 'Yangon', 'Hlegu', 6000",
    "('Yangon', 'Yangon', 'Dala', 6000",
    "('Yangon', 'Yangon', 'Twante', 6000",
  ];

  for (const fragment of expected) assert.ok(sql.includes(fragment), fragment);
});

test('seed is idempotent and reactivates the intended route row', () => {
  assert.match(
    sql,
    /on conflict \(origin_township, destination_region, destination_township\)/,
  );
  assert.match(sql, /fee = excluded\.fee/);
  assert.match(sql, /source_label = excluded\.source_label/);
  assert.match(sql, /is_active = true/);
});

test('seed does not delete or truncate existing rate rows', () => {
  assert.doesNotMatch(sql, /\bdelete\b/i);
  assert.doesNotMatch(sql, /\btruncate\b/i);
  assert.doesNotMatch(sql, /drop table/i);
});
