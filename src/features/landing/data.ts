export type LandingProduct = {
  icon: string;
  label: string;
  burmeseLabel: string;
};

export type LandingStep = {
  number: string;
  title: string;
  description: string;
};

export const landingProducts: LandingProduct[] = [
  {icon: '👕', label: 'Fashion', burmeseLabel: 'အဝတ်အထည်'},
  {icon: '🎧', label: 'Audio', burmeseLabel: 'အီလက်ထရွန်းနစ်'},
  {icon: '🧴', label: 'Beauty', burmeseLabel: 'အလှကုန်'},
  {icon: '🎒', label: 'Bags', burmeseLabel: 'အိတ်နှင့် Accessories'},
  {icon: '⌚', label: 'Watches', burmeseLabel: 'နာရီ'},
  {icon: '☕', label: 'Food', burmeseLabel: 'စားသောက်ကုန်'},
];

export const landingSteps: LandingStep[] = [
  {number: '01', title: 'ကိုယ့်ဆိုင်ကို ဖန်တီးမယ်', description: 'ပစ္စည်းတွေကို MiniShop ထဲ ထည့်ပါ။'},
  {number: '02', title: 'Link ကို မျှဝေမယ်', description: 'Social Media bio, post နဲ့ message မှာ link ကိုထည့်ပါ။'},
  {number: '03', title: 'Customer က ကြည့်မယ်', description: 'ကိုယ့်ပစ္စည်းအားလုံးကို တစ်နေရာတည်းမှာ ကြည့်နိုင်မယ်။'},
  {number: '04', title: 'Order ရလာမယ်', description: 'ကြိုက်တဲ့ပစ္စည်းကို ရွေးပြီး order တင်နိုင်မယ်။'},
];
