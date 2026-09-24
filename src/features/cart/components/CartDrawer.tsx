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
        className={`commerce-drawer fixed inset-x-0 bottom-0 z-50 flex max-h-[86dvh] w-full flex-col rounded-t-[28px] transition-transform duration-300 ease-out sm:inset-y-0 sm:left-auto sm:right-0 sm:h-full sm:max-h-none sm:w-[90%] sm:max-w-md sm:rounded-none ${
          drawerOpen ? 'translate-y-0 sm:translate-x-0' : 'translate-y-full sm:translate-y-0 sm:translate-x-full'
        }`}
        aria-hidden={!drawerOpen}>
        <header className="commerce-drawer-header flex items-center justify-between border-b px-5 py-4 pt-5">
          <h2 className="commerce-heading flex items-center gap-2 text-lg font-bold">
            <ShoppingBag className="h-5 w-5" /> ဈေးခြင်းတောင်း
            {count > 0 && <span className="commerce-badge px-2 py-0.5 text-xs font-bold">{count}</span>}
          </h2>
          <button onClick={closeDrawer} aria-label="ပိတ်ရန်" className="commerce-muted grid h-9 w-9 place-items-center rounded-full">
            <X className="h-5 w-5" />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="commerce-icon-well grid h-16 w-16 place-items-center rounded-full">
              <ShoppingBag className="h-7 w-7" />
            </div>
            <p className="commerce-muted my">ခြင်း ဗလာဖြစ်နေပါသည်</p>
            <button onClick={() => go('/products')} className="commerce-primary px-5 py-2.5 text-sm font-semibold">
              ဈေးဝယ်မယ်
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {items.map((it) => (
                <div key={it.id} className="commerce-cart-item flex gap-3 p-2.5">
                  <div className="commerce-thumb h-20 w-16 shrink-0 overflow-hidden">
                    {it.image ? (
                      <img src={it.image} alt={it.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-ink-soft"><ImageOff className="h-5 w-5" /></div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <p className="commerce-strong my line-clamp-2 text-sm font-semibold">{it.name}</p>
                      <button onClick={() => remove(it.id)} aria-label="ဖျက်ရန်" className="commerce-muted">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <span className="commerce-price mt-0.5 text-sm font-bold">{ks(it.price)}</span>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="commerce-qty flex items-center">
                        <button onClick={() => setQty(it.id, it.qty - 1)} className="commerce-accent grid h-8 w-8 place-items-center"><Minus className="h-3.5 w-3.5" /></button>
                        <span className="w-7 text-center text-sm font-semibold">{it.qty}</span>
                        <button onClick={() => setQty(it.id, it.qty + 1)} className={isDemo ? "grid h-8 w-8 place-items-center text-[#6d28d9]" : "grid h-8 w-8 place-items-center text-[#e11d48]"}><Plus className="h-3.5 w-3.5" /></button>
                      </div>
                      <span className="commerce-strong text-sm font-semibold">{ks(it.price * it.qty)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <footer className="commerce-drawer-footer border-t px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="commerce-strong my font-semibold">စုစုပေါင်း</span>
                <span className="commerce-price text-xl font-bold">{ks(subtotal)}</span>
              </div>
              <button
                onClick={() => go('/checkout')}
                className="commerce-primary w-full min-h-12 px-6 py-3 font-bold transition">
                Order တင်မယ်
              </button>
              {isDemo && <button onClick={() => go('/cart')} className="commerce-secondary mt-2 w-full min-h-11 px-6 py-2.5 text-sm font-bold">View cart</button>}
            </footer>
          </>
        )}
      </aside>
    </>
  );
}
