import {Check, CreditCard, Link2, PackageCheck} from 'lucide-react';

const featureItems = [
  {icon: Link2, title: 'Link တစ်ခုပဲ မျှဝေပါ', body: 'TikTok Bio, Telegram, Facebook မှာ MiniShop link ကို တိုက်ရိုက်ထည့်နိုင်တယ်။'},
  {icon: PackageCheck, title: 'ပစ္စည်းကို ရှင်းရှင်းပြ', body: 'ပုံ၊ ဈေးနှုန်း၊ Category တွေကို Customer ကြည့်ရလွယ်အောင် စုစည်းပြနိုင်တယ်။'},
  {icon: CreditCard, title: 'Order ကို တန်းလက်ခံ', body: 'COD, KBZPay, WavePay နဲ့ Mobile ကနေ Order တင်နိုင်အောင်လုပ်ထားတယ်။'},
];

export default function HowItWorks() {
  return (
    <section className="landing-feature-stack" aria-label="MiniShop benefits">
      <article className="landing-feature-card landing-feature-card-accent">
        <div className="landing-feature-copy">
          <span className="landing-section-pill">SOCIAL → STORE</span>
          <h2>Social Media မှာမြင်ပြီး<br/>Store ထဲမှာ Order တင်စေပါ</h2>
          <p>Post တစ်ခုချင်းစီမှာ Messenger ကိုလာမေးခိုင်းမယ့်အစား Customer ကို ပစ္စည်းကြည့်လို့ရတဲ့ Store တစ်ခုဆီ တိုက်ရိုက်ပို့ပါ။</p>
          <ul>
            <li><Check size={17} aria-hidden="true"/> TikTok / Telegram / Facebook link sharing</li>
            <li><Check size={17} aria-hidden="true"/> Mobile-first product browsing</li>
            <li><Check size={17} aria-hidden="true"/> Checkout flow တစ်ခုတည်း</li>
          </ul>
        </div>
        <div className="landing-mini-flow" aria-hidden="true">
          <div className="landing-flow-node">TikTok</div>
          <span>→</span>
          <div className="landing-flow-node landing-flow-node-primary">MiniShop</div>
          <span>→</span>
          <div className="landing-flow-node">Order</div>
        </div>
      </article>

      <div className="landing-feature-grid">
        {featureItems.map(({icon: Icon, title, body}) => (
          <article key={title} className="landing-small-feature">
            <span className="landing-benefit-icon" aria-hidden="true"><Icon size={22}/></span>
            <h3>{title}</h3>
            <p>{body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
