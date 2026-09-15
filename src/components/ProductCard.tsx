import {ImageOff, Plus} from 'lucide-react';
import type {Product} from '../lib/store';
import {useCart} from '../lib/cart';
import {cx, ks} from '../lib/format';
import {ShopLink, useShopNavigate} from './ShopLink';

type ProductCardVariant = 'default' | 'compact' | 'feature';

export default function ProductCard({
  product,
  variant = 'default',
  className,
}: {
  product: Product;
  variant?: ProductCardVariant;
  className?: string;
}) {
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

  const quickAdd = () => add(product);

  if (variant === 'feature') {
    return (
      <article className={cx('card-lift group relative h-full min-h-[220px] overflow-hidden rounded-3xl bg-cream-100', className)}>
        <ShopLink to={to} className="absolute inset-0 block">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-ink-soft">
              <ImageOff className="h-9 w-9" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 pr-14 text-white">
            {product.category && <p className="mb-1 text-[11px] font-medium text-white/75">{product.category}</p>}
            <h3 className="my line-clamp-2 text-sm font-semibold leading-snug sm:text-base">{product.name}</h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="font-display text-base font-bold sm:text-lg">{ks(price)}</span>
              {hasPromo && <span className="text-xs text-white/65 line-through">{ks(product.price)}</span>}
            </div>
          </div>
          {hasPromo && off > 0 && (
            <span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-black shadow-sm">
              -{off}%
            </span>
          )}
          {!product.inStock && (
            <span className="absolute right-3 top-3 rounded-full bg-black/75 px-2.5 py-1 text-[10px] font-semibold text-white">
              ကုန်သွားပြီ
            </span>
          )}
        </ShopLink>
        <button
          type="button"
          disabled={!product.inStock}
          onClick={quickAdd}
          aria-label="ဈေးခြင်းထဲ ထည့်မည်"
          className="absolute bottom-3 right-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-white text-black shadow-lg transition hover:scale-105 disabled:cursor-not-allowed disabled:bg-white/60 disabled:text-black/40">
          <Plus className="h-5 w-5" />
        </button>
      </article>
    );
  }

  const compact = variant === 'compact';

  return (
    <article
      className={cx(
        'card-lift group flex h-full flex-col overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_8px_30px_rgba(15,15,15,0.04)]',
        className,
      )}>
      <div className="relative">
        <ShopLink
          to={to}
          className={cx('relative block overflow-hidden bg-cream-100', compact ? 'aspect-[4/3]' : 'aspect-4/5')}>
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-ink-soft">
              <ImageOff className="h-8 w-8" />
            </div>
          )}
          {hasPromo && off > 0 && (
            <span className="absolute left-2 top-2 rounded-full bg-black px-2.5 py-1 text-[10px] font-bold text-white">
              -{off}%
            </span>
          )}
          {!product.inStock && (
            <span className="absolute right-2 top-2 rounded-full bg-black/75 px-2.5 py-1 text-[10px] font-semibold text-white">
              ကုန်သွားပြီ
            </span>
          )}
        </ShopLink>
        <button
          type="button"
          disabled={!product.inStock}
          onClick={quickAdd}
          aria-label="ဈေးခြင်းထဲ ထည့်မည်"
          className="absolute bottom-2 right-2 grid h-9 w-9 place-items-center rounded-full bg-black text-white shadow-md transition hover:scale-105 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500">
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className={cx('flex flex-1 flex-col', compact ? 'p-3' : 'p-3.5')}>
        {!compact && product.category && <p className="text-[11px] font-medium text-ink-soft">{product.category}</p>}
        <ShopLink
          to={to}
          className={cx(
            'my line-clamp-2 font-semibold leading-snug text-ink transition hover:text-brand-700',
            compact ? 'text-[13px]' : 'mt-0.5 text-sm',
          )}>
          {product.name}
        </ShopLink>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span className={cx('font-display font-bold text-ink', compact ? 'text-sm' : 'text-base')}>{ks(price)}</span>
          {hasPromo && <span className="text-[11px] text-ink-soft line-through">{ks(product.price)}</span>}
        </div>

        {!compact && (
          <button
            disabled={!product.inStock}
            onClick={buyNow}
            className="mt-3 rounded-full bg-black px-3 py-2.5 text-xs font-bold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500">
            ယခု ဝယ်မည်
          </button>
        )}
      </div>
    </article>
  );
}

export function ProductCardSkeleton({compact = false}: {compact?: boolean}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white">
      <div className={cx(compact ? 'aspect-[4/3]' : 'aspect-4/5', 'animate-pulse bg-cream-100')} />
      <div className="space-y-2 p-3">
        <div className="h-4 w-3/4 animate-pulse rounded bg-cream-100" />
        <div className="h-5 w-1/3 animate-pulse rounded bg-cream-100" />
        {!compact && <div className="mt-1 h-8 w-full animate-pulse rounded-full bg-cream-100" />}
      </div>
    </div>
  );
}
