import {useState} from 'react';
import {useLocation, useParams} from 'react-router-dom';
import {CheckCircle2, Package, Search} from 'lucide-react';
import type {OrderResult} from '../lib/store';
import {ks} from '../lib/format';
import {ShopLink} from '../components/ShopLink';

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
    <div className="mx-auto max-w-xl px-4 py-14 text-center">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-green-100 text-green-600">
        <CheckCircle2 className="h-11 w-11" />
      </div>
      <h1 className="my mt-5 font-display text-2xl font-bold text-brand-800">Order တင်ပြီးပါပြီ!</h1>
      <p className="my mt-2 text-ink-soft">
        {s.name ? `${s.name} ရေ — ` : ''}မှာယူမှုအတွက် ကျေးဇူးတင်ပါသည်။ ဆိုင်မှ အတည်ပြု၍ ပို့ဆောင်ပေးပါမည်။
      </p>

      <div className="mt-6 rounded-2xl border border-cream-200 bg-white p-5 text-left">
        <div className="flex items-center justify-between">
          <span className="my text-sm text-ink-soft">Order နံပါတ်</span>
          <span className="font-display text-lg font-bold tracking-wide text-brand-700">{orderId}</span>
        </div>
        {r && (
          <div className="my mt-4 space-y-2 border-t border-cream-200 pt-4 text-sm">
            <div className="flex justify-between"><span className="text-ink-soft">ပစ္စည်းဖိုး</span><span>{ks(r.itemTotal)}</span></div>
            <div className="flex justify-between"><span className="text-ink-soft">ပို့ဆောင်ခ</span><span>{ks(r.deliveryFee)}</span></div>
            <div className="flex justify-between font-semibold"><span>စုစုပေါင်း</span><span className="text-brand-700">{ks(r.grandTotal)}</span></div>
            <div className="mt-2 flex justify-between rounded-lg bg-cream-100 px-3 py-2">
              <span className="text-ink-soft">ငွေပေးချေမှု</span>
              <span className="font-semibold text-brand-700">{METHOD_LABEL[r.paymentMethod] ?? r.paymentMethod}</span>
            </div>
            {r.paymentMethod === 'cod' ? (
              <div className="flex justify-between text-ink-soft">
                <span>အိမ်ရောက်မှ ပေးရန်</span>
                <span className="font-semibold">{ks(r.grandTotal)}</span>
              </div>
            ) : (
              <div className="flex justify-between text-ink-soft">
                <span>လွှဲပြီး ငွေ</span>
                <span className="font-semibold">{ks(r.amountNow)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Order tracking by phone number */}
      <div className="mt-6 rounded-2xl border border-brand-200 bg-brand-50 p-5 text-left">
        <h2 className="flex items-center gap-2 font-display text-base font-bold text-brand-800">
          <Package className="h-5 w-5" /> Order ကို Tracking လုပ်ရန်
        </h2>
        <p className="my mt-1.5 text-sm text-ink-soft">
          လူကြီးမင်း၏ Order ကို Tracking လုပ်လိုပါက အောက်တွင် <b className="text-brand-700">ဖုန်းနံပါတ်</b> ထည့်ပြီး
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
            className="my w-full rounded-full border border-cream-200 bg-white px-5 py-3 text-sm outline-none focus:border-brand-400"
          />
          <ShopLink
            to={trackingHref}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-cream-100 hover:bg-brand-800">
            <Search className="h-4 w-4" /> Tracking
          </ShopLink>
        </form>
      </div>

      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <ShopLink to="/orders" className="inline-flex items-center justify-center gap-2 rounded-full border border-brand-700 px-6 py-3 font-semibold text-brand-700 hover:bg-cream-100">
          <Package className="h-4 w-4" /> Order စစ်ဆေးရန်
        </ShopLink>
        <ShopLink to="/products" className="rounded-full bg-brand-700 px-6 py-3 font-semibold text-cream-100 hover:bg-brand-800">
          ဆက်လက် ဈေးဝယ်ရန်
        </ShopLink>
      </div>
    </div>
  );
}
