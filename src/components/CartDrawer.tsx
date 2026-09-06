import {useEffect} from 'react';
import {useLocation} from 'react-router-dom';
import {ImageOff, Minus, Plus, ShoppingBag, Trash2, X} from 'lucide-react';
import {useCart} from '../lib/cart';
import {ks} from '../lib/format';
import {useShopNavigate} from './ShopLink';

export default function CartDrawer() {
  const {items, subtotal, count, setQty, remove, drawerOpen, closeDrawer} = useCart();
  const nav = useShopNavigate();
  const {pathname} = useLocation();

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
      {/* Overlay */}
      <div
        onClick={closeDrawer}
        className={`fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm transition-opacity duration-300 ${
          drawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      {/* Panel */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-[90%] max-w-md flex-col bg-cream-50 shadow-2xl transition-transform duration-300 ease-out ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-hidden={!drawerOpen}>
        <header className="flex items-center justify-between border-b border-cream-200 px-5 py-4">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-brand-800">
            <ShoppingBag className="h-5 w-5" /> စျေးဝယ်ခြင်း
            {count > 0 && <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-700">{count}</span>}
          </h2>
          <button onClick={closeDrawer} aria-label="ပိတ်ရန်" className="grid h-9 w-9 place-items-center rounded-full text-ink-soft hover:bg-cream-200">
            <X className="h-5 w-5" />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-cream-100 text-brand-700">
              <ShoppingBag className="h-7 w-7" />
            </div>
            <p className="my text-ink-soft">ခြင်း ဗလာဖြစ်နေပါသည်</p>
            <button onClick={() => go('/products')} className="rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-cream-100 hover:bg-brand-800">
              ဈေးဝယ်မယ်
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {items.map((it) => (
                <div key={it.id} className="flex gap-3 rounded-xl border border-cream-200 bg-white p-2.5">
                  <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-cream-100">
                    {it.image ? (
                      <img src={it.image} alt={it.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-ink-soft"><ImageOff className="h-5 w-5" /></div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <p className="my line-clamp-2 text-sm font-semibold text-ink">{it.name}</p>
                      <button onClick={() => remove(it.id)} aria-label="ဖျက်ရန်" className="text-ink-soft hover:text-brand-700">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <span className="mt-0.5 text-sm font-bold text-brand-700">{ks(it.price)}</span>
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

            <footer className="border-t border-cream-200 bg-cream-50 px-5 py-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="my font-semibold text-ink">စုစုပေါင်း</span>
                <span className="font-display text-xl font-bold text-brand-700">{ks(subtotal)}</span>
              </div>
              <p className="my mb-3 text-xs text-ink-soft">ပို့ဆောင်ခ Checkout တွင် တွက်ပါမည်။</p>
              <button
                onClick={() => go('/checkout')}
                className="mb-2 w-full rounded-full bg-brand-700 px-6 py-3 font-bold text-cream-100 transition hover:bg-brand-800">
                Order တင်မယ်
              </button>
              <button
                onClick={() => go('/cart')}
                className="w-full rounded-full border border-cream-200 bg-white px-6 py-2.5 text-sm font-semibold text-ink hover:bg-cream-100">
                စျေးခြင်း အပြည့်ကြည့်ရန်
              </button>
            </footer>
          </>
        )}
      </aside>
    </>
  );
}
