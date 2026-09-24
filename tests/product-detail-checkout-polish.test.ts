import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const detailPath = new URL('../src/features/catalog/pages/ProductDetail.tsx', import.meta.url);
const checkoutPath = new URL('../src/features/checkout/pages/Checkout.tsx', import.meta.url);
const cardPath = new URL('../src/features/catalog/components/ProductCard.tsx', import.meta.url);
const fixturesPath = new URL('../src/data/demo/fixtures.ts', import.meta.url);
const previewPath = new URL('../src/features/shop/components/StorePreview.tsx', import.meta.url);

test('product detail shows full gallery with arrows and requested content hierarchy', async () => {
  const source = await readFile(detailPath, 'utf8');
  const demoStart = source.indexOf('if (isDemo)');
  const demoEnd = source.indexOf('const detail = {', demoStart);
  const demo = source.slice(demoStart, demoEnd);

  assert.match(demo, /object-contain/);
  assert.match(demo, /ChevronLeft/);
  assert.match(demo, /ChevronRight/);
  assert.doesNotMatch(demo, />Price</);
  assert.doesNotMatch(demo, /နှစ်သက်မှု/);

  const title = demo.indexOf('<h1');
  const price = demo.indexOf('ks(price)', title);
  const quantity = demo.indexOf('အရေအတွက်', price);
  const description = demo.indexOf('ပစ္စည်းအကြောင်း', quantity);
  assert.ok(title >= 0 && price > title && quantity > price && description > quantity);

  assert.match(demo, /Best Selling/);
  assert.match(source.slice(demoEnd), /Best Selling/);
});

test('demo product cards do not render a favorite control', async () => {
  const source = await readFile(cardPath, 'utf8');
  const start = source.indexOf("variant === 'demo-purple'");
  const end = source.indexOf("variant === 'clean-minimal'", start);
  const demoCard = source.slice(start, end);

  assert.doesNotMatch(demoCard, /<Heart/);
  assert.doesNotMatch(demoCard, /Favorites|နှစ်သက်/);
});

test('checkout uses the simplified buyer copy', async () => {
  const source = await readFile(checkoutPath, 'utf8');

  assert.match(source, /လက်ခံမည့်သူအမည်/);
  assert.match(source, /<label htmlFor="checkout-street" className=\{label\}>လိပ်စာ/);
  assert.match(source, /placeholder="ဥပမာ ၁၂၃၊ ပြည်လမ်း\.\.\."/);

  assert.doesNotMatch(source, />Checkout<\/p>/);
  assert.doesNotMatch(source, /ပို့ဆောင်ရန်အချက်အလက်နဲ့ ငွေပေးချေမှုကို အောက်မှာဖြည့်ပါ/);
  assert.doesNotMatch(source, /ငွေပေးချေမှုနည်းလမ်း ရွေးပါ/);
  assert.doesNotMatch(source, /placeholder="အမည်ရေးပါ"/);
  assert.doesNotMatch(source, /လမ်းအမည် \/ အိမ်အမှတ်/);
});

test('all demo products have substantial sample descriptions', async () => {
  const source = await readFile(fixturesPath, 'utf8');
  const start = source.indexOf('const SEEDS: DemoSeed[] = [');
  const end = source.indexOf('const PRODUCT_PHOTOS', start);
  const seeds = source.slice(start, end);
  const descriptions = [...seeds.matchAll(/description:'([^']+)'/g)].map((match) => match[1]);

  assert.equal(descriptions.length, 12);
  for (const description of descriptions) {
    assert.ok(description.length >= 100, `description too short: ${description}`);
  }
});

test('store design checkout preview mirrors the simplified heading and receiver label', async () => {
  const source = await readFile(previewPath, 'utf8');
  const start = source.indexOf('function CheckoutPreview');
  const end = source.indexOf('export default function StorePreview', start);
  const preview = source.slice(start, end);

  assert.match(preview, /Order တင်မယ်/);
  assert.match(preview, /လက်ခံမည့်သူအမည်/);
  assert.match(preview, /လိပ်စာ/);
  assert.doesNotMatch(preview, />Checkout<\/p>/);
});
