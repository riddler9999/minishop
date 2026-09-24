import {ImageOff, Minus, Plus, ShoppingBag, Trash2} from 'lucide-react';
import {Navigate} from 'react-router-dom';
import {useCart} from '@/features/cart/state';
import {useDemoStore} from '@/features/demo/DemoStoreContext';
import {ks} from '@/shared/lib/format';
import {ShopLink} from '@/features/tenancy/ShopLink';

export default function DemoCart() {
  const isDemo = useDemoStore();
  const {items, subtotal, setQty, remove} = useCart();
  if (!isDemo) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-[#fff1e6] px-4 pb-28 pt-5">
      <div className="mx-auto max-w-3xl">
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f05a00]">Your collection</p>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] text-[#25140b]">Shopping bag</h1>
        </div>
        {items.length === 0 ? (
          <div className="rounded-[28px] bg-[#fffaf5] px-6 py-14 text-center shadow-[0_18px_48px_rgba(151,63,10,0.12)]">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#ffe3c7] text-[#f05a00]"><ShoppingBag className="h-7 w-7" /></div>
            <p className="mt-4 text-sm text-[#80695b]">Your bag is waiting for a signature scent.</p>
            <ShopLink to="/products" className="mt-5 inline-flex min-h-12 items-center justify-center rounded-full bg-[#f05a00] px-6 py-3 text-sm font-bold text-white">Explore fragrances</ShopLink>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {items.map((it) => (
                <article key={it.id} className="flex gap-3 rounded-[24px] bg-[#fffaf5] p-3 shadow-[0_14px_36px_rgba(151,63,10,0.10)]">
                  <div className="h-24 w-20 shrink-0 overflow-hidden rounded-[18px] bg-[#ffd9b8]">
                    {it.image ? <img src={it.image} alt={it.name} className="h-full w-full object-contain p-1" /> : <div className="grid h-full w-full place-items-center text-[#f05a00]"><ImageOff className="h-5 w-5" /></div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div><h2 className="line-clamp-2 text-sm font-bold text-[#25140b]">{it.name}</h2><p className="mt-1 text-sm font-black text-[#8f2d00]">{ks(it.price)}</p></div>
                      <button onClick={() => remove(it.id)} aria-label="Remove item" className="grid h-10 w-10 place-items-center rounded-full text-[#80695b] hover:bg-[#ffe3c7] hover:text-[#f05a00]"><Trash2 className="h-4 w-4" /></button>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center rounded-[14px] border border-[#f3d5bd] bg-white">
                        <button onClick={() => setQty(it.id, it.qty - 1)} aria-label="Decrease quantity" className="grid h-10 w-10 place-items-center text-[#f05a00]"><Minus className="h-4 w-4" /></button>
                        <span className="w-8 text-center text-sm font-bold text-[#25140b]">{it.qty}</span>
                        <button onClick={() => setQty(it.id, it.qty + 1)} aria-label="Increase quantity" className="grid h-10 w-10 place-items-center text-[#f05a00]"><Plus className="h-4 w-4" /></button>
                      </div>
                      <span className="text-sm font-black text-[#25140b]">{ks(it.price * it.qty)}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-5 rounded-[28px] bg-[#fffaf5] p-5 shadow-[0_18px_48px_rgba(151,63,10,0.12)]">
              <div className="flex items-center justify-between"><span className="text-sm font-semibold text-[#80695b]">Subtotal</span><span className="text-xl font-black text-[#25140b]">{ks(subtotal)}</span></div>
              <ShopLink to="/checkout" className="mt-4 flex min-h-13 w-full items-center justify-center rounded-[18px] bg-[#f05a00] px-6 py-3 font-bold text-white shadow-[0_12px_28px_rgba(240,90,0,0.28)]">Continue to checkout</ShopLink>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
