import {ImageOff, Plus} from 'lucide-react';
import type {Product} from '@/domain/product';
import {useCart} from '@/features/cart/state';
import {cx, ks} from '@/shared/lib/format';
import {ShopLink, useShopNavigate} from '@/features/tenancy/ShopLink';

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
      <article className={cx('card-lift group relative h-full min-h-[220px] overflow-hidden rounded-2xl bg-[#f2e9de]', className)}>
        <ShopLink to={to} className="absolute inset-0 block">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-[#8b7d6d]">
              <ImageOff className="h-9 w-9" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1c1109]/85 via-[#1c1109]/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 pr-14 text-white">
            {product.category && <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[#e5c17d]">{product.category}</p>}
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug sm:text-base">{product.name}</h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="font-sans text-base font-bold sm:text-lg">{ks(price)}</span>
              {hasPromo && <span className="text-xs text-white/60 line-through">{ks(product.price)}</span>}
            </div>
          </div>
          {hasPromo && off > 0 && (
            <span className="absolute left-3 top-3 rounded-full bg-[#fffaf1] px-2.5 py-1 text-[10px] font-bold text-[#734d19] shadow-sm">
              -{off}%
            </span>
          )}
          {!product.inStock && (
            <span className="absolute right-3 top-3 rounded-full bg-[#1e140d]/80 px-2.5 py-1 text-[10px] font-semibold text-white">
              Sold out
            </span>
          )}
        </ShopLink>
        <button
          type="button"
          disabled={!product.inStock}
          onClick={quickAdd}
          aria-label={`Add ${product.name} to cart`}
          className="absolute bottom-3 right-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-[#fffaf1] text-[#5d3b16] shadow-lg transition hover:scale-105 hover:bg-white disabled:cursor-not-allowed disabled:bg-white/60 disabled:text-black/35">
          <Plus className="h-5 w-5" />
        </button>
      </article>
    );
  }

  const compact = variant === 'compact';

  return (
    <article
      className={cx(
        'card-lift group flex h-full flex-col overflow-hidden rounded-xl border border-[#e7dbc9] bg-[#fffdf9] shadow-[0_8px_28px_rgba(70,45,20,0.04)]',
        className,
      )}>
      <div className="relative">
        <ShopLink
          to={to}
          className={cx('relative block overflow-hidden bg-[#f2e9de]', compact ? 'aspect-square' : 'aspect-4/5')}>
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-[#8b7d6d]">
              <ImageOff className="h-8 w-8" />
            </div>
          )}
          {hasPromo && off > 0 && (
            <span className="absolute left-2 top-2 rounded-full bg-[#fffaf1] px-2.5 py-1 text-[10px] font-bold text-[#80561e] shadow-sm">
              -{off}%
            </span>
          )}
          {!product.inStock && (
            <span className="absolute right-2 top-2 rounded-full bg-[#24170e]/80 px-2.5 py-1 text-[10px] font-semibold text-white">
              Sold out
            </span>
          )}
        </ShopLink>
        <button
          type="button"
          disabled={!product.inStock}
          onClick={quickAdd}
          aria-label={`Add ${product.name} to cart`}
          className="absolute bottom-2 right-2 grid h-9 w-9 place-items-center rounded-full bg-[#2a1b11] text-white shadow-md transition hover:scale-105 hover:bg-[#8d6022] disabled:cursor-not-allowed disabled:bg-[#ded4c8] disabled:text-[#8d8278]">
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className={cx('flex flex-1 flex-col', compact ? 'p-3' : 'p-3.5')}>
        {!compact && product.category && (
          <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#9b6d2b]">{product.category}</p>
        )}
        <ShopLink
          to={to}
          className={cx(
            'line-clamp-2 font-medium leading-snug text-[#2a2018] transition hover:text-[#986620]',
            compact ? 'text-[13px]' : 'mt-1 text-sm',
          )}>
          {product.name}
        </ShopLink>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span className={cx('font-sans font-bold text-[#251a12]', compact ? 'text-sm' : 'text-base')}>{ks(price)}</span>
          {hasPromo && <span className="text-[11px] text-[#8f8377] line-through">{ks(product.price)}</span>}
        </div>

        {!compact && (
          <button
            disabled={!product.inStock}
            onClick={buyNow}
            className="mt-3 rounded-full border border-[#9c6b26] bg-[#9c6b26] px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-[#7e531b] disabled:cursor-not-allowed disabled:border-[#ded4c8] disabled:bg-[#ded4c8] disabled:text-[#8d8278]">
            Buy Now
          </button>
        )}
      </div>
    </article>
  );
}

export function ProductCardSkeleton({compact = false}: {compact?: boolean}) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#e7dbc9] bg-[#fffdf9]">
      <div className={cx(compact ? 'aspect-square' : 'aspect-4/5', 'animate-pulse bg-[#efe6da]')} />
      <div className="space-y-2 p-3">
        <div className="h-4 w-3/4 animate-pulse rounded bg-[#eee4d7]" />
        <div className="h-5 w-1/3 animate-pulse rounded bg-[#eee4d7]" />
        {!compact && <div className="mt-1 h-8 w-full animate-pulse rounded-full bg-[#eee4d7]" />}
      </div>
    </div>
  );
}
