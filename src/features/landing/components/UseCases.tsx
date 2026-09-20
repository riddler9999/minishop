import {Link} from 'react-router-dom';
import {landingProducts} from '../data';

export default function UseCases() {
  return (
    <section id="use" className="use">
      <div>
        <span className="eyebrow">ပစ္စည်းအမျိုးအစား မရွေး</span>
        <h2>
          သင့်ပစ္စည်းတွေကို
          <br />
          ပိုမြင်ရအောင် ပြလိုက်ပါ။
        </h2>
        <p>Fashion ကနေ Electronics၊ Beauty၊ Food နဲ့ Home products အထိ — Social Media ပေါ်မှာ ရောင်းနေတဲ့ ဆိုင်တိုင်းအတွက်။</p>
        <Link className="btn" to="/admin/onboarding">
          ကိုယ့်ဆိုင်ကို စဖွင့်မယ် →
        </Link>
      </div>

      <div className="catalog">
        {landingProducts.map((product) => (
          <div key={product.label}>
            <span>{product.icon}</span>
            <b>{product.burmeseLabel}</b>
          </div>
        ))}
      </div>
    </section>
  );
}
