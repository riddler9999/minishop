import {Check, ArrowRight} from 'lucide-react';
import {Link} from 'react-router-dom';

const sellerBenefits = [
  'ပစ္စည်း၊ စျေးနှုန်းနဲ့ Category တွေ စီမံနိုင်မယ်',
  'COD, KBZPay, WavePay နဲ့ Order လက်ခံနိုင်မယ်',
  'Order တွေကို တစ်နေရာတည်းက စီမံနိုင်မယ်',
  'မြန်မာ Online Seller workflow အတွက်တည်ဆောက်ထားတယ်',
];

export default function UseCases() {
  return (
    <section className="landing-owner-section">
      <article className="landing-owner-card">
        <span className="landing-section-pill">FOR MYANMAR SELLERS</span>
        <h2>Store တစ်ခုဖွင့်ဖို့<br/>Developer မလိုပါဘူး</h2>
        <p>MiniShop က Social Media seller တွေအတွက် လိုအပ်တာကိုပဲ တိုက်ရိုက်ထားတယ် — ပစ္စည်းတင်၊ ပို့ခသတ်မှတ်၊ Order လက်ခံ၊ စီမံ။</p>
        <ul>{sellerBenefits.map((item) => <li key={item}><Check size={17} aria-hidden="true"/>{item}</li>)}</ul>
      </article>

      <article className="landing-final-card">
        <span className="landing-section-pill">START TODAY</span>
        <h2>သင့် Store Link ကို<br/>ဒီနေ့ပဲ စလုပ်ပါ</h2>
        <p>ပစ္စည်းတွေ ပိုရှင်းရှင်းပြ၊ Customer ကို Order တင်ရ ပိုလွယ်အောင်လုပ်ပါ။</p>
        <Link className="landing-primary-cta" to="/admin/onboarding">အခုပဲ စတင်မယ် <ArrowRight size={18} aria-hidden="true"/></Link>
        <span className="landing-final-note">အခမဲ့စတင်နိုင်သည် · Credit Card မလို</span>
      </article>
    </section>
  );
}
