import {ArrowRight, Check, CreditCard, ExternalLink, LayoutDashboard, MapPin, MessageCircle, Palette, PackageCheck, Send, Share2, Sparkles, Store, Truck} from 'lucide-react';
import {Link} from 'react-router-dom';
import {motion, useReducedMotion, type Variants} from 'motion/react';
import {formatKs, pricingPlans, signupHref} from '@/features/landing/pricing';

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

const pricingContainerVariants: Variants = {
  hidden: {},
  visible: {transition: {staggerChildren: 0.1, delayChildren: 0.15}},
};

const pricingCardVariants: Variants = {
  hidden: {opacity: 0, y: 32},
  visible: {opacity: 1, y: 0, transition: {duration: 0.5, ease: [0.22, 1, 0.36, 1]}},
};

export function PricingSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="landing-pricing-section px-4 py-24" id="pricing" aria-labelledby="pricing-title">
      <motion.div
        initial={shouldReduceMotion ? false : {opacity: 0, y: -20}}
        whileInView={shouldReduceMotion ? undefined : {opacity: 1, y: 0}}
        viewport={{once: true, amount: 0.35}}
        transition={{duration: 0.55, ease: [0.22, 1, 0.36, 1]}}
        className="landing-section-head mb-14"
      >
        <span className="landing-section-pill">SIMPLE PRICING</span>
        <h2 id="pricing-title">ဆိုင်အရွယ်အစားနဲ့ အော်ဒါအရေအတွက်အလိုက် ရွေးပါ</h2>
        <p>အစမ်းသုံးကြည့်လို့ရတယ်။ အဆင်ပြေမှ ကိုယ့်အရောင်းနဲ့ ကိုက်တဲ့ Plan ကို ရွေးပါ။</p>
      </motion.div>

      <motion.div
        variants={pricingContainerVariants}
        initial={shouldReduceMotion ? false : 'hidden'}
        whileInView={shouldReduceMotion ? undefined : 'visible'}
        viewport={{once: true, amount: 0.2}}
        className="mx-auto grid w-full max-w-5xl grid-cols-1 items-end gap-4 md:grid-cols-3"
      >
        {pricingPlans.map(({plan, name, eyebrow, price, priceSuffix, description, features, cta}) => {
          const featured = plan === 'starter';
          return (
            <div key={plan} className={`h-full ${featured ? 'md:-translate-y-3.5' : ''}`}>
              <motion.article
                variants={pricingCardVariants}
                whileHover={shouldReduceMotion ? undefined : {y: featured ? -14 : -6, boxShadow: featured ? '0 20px 50px rgba(0,0,0,0.28)' : '0 12px 36px rgba(0,0,0,0.10)'}}
                className={`relative flex h-full flex-col rounded-2xl p-7 ${featured ? 'bg-black text-white' : 'border border-black/10 bg-white text-black'}`}
              >
              {featured && (
                <motion.div
                  initial={shouldReduceMotion ? false : {opacity: 0, y: -8}}
                  whileInView={shouldReduceMotion ? undefined : {opacity: 1, y: 0}}
                  viewport={{once: true}}
                  transition={{delay: 0.35}}
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full border border-green-300 bg-green-100 px-3 py-0.5 text-[10px] font-bold tracking-widest text-green-700 uppercase"
                >
                  အသင့်တော်ဆုံး
                </motion.div>
              )}

              <div className="mb-5 flex items-center gap-2">
                <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-sm font-semibold ${featured ? 'bg-white/10 text-white' : 'bg-black/5 text-black'}`}>
                  {plan === 'free_trial' ? '○' : plan === 'starter' ? '◇' : '⊕'}
                </span>
                <span className="text-sm font-semibold">{name}</span>
              </div>

              <span className={`mb-3 text-xs font-semibold ${featured ? 'text-white/60' : 'text-black/50'}`}>{eyebrow}</span>
              <div className="mb-2 flex items-end gap-1">
                <strong className="text-4xl leading-none font-bold tracking-tight md:text-5xl">{formatKs(price)}</strong>
                {priceSuffix && <span className={`mb-1.5 text-xs ${featured ? 'text-white/50' : 'text-black/50'}`}>{priceSuffix}</span>}
              </div>

              <p className={`mb-6 text-sm leading-7 ${featured ? 'text-white/60' : 'text-black/60'}`}>{description}</p>
              <div className={`mb-6 h-px w-full ${featured ? 'bg-white/10' : 'bg-black/8'}`} />

              <ul className="mb-8 flex flex-1 flex-col gap-3">
                {features.map((feature, index) => (
                  <motion.li
                    key={feature}
                    initial={shouldReduceMotion ? false : {opacity: 0, x: -8}}
                    whileInView={shouldReduceMotion ? undefined : {opacity: 1, x: 0}}
                    viewport={{once: true}}
                    transition={{delay: 0.2 + index * 0.06, duration: 0.3}}
                    className={`flex items-start gap-2.5 text-sm ${featured ? 'text-white/80' : 'text-black/75'}`}
                  >
                    <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${featured ? 'bg-white/10' : 'bg-black/5'}`}>
                      <Check size={10} strokeWidth={2.5}/>
                    </span>
                    <span>{feature}</span>
                  </motion.li>
                ))}
              </ul>

              <motion.div whileHover={shouldReduceMotion ? undefined : {scale: 1.02}} whileTap={shouldReduceMotion ? undefined : {scale: 0.98}}>
                <Link
                  to={signupHref(plan)}
                  className={`flex w-full items-center justify-center gap-1.5 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 ${featured ? 'border-white bg-white text-black hover:bg-white/90' : 'border-black/10 bg-black/5 text-black hover:bg-black/10'}`}
                >
                  {cta}<ArrowRight size={16}/>
                </Link>
              </motion.div>
              </motion.article>
            </div>
          );
        })}
      </motion.div>
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
  {name:'Fashion Store', path:'/fashion-demo', preview:'/demo/fashion/preview.webp', body:'Fashion catalog + promotional storefront layout'},
  {name:'Furniture Store', path:'/furniture-demo', preview:'/demo/furniture/preview.webp', body:'Furniture-focused product browsing demo'},
  {name:'Mobile Store', path:'/mobile-store-demo', preview:'/demo/mobile/preview.webp', body:'Mobile & accessories storefront demo'},
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
              <img src={store.preview} alt={`${store.name} preview`} loading="lazy" />
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
