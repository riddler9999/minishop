import {Link} from 'react-router-dom';

const platforms = [
  {name: 'TikTok', mark: '♪', tone: 'platform-tiktok'},
  {name: 'Telegram', mark: '➤', tone: 'platform-telegram'},
  {name: 'Facebook', mark: 'f', tone: 'platform-facebook'},
];

export default function HeroSection() {
  return (
    <section className="landing-hero" aria-labelledby="landing-title">
      <div className="landing-hero-copy">
        <div className="landing-brand-lockup">
          <span className="landing-brand-mark" aria-hidden="true">🛍️</span>
          <div>
            <div className="landing-brand-name">MiniShop</div>
            <div className="landing-brand-subtitle">Online Store for Myanmar</div>
          </div>
        </div>

        <h1 id="landing-title">
          မမြင်ရတဲ့ပစ္စည်းကို
          <br />
          <span>Customer က ဝယ်လို့မရဘူး။</span>
        </h1>

        <p className="landing-hero-lede">
          MiniShop နဲ့ သင့်ရဲ့ပစ္စည်းတွေကို TikTok, Telegram, Facebook မှာ Customer တွေ မြင်အောင်ပြပြီး
          အလွယ်တကူ Order တင်နိုင်အောင် ဆိုင်တစ်ဆိုင်ဖန်တီးလိုက်ပါ။
        </p>

        <div className="landing-hero-actions">
          <Link className="landing-primary-cta" to="/admin/onboarding">
            အခုပဲ စတင်မယ် <span aria-hidden="true">→</span>
          </Link>
          <span className="landing-cta-note">Credit Card မလို · အခမဲ့စတင်နိုင်သည်</span>
        </div>
      </div>

      <div className="landing-hero-visual" aria-label="MiniShop storefront preview">
        <div className="landing-social-stack" aria-hidden="true">
          {platforms.map((platform) => (
            <div className={`landing-platform ${platform.tone}`} key={platform.name}>
              <span>{platform.mark}</span>
              <small>{platform.name}</small>
            </div>
          ))}
        </div>

        <div className="landing-phone">
          <div className="landing-phone-speaker" />
          <div className="landing-phone-screen">
            <div className="landing-phone-storebar">
              <div>
                <strong>My Shop</strong>
                <small>Fashion & Lifestyle</small>
              </div>
              <span aria-hidden="true">⌕</span>
            </div>

            <div className="landing-phone-banner">
              <div>
                <small>New</small>
                <strong>Collection</strong>
                <span>For Your Everyday</span>
              </div>
              <div className="landing-dress" aria-hidden="true">👗</div>
            </div>

            <div className="landing-phone-categories" aria-hidden="true">
              <span>👚</span><span>👜</span><span>👟</span><span>💄</span>
            </div>

            <div className="landing-phone-grid">
              <article>
                <div className="landing-product-visual bag" aria-hidden="true">👜</div>
                <strong>K 45,000</strong>
              </article>
              <article>
                <div className="landing-product-visual dress" aria-hidden="true">👗</div>
                <strong>K 38,000</strong>
              </article>
            </div>
          </div>
        </div>

        <div className="landing-social-copy">Social Media က Customer တွေကို သင့်ဆိုင်ထဲ ခေါ်လာပါ။</div>
      </div>
    </section>
  );
}
