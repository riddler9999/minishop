import {ArrowRight, Check, ExternalLink, Heart, Search, SlidersHorizontal, Sparkles} from 'lucide-react';
import {Link} from 'react-router-dom';

const proofItems = ['ပစ္စည်းတွေကို တစ်နေရာတည်းမှာ ပြနိုင်', 'ဝယ်သူကိုယ်တိုင် Order တင်နိုင်', 'Product အကြောင်းပြည့်ပြည့်စုံစုံ ပြနိုင်'];
const demoProducts = [
  {name: 'Classic White Shirt', price: '17,500 Ks', tone: 'white', discount: '-20%'},
  {name: 'Floral Blouse', price: '19,500 Ks', tone: 'floral'},
  {name: 'Everyday Tee', price: '15,900 Ks', tone: 'pink', discount: '-26%'},
  {name: 'Lavender Tee', price: '16,500 Ks', tone: 'lavender', discount: '-21%'},
];

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
        <p className="landing-hero-lede">တစ်ခုဝယ်ဖို့လာတဲ့သူက တခြားပစ္စည်းတွေပါမြင်ရင် နှစ်ခုဝယ်သွားနိုင်တယ်။</p>
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

      <div className="landing-hero-visual" aria-label="MiniShop demo storefront animation">
        <div className="landing-demo-device" role="img" aria-label="MiniShop demo home page mobile mockup">
          <div className="landing-demo-screen">
            <div className="landing-demo-search"><Search size={16}/><span>Search</span><b>M</b></div>
            <div className="landing-demo-banner"><small>BANNER</small><strong>Featured campaign<br/>area</strong><span>Promotion, collection or seasonal artwork</span><Sparkles size={26}/></div>
            <div className="landing-demo-arrivals">
              <div className="landing-demo-title"><strong>New<br/>arrivals</strong><SlidersHorizontal size={20}/></div>
              <div className="landing-demo-categories"><b>All</b><span>အကျီ</span><span>ဂါဝန်</span><span>စကတ် & ဘောင်းဘီ</span></div>
              <div className="landing-demo-products">
                {demoProducts.map((product, index) => (
                  <article key={product.name} className={`landing-demo-product landing-demo-product-${product.tone}`}>
                    <div className="landing-demo-product-image">
                      {product.discount && <small>{product.discount}</small>}
                      <Heart size={14}/><span className="landing-demo-shirt"/>
                    </div>
                    <strong>{product.name}</strong><b>{product.price}</b>
                    {index === 0 && <i>22,000 Ks</i>}
                  </article>
                ))}
              </div>
            </div>
            <div className="landing-demo-nav"><span>⌂<small>Home</small></span><span>▦<small>Category</small></span><span>▢<small>Cart</small></span></div>
          </div>
          <div className="landing-demo-pointer" aria-hidden="true"/>
        </div>
      </div>
    </section>
  );
}
