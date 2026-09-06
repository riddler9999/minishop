import {ImageOff, ShoppingBag} from 'lucide-react';
import type {Product} from '../lib/store';
import {useCart} from '../lib/cart';
import {ks} from '../lib/format';
import {ShopLink, useShopNavigate} from './ShopLink';

export default function ProductCard({product}: {product: Product}) {
  const {add} = useCart();
  const nav = useShopNavigate();
  const price = product.isPromotion && product.promoPrice ? product.promoPrice : product.price;
  const hasPromo = product.isPromotion && product.promoPrice != null;
  const off = hasPromo ? Math.round((1 - price / product.price) * 100) : 0;
  const to = `/products/${encodeURIComponent(product.id)}`;

  const buyNow = () => {
    add(product);
    nav('/checkout');
  };

  return (
    <div className="card-lift group flex flex-col overflow-hidden rounded-2xl border border-cream-200 bg-white">
      <ShopLink to={to} className="relative block aspect-4/5 overflow-hidden bg-cream-100">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-ink-soft">
            <ImageOff className="h-8 w-8" />
          </div>
        )}
        {hasPromo && off > 0 && (
          <span className="absolute left-2 top-2 rounded-full bg-brand-600 px-2.5 py-1 text-[11px] font-bold text-white">
            -{off}%
          </span>
        )}
        {!product.inStock && (
          <span className="absolute right-2 top-2 rounded-full bg-ink/80 px-2.5 py-1 text-[11px] font-semibold text-white">
            ကုန်သွားပြီ
          </span>
        )}
      </ShopLink>

      <div className="flex flex-1 flex-col p-3">
        {product.category && <p className="text-[11px] font-medium text-ink-soft">{product.category}</p>}
        <ShopLink to={to} className="my mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-ink hover:text-brand-700">
          {product.name}
        </ShopLink>
        <div className="mt-1.5 flex items-center gap-2">
          <span className="font-display text-base font-bold text-brand-700">{ks(price)}</span>
          {hasPromo && <span className="text-xs text-ink-soft line-through">{ks(product.price)}</span>}
        </div>

        {/* Shopify-style dual action */}
        <div className="mt-3 flex flex-col gap-2">
          <button
            disabled={!product.inStock}
            onClick={() => add(product)}
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-brand-700 px-3 py-2 text-xs font-bold text-brand-700 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:border-cream-200 disabled:text-ink-soft">
            <ShoppingBag className="h-3.5 w-3.5" /> ဈေးခြင်းထဲ ထည့်မည်
          </button>
          <button
            disabled={!product.inStock}
            onClick={buyNow}
            className="rounded-full bg-brand-700 px-3 py-2 text-xs font-bold text-cream-100 transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:bg-cream-200 disabled:text-ink-soft">
            ယခု ဝယ်မည်
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-cream-200 bg-white">
      <div className="aspect-4/5 animate-pulse bg-cream-100" />
      <div className="space-y-2 p-3">
        <div className="h-3 w-1/2 animate-pulse rounded bg-cream-100" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-cream-100" />
        <div className="h-5 w-1/3 animate-pulse rounded bg-cream-100" />
        <div className="h-8 w-full animate-pulse rounded-full bg-cream-100" />
        <div className="h-8 w-full animate-pulse rounded-full bg-cream-100" />
      </div>
    </div>
  );
}
