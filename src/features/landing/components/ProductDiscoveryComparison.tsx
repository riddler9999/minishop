import {landingProducts} from '../data';

export default function ProductDiscoveryComparison() {
  return (
    <div className="compare">
      <div>
        <h3>Social Media မှာ</h3>
        <div className="phone chat">
          <small>Customer</small>
          <div className="bubble">ဒီပစ္စည်း ဈေးဘယ်လောက်လဲ?</div>
          <div className="single">
            👟
            <b>Sneakers</b>
            <span>MMK 45,000</span>
          </div>
          <div className="bubble muted">တခြားပစ္စည်းတွေရော?</div>
        </div>
        <p>ပစ္စည်းတစ်ခုချင်းစီပဲ မြင်ရတယ်</p>
      </div>

      <div className="arrow">→</div>

      <div>
        <h3>MiniShop နဲ့</h3>
        <div className="phone shop">
          <b>MiniShop</b>
          <div className="shopTitle">
            ပစ္စည်းအားလုံး
            <br />
            တစ်နေရာတည်းမှာ
          </div>
          <div className="product-grid">
            {landingProducts.map((product) => (
              <div key={product.label}>
                <span>{product.icon}</span>
                <small>{product.label}</small>
              </div>
            ))}
          </div>
        </div>
        <p>ကိုယ့်ဆိုင်တစ်ခုလုံးကို ကြည့်နိုင်တယ်</p>
      </div>
    </div>
  );
}
