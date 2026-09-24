// ---- DEMO DATA -------------------------------------------------------------
// This is a DEMO storefront. No backend / no database. All products, merchant
// accounts and orders are fake, client-side data so the store can be deployed
// as a pure static site (Vercel) with no secrets. Uploaded first-party product
// photos are used where available; remaining products keep self-contained SVG
// placeholders so the demo never depends on an external image host.

import type {Product} from '@/domain/product';
import type {MerchantAccount} from '@/domain/shop';

const CATEGORY_THEME: Record<string, {bg: string; deep: string; accent: string}> = {
  'အင်္ကျီ': {bg: '#ffe4ec', deep: '#fbb6ce', accent: '#e11d48'},
  'ဂါဝန်': {bg: '#f3e8ff', deep: '#d8b4fe', accent: '#9333ea'},
  'စကတ် & ဘောင်းဘီ': {bg: '#e0f2fe', deep: '#a5d8f3', accent: '#0284c7'},
  'အနွေးထည်': {bg: '#fef3c7', deep: '#fcd9a1', accent: '#d97706'},
};
const FALLBACK_THEME = {bg: '#fff0f6', deep: '#fbcfe8', accent: '#e11d48'};

const latinLabel = (name: string): string => {
  const parts = name.split('—');
  return (parts[1] ?? parts[0]).trim();
};

