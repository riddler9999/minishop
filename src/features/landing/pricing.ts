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
    eyebrow: 'စတင်စမ်းသပ်သူများအတွက်',
    price: PLAN_PRICE_KS.free_trial,
    priceSuffix: '',
    description: 'ဆိုင်စဖွင့်ပြီး စနစ်ကို လက်တွေ့ အခမဲ့ စမ်းသပ်နိုင်သည်',
    features: [
      `Order ${PLAN_MONTHLY_QUOTA.free_trial} ခု (တစ်သက်တာ စမ်းသပ်ခွင့်)`,
      `Product ${PLAN_PRODUCT_LIMIT.free_trial} ခုအထိ တင်နိုင်`,
      'KPay / Wave / COD ငွေပေးချေမှု စနစ်',
      'ငွေကြိုပေးရန်မလိုဘဲ တန်းစမ်းနိုင်',
    ],
    cta: 'အခမဲ့ စမ်းသုံးမယ်',
  },
  {
    plan: 'starter',
    name: 'Starter',
    eyebrow: 'ပုံမှန်အရောင်းရှိသော ဆိုင်များအတွက်',
    price: PLAN_PRICE_KS.starter,
    priceSuffix: '/ လ',
    description: 'တစ်နေ့ အော်ဒါ ၁-၂ ခု ပုံမှန်ရှိသော Seller များအတွက် အသင့်တော်ဆုံး',
    features: [
      `Order ${PLAN_MONTHLY_QUOTA.starter} ခု / လ`,
      `Product ${PLAN_PRODUCT_LIMIT.starter} ခုအထိ တင်နိုင်`,
      'မြို့နယ်အလိုက် ပို့ခ အလိုအလျောက်တွက်ချက်မှု',
      'Stock စာရင်း အလိုအလျောက် စီမံမှု',
      `Extra Orders = ${EXTRA_ORDER_UNIT_PRICE_KS.toLocaleString()} Ks / order`,
    ],
    cta: 'Starter ဖြင့် စတင်မယ်',
  },
  {
    plan: 'business',
    name: 'Business',
    eyebrow: 'အရောင်းသွက်သော Brand ကြီးများအတွက်',
    price: PLAN_PRICE_KS.business,
    priceSuffix: '/ လ',
    description: 'နေ့စဉ် အော်ဒါများပြားပြီး စနစ်တကျ အလုပ်သွက်စေရန်',
    features: [
      `Order ${PLAN_MONTHLY_QUOTA.business} ခု / လ`,
      `Product ${PLAN_PRODUCT_LIMIT.business} ခုအထိ တင်နိုင်`,
      'Starter လုပ်ဆောင်ချက် အားလုံး အပြည့်အစုံ',
      'Store Builder Theme စိတ်ကြိုက်ပြင်ဆင်ခွင့် (Plan အားလုံး)',
      'ပစ္စည်းနဲ့ အော်ဒါ ပိုများများ စီမံနိုင်',
    ],
    cta: 'Business သို့ တက်မယ်',
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
