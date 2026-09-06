import {ImageOff, Minus, Plus, ShoppingBag, Trash2} from 'lucide-react';
import {useCart} from '../lib/cart';
import {ks} from '../lib/format';
import {ShopLink, useShopNavigate} from '../components/ShopLink';

export default function Cart() {
  const {items, subtotal, setQty, remove} = useCart();
  const nav = useShopNavigate();

  if (!items.length) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-cream-100 text-brand-700">
          <ShoppingBag className="h-7 w-7" />
        </div>
        <h1 className="my mt-4 font-display text-2xl font-bold text-brand-800">ခြင်း ဗလာဖြစ်နေပါသည်</h1>
        <p className="my mt-2 text-ink-soft">ကြိုက်နှစ်သက်ရာ ပစ္စည်းများ ရွေးချယ်ပါ။</p>
        <ShopLink to="/products" className="mt-6 inline-block rounded-full bg-brand-700 px-6 py-3 font-semibold text-cream-100 hover:bg-brand-800">
          ဈေးဝယ်မယ်
        </ShopLink>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 font-display text-2xl font-bold text-brand-800">စျေးဝယ်ခြင်း</h1>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {items.map((it) => (
            <div key={it.id} className="flex gap-3 rounded-2xl border border-cream-200 bg-white p-3">
              <div className="h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-cream-100">
                {it.image ? (
                  <img src={it.image} alt={it.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center text-ink-soft"><ImageOff className="h-6 w-6" /></div>
                )}
              </div>
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <p className="my line-clamp-2 text-sm font-semibold text-ink">{it.name}</p>
                  <button onClick={() => remove(it.id)} aria-label="ဖျက်ရန်" className="text-ink-soft hover:text-brand-700">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <span className="mt-1 text-sm font-bold text-brand-700">{ks(it.price)}</span>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center rounded-full border border-cream-200">
                    <button onClick={() => setQty(it.id, it.qty - 1)} className="grid h-8 w-8 place-items-center text-brand-700"><Minus className="h-3.5 w-3.5" /></button>
                    <span className="w-7 text-center text-sm font-semibold">{it.qty}</span>
                    <button onClick={() => setQty(it.id, it.qty + 1)} className="grid h-8 w-8 place-items-center text-brand-700"><Plus className="h-3.5 w-3.5" /></button>
                  </div>
                  <span className="text-sm font-semibold text-ink">{ks(it.price * it.qty)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="h-fit rounded-2xl border border-cream-200 bg-white p-5 lg:sticky lg:top-20">
          <h2 className="font-display text-lg font-bold text-brand-800">အကျဉ်းချုပ်</h2>
          <div className="my mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-ink-soft">ပစ္စည်းဖိုး</span><span className="font-semibold">{ks(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-ink-soft">ပို့ဆောင်ခ</span><span className="text-ink-soft">Checkout တွင် တွက်ပါမည်</span></div>
          </div>
          <div className="my mt-4 flex justify-between border-t border-cream-200 pt-4">
            <span className="font-semibold">ခန့်မှန်း စုစုပေါင်း</span>
            <span className="font-display text-lg font-bold text-brand-700">{ks(subtotal)}</span>
          </div>
          <button
            onClick={() => nav('/checkout')}
            className="mt-5 w-full rounded-full bg-brand-700 px-6 py-3 font-semibold text-cream-100 transition hover:bg-brand-800">
            Order တင်မယ်
          </button>
          <ShopLink to="/products" className="my mt-3 block text-center text-sm font-semibold text-brand-700">
            ဆက်လက် ဈေးဝယ်ရန်
          </ShopLink>
        </div>
      </div>
    </div>
  );
}
