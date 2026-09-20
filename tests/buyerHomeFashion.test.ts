import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const homePath = new URL('../src/features/catalog/pages/Home.tsx', import.meta.url);

async function readHome() {
  return readFile(homePath, 'utf8');
}

test('buyer home uses the fashion storefront contract', async () => {
  const source = await readHome();

  assert.match(source, /New Arrivals/);
  assert.match(source, /Shop Now/);
  assert.match(source, /bg-white/);
  assert.match(source, /#(?:ec4899|db2777|e11d48|ff[0-9a-f]{4})/i);
  assert.match(source, /ProductCard/);
  assert.match(source, /api\.products\(\{scope: 'active', limit: 12\}\)/);
  assert.match(source, /to="\/products"/);
});

test('buyer home removes jewellery-specific presentation', async () => {
  const source = (await readHome()).toLowerCase();

  for (const forbidden of [
    'fine jewellery',
    'traditional gold',
    'diamond jewellery',
    'crafted with meaning',
    'shop the collection',
    'jewel-cta',
  ]) {
    assert.equal(source.includes(forbidden), false, `unexpected jewellery copy/style: ${forbidden}`);
  }
});
