import {ArrowRight, Check, CreditCard, ExternalLink, LayoutDashboard, MapPin, MessageCircle, Palette, PackageCheck, Send, Share2, Sparkles, Store, Truck} from 'lucide-react';
import {Link} from 'react-router-dom';
import {PLAN_PRICE_KS} from '@/domain/subscription';
import {EXTRA_ORDER_UNIT_PRICE_KS, PLAN_MONTHLY_QUOTA, PLAN_PRODUCT_LIMIT} from '@/domain/entitlement';
import type {Plan} from '@/domain/plan';

const channels = ['Facebook', 'TikTok', 'Messenger', 'Telegram'];

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
    {number: '03', icon: Share2, title: 'Link မျှဝေပြီး အော်ဒါစောင့်မယ်', body: 'ရလာတဲ့ Link ကို Facebook, TikTok, Messenger မှာ ထည့်ထားပြီး Customer ကို ကိုယ်တိုင်ဝယ်ခိုင်းလိုက်ပါ။'},
  ];
  return (
    <section className="landing-steps-section" aria-labelledby="steps-title">
      <div className="landing-section-head"><span className="landing-section-pill">3 STEPS. DONE.</span><h2 id="steps-title">ဆိုင်ဖွင့်ဖို့ နည်းပညာကျွမ်းကျင်စရာ မလိုဘူး</h2><p>Page ဆောက်၊ Website ရေး၊ Developer ရှာစရာမလိုဘူး။ ကိုယ့်ဖုန်းတစ်လုံးနဲ့ပဲ အွန်လိုင်းဆိုင်တစ်ဆိုင် အလွယ်တကူ ရသွားမယ်။</p></div>
      <div className="landing-steps-grid">{steps.map(({number, icon: Icon, title, body}) => <article key={number} className="landing-step-card"><div className="landing-step-top"><span>{number}</span><Icon size={24}/></div><h3>{title}</h3><p>{body}</p></article>)}</div>
    </section>
  );
}

export function SellEverywhere() {
  return (
    <section className="landing-everywhere-section" aria-labelledby="everywhere-title">
      <div className="landing-everywhere-copy"><span className="landing-section-pill">ONE LINK. ALL PLATFORM.</span><h2 id="everywhere-title">Platform မရွေးဘူး — Link တစ်ခုရှိရင် ဘယ်နေရာကမဆို ရောင်းလို့ရတယ်</h2><p>Facebook Page, TikTok Bio, Messenger Auto Reply, Telegram Channel — Customer ရှိတဲ့နေရာတိုင်းမှာ MiniShop Link တစ်ခုပဲ ချိတ်ထားလိုက်ပါ။</p></div>
      <div className="landing-channel-flow">
        <div className="landing-channel-list">{channels.map((channel) => <div key={channel}><Send size={16}/><span>{channel}</span></div>)}</div>
        <div className="landing-channel-line" aria-hidden="true"/>
        <div className="landing-store-node"><span className="landing-store-brandmark">m</span><strong>MiniShop MM</strong><span>Store Link</span></div>
        <div className="landing-channel-line" aria-hidden="true"/>
        <div className="landing-order-node"><LayoutDashboard size={26}/><strong>Orders</strong><span>တစ်နေရာထဲမှာ</span></div>
      </div>
    </section>
  );
}

