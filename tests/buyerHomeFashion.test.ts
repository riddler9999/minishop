import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const homePath = new URL('../src/features/catalog/pages/Home.tsx', import.meta.url);
const layoutPath = new URL('../src/shared/ui/Layout.tsx', import.meta.url);

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

test('promotion and service actions use real product and storefront routes', async () => {
  const source = await readHome();

  assert.match(source, /product\.isPromotion/);
  assert.match(source, /\/products\/\$\{product\.id\}/);
  assert.match(source, /to: '\/products'/);
  assert.match(source, /to: '\/cart'/);
  assert.match(source, /to: '\/orders'/);
});

test('buyer storefront uses Burmese fashion copy and removes jewellery presentation', async () => {
  const source = ((await readHome()) + (await readFile(layoutPath, 'utf8'))).toLowerCase();

  assert.match(source, /အသစ်ရောက် ပစ္စည်းများ/);
  assert.match(source, /ပစ္စည်းများကြည့်ရန်/);
  assert.match(source, /အွန်လိုင်းဖက်ရှင်ဆိုင်/);

  for (const forbidden of [
    'fine jewellery',
    'fine jewelry',
    'traditional gold',
    'diamond jewellery',
    'crafted with meaning',
    'shop the collection',
    'online fashion store',
    'jewel-cta',
  ]) {
    assert.equal(source.includes(forbidden), false, `unexpected jewellery/English copy: ${forbidden}`);
  }
});
