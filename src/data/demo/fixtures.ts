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
  {name:'ရှပ်အင်္ကျီ — Classic White Shirt',category:'အင်္ကျီ',color:'အဖြူ',size:'M',price:22000,promoPrice:17500,stock:14,keyword:'shirt',locks:[101,102],description:'သန့်ရှင်းရိုးရှင်းတဲ့ Classic White Shirt ဖြစ်ပြီး ရုံးဝတ်၊ အစည်းအဝေးနဲ့ နေ့စဉ် smart-casual look အတွက် လွယ်လွယ်ကူကူတွဲဝတ်နိုင်ပါတယ်။\nပေါ့ပါးနူးညံ့တဲ့ ချည်သားအထိအတွေ့နဲ့ ဖြောင့်တန်းသပ်ရပ်တဲ့ cut ကြောင့် ဘောင်းဘီ၊ စကတ်၊ denim တို့နဲ့ အဆင်ပြေပါတယ်။'},
  {name:'ဘလောက်စ်အင်္ကျီ — Floral Blouse',category:'အင်္ကျီ',color:'ပန်းရောင်',size:'S',price:19500,stock:10,keyword:'blouse',locks:[111,112],description:'နူးညံ့တဲ့ ပန်းရောင်အခြေခံပေါ်မှာ floral pattern ပါတဲ့ Feminine Blouse ဖြစ်ပါတယ်။\nပေါ့ပါးတဲ့အထိအတွေ့နဲ့ ချောမွေ့တဲ့ silhouette ကြောင့် အလုပ်သွားဝတ်၊ brunch look နဲ့ ပွဲသွား smart-casual style တွေအတွက် သင့်တော်ပါတယ်။'},
  {name:'တီရှပ် — Cotton Tee',category:'အင်္ကျီ',color:'မီးခိုး',size:'L',price:12000,promoPrice:8900,stock:25,keyword:'tshirt',locks:[121,122],description:'နေ့စဉ်ဝတ်ဖို့ လွယ်ကူတဲ့ မီးခိုးရောင် Cotton Tee ဖြစ်ပြီး ရိုးရှင်းတဲ့ crew-neck design နဲ့ clean fit ကိုရရှိစေပါတယ်။\nနူးညံ့ပေါ့ပါးတဲ့ ချည်သားအထိအတွေ့ရှိပြီး jeans၊ shorts၊ cargo pants တို့နဲ့ အလွယ်တကူတွဲဝတ်နိုင်ပါတယ်။'},
  {name:'ဂါဝန် — Summer Dress',category:'ဂါဝန်',color:'ကောင်းကင်ပြာ',size:'M',price:28000,promoPrice:22000,stock:12,keyword:'dress',locks:[131,132,133],description:'နွေရာသီအတွက် သက်တောင့်သက်သာဝတ်နိုင်တဲ့ ကောင်းကင်ပြာရောင် Summer Dress ဖြစ်ပါတယ်။\nပေါ့ပါးပြီး လှုပ်ရှားရလွယ်တဲ့ silhouette ကြောင့် နေ့လယ်ခင်း outing၊ cafe date နဲ့ ခရီးသွား look တွေအတွက် သင့်တော်ပါတယ်။'},
  {name:'ည ဝတ်ဂါဝန် — Evening Gown',category:'ဂါဝန်',color:'ခရမ်း',size:'Free',price:45000,stock:5,keyword:'gown',locks:[141,142],description:'ခရမ်းရောင် tone နဲ့ elegant silhouette ကို အဓိကထားတဲ့ Evening Gown ဖြစ်ပါတယ်။\nညစာပွဲ၊ မင်္ဂလာဧည့်ခံပွဲနဲ့ အထူးအခမ်းအနားလို dress-up လုပ်ရတဲ့အချိန်တွေမှာ premium look ရစေဖို့ ဒီဇိုင်းထားပါတယ်။'},
  {name:'စကတ် — Pleated Skirt',category:'စကတ် & ဘောင်းဘီ',color:'အနက်',size:'M',price:18000,promoPrice:14500,stock:9,keyword:'skirt',locks:[151,152],description:'အခေါက်လိုက် pleat detail နဲ့ သပ်ရပ်တဲ့ အနက်ရောင် Pleated Skirt ဖြစ်ပါတယ်။\nShirt၊ blouse၊ knit top တို့နဲ့တွဲဝတ်လို့ကောင်းပြီး ရုံးဝတ်၊ ကျောင်းဝတ်နဲ့ smart-casual outfit တွေအတွက် လွယ်ကူစွာအသုံးချနိုင်ပါတယ်။'},
  {name:'ဂျင်းဘောင်းဘီ — Denim Jeans',category:'စကတ် & ဘောင်းဘီ',color:'ပြာ',size:'30',price:26000,stock:16,keyword:'jeans',locks:[161,162],description:'Classic blue wash နဲ့ နေ့စဉ်အသုံးများတဲ့ Denim Jeans ဖြစ်ပါတယ်။\nတည်ငြိမ်တဲ့ denim feel နဲ့ versatile fit ကြောင့် T-shirt၊ shirt၊ hoodie နဲ့ jacket တွေအားလုံးနဲ့ လွယ်ကူစွာတွဲဝတ်နိုင်ပါတယ်။'},
  {name:'အနွေးထည် — Knit Sweater',category:'အနွေးထည်',color:'အညို',size:'L',price:24000,promoPrice:19000,stock:11,keyword:'sweater',locks:[171,172],description:'နွေးထွေးတဲ့အညိုရောင် tone နဲ့ soft knit texture ပါတဲ့ Knit Sweater ဖြစ်ပါတယ်။\nအေးမြတဲ့ရာသီ၊ air-con ပြင်းတဲ့နေရာနဲ့ layered outfit တွေအတွက် သင့်တော်ပြီး denim သို့မဟုတ် neutral-color pants တွေနဲ့ လိုက်ဖက်ပါတယ်။'},
  {name:'ဂျင်းဂျာကင် — Denim Jacket',category:'အနွေးထည်',color:'ပြာရင့်',size:'M',price:32000,stock:7,keyword:'denim,jacket',locks:[181,182],description:'ပြာရင့် denim finish နဲ့ timeless casual look ရစေတဲ့ Denim Jacket ဖြစ်ပါတယ်။\nT-shirt၊ dress၊ hoodie ပေါ်ကနေ layer လုပ်ဝတ်နိုင်ပြီး နေ့စဉ် street style နဲ့ weekend outfit တွေအတွက် အသုံးဝင်ပါတယ်။'},
  {name:'ဟူးဒီ — Cozy Hoodie',category:'အနွေးထည်',color:'မီးခိုးရင့်',size:'XL',price:21000,promoPrice:16500,stock:0,keyword:'hoodie',locks:[191,192],description:'အေးမြတဲ့နေ့တွေမှာ သက်တောင့်သက်သာဝတ်နိုင်တဲ့ မီးခိုးရင့် Cozy Hoodie ဖြစ်ပါတယ်။\nRelaxed fit နဲ့ soft-touch feel ကြောင့် casual day၊ ခရီးသွားချိန်နဲ့ အိမ်နားနေချိန်တွေမှာ လွယ်ကူစွာဝတ်ဆင်နိုင်ပါတယ်။ လက်ရှိ demo stock ကုန်နေပါတယ်။'},
  {name:'ကုတ်အင်္ကျီ — Wool Coat',category:'အနွေးထည်',color:'အနက်ညို',size:'M',price:52000,stock:4,keyword:'coat',locks:[201,202,203],description:'အနက်ညိုရောင်နဲ့ refined outerwear look ပေးတဲ့ Wool Coat ဖြစ်ပါတယ်။\nနွေးထွေးတဲ့ wool-like texture နဲ့ structured silhouette ကြောင့် အေးတဲ့ရာသီ၊ business outfit နဲ့ formal layering အတွက် သင့်တော်ပါတယ်။'},
  {name:'လင်နင်ရှပ်အင်္ကျီ — Linen Shirt',category:'အင်္ကျီ',color:'ခရင်မ်',size:'L',price:20000,promoPrice:15900,stock:18,keyword:'linen,shirt',locks:[211,212],description:'ခရင်မ်ရောင် natural tone နဲ့ ပေါ့ပါးတဲ့ Linen Shirt ဖြစ်ပါတယ်။\nလေဝင်လေထွက်ကောင်းတဲ့ linen-style feel ကြောင့် ပူတဲ့ရာသီနဲ့ ခရီးသွား outfit တွေအတွက် သင့်တော်ပြီး shorts၊ chino နဲ့ denim တို့နဲ့ လွယ်ကူစွာတွဲဝတ်နိုင်ပါတယ်။'},
]

const PRODUCT_PHOTOS: Record<number, string> = {
  0: '/demo/fashion/classic-white-shirt.png',
  1: '/demo/fashion/floral-blouse-pink.png',
  2: '/demo/fashion/fashion-01.png',
  3: '/demo/fashion/fashion-04.png',
  4: '/demo/fashion/fashion-07.png',
  5: '/demo/fashion/fashion-09.png',
  7: '/demo/fashion/fashion-06.png',
  8: '/demo/fashion/fashion-08.png',
  9: '/demo/fashion/fashion-05.png',
  10: '/demo/fashion/fashion-02.png',
  11: '/demo/fashion/fashion-03.png',
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
