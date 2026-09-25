import type {Product} from '@/domain/product';

const now = Date.now();
const daysAgo = (days: number) => new Date(now - days * 86_400_000).toISOString();

export const MOBILE_CATEGORIES = ['iPhone', 'Samsung Galaxy', 'Audio', 'Wearables', 'Accessories'] as const;

export const MOBILE_PRODUCTS: Product[] = [
  {
    id: 'mobile-1', itemCode: 'MO-001', name: 'iPhone 16 Pro Max 256GB', category: 'iPhone',
    color: 'Black Titanium', size: '256GB', price: 5190000, promoPrice: 4990000, isPromotion: true,
    stock: 7, inStock: true, status: 'active',
    images: [
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1200&q=88',
      'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=1200&q=88'
    ],
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1200&q=88',
    description: 'Premium Titanium finish နဲ့ flagship performance ကိုလိုချင်သူတွေအတွက် iPhone ဖြစ်ပါတယ်။ Camera quality, battery life နဲ့ everyday productivity ကို balance ကောင်းကောင်းပေးနိုင်တဲ့ high-end model တစ်လုံးပါ။',
    arrivalDate: daysAgo(2), createdAt: daysAgo(2),
  },
  {
    id: 'mobile-2', itemCode: 'MO-002', name: 'iPhone 16 128GB', category: 'iPhone',
    color: 'Ultramarine', size: '128GB', price: 3290000, promoPrice: null, isPromotion: false,
    stock: 10, inStock: true, status: 'active',
    images: ['https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=1200&q=88'],
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=1200&q=88',
    description: 'နေ့စဉ်သုံးအတွက် လျင်မြန်တဲ့ performance, camera quality ကောင်းကောင်းနဲ့ အလေးချိန်သက်သာတဲ့ iPhone ဖြစ်ပါတယ်။ Social content, work နဲ့ gaming အတွက် balance ကောင်းပါတယ်။',
    arrivalDate: daysAgo(4), createdAt: daysAgo(4),
  },
  {
    id: 'mobile-3', itemCode: 'MO-003', name: 'Samsung Galaxy S25 Ultra 256GB', category: 'Samsung Galaxy',
    color: 'Titanium Black', size: '256GB', price: 4890000, promoPrice: 4650000, isPromotion: true,
    stock: 6, inStock: true, status: 'active',
    images: ['https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=1200&q=88'],
    image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=1200&q=88',
    description: 'S Pen, flagship camera system နဲ့ high-end Android performance ကိုတစ်လုံးတည်းမှာရချင်သူတွေအတွက် Ultra class Galaxy ဖြစ်ပါတယ်။ Productivity နဲ့ zoom photography အတွက်သင့်တော်ပါတယ်။',
    arrivalDate: daysAgo(5), createdAt: daysAgo(5),
  },
  {
    id: 'mobile-4', itemCode: 'MO-004', name: 'Samsung Galaxy S25 256GB', category: 'Samsung Galaxy',
    color: 'Icy Blue', size: '256GB', price: 3190000, promoPrice: null, isPromotion: false,
    stock: 9, inStock: true, status: 'active',
    images: ['https://images.unsplash.com/photo-1610792516307-ea5acd9c3b00?auto=format&fit=crop&w=1200&q=88'],
    image: 'https://images.unsplash.com/photo-1610792516307-ea5acd9c3b00?auto=format&fit=crop&w=1200&q=88',
    description: 'Compact flagship feel, bright AMOLED display နဲ့ responsive Android experience ရချင်သူတွေအတွက် လက်ထဲအဆင်ပြေတဲ့ Galaxy model ဖြစ်ပါတယ်။',
    arrivalDate: daysAgo(7), createdAt: daysAgo(7),
  },
  {
    id: 'mobile-5', itemCode: 'MO-005', name: 'AirPods Pro (2nd Gen)', category: 'Audio',
    color: 'White', size: 'USB-C', price: 890000, promoPrice: 835000, isPromotion: true,
    stock: 15, inStock: true, status: 'active',
    images: ['https://images.unsplash.com/photo-1606741965429-8d76ff50bb2f?auto=format&fit=crop&w=1200&q=88'],
    image: 'https://images.unsplash.com/photo-1606741965429-8d76ff50bb2f?auto=format&fit=crop&w=1200&q=88',
    description: 'Active Noise Cancellation, Transparency Mode နဲ့ iPhone ecosystem အတွက် seamless pairing ပါဝင်တဲ့ premium true wireless earbuds ဖြစ်ပါတယ်။ Commute နဲ့ calls အတွက်သင့်တော်ပါတယ်။',
    arrivalDate: daysAgo(8), createdAt: daysAgo(8),
  },
  {
    id: 'mobile-6', itemCode: 'MO-006', name: 'Samsung Galaxy Buds3 Pro', category: 'Audio',
    color: 'Silver', size: 'Standard', price: 690000, promoPrice: 649000, isPromotion: true,
    stock: 12, inStock: true, status: 'active',
    images: ['https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=1200&q=88'],
    image: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=1200&q=88',
    description: 'Galaxy users အတွက် ANC, clear voice calls နဲ့ low-latency listening ကိုအဓိကထားတဲ့ wireless earbuds ဖြစ်ပါတယ်။ Daily music နဲ့ travel အတွက် practical premium option ပါ။',
    arrivalDate: daysAgo(10), createdAt: daysAgo(10),
  },
  {
    id: 'mobile-7', itemCode: 'MO-007', name: 'Apple Watch Series 10 GPS 46mm', category: 'Wearables',
    color: 'Jet Black', size: '46mm', price: 1690000, promoPrice: null, isPromotion: false,
    stock: 8, inStock: true, status: 'active',
    images: ['https://images.unsplash.com/photo-1551816230-ef5deaed4a26?auto=format&fit=crop&w=1200&q=88'],
    image: 'https://images.unsplash.com/photo-1551816230-ef5deaed4a26?auto=format&fit=crop&w=1200&q=88',
    description: 'iPhone နဲ့တွဲသုံးပြီး notification, fitness tracking နဲ့ daily activity ကိုလွယ်လွယ်ကူကူစီမံနိုင်တဲ့ smartwatch ဖြစ်ပါတယ်။ Slim design နဲ့ all-day wear အတွက်သင့်တော်ပါတယ်။',
    arrivalDate: daysAgo(12), createdAt: daysAgo(12),
  },
  {
    id: 'mobile-8', itemCode: 'MO-008', name: 'Galaxy Watch Ultra LTE', category: 'Wearables',
    color: 'Titanium Gray', size: '47mm', price: 1890000, promoPrice: 1790000, isPromotion: true,
    stock: 5, inStock: true, status: 'active',
    images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=88'],
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=88',
    description: 'Outdoor activity, fitness tracking နဲ့ durable build ကိုလိုချင်တဲ့ Galaxy users အတွက် premium wearable ဖြစ်ပါတယ်။ LTE support ကြောင့် phone မကိုင်ဘဲ basic connectivity ရနိုင်ပါတယ်။',
    arrivalDate: daysAgo(15), createdAt: daysAgo(15),
  },
  {
    id: 'mobile-9', itemCode: 'MO-009', name: 'MagSafe Battery Pack 10000mAh', category: 'Accessories',
    color: 'Matte Black', size: '10,000mAh', price: 185000, promoPrice: 165000, isPromotion: true,
    stock: 25, inStock: true, status: 'active',
    images: ['https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=1200&q=88'],
    image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=1200&q=88',
    description: 'နေ့စဉ်သယ်သွားလို့လွယ်တဲ့ compact magnetic power bank ဖြစ်ပြီး iPhone compatible devices တွေအတွက် cable မရှုပ်ဘဲ emergency top-up လုပ်နိုင်ပါတယ်။',
    arrivalDate: daysAgo(18), createdAt: daysAgo(18),
  },
  {
    id: 'mobile-10', itemCode: 'MO-010', name: '65W GaN Fast Charger', category: 'Accessories',
    color: 'Black', size: '65W', price: 95000, promoPrice: null, isPromotion: false,
    stock: 30, inStock: true, status: 'active',
    images: ['https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1200&q=88'],
    image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1200&q=88',
    description: 'Phone, tablet နဲ့ USB-C laptop တချို့ကို charger တစ်လုံးနဲ့သုံးချင်သူတွေအတွက် compact 65W GaN charger ဖြစ်ပါတယ်။ Travel bag ထဲထည့်ရလွယ်ပြီး fast charging support ပါပါတယ်။',
    arrivalDate: daysAgo(21), createdAt: daysAgo(21),
  },
  {
    id: 'mobile-11', itemCode: 'MO-011', name: 'iPhone 15 Plus 128GB', category: 'iPhone',
    color: 'Pink', size: '128GB', price: 2690000, promoPrice: 2550000, isPromotion: true,
    stock: 8, inStock: true, status: 'active',
    images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1200&q=88'],
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1200&q=88',
    description: 'Large display နဲ့ battery life ကိုအဓိကလိုချင်ပြီး Pro price မတက်ချင်သူတွေအတွက် value ကောင်းတဲ့ big-screen iPhone option ဖြစ်ပါတယ်။',
    arrivalDate: daysAgo(24), createdAt: daysAgo(24),
  },
  {
    id: 'mobile-12', itemCode: 'MO-012', name: 'Samsung Galaxy A56 5G 256GB', category: 'Samsung Galaxy',
    color: 'Graphite', size: '256GB', price: 1690000, promoPrice: 1590000, isPromotion: true,
    stock: 14, inStock: true, status: 'active',
    images: ['https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=1200&q=88'],
    image: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=1200&q=88',
    description: 'Mid-range budget ထဲမှာ AMOLED display, 5G နဲ့ practical camera setup ရချင်သူတွေအတွက် balance ကောင်းတဲ့ Galaxy A-series option ဖြစ်ပါတယ်။',
    arrivalDate: daysAgo(28), createdAt: daysAgo(28),
  },
];

export const MOBILE_FEATURED_IDS = ['mobile-1', 'mobile-3', 'mobile-5', 'mobile-7', 'mobile-9', 'mobile-12'];
export const MOBILE_BEST_SELLING_IDS = ['mobile-1', 'mobile-3', 'mobile-5', 'mobile-2', 'mobile-12', 'mobile-9'];

export function mobileProduct(id: string | undefined): Product | null {
  if (!id) return null;
  return MOBILE_PRODUCTS.find((product) => product.id === id) ?? null;
}