export function MyanmarCheckout() {
  return (
    <section className="landing-checkout-section" aria-labelledby="checkout-title">
      <div className="landing-checkout-preview" aria-label="MiniShop real checkout flow animation">
        <div className="landing-checkout-phone landing-checkout-phone-animated">
          <div className="landing-checkout-bar">Order တင်မယ်</div>
          <div className="landing-checkout-stage landing-checkout-stage-address">
            <div className="landing-checkout-step-heading"><span>၁</span> ပို့ဆောင်မည့် လိပ်စာ</div>
            <div className="landing-checkout-mini-grid">
              <div className="landing-checkout-animated-field"><span>လက်ခံမည့်သူအမည် *</span><strong className="landing-checkout-value-name">မိုးသက်</strong></div>
              <div className="landing-checkout-animated-field"><span>ဖုန်းနံပါတ် *</span><strong className="landing-checkout-value-phone">09 123 456 789</strong></div>
              <div className="landing-checkout-animated-field landing-checkout-animated-field-wide"><span>လိပ်စာ *</span><strong className="landing-checkout-value-street">၁၂၃၊ ပြည်လမ်း</strong></div>
            </div>
            <div className="landing-checkout-demo-field"><span>တိုင်း / ပြည်နယ် *</span><strong>Yangon</strong></div>
            <div className="landing-checkout-demo-field"><span>မြို့နယ် *</span><strong>Sanchaung</strong></div>
            <div className="landing-checkout-fee-note">📦 Sanchaung — ပို့ဆောင်ခ <strong>3,000 Ks</strong></div>
          </div>
          <div className="landing-checkout-stage landing-checkout-stage-payment">
            <div className="landing-checkout-step-heading"><span>၂</span> ငွေပေးချေမှု</div>
            <div className="landing-payment-row landing-payment-row-real">
              <span className="landing-payment-option landing-payment-option-active">COD<small>အိမ်ရောက်ငွေချေ</small></span>
              <span className="landing-payment-option">KBZPay<small>ငွေလွှဲ</small></span>
              <span className="landing-payment-option">WavePay<small>ငွေလွှဲ</small></span>
            </div>
            <div className="landing-checkout-total"><span>အိမ်ရောက်မှ ပေးရမည့် ငွေ</span><strong>28,000 Ks</strong></div>
          </div>
          <div className="landing-checkout-stage landing-checkout-stage-summary">
            <div className="landing-checkout-summary"><span>ပစ္စည်းတန်ဖိုး</span><strong>25,000 Ks</strong></div>
            <div className="landing-checkout-summary"><span>ပို့ဆောင်ခ</span><strong>3,000 Ks</strong></div>
            <div className="landing-checkout-button">Order တင်မယ်</div>
          </div>
          <div className="landing-checkout-tap" aria-hidden="true" />
          <div className="landing-checkout-success" aria-hidden="true"><Check size={18}/><span>Order တင်ပြီးပါပြီ</span></div>
        </div>
      </div>
      <div className="landing-checkout-copy">
        <span className="landing-section-pill">BUILT FOR MYANMAR</span>
        <h2 id="checkout-title">မြန်မာ ဝယ်သူတွေ ဈေးဝယ်နေကျ Flow အတိုင်း ကွက်တိ ချထားပေးတယ်</h2>
        <p>နိုင်ငံခြား template တွေလို အဆင့်တွေမရှုပ်ဘူး။ မြန်မာပြည် အွန်လိုင်းဈေးဝယ်သူတွေ မျက်စိကျက်ပြီးသား ပုံစံအတိုင်း အလွယ်ဆုံး ဝယ်လို့ရအောင် လုပ်ထားပါတယ်။</p>
        <div className="landing-checkout-features">{checkoutFeatures.map(({icon: Icon, title, body}) => <div key={title}><Icon size={20}/><span><strong>{title}</strong><small>{body}</small></span></div>)}</div>
      </div>
    </section>
  );
}

export function ThemeShowcase() {
  return (
    <section className="landing-themes-section" aria-labelledby="themes-title">
      <div className="landing-section-head"><span className="landing-section-pill">YOUR STORE. YOUR STYLE.</span><h2 id="themes-title">ဆိုင်တိုင်း ပုံစံတူစရာ မလိုဘူး</h2><p>အဝတ်အစားဆိုင်၊ အလှကုန်ဆိုင်၊ စားသောက်ကုန်ဆိုင် — ကိုယ့်ပစ္စည်းနဲ့ လိုက်ဖက်တဲ့ Theme ကို ရွေးပြီး ကိုယ့် Brand အရောင်နဲ့ ပြင်နိုင်ပါတယ်။</p></div>
      <div className="landing-theme-grid">{themes.map(({name, tone}) => <div key={name} className={`landing-theme-card ${tone}`}><div className="landing-theme-browser"><span/><span/><span/></div><div className="landing-theme-hero"/><div className="landing-theme-products"><i/><i/><i/></div><strong>{name}</strong></div>)}</div>
    </section>
  );
}

export function PricingSection() {
  return (
    <section className="landing-pricing-section" id="pricing" aria-labelledby="pricing-title">
      <div className="landing-section-head"><span className="landing-section-pill">SIMPLE PRICING</span><h2 id="pricing-title">ဆိုင်အရွယ်အစားနဲ့ အော်ဒါအရေအတွက်အလိုက် ရွေးပါ</h2><p>အစမ်းသုံးကြည့်လို့ရတယ်။ အဆင်ပြေမှ ကိုယ့်အရောင်းနဲ့ ကိုက်တဲ့ Plan ကို ရွေးပါ။</p></div>
      <div className="landing-pricing-grid">
        {pricingPlans.map(({plan, name, eyebrow, priceSuffix, description, features, cta}) => <article key={plan} className={`landing-pricing-card ${plan === 'starter' ? 'landing-pricing-card-featured' : ''}`}>{plan === 'starter' && <span className="landing-popular-badge">အသင့်တော်ဆုံး</span>}<span className="landing-plan-eyebrow">{eyebrow}</span><h3>{name}</h3><div className="landing-plan-price"><strong>{formatKs(PLAN_PRICE_KS[plan])}</strong><span>{priceSuffix}</span></div><p>{description}</p><ul>{features.map((feature) => <li key={feature}><Check size={17}/><span>{feature}</span></li>)}</ul><Link to={signupHref(plan)} className="landing-plan-cta">{cta}<ArrowRight size={17}/></Link></article>)}
      </div>
    </section>
  );
}

