import {Link} from 'react-router-dom';

const sellerBenefits = [
  'မိနစ်ပိုင်းအတွင်း ကိုယ့်ဆိုင်ဖန်တီးနိုင်မယ်',
  'ပစ္စည်း၊ စျေးနှုန်းနဲ့ Category တွေ စီမံနိုင်မယ်',
  'COD, KBZPay, WavePay နဲ့ Order လက်ခံနိုင်မယ်',
  'တိုးတက်လာတဲ့ Order တွေကို တစ်နေရာတည်းက စီမံနိုင်မယ်',
  'မြန်မာဘာသာ Customer Support',
];

export default function UseCases() {
  return (
    <section className="landing-owner-section" id="use">
      <div className="landing-owner-card">
        <span className="landing-owner-eyebrow">FOR MYANMAR ONLINE BUSINESS OWNERS</span>
        <h2>သင့်ရဲ့ အွန်လိုင်းစီးပွားရေးကို ပိုလွယ်ကူအောင်</h2>
        <p>
          TikTok, Telegram, Facebook ပေါ်က Customer တွေကို ကိုယ့် Online Shop တစ်ခုထဲ စုစည်းပြီး
          ပစ္စည်းတွေကြည့်၊ Order တင်နိုင်အောင် လုပ်ပေးပါ။
        </p>

        <ul>
          {sellerBenefits.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </div>

      <div className="landing-final-card">
        <span className="landing-owner-eyebrow">START TODAY</span>
        <h2>သင့်ရဲ့ Online Shop ကို အခုပဲ စတင်ပါ</h2>
        <p>Social Media မှာ ရောင်းနေရတဲ့လုပ်ငန်းကို MiniShop နဲ့ စနစ်တကျပြောင်းလိုက်ပါ။</p>
        <Link className="landing-primary-cta" to="/admin/onboarding">
          အခုပဲ စတင်မယ် <span aria-hidden="true">→</span>
        </Link>
        <div className="landing-seller-illustration" aria-hidden="true">
          <span>👩🏻‍💻</span>
        </div>
      </div>
    </section>
  );
}
