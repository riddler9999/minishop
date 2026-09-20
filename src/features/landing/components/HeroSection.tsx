import {Link} from 'react-router-dom';
import ProductDiscoveryComparison from './ProductDiscoveryComparison';

export default function HeroSection() {
  return (
    <section className="hero">
      <div className="copy">
        <span className="eyebrow">Social Media ကနေ ကိုယ့် Online Shop အထိ</span>
        <h1>
          မမြင်ရတဲ့ပစ္စည်းကို
          <br />
          Customer က <em>ဝယ်လို့မရဘူး။</em>
        </h1>
        <p>Social Media မှာ Post တစ်ခု၊ Message တစ်ခုနဲ့ ကိုယ့်ဆိုင်မှာရှိတဲ့ ပစ္စည်းအားလုံးကို ပြဖို့မလွယ်ပါဘူး။</p>
        <p>
          <b>MiniShop နဲ့ ကိုယ့်ပစ္စည်းအားလုံးကို တစ်နေရာတည်းမှာ စုထားပြီး Customer ကို ကြည့်ခိုင်းလိုက်ပါ။</b>
        </p>
        <p>သူတို့လိုချင်တဲ့ပစ္စည်းတစ်ခုကို လာကြည့်ရင်း တခြားပစ္စည်းတွေကိုပါ ရှာတွေ့နိုင်မယ်။</p>

        <div className="promise">
          ပစ္စည်းတွေ ပိုမြင်ရလေလေ၊
          <br />
          <b>ဝယ်ဖို့အခွင့်အရေး ပိုများလေလေ။</b>
        </div>

        <div className="actions">
          <Link className="btn" to="/admin/onboarding">
            ကိုယ့်ဆိုင်ကို စဖွင့်မယ် →
          </Link>
          <Link className="btn ghost" to="/demo">
            Demo ကြည့်မယ်
          </Link>
        </div>
      </div>

      <ProductDiscoveryComparison />
    </section>
  );
}
