import {createContext, useContext, useEffect, useMemo, useState, type ReactNode} from 'react';
import {useLocation} from 'react-router-dom';
import type {Product} from '@/domain/product';
import {getShopSlug} from '@/features/tenancy/shopContext';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string | null;
  qty: number;
  stock: number;
}

interface CartCtx {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (p: Product, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const Ctx = createContext<CartCtx | null>(null);

function storageKey(storageScope?: string): string {
  return `minishop_cart:${storageScope ?? getShopSlug() ?? 'demo'}`;
}

function loadByKey(key: string): CartItem[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({
  children,
  storageScope,
}: {
  children: ReactNode;
  storageScope?: string;
}) {
  const key = storageKey(storageScope);
  const [items, setItems] = useState<CartItem[]>(() => loadByKey(key));
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(items));
    } catch {
      /* ignore quota / private mode */
    }
  }, [items, key]);

  const value = useMemo<CartCtx>(() => {
    const unit = (p: Product) => (p.isPromotion && p.promoPrice ? p.promoPrice : p.price);
    return {
      items,
      count: items.reduce((s, i) => s + i.qty, 0),
      subtotal: items.reduce((s, i) => s + i.price * i.qty, 0),
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      add: (p, qty = 1) => {
        setDrawerOpen(true);
        setItems((prev) => {
          const found = prev.find((i) => i.id === p.id);
          const max = Math.max(p.stock, 1);
          if (found) {
            return prev.map((i) =>
              i.id === p.id ? {...i, qty: Math.min(i.qty + qty, max), stock: p.stock} : i,
            );
          }
          return [
            ...prev,
            {id: p.id, name: p.name, price: unit(p), image: p.image, qty: Math.min(qty, max), stock: p.stock},
          ];
        });
      },
      setQty: (id, qty) =>
        setItems((prev) =>
          prev
            .map((i) => (i.id === id ? {...i, qty: Math.max(1, Math.min(qty, Math.max(i.stock, 1)))} : i))
            .filter((i) => i.qty > 0),
        ),
      remove: (id) => setItems((prev) => prev.filter((i) => i.id !== id)),
      clear: () => setItems([]),
    };
  }, [items, drawerOpen]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart(): CartCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useCart must be used within CartProvider');
  return c;
}

export function routeCartScope(pathname: string): string {
  const live = pathname.match(/^\/s\/([^/]+)(?:\/|$)/);
  if (live) return decodeURIComponent(live[1]);
  if (pathname.startsWith('/fashion-demo')) return 'fashion-demo';
  if (pathname.startsWith('/furniture-demo')) return 'furniture-demo';
  if (pathname.startsWith('/mobile-store-demo')) return 'mobile-demo';
  return 'demo';
}

export function RouteScopedCartProvider({children}: {children: ReactNode}) {
  const {pathname} = useLocation();
  const scope = routeCartScope(pathname);
  return <CartProvider key={scope} storageScope={scope}>{children}</CartProvider>;
}
