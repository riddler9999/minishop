import { useState } from 'react';
import {ArrowRight, Boxes, Check, ChevronDown, ExternalLink, HelpCircle, LayoutDashboard, MessageCircle, Palette, PackageCheck, RefreshCw, Send, Share2, Sparkles, Store} from 'lucide-react';
import {Link} from 'react-router-dom';
import {motion, useReducedMotion, type Variants} from 'motion/react';
import {formatKs, pricingPlans, signupHref} from '@/features/landing/pricing';

const channels = ['Facebook', 'TikTok', 'Messenger', 'Telegram'];

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
      <div className="landing-checkout-copy">
        <h2 id="checkout-title">လွယ်ကူရိုးရှင်းသော Checkout Flow</h2>
        <p>၀ယ်ယူနည်းပြပေးစရာမလိုတဲ့အထိ လူတိုင်းအလွယ်တကူအော်ဒါတင်လို့ရစေမယ့် Checkout Process</p>
      </div>
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
            <div className="landing-checkout-demo-field"><span>တိုင်း / ပြည်နယ် *</span><strong>Yangon (ရန်ကုန်တိုင်း)</strong></div>
            <div className="landing-checkout-demo-field"><span>မြို့နယ် *</span><strong>Kamayut (ကမာရွတ်)</strong></div>
            <div className="landing-checkout-fee-note">📦 ကမာရွတ် — ပို့ဆောင်ခ <strong>3,000 Ks</strong></div>
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
    <section className="landing-pricing-section px-4 py-24" id="pricing" aria-label="Simple Pricing">
      <motion.div
        initial={shouldReduceMotion ? false : {opacity: 0, y: -20}}
        whileInView={shouldReduceMotion ? undefined : {opacity: 1, y: 0}}
        viewport={{once: true, amount: 0.35}}
        transition={{duration: 0.55, ease: [0.22, 1, 0.36, 1]}}
        className="landing-section-head mb-12 text-center"
      >
        <span className="landing-section-pill border border-[var(--commerce-border,#e1e7e3)] bg-[var(--commerce-surface-soft,#f4f7f5)] text-[var(--commerce-accent,#35b99d)]">
          SIMPLE PRICING
        </span>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-[var(--commerce-text,#1f2421)] md:text-4xl">
          Pricing
        </h2>
      </motion.div>

      <motion.div
        variants={pricingContainerVariants}
        initial={shouldReduceMotion ? false : 'hidden'}
        whileInView={shouldReduceMotion ? undefined : 'visible'}
        viewport={{once: true, amount: 0.2}}
        className="mx-auto grid w-full max-w-5xl grid-cols-1 items-stretch gap-6 md:grid-cols-3"
      >
        {pricingPlans.map(({plan, name, eyebrow, price, priceSuffix, description, features, cta}) => {
          const featured = plan === 'starter';
          const displayPrice = price;
          const displaySuffix = priceSuffix || '';

          return (
            <div key={plan} className={`h-full ${featured ? 'md:-translate-y-3' : ''}`}>
              <motion.article
                variants={pricingCardVariants}
                whileHover={shouldReduceMotion ? undefined : {y: featured ? -10 : -5, boxShadow: featured ? '0 20px 48px rgba(31,36,33,0.16)' : '0 10px 28px rgba(31,36,33,0.06)'}}
                className={`relative flex h-full flex-col rounded-[var(--commerce-radius,20px)] p-7 transition-all duration-200 ${
                  featured
                    ? 'border-2 border-[var(--commerce-accent,#35b99d)] bg-[var(--commerce-surface,#ffffff)] text-[var(--commerce-text,#1f2421)] shadow-xl ring-1 ring-[var(--commerce-accent,#35b99d)]/20'
                    : 'border border-[var(--commerce-border,#e1e7e3)] bg-[var(--commerce-surface,#ffffff)] text-[var(--commerce-text,#1f2421)] shadow-xs'
                }`}
              >
                {featured && (
                  <motion.div
                    initial={shouldReduceMotion ? false : {opacity: 0, y: -8}}
                    whileInView={shouldReduceMotion ? undefined : {opacity: 1, y: 0}}
                    viewport={{once: true}}
                    transition={{delay: 0.35}}
                    className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full border border-[var(--commerce-accent,#35b99d)] bg-[var(--commerce-accent,#35b99d)] px-3 py-0.5 text-[10px] font-bold tracking-widest text-[var(--commerce-accent-contrast,#ffffff)] uppercase shadow-xs"
                  >
                    အသင့်တော်ဆုံး
                  </motion.div>
                )}

                <div className="mb-5 flex items-center gap-2.5">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-[var(--commerce-radius-sm,10px)] text-sm font-bold ${
                    featured
                      ? 'bg-[var(--commerce-accent-soft,#d8f1ea)] text-[var(--commerce-accent,#35b99d)]'
                      : 'bg-[var(--commerce-surface-soft,#f4f7f5)] text-[var(--commerce-text,#1f2421)]'
                  }`}>
                    {plan === 'free_trial' ? '○' : plan === 'starter' ? '◇' : '⊕'}
                  </span>
                  <span className="text-base font-bold text-[var(--commerce-text,#1f2421)]">{name}</span>
                </div>

                <span className="mb-3 text-xs font-semibold text-[var(--commerce-muted,#66706c)]">{eyebrow}</span>
                <div className="mb-2 flex items-end gap-1">
                  <strong className="text-4xl leading-none font-bold tracking-tight text-[var(--commerce-text,#1f2421)] md:text-5xl">{formatKs(displayPrice)}</strong>
                  {displaySuffix && <span className="mb-1.5 text-xs text-[var(--commerce-muted,#66706c)]">{displaySuffix}</span>}
                </div>

                <p className="mb-6 text-sm leading-6 text-[var(--commerce-muted,#66706c)]">{description}</p>
                <div className="mb-6 h-px w-full bg-[var(--commerce-border,#e1e7e3)]" />

                <ul className="mb-8 flex flex-1 flex-col gap-3">
                  {features.map((feature, index) => (
                    <motion.li
                      key={feature}
                      initial={shouldReduceMotion ? false : {opacity: 0, x: -8}}
                      whileInView={shouldReduceMotion ? undefined : {opacity: 1, x: 0}}
                      viewport={{once: true}}
                      transition={{delay: 0.2 + index * 0.06, duration: 0.3}}
                      className="flex items-start gap-2.5 text-sm text-[var(--commerce-text,#1f2421)]"
                    >
                      <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                        featured
                          ? 'bg-[var(--commerce-accent-soft,#d8f1ea)] text-[var(--commerce-accent,#35b99d)]'
                          : 'bg-[var(--commerce-surface-soft,#f4f7f5)] text-[var(--commerce-text,#1f2421)]'
                      }`}>
                        <Check size={10} strokeWidth={2.5}/>
                      </span>
                      <span>{feature}</span>
                    </motion.li>
                  ))}
                </ul>

                <motion.div whileHover={shouldReduceMotion ? undefined : {scale: 1.02}} whileTap={shouldReduceMotion ? undefined : {scale: 0.98}}>
                  <Link
                    to={signupHref(plan)}
                    className={`flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-[var(--commerce-radius-sm,12px)] border px-4 py-3 text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--commerce-accent,#35b99d)] focus-visible:ring-offset-2 ${
                      featured
                        ? 'border-[var(--commerce-accent,#35b99d)] bg-[var(--commerce-accent,#35b99d)] text-[var(--commerce-accent-contrast,#ffffff)] shadow-xs hover:brightness-95'
                        : 'border-[var(--commerce-border,#e1e7e3)] bg-[var(--commerce-surface-soft,#f4f7f5)] text-[var(--commerce-text,#1f2421)] hover:border-[var(--commerce-accent,#35b99d)] hover:bg-[var(--commerce-surface,#ffffff)]'
                    }`}
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
    <section className="landing-demo-stores-section" aria-label="Live Demo Stores">
      <div className="landing-section-head">
        <span className="landing-section-pill"><Store size={15}/> LIVE DEMO STORES</span>
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

export function KeyFeatures() {
  const keyFeaturesList = [
    {
      icon: Boxes,
      pill: 'INVENTORY MANAGEMENT',
      title: 'လွယ်ကူစနစ်ကျတဲ့ Stock စီမံခန့်ခွဲမှု',
      description: 'ပစ္စည်းအဝင်အထွက်နဲ့ ကုန်ပစ္စည်း အရေအတွက် (Stock) တွေကို ဖုန်းတစ်လုံးတည်းနဲ့ အချိန်မရွေး ကြည့်ပြီး လွယ်ကူစွာ စီမံနိုင်မယ်။',
      highlights: ['အလိုအလျောက် Stock နုတ်ပေးခြင်း', 'Category အလိုက် ပစ္စည်းခွဲခြားခြင်း', 'ပစ္စည်းပြတ်ခါနီး သတိပေးချက်'],
      accentBg: 'bg-pink-50 text-pink-600 border-pink-200/60',
    },
    {
      icon: Palette,
      pill: 'CUSTOM STORE THEMES',
      title: 'စိတ်ကြိုက်ပြင်နိုင်တဲ့ Store Themes',
      description: 'မိမိဆိုင် Brand အရောင်၊ Hero Banner နဲ့ Layout တွေကို Code ရေးစရာမလိုဘဲ 1-Click နဲ့ လှလှပပ ပြောင်းလဲပြင်ဆင်နိုင်မယ်။',
      highlights: ['No-code Store Builder', 'Mobile-first Responsive Design', 'Custom Hero Banner & Colors'],
      accentBg: 'bg-purple-50 text-purple-600 border-purple-200/60',
    },
    {
      icon: RefreshCw,
      pill: 'AUTOMATED ORDER TRACKING',
      title: 'အလိုအလျောက် Order Tracking စနစ်',
      description: 'Customer ဆီက Order တန်းဝင်လာတာနဲ့ Dashboard မှာ အလိုအလျောက် ပေါ်လာပြီး Order တိုင် ပို့ဆောင်မှု အခြေအနေအထိ စောင့်ကြည့်နိုင်မယ်။',
      highlights: ['Real-time Order Notification', 'Township Delivery Fee Calculator', 'Payment Receipt Verification'],
      accentBg: 'bg-emerald-50 text-emerald-600 border-emerald-200/60',
    },
  ];

  return (
    <section className="landing-steps-section" aria-labelledby="key-features-title">
      <div className="landing-section-head">
        <span className="landing-section-pill mb-2"><Sparkles size={15}/> KEY FEATURES</span>
        <h2 id="key-features-title">
          ဆိုင်တစ်ဆိုင် လွယ်လွယ်နဲ့ ရောင်းအားတက်စေမယ့် Key Features ၃ ခု
        </h2>
        <p>
          Stock စီမံတာ၊ ဆိုင်ဒီဇိုင်းပြင်တာနဲ့ Order စောင့်ကြည့်တာတွေကို လူမပင်ပန်းဘဲ စနစ်တကျ ပြုလုပ်နိုင်ပါပြီ။
        </p>
      </div>

      <div className="max-w-5xl mx-auto mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        {keyFeaturesList.map(({icon: Icon, pill, title, description, highlights, accentBg}) => (
          <article
            key={title}
            className="flex flex-col justify-between p-7 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 group"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-5">
                <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase bg-slate-100 px-2.5 py-1 rounded-md">
                  {pill}
                </span>
                <div className={`p-2.5 rounded-xl border ${accentBg} transition-transform duration-200 group-hover:scale-110`}>
                  <Icon size={22} strokeWidth={2.2} />
                </div>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-2.5 tracking-tight group-hover:text-pink-600 transition-colors">
                {title}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6 font-normal">
                {description}
              </p>
            </div>
            <ul className="space-y-2.5 border-t border-slate-100 pt-4 mt-2">
              {highlights.map((h) => (
                <li key={h} className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <Check size={10} strokeWidth={3} />
                  </span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'MiniShop ကို စတင်သုံးစွဲဖို့ ဘာတွေလိုအပ်လဲ။',
      a: 'ဖုန်းတစ်လုံးနဲ့ ဆိုင်အမည်၊ ပစ္စည်းအချက်အလက်များ ရှိရုံဖြင့် ၅ မိနစ်အတွင်း ဆိုင်စတင်ဖွင့်လှစ်နိုင်ပါသည်။ Code ရေးရန် သို့မဟုတ် Graphic Design သင်ရန် မလိုပါ။',
    },
    {
      q: 'TikTok Bio မှာ Link ထည့်ပြီး ဘယ်လိုရောင်းရမလဲ။',
      a: 'MiniShop မှ ရရှိလာသော ကိုယ့်ဆိုင် Link (ဥပမာ minishop.mm/s/your-store) ကို TikTok profile bio တွင် ထည့်ထားလိုက်ရုံဖြင့် ဝယ်သူများ TikTok WebView ထဲမှ တိုက်ရိုက် အော်ဒါတင်နိုင်မည်ဖြစ်သည်။',
    },
    {
      q: 'Customer တွေက အော်ဒါတင်ရင် ငွေဘယ်လိုချေရလဲ။',
      a: 'KPay၊ WavePay ငွေလွှဲပြေစာ (Payment Receipt Upload) စနစ်နှင့် COD (အိမ်ရောက်ငွေချေ) စနစ်များ ပါဝင်သောကြောင့် မြန်မာနိုင်ငံအတွက် အဆင်ပြေဆုံး ဖြစ်ပါသည်။',
    },
    {
      q: 'Free Trial စမ်းသုံးကြည့်လို့ ရပါသလား။',
      a: 'ရပါတယ်။ Free Trial ဖြင့် အခမဲ့ စမ်းသပ်သုံးစွဲနိုင်ပြီး အဆင်ပြေမှ မိမိဆိုင်နှင့် ကိုက်ညီသော Starter သို့မဟုတ် Pro Plan သို့ အချိန်မရွေး Upgrade လုပ်နိုင်ပါသည်။',
    },
    {
      q: 'Delivery ပို့ဆောင်ခ ဘယ်လိုတွက်ချက်လဲ။',
      a: 'တိုင်း/ပြည်နယ်နှင့် မြို့နယ်အလိုက် Delivery Fee များကို သီးသန့် သတ်မှတ်ထားနိုင်ပြီး Customer Checkout လုပ်ချိန်တွင် အလိုအလျောက် တွက်ချက်ပေးပါသည်။',
    },
  ];

  return (
    <section className="landing-steps-section py-16" aria-labelledby="faq-title">
      <div className="landing-section-head mb-10 text-center">
        <span className="landing-section-pill mb-2 inline-flex items-center gap-1.5">
          <HelpCircle size={15} /> FREQUENTLY ASKED QUESTIONS
        </span>
        <h2 id="faq-title" className="text-3xl font-extrabold text-slate-900 tracking-tight">
          မကြာခဏ မေးလေ့ရှိသော မေးခွန်းများ
        </h2>
        <p className="mt-2 text-base text-slate-600 max-w-xl mx-auto">
          MiniShop နှင့် ပတ်သက်၍ သိလိုသည်များကို အောက်တွင် ကြည့်ရှုနိုင်ပါသည်။
        </p>
      </div>

      <div className="max-w-3xl mx-auto divide-y divide-slate-200/80 rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={faq.q} className="transition-colors">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full flex items-center justify-between gap-4 p-5 text-left text-base font-bold text-slate-900 hover:bg-slate-50 transition-colors focus:outline-none"
                aria-expanded={isOpen}
              >
                <span>{faq.q}</span>
                <ChevronDown
                  size={20}
                  className={`shrink-0 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180 text-pink-600' : ''}`}
                />
              </button>
              {isOpen && (
                <div className="px-5 pb-5 text-sm text-slate-600 leading-relaxed font-normal bg-slate-50/50">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
