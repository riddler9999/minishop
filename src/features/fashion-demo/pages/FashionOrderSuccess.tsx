import {useState} from 'react';
import {CheckCircle2, Package, Search} from 'lucide-react';
import {useLocation, useNavigate, useParams} from 'react-router-dom';
import type {OrderResult} from '@/domain/order';
import {ks} from '@/shared/lib/format';

interface SuccessState {
  result?: OrderResult;
  method?: 'cod' | 'kpay' | 'wave';
  name?: string;
  phone?: string;
}

export default function FashionOrderSuccess() {
  const {orderId} = useParams();
  const {state} = useLocation();
  const nav = useNavigate();
  const s = (state as SuccessState) || {};
  const r = s.result;
  const [phone, setPhone] = useState(s.phone ?? '');

  const track = () => {
    const qs = new URLSearchParams();
    if (phone.trim()) qs.set('phone', phone.trim());
    if (orderId) qs.set('orderNo', orderId);
    nav(`/fashion-demo/orders?${qs.toString()}`);
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-12 text-center sm:px-6">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#fff0f5] text-[#f43f70]"><CheckCircle2 className="h-10 w-10" /></div>
      <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#c92b59]">Order confirmed</p>
      <h1 className="my mt-1 font-display text-2xl font-black tracking-[-0.04em]">Order တင်ပြီးပါပြီ</h1>
      <p className="my mt-2 text-sm leading-6 text-slate-500">{s.name ? `${s.name} ရေ — ` : ''}မှာယူမှုအတွက် ကျေးဇူးတင်ပါတယ်။</p>

      <section className="mt-6 rounded-[20px] bg-white p-5 text-left shadow-[0_10px_28px_rgba(88,52,64,0.07)]">
        <div className="flex justify-between gap-4"><span className="my text-xs text-slate-500">Order နံပါတ်</span><span className="break-all text-right text-sm font-black text-[#f43f70]">{orderId}</span></div>
        {r && <div className="my mt-4 space-y-2 border-t border-[#f3e3e9] pt-4 text-sm"><div className="flex justify-between"><span className="text-slate-500">ပစ္စည်းဖိုး</span><span>{ks(r.itemTotal)}</span></div><div className="flex justify-between"><span className="text-slate-500">ပို့ဆောင်ခ</span><span>{ks(r.deliveryFee)}</span></div><div className="flex justify-between border-t border-[#f3e3e9] pt-2 font-bold"><span>စုစုပေါင်း</span><span className="text-[#f43f70]">{ks(r.grandTotal)}</span></div></div>}
      </section>

      <section className="mt-4 rounded-[20px] bg-[#fff4f8] p-5 text-left">
        <h2 className="flex items-center gap-2 text-sm font-bold"><Package className="h-4 w-4 text-[#f43f70]" /> Order tracking</h2>
        <p className="my mt-1 text-xs leading-5 text-slate-500">ဖုန်းနံပါတ်နဲ့ Order နံပါတ်နှစ်ခုလုံးလိုပါတယ်။</p>
        <div className="mt-3 flex gap-2"><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09…" inputMode="tel" className="my min-h-11 min-w-0 flex-1 rounded-full border border-[#f0dbe3] bg-white px-4 text-sm outline-none focus:border-[#f43f70]" /><button type="button" onClick={track} className="inline-flex min-h-11 items-center gap-1 rounded-full bg-[#f43f70] px-4 text-xs font-bold text-white"><Search className="h-4 w-4" /> Track</button></div>
      </section>

      <div className="mt-5 grid gap-2 sm:grid-cols-2"><button type="button" onClick={() => nav('/fashion-demo/orders')} className="min-h-12 rounded-[14px] border border-[#f43f70] bg-white text-sm font-bold text-[#e33565]">Order စစ်မယ်</button><button type="button" onClick={() => nav('/fashion-demo/products')} className="min-h-12 rounded-[14px] bg-[#f43f70] text-sm font-bold text-white">ဆက်လက် ဈေးဝယ်မယ်</button></div>
    </div>
  );
}
