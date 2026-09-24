import {useState} from 'react';
import {useLocation, useParams} from 'react-router-dom';
import {CheckCircle2, Package, Search} from 'lucide-react';
import type {OrderResult} from '@/domain/order';
import {ks} from '@/shared/lib/format';
import {ShopLink} from '@/features/tenancy/ShopLink';

interface SuccessState {
  result?: OrderResult;
  method?: 'cod' | 'kpay' | 'wave';
  name?: string;
  phone?: string;
}

const METHOD_LABEL: Record<string, string> = {
  cod: 'Cash on Delivery — အိမ်ရောက် ငွေချေ',
  kpay: 'KBZPay',
  wave: 'WavePay',
};

export default function OrderSuccess() {
  const {orderId} = useParams();
  const {state} = useLocation();
  const s = (state as SuccessState) || {};
  const r = s.result;

  // Phone-number tracking helper right on the thank-you page.
  const [phone, setPhone] = useState(s.phone ?? '');

  // Tracking link needs BOTH phone and order number (live lookup_order requires
  // order_no; see OrderLookup). orderId always present on this route.
  const trackingQs = new URLSearchParams();
  if (phone.trim()) trackingQs.set('phone', phone.trim());
  if (orderId) trackingQs.set('orderNo', orderId);
  const trackingHref = `/orders${trackingQs.toString() ? `?${trackingQs.toString()}` : ''}`;

  return (
    <div className="commerce-page mx-auto max-w-xl px-4 py-14 text-center">
      <div className="commerce-success-icon mx-auto grid h-20 w-20 place-items-center rounded-full">
        <CheckCircle2 className="h-11 w-11" />
      </div>
      <h1 className="commerce-title my mt-5 font-display text-2xl font-bold">Order တင်ပြီးပါပြီ!</h1>
      <p className="commerce-muted my mt-2">
        {s.name ? `${s.name} ရေ — ` : ''}မှာယူမှုအတွက် ကျေးဇူးတင်ပါသည်။ ဆိုင်မှ အတည်ပြု၍ ပို့ဆောင်ပေးပါမည်။
      </p>

      <div className="commerce-order-card mt-6 p-5 text-left">
        <div className="flex items-center justify-between">
          <span className="commerce-muted my text-sm">Order နံပါတ်</span>
          <span className="commerce-price font-display text-lg font-bold tracking-wide">{orderId}</span>
        </div>
        {r && (
          <div className="commerce-divider my mt-4 space-y-2 border-t pt-4 text-sm">
            <div className="flex justify-between"><span className="commerce-muted">ပစ္စည်းဖိုး</span><span>{ks(r.itemTotal)}</span></div>
            <div className="flex justify-between"><span className="commerce-muted">ပို့ဆောင်ခ</span><span>{ks(r.deliveryFee)}</span></div>
            <div className="flex justify-between font-semibold"><span>စုစုပေါင်း</span><span className="commerce-price">{ks(r.grandTotal)}</span></div>
            <div className="commerce-note mt-2 flex justify-between px-3 py-2">
              <span className="commerce-muted">ငွေပေးချေမှု</span>
              <span className="commerce-price font-semibold">{METHOD_LABEL[r.paymentMethod] ?? r.paymentMethod}</span>
            </div>
            {r.paymentMethod === 'cod' ? (
              <div className="commerce-muted flex justify-between">
                <span>အိမ်ရောက်မှ ပေးရန်</span>
                <span className="font-semibold">{ks(r.grandTotal)}</span>
              </div>
            ) : (
              <div className="commerce-muted flex justify-between">
                <span>လွှဲပြီး ငွေ</span>
                <span className="font-semibold">{ks(r.amountNow)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Order tracking by phone number */}
      <div className="commerce-tracking-panel mt-6 p-5 text-left">
        <h2 className="commerce-heading flex items-center gap-2 font-display text-base font-bold">
          <Package className="h-5 w-5" /> Order ကို Tracking လုပ်ရန်
        </h2>
        <p className="commerce-muted my mt-1.5 text-sm">
          လူကြီးမင်း၏ Order ကို Tracking လုပ်လိုပါက အောက်တွင် <b className="commerce-price">ဖုန်းနံပါတ်</b> ထည့်ပြီး
          Tracking လုပ်နိုင်ပါသည်။
        </p>
        <form
          onSubmit={(e) => e.preventDefault()}
          className="mt-3 flex gap-2">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="09…"
            inputMode="tel"
            className="commerce-input my w-full px-5 py-3 text-sm outline-none"
          />
          <ShopLink
            to={trackingHref}
            className="commerce-primary inline-flex shrink-0 items-center gap-1.5 px-5 py-3 text-sm font-semibold">
            <Search className="h-4 w-4" /> Tracking
          </ShopLink>
        </form>
      </div>

      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <ShopLink to="/orders" className="commerce-secondary inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold">
          <Package className="h-4 w-4" /> Order စစ်ဆေးရန်
        </ShopLink>
        <ShopLink to="/products" className="commerce-primary px-6 py-3 font-semibold">
          ဆက်လက် ဈေးဝယ်ရန်
        </ShopLink>
      </div>
    </div>
  );
}