export function DashboardFinalCTA() {
  return (
    <section className="landing-dashboard-section" aria-labelledby="dashboard-title">
      <div className="landing-dashboard-copy"><span className="landing-section-pill">SELLER CONTROL CENTER</span><h2 id="dashboard-title">Order, Product, Delivery — အားလုံး တစ်နေရာထဲမှာ</h2><p>Chat တစ်ခုချင်းစီ ပြန်ရှာ၊ Screenshot တွေ လိုက်ကြည့်၊ စာရင်းစာအုပ်ထဲ ပြန်မှတ်နေစရာ မလိုတော့ဘူး။ ဆိုင်ရဲ့ အရောင်းအခြေအနေကို Dashboard တစ်ခုထဲကနေ ကြည့်ပြီး စီမံနိုင်ပါတယ်။</p><Link to={signupHref()} className="landing-primary-cta">ကိုယ့်ဆိုင် စဖွင့်မယ် <ArrowRight size={18}/></Link></div>
      <div className="landing-dashboard-window"><div className="landing-dashboard-sidebar"><span className="landing-store-brandmark">m</span>{[1,2,3,4].map((item) => <i key={item}/>)}</div><div className="landing-dashboard-main"><div className="landing-dashboard-top"><strong>Dashboard</strong><span>Today</span></div><div className="landing-dashboard-stats"><div><small>Orders</small><strong>24</strong></div><div><small>Revenue</small><strong>480K</strong></div><div><small>Products</small><strong>86</strong></div></div><div className="landing-dashboard-chart"><i/><i/><i/><i/><i/><i/><i/></div></div></div>
    </section>
  );
}


export function ProductFeatures() {
  const features = [
    ['Online Store', 'Product၊ Category၊ Stock၊ Price နဲ့ Promotion တွေကို ဆိုင်တစ်ခုတည်းထဲ စနစ်တကျ ပြနိုင်မယ်။'],
    ['Self-service Order', 'Customer က Chat မစောင့်ဘဲ Cart ထည့်၊ လိပ်စာရွေး၊ Payment ရွေးပြီး ကိုယ်တိုင် Order တင်နိုင်မယ်။'],
    ['Myanmar Checkout', 'Township-based delivery fee၊ KPay၊ WavePay နဲ့ COD flow ကို checkout တစ်ခုတည်းထဲ ထည့်ထားတယ်။'],
    ['Seller Dashboard', 'Orders၊ Products၊ Shipping၊ Billing နဲ့ Store settings တွေကို Admin Dashboard ကနေ manage လုပ်နိုင်မယ်။'],
    ['Store Builder', 'Theme၊ Hero၊ Typography၊ Accent color၊ Category rail နဲ့ storefront content တွေကို preview ကြည့်ရင်း ပြင်နိုင်မယ်။'],
    ['Share Anywhere', 'Facebook၊ TikTok Bio၊ Messenger၊ Telegram မှာ store link တစ်ခုတည်း ချိတ်ပြီး ရောင်းနိုင်မယ်။'],
  ];
  return (
    <section className="landing-features-section" aria-labelledby="features-title">
      <div className="landing-section-head">
        <span className="landing-section-pill"><Sparkles size={15}/> WHAT YOU GET</span>
        <h2 id="features-title">Online ရောင်းဖို့လိုတဲ့ Core Features တွေကို တစ်နေရာတည်းမှာ</h2>
        <p>MiniShop က landing page သက်သက်မဟုတ်ဘူး။ Storefront၊ Checkout၊ Order management နဲ့ Seller tools တွေကို တစ်ခုတည်းအဖြစ် သုံးနိုင်အောင်ဆောက်ထားတာ။</p>
      </div>
      <div className="landing-features-grid">
        {features.map(([title, body]) => (
          <article key={title} className="landing-feature-card">
            <Check size={18}/>
            <div><h3>{title}</h3><p>{body}</p></div>
          </article>
        ))}
      </div>
    </section>
  );
}

const demoStores = [
  {name:'Fashion Store', path:'/fashion-demo', body:'Fashion catalog + promotional storefront layout'},
  {name:'Furniture Store', path:'/furniture-demo', body:'Furniture-focused product browsing demo'},
  {name:'Mobile Store', path:'/mobile-store-demo', body:'Mobile & accessories storefront demo'},
];

export function DemoStoreShowcase() {
  return (
    <section className="landing-demo-stores-section" aria-labelledby="demo-stores-title">
      <div className="landing-section-head">
        <span className="landing-section-pill"><Store size={15}/> LIVE DEMO STORES</span>
        <h2 id="demo-stores-title">Mockup မဟုတ်ဘဲ တကယ့် Demo Store Home Page တွေကို Slide နဲ့ကြည့်မယ်</h2>
        <p>Store တစ်ခုချင်းစီကို card slide အနေနဲ့ preview ကြည့်ပြီး အောက်က Link ကနေ တကယ့် demo storefront ထဲ တန်းဝင်စမ်းလို့ရမယ်။</p>
      </div>
      <div className="landing-demo-store-slider" role="list">
        {demoStores.map((store) => (
          <article className="landing-demo-store-card" role="listitem" key={store.path}>
            <Link className="landing-demo-store-preview" to={store.path} aria-label={`${store.name} demo store`}>
              <iframe src={store.path} title={`${store.name} preview`} loading="lazy" tabIndex={-1} />
            </Link>
            <div className="landing-demo-store-meta">
              <div><strong>{store.name}</strong><span>{store.body}</span></div>
              <Link to={store.path}>Demo Store ဖွင့်ကြည့်မယ် <ExternalLink size={16}/></Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
