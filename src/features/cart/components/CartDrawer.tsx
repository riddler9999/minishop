import {useEffect} from 'react';
import {useLocation} from 'react-router-dom';
import {ImageOff, Minus, Plus, ShoppingBag, Trash2, X} from 'lucide-react';
import {useCart} from '@/features/cart/state';
import {ks} from '@/shared/lib/format';
import {useShopNavigate} from '@/features/tenancy/ShopLink';
import {useDemoStore} from '@/features/demo/DemoStoreContext';

export default function CartDrawer() {
  const {items, subtotal, count, setQty, remove, drawerOpen, closeDrawer} = useCart();
  const nav = useShopNavigate();
  const {pathname} = useLocation();
  const isDemo = useDemoStore();

  // Close on navigation.
  useEffect(() => {
    closeDrawer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Lock body scroll + close on Escape while open.
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeDrawer();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [drawerOpen, closeDrawer]);

  const go = (to: string) => {
    closeDrawer();
    nav(to);
  };

  return (
    <>
      {/* Overlay — always mounted (only its classes toggle), so it must stay out of the tab
          order and hidden from assistive tech while the drawer is closed. */}
      <button
        type="button"
        aria-label="close"
        aria-hidden={!drawerOpen}
        tabIndex={drawerOpen ? 0 : -1}
        onClick={closeDrawer}
        className={`fixed inset-0 z-50 bg-slate-950/30 backdrop-blur-sm transition-opacity duration-300 ${
          drawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      {/* Panel */}
      <aside
        className={`fixed inset-x-0 bottom-0 z-50 flex max-h-[86dvh] w-full flex-col rounded-t-[28px] ${isDemo ? 'bg-[#fbf8ff] shadow-[0_-24px_70px_rgba(76,29,149,0.20)]' : 'bg-white shadow-[0_-24px_70px_rgba(15,23,42,0.18)]'} transition-transform duration-300 ease-out sm:inset-y-0 sm:left-auto sm:right-0 sm:h-full sm:max-h-none sm:w-[90%] sm:max-w-md sm:rounded-none ${
          drawerOpen ? 'translate-y-0 sm:translate-x-0' : 'translate-y-full sm:translate-y-0 sm:translate-x-full'
        }`}
        aria-hidden={!drawerOpen}>
        <header className={isDemo ? "flex items-center justify-between border-b border-[#e1d4f5] px-5 py-4 pt-5" : "flex items-center justify-between border-b border-rose-100 px-5 py-4 pt-5"}>
          <h2 className={isDemo ? "flex items-center gap-2 text-lg font-black text-[#21133f]" : "flex items-center gap-2 text-lg font-bold text-slate-950"}>
            <ShoppingBag className="h-5 w-5" /> ဈေးခြင်းတောင်း
            {count > 0 && <span className={isDemo ? "rounded-full bg-[#efe5ff] px-2 py-0.5 text-xs font-bold text-[#6d28d9]" : "rounded-full bg-rose-50 px-2 py-0.5 text-xs font-bold text-[#e11d48]"}>{count}</span>}
          </h2>
          <button onClick={closeDrawer} aria-label="ပိတ်ရန်" className={isDemo ? "grid h-9 w-9 place-items-center rounded-full text-[#76698a] hover:bg-[#efe5ff] hover:text-[#6d28d9]" : "grid h-9 w-9 place-items-center rounded-full text-slate-500 hover:bg-rose-50 hover:text-[#e11d48]"}>
            <X className="h-5 w-5" />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <div className={isDemo ? "grid h-16 w-16 place-items-center rounded-full bg-[#efe5ff] text-[#6d28d9]" : "grid h-16 w-16 place-items-center rounded-full bg-rose-50 text-[#e11d48]"}>
              <ShoppingBag className="h-7 w-7" />
            </div>
            <p className="my text-slate-500">ခြင်း ဗလာဖြစ်နေပါသည်</p>
            <button onClick={() => go('/products')} className={isDemo ? "rounded-full bg-[#6d28d9] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#5b21b6]" : "rounded-full bg-[#e11d48] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#be123c]"}>
              ဈေးဝယ်မယ်
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {items.map((it) => (
                <div key={it.id} className={isDemo ? "flex gap-3 rounded-[20px] bg-[#f4edff] p-2.5" : "flex gap-3 rounded-2xl bg-[#faf8f9] p-2.5"}>
                  <div className={isDemo ? "h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-[#dac6ff]" : "h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-rose-50"}>
                    {it.image ? (
                      <img src={it.image} alt={it.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-ink-soft"><ImageOff className="h-5 w-5" /></div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <p className="my line-clamp-2 text-sm font-semibold text-slate-950">{it.name}</p>
                      <button onClick={() => remove(it.id)} aria-label="ဖျက်ရန်" className={isDemo ? "text-[#8f82a2] hover:text-[#6d28d9]" : "text-slate-400 hover:text-[#e11d48]"}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <span className={isDemo ? "mt-0.5 text-sm font-bold text-[#3a1268]" : "mt-0.5 text-sm font-bold text-[#e11d48]"}>{ks(it.price)}</span>
                    <div className="mt-auto flex items-center justify-between">
                      <div className={isDemo ? "flex items-center rounded-xl border border-[#d9c8f2] bg-white" : "flex items-center rounded-xl border border-rose-100 bg-white"}>
                        <button onClick={() => setQty(it.id, it.qty - 1)} className={isDemo ? "grid h-8 w-8 place-items-center text-[#6d28d9]" : "grid h-8 w-8 place-items-center text-[#e11d48]"}><Minus className="h-3.5 w-3.5" /></button>
                        <span className="w-7 text-center text-sm font-semibold">{it.qty}</span>
                        <button onClick={() => setQty(it.id, it.qty + 1)} className={isDemo ? "grid h-8 w-8 place-items-center text-[#6d28d9]" : "grid h-8 w-8 place-items-center text-[#e11d48]"}><Plus className="h-3.5 w-3.5" /></button>
                      </div>
                      <span className="text-sm font-semibold text-slate-950">{ks(it.price * it.qty)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <footer className={isDemo ? "border-t border-[#e1d4f5] bg-[#fbf8ff] px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4" : "border-t border-rose-100 bg-white px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4"}>
              <div className="mb-3 flex items-center justify-between">
                <span className="my font-semibold text-slate-900">စုစုပေါင်း</span>
                <span className={isDemo ? "text-xl font-black text-[#21133f]" : "text-xl font-bold text-[#e11d48]"}>{ks(subtotal)}</span>
              </div>
              <button
                onClick={() => go('/checkout')}
                className={isDemo ? "w-full min-h-12 rounded-2xl bg-[#6d28d9] px-6 py-3 font-bold text-white shadow-[0_12px_28px_rgba(109,40,217,0.28)] transition hover:bg-[#5b21b6]" : "w-full min-h-12 rounded-2xl bg-[#e11d48] px-6 py-3 font-bold text-white transition hover:bg-[#be123c]"}>
                Order တင်မယ်
              </button>
              {isDemo && <button onClick={() => go('/cart')} className="mt-2 w-full min-h-11 rounded-2xl border border-[#d9c8f2] bg-white px-6 py-2.5 text-sm font-bold text-[#6d28d9]">View cart</button>}
            </footer>
          </>
        )}
      </aside>
    </>
  );
}
