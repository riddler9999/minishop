// ---- DEMO DATA -------------------------------------------------------------
// This is a DEMO storefront. No backend / no database. All products, merchant
// accounts and orders are fake, client-side data so the store can be deployed
// as a pure static site (Vercel) with no secrets. Product photos are real
// CLOTHING placeholders from loremflickr (keyword-matched per garment, with a
// fixed `lock` so each product keeps the same stable image). Product names are
// chosen to match the garment shown in the photo.

import type {MerchantAccount, Product} from '../lib/api';

// Clothing photo matched to a garment keyword; `lock` keeps the image stable.
const img = (keyword: string, lock: number) =>
  `https://loremflickr.com/800/1000/${keyword}?lock=${lock}`;

interface DemoSeed {
  name: string;
  category: string;
  color: string;
  size: string;
  price: number;
  promoPrice?: number;
  stock: number;
  keyword: string; // loremflickr tag(s) — the garment in the photo
  locks: number[]; // one per gallery image
  description: string;
}

const SEEDS: DemoSeed[] = [
  {
    name: 'ရှပ်အင်္ကျီ — Classic White Shirt',
    category: 'အင်္ကျီ',
    color: 'အဖြူ',
    size: 'M',
    price: 22000,
    promoPrice: 17500,
    stock: 14,
    keyword: 'shirt',
    locks: [101, 102],
    description: 'နမူနာ (Demo) ရှပ်အင်္ကျီ။ ရုံးဝတ် / နေ့စဉ်ဝတ် သင့်တော်သည်။\nဤစတိုးသည် သရုပ်ပြ (demo) စတိုးဖြစ်ပြီး အမှန်တကယ် ရောင်းချခြင်း မဟုတ်ပါ။',
  },
  {
    name: 'ဘလောက်စ်အင်္ကျီ — Floral Blouse',
    category: 'အင်္ကျီ',
    color: 'ပန်းရောင်',
    size: 'S',
    price: 19500,
    stock: 10,
    keyword: 'blouse',
    locks: [111, 112],
    description: 'နမူနာ (Demo) ပန်းပွင့်ပုံစံ ဘလောက်စ်အင်္ကျီ။ ပေါ့ပါးပြီး လှပသည်။',
  },
  {
    name: 'တီရှပ် — Cotton Tee',
    category: 'အင်္ကျီ',
    color: 'မီးခိုး',
    size: 'L',
    price: 12000,
    promoPrice: 8900,
    stock: 25,
    keyword: 'tshirt',
    locks: [121, 122],
    description: 'နမူနာ (Demo) ချည်သားတီရှပ်။ လေဝင်လေထွက်ကောင်းသည်။',
  },
  {
    name: 'ဂါဝန် — Summer Dress',
    category: 'ဂါဝန်',
    color: 'ကောင်းကင်ပြာ',
    size: 'M',
    price: 28000,
    promoPrice: 22000,
    stock: 12,
    keyword: 'dress',
    locks: [131, 132, 133],
    description: 'နမူနာ (Demo) နွေရာသီ ဂါဝန်။ နေ့လယ်ခင်း ထွက်ဝတ်ရန် သင့်တော်သည်။',
  },
  {
    name: 'ည ဝတ်ဂါဝန် — Evening Gown',
    category: 'ဂါဝန်',
    color: 'ခရမ်း',
    size: 'Free',
    price: 45000,
    stock: 5,
    keyword: 'gown',
    locks: [141, 142],
    description: 'နမူနာ (Demo) ည ဝတ်ဂါဝန်။ အထူးအခမ်းအနားများအတွက်။',
  },
  {
    name: 'စကတ် — Pleated Skirt',
    category: 'စကတ် & ဘောင်းဘီ',
    color: 'အနက်',
    size: 'M',
    price: 18000,
    promoPrice: 14500,
    stock: 9,
    keyword: 'skirt',
    locks: [151, 152],
    description: 'နမူနာ (Demo) အခေါက်လိုက် စကတ်။ ရုံး / ကျောင်း ဝတ်ဆင်ရန်။',
  },
  {
    name: 'ဂျင်းဘောင်းဘီ — Denim Jeans',
    category: 'စကတ် & ဘောင်းဘီ',
    color: 'ပြာ',
    size: '30',
    price: 26000,
    stock: 16,
    keyword: 'jeans',
    locks: [161, 162],
    description: 'နမူနာ (Demo) ဂျင်းဘောင်းဘီ။ ခံနိုင်ရည်ရှိပြီး ခေတ်မီသည်။',
  },
  {
    name: 'အနွေးထည် — Knit Sweater',
    category: 'အနွေးထည်',
    color: 'အညို',
    size: 'L',
    price: 24000,
    promoPrice: 19000,
    stock: 11,
    keyword: 'sweater',
    locks: [171, 172],
    description: 'နမူနာ (Demo) ရက်ကန်း အနွေးထည်။ ဆောင်းရာသီအတွက် နွေးထွေးသည်။',
  },
  {
    name: 'ဂျင်းဂျာကင် — Denim Jacket',
    category: 'အနွေးထည်',
    color: 'ပြာရင့်',
    size: 'M',
    price: 32000,
    stock: 7,
    keyword: 'denim,jacket',
    locks: [181, 182],
    description: 'နမူနာ (Demo) ဂျင်းဂျာကင်။ ဘယ်အဝတ်နဲ့မဆို လိုက်ဖက်သည်။',
  },
  {
    name: 'ဟူးဒီ — Cozy Hoodie',
    category: 'အနွေးထည်',
    color: 'မီးခိုးရင့်',
    size: 'XL',
    price: 21000,
    promoPrice: 16500,
    stock: 0,
    keyword: 'hoodie',
    locks: [191, 192],
    description: 'နမူနာ (Demo) ဟူးဒီ။ ယခုအခါ ကုန်သွားပြီ (demo out-of-stock)။',
  },
  {
    name: 'ကုတ်အင်္ကျီ — Wool Coat',
    category: 'အနွေးထည်',
    color: 'အနက်ညို',
    size: 'M',
    price: 52000,
    stock: 4,
    keyword: 'coat',
    locks: [201, 202, 203],
    description: 'နမူနာ (Demo) သိုးမွှေး ကုတ်အင်္ကျီ။ အေးသောရာသီအတွက်။',
  },
  {
    name: 'လင်နင်ရှပ်အင်္ကျီ — Linen Shirt',
    category: 'အင်္ကျီ',
    color: 'ခရင်မ်',
    size: 'L',
    price: 20000,
    promoPrice: 15900,
    stock: 18,
    keyword: 'linen,shirt',
    locks: [211, 212],
    description: 'နမူနာ (Demo) လင်နင်ရှပ်အင်္ကျီ။ ပူသောရာသီအတွက် ပေါ့ပါးသည်။',
  },
];

// Build full Product objects (matches the api.ts Product shape 1:1).
export const DEMO_PRODUCTS: Product[] = SEEDS.map((s, i) => {
  const images = s.locks.map((lock) => img(s.keyword, lock));
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
