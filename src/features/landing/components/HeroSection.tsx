import {Link} from 'react-router-dom';

const PHONE_ASSET = '/minishop-storefront.webp';

function TikTokIcon(){return <svg viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="12" fill="#080808"/><path d="M28 12c1 4 3.5 6 7 7v5c-2.7-.1-5-1-7-2.4V31c0 5-3.6 8-8 8a8 8 0 1 1 0-16c.8 0 1.5.1 2.2.3V29a3 3 0 1 0 1.8 2.8V12h4Z" fill="#fff"/><path d="M26.5 12c.3 2.1 1.2 4.1 2.8 5.6" stroke="#25F4EE" strokeWidth="2.5"/><path d="M22 28.5a3 3 0 0 0-3.8 2.8" stroke="#FE2C55" strokeWidth="2.5"/></svg>}
function TelegramIcon(){return <svg viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="12" fill="#2AABEE"/><path d="M10 23.3 36.2 13c1.2-.5 2.2.3 1.8 2L33.5 36c-.3 1.5-1.2 1.9-2.4 1.2l-7-5.2-3.4 3.3c-.4.4-.7.7-1.4.7l.5-7.1 12.9-11.7c.6-.5-.1-.8-.9-.3L15.9 27l-6.8-2.2c-1.5-.5-1.5-1.5.9-2.5Z" fill="#fff"/></svg>}
function FacebookIcon(){return <svg viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="12" fill="#1877F2"/><path d="M27.4 39V25.3H32l.7-5.3h-5.3v-3.4c0-1.5.4-2.6 2.7-2.6H33V9.3a39 39 0 0 0-4.2-.2c-4.2 0-7.1 2.6-7.1 7.2V20H17v5.3h4.7V39h5.7Z" fill="#fff"/></svg>}

export default function HeroSection() {
  return (
    <section className="landing-hero" aria-labelledby="landing-title">
      <div className="landing-hero-copy">
        <div className="landing-brand-lockup">
          <div className="landing-brand-mark" aria-hidden="true">M</div>
          <div><div className="landing-brand-name">MiniShop</div><div className="landing-brand-subtitle">Simple · Sell · Grow</div></div>
        </div>
        <p className="landing-kicker">MYANMAR ONLINE BUSINESS အတွက်</p>
        <h1 id="landing-title">မမြင်ရတဲ့ပစ္စည်းကို<br/><span>Customer က ဝယ်လို့မရဘူး။</span></h1>
        <p className="landing-hero-lede">MiniShop နဲ့ သင့်ပစ္စည်းတွေကို Online Shop အဖြစ် လွယ်လွယ်ကူကူ ပြပြီး TikTok, Telegram နဲ့ Facebook က Customer တွေ Order တင်နိုင်အောင် လုပ်ပါ။</p>
        <div className="landing-hero-actions">
          <div className="landing-hero-buttons">
            <Link className="landing-primary-cta" to="/admin/onboarding">အခုပဲ စတင်မယ် <span aria-hidden="true">→</span></Link>
            <Link className="landing-demo-cta" to="/demo">Demo Store ကြည့်မယ်</Link>
          </div>
          <span className="landing-cta-note">အခမဲ့စတင်နိုင်သည် · Credit Card မလို</span>
        </div>
      </div>
      <div className="landing-hero-visual">
        <div className="landing-visual-halo" aria-hidden="true"/>
        <img className="landing-phone-image" src={PHONE_ASSET} alt="MiniShop mobile storefront mockup"/>
        <div className="landing-social-stack" aria-label="Supported social platforms">
          <span><TikTokIcon/></span><span><TelegramIcon/></span><span><FacebookIcon/></span>
        </div>
        <div className="landing-social-copy">Social Media က Customer တွေကို<br/>သင့်ဆိုင်ထဲ ခေါ်လာပါ။</div>
      </div>
    </section>
  );
}
