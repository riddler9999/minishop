import {EXTRA_ORDER_UNIT_PRICE_KS, PLAN_MONTHLY_QUOTA, PLAN_PRODUCT_LIMIT} from '@/domain/entitlement';
import type {Plan} from '@/domain/plan';
import {PLAN_PRICE_KS} from '@/domain/subscription';

export type LandingPricingPlan = {
  plan: Plan;
  name: string;
  eyebrow: string;
  price: number;
  priceSuffix: string;
  description: string;
  features: string[];
  cta: string;
};

export const pricingPlans: LandingPricingPlan[] = [
  {
    plan: 'free_trial',
    name: 'Free Trial',
    eyebrow: 'အစမ်းသုံးကြည့်ချင်သူများအတွက်',
    price: PLAN_PRICE_KS.free_trial,
    priceSuffix: '',
    description: 'ဆိုင်စမ်းဖွင့်ပြီး MiniShop ဘယ်လို အလုပ်လုပ်လဲဆိုတာ စမ်းသပ်ကြည့်နိုင်ပါတယ်။',
    features: [
      `Order ${PLAN_MONTHLY_QUOTA.free_trial} ခု (တစ်သက်တာ)`,
      `Product ${PLAN_PRODUCT_LIMIT.free_trial} ခုအထိ`,
      'Core ecommerce features',
      'Credit Card မလို',
    ],
    cta: 'အခမဲ့ စမ်းသုံးမယ်',
  },
  {
    plan: 'starter',
    name: 'Starter',
    eyebrow: 'အရောင်းမှန်နေတဲ့ အွန်လိုင်းရှော့ပ်များအတွက် (အသင့်တော်ဆုံး)',
    price: PLAN_PRICE_KS.starter,
    priceSuffix: '/ လ',
    description: 'တစ်နေ့ အော်ဒါ ၁ ခု၊ ၂ ခု ပုံမှန်ရှိနေတဲ့ Seller တွေအတွက် အချိန်ကုန်သက်သာပြီး စနစ်ကျစေမယ့် Plan',
    features: [
      `Order ${PLAN_MONTHLY_QUOTA.starter} ခု / လ`,
      `Product ${PLAN_PRODUCT_LIMIT.starter} ခုအထိ`,
      'ရောင်းဖို့လိုတဲ့ Core features အားလုံး',
      `Extra Orders = ${EXTRA_ORDER_UNIT_PRICE_KS.toLocaleString()} Ks / order`,
    ],
    cta: 'Starter ဖြင့် စတင်မယ်',
  },
  {
    plan: 'business',
    name: 'Business',
    eyebrow: 'နေ့စဉ် အော်ဒါများတဲ့ Brand ကြီးများအတွက်',
    price: PLAN_PRICE_KS.business,
    priceSuffix: '/ လ',
    description: 'အော်ဒါများပြားပြီး လူအင်အား သက်သက်သာသာနဲ့ အလုပ်သွက်သွက် လုပ်ချင်တဲ့ ဆိုင်ကြီးများအတွက်',
    features: [
      `Order ${PLAN_MONTHLY_QUOTA.business} ခု / လ`,
      `Product ${PLAN_PRODUCT_LIMIT.business} ခုအထိ`,
      'Starter selling features အားလုံး',
      'Productivity / automation capabilities',
    ],
    cta: 'Business သို့ အဆင့်မြှင့်မယ်',
  },
];

export function formatKs(amount: number) {
  return amount === 0 ? '0 Ks' : `${amount.toLocaleString()} Ks`;
}

export function signupHref(plan?: Plan) {
  const destination = plan
    ? `/admin/subscribe?plan=${plan}`
    : '/admin/subscribe';
  return `/admin/login?mode=signup&from=${encodeURIComponent(destination)}`;
}
