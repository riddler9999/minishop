import {ArrowRight, Check, CreditCard, LayoutDashboard, MapPin, MessageCircle, Palette, PackageCheck, Send, Share2, ShoppingBag, Truck} from 'lucide-react';
import {Link} from 'react-router-dom';
import {PLAN_PRICE_KS} from '@/domain/subscription';
import {EXTRA_ORDER_UNIT_PRICE_KS, PLAN_MONTHLY_QUOTA, PLAN_PRODUCT_LIMIT} from '@/domain/entitlement';
import type {Plan} from '@/domain/plan';

const channels = ['Facebook', 'TikTok', 'Telegram'];

const checkoutFeatures = [
  {icon: MapPin, title: 'မြို့နယ်နဲ့ တိုင်းဒေသကြီး', body: 'Customer ဘက်က လိပ်စာ အပြည့်အစုံ မရိုက်တတ်ရင်တောင် မြို့နယ် အလွယ်တကူ ရွေးလိုက်ရုံပဲ။'},
  {icon: Truck, title: 'Deli ခ အလိုအလျောက် တွက်ချက်ခြင်း', body: 'မြို့နယ်ရွေးလိုက်တာနဲ့ ပို့ခပါ တခါတည်းတွက်ပေးလို့ “Deli ခ ဘယ်လောက်လဲ” လိုက်မေးစရာ မလိုတော့ဘူး။'},
  {icon: CreditCard, title: 'KPay, Wave & COD စနစ်', body: 'မြန်မာပြည်မှာ အသုံးအများဆုံး KPay, WavePay ငွေလွှဲစနစ်တွေရော အိမ်ရောက်ငွေချေ (COD) ပါ အပြည့်အစုံ ပါတယ်။'},
];

const themes = [
  {name: 'Minimal', tone: 'theme-minimal'},
  {name: 'Fashion', tone: 'theme-fashion'},
  {name: 'Beauty', tone: 'theme-beauty'},
  {name: 'Food', tone: 'theme-food'},
  {name: 'Bold', tone: 'theme-bold'},
];

