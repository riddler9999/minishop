import {ArrowRight, Check, ExternalLink, Sparkles} from 'lucide-react';
import {Link} from 'react-router-dom';

const proofItems = ['ပစ္စည်းတွေကို တစ်နေရာတည်းမှာ ပြနိုင်', 'ဝယ်သူကိုယ်တိုင် Order တင်နိုင်', 'Product အကြောင်းပြည့်ပြည့်စုံစုံ ပြနိုင်'];

export default function HeroSection() {
  return (
    <section className="landing-hero" aria-labelledby="landing-title">
      <div className="landing-topbar">
        <Link className="landing-wordmark" to="/" aria-label="MiniShop homepage">
          <span className="landing-wordmark-mark" aria-hidden="true">m</span>
          <span className="landing-wordmark-text"><strong>Mini</strong><b>Shop</b><em>MM</em></span>
        </Link>
        <div className="landing-topbar-actions">
          <Link className="landing-text-link" to="/demo">Demo Store</Link>
          <Link className="landing-topbar-cta" to="/admin/login?mode=signup&from=%2Fadmin%2Fsubscribe">အခမဲ့ အခုပဲ ဆိုင်ဖွင့်မယ် <ArrowRight size={16} aria-hidden="true"/></Link>
        </div>
      </div>

      <div className="landing-hero-copy">
        <span className="landing-pill"><Sparkles size={16} aria-hidden="true"/> အွန်လိုင်းရောင်းသူတွေအတွက် သီးသန့်</span>
        <h1 id="landing-title">ဝယ်ဖို့ဆိုတာ မြင်အောင်ပြပေးနိုင်မှ ဝယ်တာပါ</h1>
        <p className="landing-hero-lede">
          တစ်ခုဝယ်ဖို့လာတဲ့သူက တခြားပစ္စည်းတွေပါမြင်ရင် နှစ်ခုဝယ်သွားနိုင်တယ်။
        </p>
        <div className="landing-hero-points">
          <p><strong>ဝယ်မယ်ဆိုရင်တောင် ဝယ်လို့လွယ်အောင်လုပ်ထားဖို့လိုသေးတယ်</strong><span>ဝယ်ယူနည်းလိုက်ပြပေးစရာမလိုတဲ့အထိ ကိုယ်တိုင်အလွယ်တကူ အော်ဒါတင်နိုင်ရမယ်။</span></p>
          <p><strong>မေးစရာမလိုအောင်လည်း ပြည့်စုံဖို့လိုတယ်</strong><span>ပစ္စည်းတစ်ခုချင်းစီအကြောင်းကို ဝယ်သူက ထပ်မေးစရာမလိုတဲ့အထိ ပြည့်ပြည့်စုံစုံပြထားနိုင်ရမယ်။</span></p>
        </div>
        <div className="landing-hero-buttons">
          <Link className="landing-primary-cta" to="/admin/login?mode=signup&from=%2Fadmin%2Fsubscribe">အခမဲ့ အခုပဲ ဆိုင်ဖွင့်မယ် <ArrowRight size={18} aria-hidden="true"/></Link>
          <Link className="landing-demo-cta" to="/demo">Demo ဆိုင်ကို အရင်ကြည့်မယ် <ExternalLink size={17} aria-hidden="true"/></Link>
        </div>
        <div className="landing-proof-row" aria-label="MiniShop setup benefits">
          {proofItems.map((item) => <span key={item}><Check size={15} aria-hidden="true"/>{item}</span>)}
        </div>
      </div>

      <div className="landing-hero-visual" aria-label="MiniShop buyer journey animation">
        <div className="landing-store-animation" role="img" aria-label="ပစ္စည်းကြည့်ပြီး အော်ဒါတင်တဲ့ buyer journey">
          <div className="landing-store-browser">
            <div className="landing-store-browser-bar"><span/><span/><span/></div>
            <div className="landing-store-grid">
              <article><div/><strong>Product 01</strong><small>25,000 Ks</small></article>
              <article><div/><strong>Product 02</strong><small>32,000 Ks</small></article>
              <article><div/><strong>Product 03</strong><small>18,000 Ks</small></article>
              <article><div/><strong>Product 04</strong><small>41,000 Ks</small></article>
            </div>
          </div>
          <div className="landing-animation-cursor" aria-hidden="true"/>
          <div className="landing-animation-cart" aria-hidden="true"><span className="landing-cart-mark">m</span><span>2</span></div>
          <div className="landing-animation-order">Order တင်ပြီး ✓</div>
        </div>
      </div>
    </section>
  );
}
