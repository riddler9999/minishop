import {ArrowRight, Check, Clock3, ExternalLink, ShoppingBag, Smartphone, Sparkles} from 'lucide-react';
import {Link} from 'react-router-dom';

const PHONE_ASSET = '/minishop-storefront.webp';

const proofItems = ['၂ မိနစ်နဲ့ ဆိုင်စရောင်းနိုင်', 'IT ပညာ လုံးဝမလို', 'ဖုန်းတစ်လုံးတည်းနဲ့ အကုန်ပြီး'];

export default function HeroSection() {
  return (
    <section className="landing-hero" aria-labelledby="landing-title">
      <div className="landing-topbar">
        <Link className="landing-wordmark" to="/" aria-label="MiniShop homepage">
          <span className="landing-wordmark-mark" aria-hidden="true"><ShoppingBag size={20} strokeWidth={2.2}/></span>
          <span>MiniShop</span>
        </Link>
        <div className="landing-topbar-actions">
          <Link className="landing-text-link" to="/demo">Demo Store</Link>
          <Link className="landing-topbar-cta" to="/admin/login?mode=signup&from=%2Fadmin%2Fsubscribe">အခမဲ့ အခုပဲ ဆိုင်ဖွင့်မယ် <ArrowRight size={16} aria-hidden="true"/></Link>
        </div>
      </div>

      <div className="landing-hero-copy">
        <span className="landing-pill"><Sparkles size={16} aria-hidden="true"/> အွန်လိုင်းရောင်းသူတွေအတွက် သီးသန့်</span>
        <h1 id="landing-title">Chat ထဲမှာ တစ်ယောက်ချင်း ဈေးရောင်းရတာ ပင်ပန်းနေပြီလား?<br/><span>ကိုယ့် Store Link လေး ချထားရုံနဲ့ Order တွေ အလိုအလျောက် ဝင်လာမယ်</span></h1>
        <p className="landing-hero-lede">
          ဈေးဘယ်လောက်လဲ၊ ပစ္စည်းရှိသေးလား ခဏခဏ ဖြေမနေပါနဲ့တော့။ ပစ္စည်းတင်၊ Link ယူပြီး Bio ထဲ ထည့်ထားလိုက်ရုံနဲ့ ဝယ်သူက စိတ်ကြိုက်ရွေးပြီး အော်ဒါ တန်းတင်သွားလိမ့်မယ်။
        </p>
        <div className="landing-hero-buttons">
          <Link className="landing-primary-cta" to="/admin/login?mode=signup&from=%2Fadmin%2Fsubscribe">အခမဲ့ အခုပဲ ဆိုင်ဖွင့်မယ် <ArrowRight size={18} aria-hidden="true"/></Link>
          <Link className="landing-demo-cta" to="/demo">Demo ဆိုင်ကို အရင်ကြည့်မယ် <ExternalLink size={17} aria-hidden="true"/></Link>
        </div>
        <div className="landing-proof-row" aria-label="MiniShop setup benefits">
          {proofItems.map((item) => <span key={item}><Check size={15} aria-hidden="true"/>{item}</span>)}
        </div>
      </div>

      <div className="landing-hero-visual" aria-label="MiniShop storefront preview">
        <div className="landing-phone-shell">
          <img className="landing-phone-image" src={PHONE_ASSET} alt="MiniShop mobile storefront preview"/>
        </div>
        <div className="landing-floating-card landing-floating-card-top">
          <span className="landing-floating-icon"><Clock3 size={18} aria-hidden="true"/></span>
          <span><strong>မြန်မြန်စတင်နိုင်</strong><small>လွယ်ကူတဲ့ setup</small></span>
        </div>
        <div className="landing-floating-card landing-floating-card-bottom">
          <span className="landing-floating-icon"><Smartphone size={18} aria-hidden="true"/></span>
          <span><strong>Mobile-first</strong><small>Buyer experience</small></span>
        </div>
      </div>
    </section>
  );
}