const img = (name: string, category: string, variant: number): string => {
  const t = CATEGORY_THEME[category] ?? FALLBACK_THEME;
  const label = latinLabel(name);
  const [x1, y1, x2, y2] = (['0 0 1 1', '1 0 0 1', '0 1 1 0'][variant % 3]).split(' ');
  const font = "font-family='system-ui,-apple-system,Segoe UI,Roboto,sans-serif'";
  const shirt =
    'M280 330 L360 285 Q400 330 440 285 L520 330 L610 400 L560 470 ' +
    'L505 435 L505 690 L295 690 L295 435 L240 470 L190 400 Z';
  const svg =
    "<svg xmlns='http://www.w3.org/2000/svg' width='800' height='1000' viewBox='0 0 800 1000'>" +
    `<defs><linearGradient id='g' x1='${x1}' y1='${y1}' x2='${x2}' y2='${y2}'>` +
    `<stop offset='0' stop-color='${t.bg}'/><stop offset='1' stop-color='${t.deep}'/>` +
    '</linearGradient></defs>' +
    "<rect width='800' height='1000' fill='url(#g)'/>" +
    "<circle cx='400' cy='450' r='250' fill='#ffffff' opacity='0.3'/>" +
    `<path d='${shirt}' fill='#ffffff' opacity='0.85' stroke='${t.accent}' stroke-width='6' stroke-linejoin='round'/>` +
    `<rect x='40' y='40' width='128' height='52' rx='18' fill='${t.accent}' opacity='0.92'/>` +
    `<text x='104' y='75' text-anchor='middle' font-size='26' font-weight='700' fill='#ffffff' ${font}>DEMO</text>` +
    `<text x='400' y='840' text-anchor='middle' font-size='42' font-weight='700' fill='#334155' ${font}>${label}</text>` +
    '</svg>';
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

interface DemoSeed {
  name: string;
  category: string;
  color: string;
  size: string;
  price: number;
  promoPrice?: number;
  stock: number;
  keyword: string;
  locks: number[];
  description: string;
}

const SEEDS: DemoSeed[] = [
  {name:'ရှပ်အင်္ကျီ — Classic White Shirt',category:'အင်္ကျီ',color:'အဖြူ',size:'M',price:22000,promoPrice:17500,stock:14,keyword:'shirt',locks:[101,102],description:'နမူနာ (Demo) ရှပ်အင်္ကျီ။ ရုံးဝတ် / နေ့စဉ်ဝတ် သင့်တော်သည်။\nဤစတိုးသည် သရုပ်ပြ (demo) စတိုးဖြစ်ပြီး အမှန်တကယ် ရောင်းချခြင်း မဟုတ်ပါ။'},
  {name:'ဘလောက်စ်အင်္ကျီ — Floral Blouse',category:'အင်္ကျီ',color:'ပန်းရောင်',size:'S',price:19500,stock:10,keyword:'blouse',locks:[111,112],description:'နမူနာ (Demo) ပန်းပွင့်ပုံစံ ဘလောက်စ်အင်္ကျီ။ ပေါ့ပါးပြီး လှပသည်။'},
  {name:'တီရှပ် — Cotton Tee',category:'အင်္ကျီ',color:'မီးခိုး',size:'L',price:12000,promoPrice:8900,stock:25,keyword:'tshirt',locks:[121,122],description:'နမူနာ (Demo) ချည်သားတီရှပ်။ လေဝင်လေထွက်ကောင်းသည်။'},
  {name:'ဂါဝန် — Summer Dress',category:'ဂါဝန်',color:'ကောင်းကင်ပြာ',size:'M',price:28000,promoPrice:22000,stock:12,keyword:'dress',locks:[131,132,133],description:'နမူနာ (Demo) နွေရာသီ ဂါဝန်။ နေ့လယ်ခင်း ထွက်ဝတ်ရန် သင့်တော်သည်။'},
  {name:'ည ဝတ်ဂါဝန် — Evening Gown',category:'ဂါဝန်',color:'ခရမ်း',size:'Free',price:45000,stock:5,keyword:'gown',locks:[141,142],description:'နမူနာ (Demo) ည ဝတ်ဂါဝန်။ အထူးအခမ်းအနားများအတွက်။'},
  {name:'စကတ် — Pleated Skirt',category:'စကတ် & ဘောင်းဘီ',color:'အနက်',size:'M',price:18000,promoPrice:14500,stock:9,keyword:'skirt',locks:[151,152],description:'နမူနာ (Demo) အခေါက်လိုက် စကတ်။ ရုံး / ကျောင်း ဝတ်ဆင်ရန်။'},
  {name:'ဂျင်းဘောင်းဘီ — Denim Jeans',category:'စကတ် & ဘောင်းဘီ',color:'ပြာ',size:'30',price:26000,stock:16,keyword:'jeans',locks:[161,162],description:'နမူနာ (Demo) ဂျင်းဘောင်းဘီ။ ခံနိုင်ရည်ရှိပြီး ခေတ်မီသည်။'},
  {name:'အနွေးထည် — Knit Sweater',category:'အနွေးထည်',color:'အညို',size:'L',price:24000,promoPrice:19000,stock:11,keyword:'sweater',locks:[171,172],description:'နမူနာ (Demo) ရက်ကန်း အနွေးထည်။ ဆောင်းရာသီအတွက် နွေးထွေးသည်။'},
  {name:'ဂျင်းဂျာကင် — Denim Jacket',category:'အနွေးထည်',color:'ပြာရင့်',size:'M',price:32000,stock:7,keyword:'denim,jacket',locks:[181,182],description:'နမူနာ (Demo) ဂျင်းဂျာကင်။ ဘယ်အဝတ်နဲ့မဆို လိုက်ဖက်သည်။'},
  {name:'ဟူးဒီ — Cozy Hoodie',category:'အနွေးထည်',color:'မီးခိုးရင့်',size:'XL',price:21000,promoPrice:16500,stock:0,keyword:'hoodie',locks:[191,192],description:'နမူနာ (Demo) ဟူးဒီ။ ယခုအခါ ကုန်သွားပြီ (demo out-of-stock)။'},
  {name:'ကုတ်အင်္ကျီ — Wool Coat',category:'အနွေးထည်',color:'အနက်ညို',size:'M',price:52000,stock:4,keyword:'coat',locks:[201,202,203],description:'နမူနာ (Demo) သိုးမွှေး ကုတ်အင်္ကျီ။ အေးသောရာသီအတွက်။'},
  {name:'လင်နင်ရှပ်အင်္ကျီ — Linen Shirt',category:'အင်္ကျီ',color:'ခရင်မ်',size:'L',price:20000,promoPrice:15900,stock:18,keyword:'linen,shirt',locks:[211,212],description:'နမူနာ (Demo) လင်နင်ရှပ်အင်္ကျီ။ ပူသောရာသီအတွက် ပေါ့ပါးသည်။'},
];

const PRODUCT_PHOTOS: Record<number, string> = {
  0: '/demo/classic-white-shirt.png',
  1: '/demo/floral-blouse-pink.png',
  2: '/demo/file_00000000079c820797dc012775230856.png',
  3: '/demo/file_00000000a42481f5b2ba35ba5d0f1f73.png',
  4: '/demo/file_00000000d7888211949a8b167a659bd3.png',
  5: '/demo/file_00000000eb9481f8b1599e3efcccea5e.png',
  7: '/demo/file_00000000bd588230a18a8990158c5904.png',
  8: '/demo/file_00000000e91881f48a450ef00b260d45.png',
  9: '/demo/file_00000000baf88211920b2f9b2b8a5a38.png',
  10: '/demo/file_0000000065548206a93c8bc40de39d28.png',
  11: '/demo/file_000000009a24820dafdc839bc0bced2e.png',
};

export const DEMO_PRODUCTS: Product[] = SEEDS.map((s, i) => {
  const placeholderImages = s.locks.map((_lock, variant) => img(s.name, s.category, variant));
  const uploadedPhoto = PRODUCT_PHOTOS[i];
  const images = uploadedPhoto ? [uploadedPhoto, ...placeholderImages.slice(1)] : placeholderImages;
  const isPromotion = s.promoPrice != null;
  const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();
  return {
    id: `demo-${i + 1}`,
    itemCode: `DEMO-${String(i + 1).padStart(3, '0')}`,
    name: s.name,
    category: s.category,
    color: s.color,
    size: s.size,
    price: s.price,
    promoPrice: s.promoPrice ?? null,
    isPromotion,
    stock: s.stock,
    inStock: s.stock > 0,
    status: 'active',
    images,
    image: images[0] ?? null,
    description: s.description,
    arrivalDate: daysAgo(i),
    createdAt: daysAgo(i),
  };
});

export const DEMO_MERCHANT_ACCOUNTS: MerchantAccount[] = [
  {provider: 'kpay', label: 'KBZPay', accountName: 'Mini Shop (နမူနာ)', phone: '09-000-000-001', tail: '0001'},
  {provider: 'wave', label: 'WavePay', accountName: 'Mini Shop (နမူနာ)', phone: '09-000-000-002', tail: '0002'},
];

export function demoCategories(): string[] {
  return Array.from(new Set(DEMO_PRODUCTS.map((p) => p.category).filter(Boolean) as string[]));
}
