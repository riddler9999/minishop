import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const homePath = new URL('../src/features/catalog/pages/Home.tsx', import.meta.url);

async function readHome() {
  return readFile(homePath, 'utf8');
}

test('buyer home keeps real tenant catalog and navigation contracts', async () => {
  const source = await readHome();

  assert.match(source, /api\.products\(\{scope: 'active', limit: 12\}\)/);
  assert.match(source, /api\.categories\(\)/);
  assert.match(source, /ProductCard/);
  assert.match(source, /useShopNavigate/);
  assert.match(source, /\/products\?q=/);
  assert.match(source, /\/products\?category=/);
  assert.match(source, /encodeURIComponent/);
});

test('buyer home uses Burmese fashion copy and removes jewellery presentation', async () => {
  const source = (await readHome()).toLowerCase();

  assert.match(source, /အသစ်ရောက် ပစ္စည်းများ/);
  assert.match(source, /ပစ္စည်းများကြည့်ရန်/);

  for (const forbidden of ['fine jewellery', 'traditional gold', 'diamond jewellery', 'crafted with meaning', 'shop the collection', 'jewel-cta']) {
    assert.equal(source.includes(forbidden), false, `unexpected jewellery copy/style: ${forbidden}`);
  }
});
