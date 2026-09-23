import {ArrowRight, Check, CreditCard, LayoutDashboard, MapPin, MessageCircle, Palette, PackageCheck, Send, Share2, ShoppingBag, Truck} from 'lucide-react';
import {Link} from 'react-router-dom';
import {PLAN_PRICE_KS} from '@/domain/subscription';
import {EXTRA_ORDER_UNIT_PRICE_KS, FREE_TRIAL_PRODUCT_LIMIT, PLAN_MONTHLY_QUOTA} from '@/domain/entitlement';
import type {Plan} from '@/domain/plan';

const channels = ['Facebook', 'TikTok', 'Telegram'];

const checkoutFeatures = [
  {icon: MapPin, title: 'Region / Township', body: 'Customer က ကိုယ့်နေရာကို လွယ်လွယ်ရွေးနိုင်မယ်။'},
  {icon: Truck, title: 'Delivery Fee', body: 'ပို့ခကို checkout flow ထဲမှာ ရှင်းရှင်းပြနိုင်မယ်။'},
  {icon: CreditCard, title: 'Local Payments', body: 'COD, KBZPay, WavePay နဲ့ Order လက်ခံနိုင်မယ်။'},
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
    eyebrow: 'စမ်းသုံးကြည့်ဖို့',
    priceSuffix: '',
    description: 'ငွေမချေဘဲ ဆိုင်ဖွင့်ပြီး MiniShop flow ကို လက်တွေ့စမ်းကြည့်နိုင်ပါတယ်။',
    features: [
      `Order ${PLAN_MONTHLY_QUOTA.free_trial} ခု (တစ်သက်တာ)`,
      `Product ${FREE_TRIAL_PRODUCT_LIMIT} ခုအထိ`,
      'Core ecommerce features',
      'Credit Card မလို',
    ],
    cta: 'အခမဲ့စတင်မယ်',
  },
  {
    plan: 'starter',
    name: 'Starter',
    eyebrow: 'ပုံမှန်ရောင်းချနေတဲ့ဆိုင်များ',
    priceSuffix: '/ လ',
    description: 'လစဉ် Order volume မများသေးတဲ့ seller တွေအတွက် အခြေခံ operation ကိုအပြည့်သုံးနိုင်ပါတယ်။',
    features: [
      `Order ${PLAN_MONTHLY_QUOTA.starter} ခု / လ`,
      'Core ecommerce features အားလုံး',
      `Extra Orders = ${EXTRA_ORDER_UNIT_PRICE_KS.toLocaleString()} Ks / order`,
      'Purchased Extra Orders မ expire ပါ',
    ],
    cta: 'Starter ရွေးမယ်',
  },
  {
    plan: 'business',
    name: 'Business',
    eyebrow: 'Order volume ပိုများတဲ့ဆိုင်များ',
    priceSuffix: '/ လ',
    description: 'Order volume တက်လာတဲ့ seller တွေအတွက် quota ပိုများပြီး advanced operations ကိုအသုံးပြုနိုင်ပါတယ်။',
    features: [
      `Order ${PLAN_MONTHLY_QUOTA.business} ခု / လ`,
      'Starter features အားလုံး',
      'Advanced operations / features',
      'Purchased Extra Orders မ expire ပါ',
    ],
    cta: 'Business ရွေးမယ်',
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
        <span className="landing-section-pill">STOP SELLING THROUGH CHAT</span>
        <h2 id="chat-title">ပုံပို့၊ ဈေးပြန်ဖြေ၊ Order စာရင်းလိုက်မှတ်နေရတာကို လျှော့လိုက်ပါ</h2>
        <p>Customer တစ်ယောက်ချင်းစီကို chat ထဲမှာ အကုန်ပြန်ရှင်းပြနေရမယ့်အစား Store Link တစ်ခုနဲ့ ပစ္စည်းကြည့်ခြင်းကနေ Order တင်ခြင်းအထိ တစ်လမ်းတည်းပို့ပါ။</p>
      </div>
      <div className="landing-comparison">
        <article className="landing-comparison-card">
          <span className="landing-comparison-label">အခုလို</span>
          <div className="landing-chat-stack" aria-label="manual chat selling">
            {['ဒီဟာဘယ်လောက်လဲ?', 'အရောင်ရှိလား?', 'ပို့ခဘယ်လောက်လဲ?', 'Order တင်ချင်တယ်'].map((text) => (
              <div key={text} className="landing-chat-bubble"><MessageCircle size={16}/>{text}</div>
            ))}
          </div>
        </article>
        <div className="landing-comparison-arrow"><ArrowRight size={24}/></div>
        <article className="landing-comparison-card landing-comparison-card-after">
          <span className="landing-comparison-label">MiniShop နဲ့</span>
          <div className="landing-journey-list">
            {['ပစ္စည်းကိုယ်တိုင်ကြည့်', 'Cart ထဲထည့်', 'Checkout လုပ်', 'Order တင်'].map((text, index) => (
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
    {number: '01', icon: PackageCheck, title: 'ပစ္စည်းတင်', body: 'ပုံ၊ ဈေးနှုန်းနဲ့ Product အချက်အလက်တွေ ထည့်ပါ။'},
    {number: '02', icon: Palette, title: 'ဆိုင်ပြင်', body: 'ကိုယ့် Brand နဲ့ကိုက်တဲ့ Theme ကိုရွေးပြီး Store ကိုပြင်ပါ။'},
    {number: '03', icon: Share2, title: 'Link Share', body: 'Store Link ကို Facebook, TikTok, Telegram မှာ မျှဝေပြီး စရောင်းပါ။'},
  ];
  return (
    <section className="landing-steps-section" aria-labelledby="steps-title">
      <div className="landing-section-head">
        <span className="landing-section-pill">3 STEPS</span>
        <h2 id="steps-title">Store တစ်ခုစဖို့ ဒီလောက်ပဲလိုတယ်</h2>
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
        <h2 id="everywhere-title">ဘယ် Channel ကနေရောင်းရောင်း Order ကတော့ တစ်နေရာထဲမှာ</h2>
        <p>Facebook post, TikTok bio, Telegram channel ကနေ Customer ကို MiniShop ဆီ တိုက်ရိုက်ခေါ်လာပါ။</p>
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
        <h2 id="checkout-title">Myanmar Seller တွေရဲ့ Checkout Flow ကို တိုက်ရိုက်ထည့်ထားတယ်</h2>
        <p>Global ecommerce template ကို ပြန်ညှိထားတာမဟုတ်ဘဲ local selling flow ကို အဓိကထားတယ်။</p>
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
        <h2 id="themes-title">ဆိုင်တိုင်း ပုံစံတူနေစရာမလိုပါဘူး</h2>
        <p>ကိုယ့် product category နဲ့ brand feeling ကိုက်တဲ့ Theme ကိုရွေးပြီး Store ကို ကိုယ့်ဆိုင်လိုမြင်အောင်ပြင်ပါ။</p>
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
      <Link className="landing-demo-cta landing-theme-demo" to="/demo">Live Demo ကြည့်မယ် <ArrowRight size={17}/></Link>
    </section>
  );
}

export function PricingSection() {
  return (
    <section className="landing-pricing-section" aria-labelledby="pricing-title">
      <div className="landing-section-head landing-pricing-head">
        <span className="landing-section-pill">SIMPLE PRICING</span>
        <h2 id="pricing-title">ကိုယ့်ဆိုင်ရဲ့ Order Volume နဲ့ကိုက်တဲ့ Plan ကိုရွေးပါ</h2>
        <p>Free Trial နဲ့စမ်းသုံးပြီးနောက် လိုအပ်သလို Starter သို့မဟုတ် Business ကိုရွေးနိုင်ပါတယ်။ Paid plan နှစ်ခုလုံးမှာ Extra Orders ကို ဝယ်ထားရင် balance မ expire ပါ။</p>
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