const pricingPlans: Array<{
  plan: Plan;
  name: string;
  eyebrow: string;
  priceSuffix: string;
  description: string;
  features: string[];
  cta: string;
}> = [
  {
    plan: 'free_trial',
    name: 'Free Trial',
    eyebrow: 'အစမ်းသုံးကြည့်ချင်သူများအတွက်',
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

function formatKs(amount: number) {
  return amount === 0 ? '0 Ks' : `${amount.toLocaleString()} Ks`;
}

function signupHref(plan?: Plan) {
  const destination = plan
    ? `/admin/subscribe?plan=${plan}`
    : '/admin/subscribe';
  return `/admin/login?mode=signup&from=${encodeURIComponent(destination)}`;
}

export function StopSellingThroughChat() {
  return (
    <section className="landing-story-section" aria-labelledby="chat-title">
      <div className="landing-story-heading">
        <span className="landing-section-pill">NO MORE CHAT STRESS</span>
        <h2 id="chat-title">မနက်မိုးလင်းတာနဲ့ Chat တွေဖတ်၊ စာရင်းတွေလိုက်မှတ်နေရတဲ့ ဒုက္ခကို အဆုံးသတ်လိုက်ပါ</h2>
        <p>အရောင်း Post တင်ပြီး မအားလို့ စာမပြန်နိုင်ရင် ဝယ်သူက တခြားဆိုင်ဆီ ထွက်သွားတတ်တယ်။ MiniShop ရှိရင် စာပြန်နောက်ကျလို့ အားနာစရာမလိုဘဲ ဝယ်သူက သူ့ဖာသာ ဈေးဝယ်ပြီး ငွေပါ ရှင်းသွားမယ်။</p>
      </div>
      <div className="landing-comparison">
        <article className="landing-comparison-card">
          <span className="landing-comparison-label">အခုလို</span>
          <div className="landing-chat-stack" aria-label="manual chat selling">
            {['ဈေးဘယ်လောက်လဲ?', 'ဒီအရောင်/ဆိုဒ် ရှိသေးလား?', 'ပို့ခ ဘယ်လောက်လဲရှင်?', 'အော်ဒါ ဘယ်လိုတင်ရမလဲ?'].map((text) => (
              <div key={text} className="landing-chat-bubble"><MessageCircle size={16}/>{text}</div>
            ))}
          </div>
        </article>
        <div className="landing-comparison-arrow"><ArrowRight size={24}/></div>
        <article className="landing-comparison-card landing-comparison-card-after">
          <span className="landing-comparison-label">MiniShop နဲ့</span>
          <div className="landing-journey-list">
            {['ပစ္စည်းနဲ့ ဈေးနှုန်းကို ကိုယ်တိုင် အေးဆေးကြည့်မယ်', 'လိုချင်တာ Cart ထဲ ထည့်မယ်', 'လိပ်စာရွေးပြီး KPay / Wave / COD နဲ့ ငွေရှင်းမယ်', 'Order တန်းကျပြီး စာရင်းထဲ အော်တိုရောက်မယ်'].map((text, index) => (
              <div key={text}><span>{index + 1}</span>{text}<Check size={17}/></div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}

export function ThreeStepStoreCreation() {
  const steps = [
    {number: '01', icon: PackageCheck, title: 'ပစ္စည်းတင်မယ်', body: 'ပုံရိုက်ထည့်၊ ဈေးနှုန်းနဲ့ ကိုယ့်ဆီမှာကျန်တဲ့ အရေအတွက် ထည့်လိုက်ရုံပဲ။'},
    {number: '02', icon: Palette, title: 'Design Theme ရွေးမယ်', body: 'ကိုယ့် Brand နဲ့လိုက်မယ့် အရောင်နဲ့ ပုံစံကို 1-Click နဲ့ အလွယ်တကူ ပြောင်းမယ်။'},
    {number: '03', icon: Share2, title: 'Link မျှဝေပြီး အော်ဒါစောင့်မယ်', body: 'ရလာတဲ့ ဆိုင် Link ကို Page Bio၊ TikTok Bio နဲ့ Chat အော်တိုမက်ဆေ့ခ်ျတွေမှာ ထည့်ထားလိုက်ပါ။'},
  ];
  return (
    <section className="landing-steps-section" aria-labelledby="steps-title">
      <div className="landing-section-head">
        <span className="landing-section-pill">3 STEPS</span>
        <h2 id="steps-title">၃ ဆင့်တည်းနဲ့ ဆိုင်စဖွင့်လို့ရပြီ</h2>
      </div>
      <div className="landing-steps-grid">
        {steps.map(({number, icon: Icon, title, body}) => (
          <article key={number} className="landing-step-card">
            <div className="landing-step-top"><span>{number}</span><Icon size={24}/></div>
            <h3>{title}</h3><p>{body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function SellEverywhere() {
  return (
    <section className="landing-everywhere-section" aria-labelledby="everywhere-title">
      <div className="landing-everywhere-copy">
        <span className="landing-section-pill">ONE STORE. EVERYWHERE.</span>
        <h2 id="everywhere-title">FB၊ TikTok၊ Telegram... ဘယ်ကပဲလာလာ Order တွေက တစ်နေရာတည်း စုပေးတယ်</h2>
        <p>App တစ်ခုချင်းစီ လိုက်ဖွင့်ပြီး စာရင်းတွေလိုက်ကူးမနေပါနဲ့တော့။ ဘယ်နေရာကပဲ ဝယ်ဝယ် Dashboard တစ်ခုတည်းမှာ Order အကုန် စနစ်တကျ ရှိနေမယ်။</p>
      </div>
      <div className="landing-channel-flow" aria-label="social channels to MiniShop">
        <div className="landing-channel-list">
          {channels.map((channel) => <div key={channel}><Send size={17}/>{channel}</div>)}
        </div>
        <div className="landing-channel-line" aria-hidden="true"/>
        <div className="landing-store-node"><ShoppingBag size={28}/><strong>MiniShop</strong><span>Store Link</span></div>
        <div className="landing-channel-line" aria-hidden="true"/>
        <div className="landing-order-node"><LayoutDashboard size={26}/><strong>Orders</strong><span>တစ်နေရာထဲမှာ</span></div>
      </div>
    </section>
  );
}

export function MyanmarCheckout() {
  return (
    <section className="landing-checkout-section" aria-labelledby="checkout-title">
      <div className="landing-checkout-preview">
        <div className="landing-checkout-phone">
          <div className="landing-checkout-bar">Checkout</div>
          <span className="landing-checkout-label">Region</span><div className="landing-checkout-field">Yangon</div>
          <span className="landing-checkout-label">Township</span><div className="landing-checkout-field">Sanchaung</div>
          <span className="landing-checkout-label">Payment</span><div className="landing-payment-row"><span>COD</span><span>KBZPay</span><span>WavePay</span></div>
          <div className="landing-checkout-summary"><span>Delivery Fee</span><strong>3,000 MMK</strong></div>
          <div className="landing-checkout-button">Order Confirm</div>
        </div>
      </div>
      <div className="landing-checkout-copy">
        <span className="landing-section-pill">BUILT FOR MYANMAR</span>
        <h2 id="checkout-title">မြန်မာ ဝယ်သူတွေ ဈေးဝယ်နေကျ Flow အတိုင်း ကွက်တိ ချထားပေးတယ်</h2>
        <p>နိုင်ငံခြား template တွေလို အဆင့်တွေမရှုပ်ဘူး။ မြန်မာပြည် အွန်လိုင်းဈေးဝယ်သူတွေ မျက်စိကျက်ပြီးသား ပုံစံအတိုင်း အလွယ်ဆုံး ဝယ်လို့ရအောင် လုပ်ထားပါတယ်။</p>
        <div className="landing-checkout-features">
          {checkoutFeatures.map(({icon: Icon, title, body}) => (
            <div key={title}><Icon size={20}/><span><strong>{title}</strong><small>{body}</small></span></div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ThemeShowcase() {
  return (
    <section className="landing-themes-section" aria-labelledby="themes-title">
      <div className="landing-section-head">
        <span className="landing-section-pill">5 STORE THEMES</span>
        <h2 id="themes-title">Designer ငှားစရာမလိုဘဲ ဆိုင်သပ်သပ်ရပ်ရပ် ဖြစ်သွားစေမယ့် Themes များ</h2>
        <p>အဝတ်အထည်လား၊ အလှကုန်လား၊ ပစ္စည်းစုံလား — ကိုယ့် Brand နဲ့ ကွက်တိကျမယ့် Design ကို တစ်ချက်နှိပ်ရုံနဲ့ ပြောင်းလဲနိုင်ပါတယ်။</p>
      </div>
      <div className="landing-theme-strip">
        {themes.map((theme) => (
          <article key={theme.name} className="landing-theme-card">
            <div className={'landing-theme-phone ' + theme.tone}>
              <div className="landing-theme-nav"/>
              <div className="landing-theme-hero"/>
              <div className="landing-theme-products"><span/><span/><span/><span/></div>
            </div>
            <strong>{theme.name}</strong>
          </article>
        ))}
      </div>
      <Link className="landing-demo-cta landing-theme-demo" to="/demo">တကယ့် ဆိုင်နမူနာကို စမ်းကြည့်မယ် <ArrowRight size={17}/></Link>
    </section>
  );
}

export function PricingSection() {
  return (
    <section className="landing-pricing-section" aria-labelledby="pricing-title">
      <div className="landing-section-head landing-pricing-head">
        <span className="landing-section-pill">SIMPLE PRICING</span>
        <h2 id="pricing-title">ကိုယ့်ရဲ့ အရောင်းပမာဏအလိုက် တန်တဲ့ Plan ကို ရွေးပါ</h2>
        <p>စမ်းသုံးကြည့်ချင်ရင် Free Plan နဲ့ အခုပဲ စတင်လိုက်ပါ။ ကတ်နံပါတ်တွေ၊ ငွေကြိုပေးရတာတွေ လုံးဝမလိုပါဘူး။</p>
      </div>
      <div className="landing-pricing-grid">
        {pricingPlans.map((item) => (
          <article key={item.plan} className={'landing-pricing-card landing-pricing-card-' + item.plan}>
            <div className="landing-pricing-card-top">
              <span className="landing-pricing-eyebrow">{item.eyebrow}</span>
              <h3>{item.name}</h3>
              <div className="landing-pricing-price">
                <strong>{formatKs(PLAN_PRICE_KS[item.plan])}</strong>
                {item.priceSuffix && <span>{item.priceSuffix}</span>}
              </div>
              <p>{item.description}</p>
            </div>
            <div className="landing-pricing-features">
              {item.features.map((feature) => <span key={feature}><Check size={16}/>{feature}</span>)}
            </div>
            <Link className={item.plan === 'free_trial' ? 'landing-primary-cta landing-pricing-cta' : 'landing-demo-cta landing-pricing-cta'} to={signupHref(item.plan)}>
              {item.cta} <ArrowRight size={17}/>
            </Link>
          </article>
        ))}
      </div>
      <p className="landing-pricing-note">Plan ပြောင်းလဲမှုနှင့် billing အခြေအနေကို seller dashboard မှာ စစ်ဆေးနိုင်ပါတယ်။</p>
    </section>
  );
}

export function DashboardFinalCTA() {
  return (
    <section className="landing-dashboard-section" aria-labelledby="dashboard-title">
      <div className="landing-dashboard-mockup">
        <div className="landing-dashboard-sidebar"><span/><span/><span/><span/></div>
        <div className="landing-dashboard-main">
          <div className="landing-dashboard-top"/>
          <div className="landing-dashboard-stats"><span/><span/><span/></div>
          <div className="landing-dashboard-table"><span/><span/><span/><span/></div>
        </div>
      </div>
      <div className="landing-dashboard-copy">
        <span className="landing-section-pill">ONE SIMPLE DASHBOARD</span>
        <h2 id="dashboard-title">Products နဲ့ Orders ကို တစ်နေရာတည်းက စီမံပါ</h2>
        <p>ဆိုင်ဖွင့်ပြီးတာနဲ့ အလုပ်မရှုပ်အောင် product, order, delivery နဲ့ store design ကို dashboard တစ်ခုထဲမှာ စီမံနိုင်မယ်။</p>
        <div className="landing-dashboard-checks">
          {['Product Management', 'Order Management', 'Delivery Settings', 'Theme Customization'].map((item) => <span key={item}><Check size={16}/>{item}</span>)}
        </div>
        <div className="landing-final-actions">
          <Link className="landing-primary-cta" to={signupHref()}>ကိုယ့် Online Store စဖွင့်မယ် <ArrowRight size={18}/></Link>
          <Link className="landing-demo-cta" to="/demo">Demo Store ကြည့်မယ်</Link>
        </div>
        <small className="landing-final-note">အခမဲ့စတင်နိုင်သည် · Credit Card မလို</small>
      </div>
    </section>
  );
}
