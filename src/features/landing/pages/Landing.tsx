import {Link} from 'react-router-dom';
import './landing.css';

const features = [
  ['ဆိုင်တည်ဆောက်ခြင်း', 'Product ပုံ၊ ဈေးနှုန်းနဲ့ အချက်အလက်တွေကို တစ်နေရာတည်းမှာ စနစ်တကျ ပြပါ။', '01'],
  ['Order ကောက်ခြင်း', 'Customer က Messenger ထဲမှာ မေးနေရတာမလိုဘဲ ဆိုင်ထဲကနေ တိုက်ရိုက် Order တင်နိုင်ပါတယ်။', '02'],
  ['ပို့ဆောင်ခတွက်ခြင်း', 'Region နဲ့ Township အလိုက် Delivery Service ရဲ့ ပို့ခကို Checkout မှာ ရှင်းရှင်းလင်းလင်း ပြပါ။', '03'],
  ['Social ကနေ ရောင်းခြင်း', 'TikTok, Facebook နဲ့ Telegram မှာ Shop link တစ်ခုတည်းမျှဝေပြီး Customer ကို ဆိုင်ထဲခေါ်ပါ။', '04'],
];

function StorePreview() {
  return (
    <div className="easy-preview" aria-label="MiniShop storefront preview">
      <div className="easy-preview-bar"><span/><span/><span/><b>minishop.mm/your-shop</b></div>
      <div className="easy-preview-body">
        <div className="easy-preview-head"><strong>သင့်ဆိုင်</strong><span>⌕　♡　🛒</span></div>
        <div className="easy-preview-banner"><small>NEW COLLECTION</small><strong>Customer မြင်တာနဲ့<br/>ဝယ်ချင်စေမယ့် ဆိုင်</strong><button type="button">Shop now</button></div>
        <div className="easy-preview-grid">
          <article><div className="easy-product p1"/><b>Everyday Tote</b><span>35,000 Ks</span></article>
          <article><div className="easy-product p2"/><b>Classic Tee</b><span>28,000 Ks</span></article>
          <article><div className="easy-product p3"/><b>Daily Sneakers</b><span>62,000 Ks</span></article>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <main className="landing">
      <header className="easy-nav">
        <Link className="easy-logo" to="/"><span>M</span> MiniShop</Link>
        <nav aria-label="Main navigation"><a href="#features">Features</a><a href="#how">ဘယ်လိုအလုပ်လုပ်လဲ</a><Link to="/demo">Demo Store</Link></nav>
        <div className="easy-nav-actions"><Link className="easy-login" to="/admin/login">ဝင်မယ်</Link><Link className="easy-nav-cta" to="/admin/onboarding">အခမဲ့စတင်မယ်</Link></div>
      </header>

      <section className="easy-hero">
        <div className="easy-hero-copy">
          <div className="easy-pill">MYANMAR ONLINE SELLERS အတွက်</div>
          <h1>Social Media က<br/>Customer တွေကို<br/><em>သင့် Online Shop ထဲ</em><br/>ခေါ်လာပါ။</h1>
          <p>Product ပုံတွေ Chat ထဲ တစ်ပုံချင်းပို့နေရတာ၊ ဈေးနှုန်းပြန်ဖြေနေရတာနဲ့ Order ကောက်နေရတာကို လျှော့ပါ။ MiniShop နဲ့ သင့်ဆိုင် link တစ်ခုတည်းကနေ Product ပြ၊ Order ကောက်၊ ပို့ခတွက်နိုင်ပါတယ်။</p>
          <div className="easy-actions"><Link className="easy-primary" to="/admin/onboarding">အခုပဲ စတင်မယ် <span>→</span></Link><Link className="easy-secondary" to="/demo">Demo Store ကြည့်မယ်</Link></div>
          <small>အခမဲ့စတင်နိုင်သည် · Credit Card မလို</small>
        </div>
        <div className="easy-hero-demo"><StorePreview/><div className="easy-order-pop"><i>✓</i><div><small>ORDER အသစ်</small><b>Order #MS-2048</b><span>62,000 Ks · Yangon</span></div></div></div>
      </section>

      <section className="easy-trust"><span>TikTok</span><span>Facebook</span><span>Telegram</span><span>KBZPay</span><span>WavePay</span><span>Cash on Delivery</span></section>

      <section className="easy-intro" id="features"><p>ဆိုင်တစ်ဆိုင်အတွက် လိုတာတွေကို ရှုပ်ရှုပ်ထွေးထွေးမလုပ်ဘဲ</p><h2>မြင်အောင်ပြ။ လွယ်လွယ်ဝယ်။<br/>Order ကို တစ်နေရာတည်းမှာ စီမံ။</h2></section>

      <section className="easy-features">
        {features.map(([title, text, no]) => <article key={no}><span>{no}</span><h3>{title}</h3><p>{text}</p></article>)}
      </section>

      <section className="easy-showcase" id="how">
        <div><span className="easy-label">CUSTOMER EXPERIENCE</span><h2>ပစ္စည်းရှာတာကနေ<br/>Order တင်တဲ့အထိ<br/>ဖုန်းထဲမှာပဲ ပြီးပါစေ။</h2><p>Mobile-first storefront, ရှင်းတဲ့ Checkout flow နဲ့ Myanmar online business အတွက် လိုအပ်တဲ့ payment နဲ့ delivery ရွေးချယ်မှုတွေကို တစ်ဆက်တည်းထားပါတယ်။</p><Link className="easy-text-link" to="/demo">Demo Store ကို စမ်းကြည့်မယ် →</Link></div>
        <StorePreview/>
      </section>

      <section className="easy-final">
        <span>သင့် Product တွေ ရောင်းဖို့ အဆင်သင့်ဖြစ်ပြီလား?</span>
        <h2>Online Shop တစ်ခုရဖို့<br/>မရှုပ်သင့်ဘူး။</h2>
        <p>MiniShop မှာ ဆိုင်ဖွင့်ပြီး link ကို Social Media မှာ မျှဝေလိုက်ပါ။</p>
        <Link className="easy-final-cta" to="/admin/onboarding">MiniShop နဲ့ စတင်မယ် →</Link>
      </section>

      <footer className="easy-footer"><Link className="easy-logo" to="/"><span>M</span> MiniShop</Link><p>Myanmar Online Business ကို ပိုလွယ်ကူအောင်။</p><small>© 2026 MiniShop MM</small></footer>
    </main>
  );
}
