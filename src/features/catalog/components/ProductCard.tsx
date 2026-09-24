import {Heart, ImageOff, ShoppingBag} from 'lucide-react';
import type {Product} from '@/domain/product';
import {useCart} from '@/features/cart/state';
import {cx, ks} from '@/shared/lib/format';
import {ShopLink, useShopNavigate} from '@/features/tenancy/ShopLink';

type ProductCardVariant = 'default' | 'compact' | 'feature';

export default function ProductCard({product, variant = 'default', className}: {product: Product; variant?: ProductCardVariant; className?: string}) {
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
          {product.image ? <img src={product.image} alt={product.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" /> : <div className="grid h-full w-full place-items-center text-[#8b7d6d]"><ImageOff className="h-9 w-9" /></div>}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1c1109]/85 via-[#1c1109]/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 text-white"><h3 className="font-display line-clamp-2 text-base font-semibold leading-snug">{product.name}</h3><span className="mt-1 block font-sans text-sm font-bold">{ks(price)}</span></div>
        </ShopLink>
      </article>
    );
  }

  const compact = variant === 'compact';

  if (compact) {
    return (
      <article className={cx('group min-w-0', className)}>
        <ShopLink to={to} className="relative block aspect-[0.86] overflow-hidden rounded-[16px] bg-[#f5f2f3]">
          {product.image ? (
            <img src={product.image} alt={product.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]" />
          ) : (
            <div className="grid h-full w-full place-items-center text-slate-400"><ImageOff className="h-7 w-7" /></div>
          )}
          {hasPromo && off > 0 && <span className="absolute left-1.5 top-1.5 rounded-full bg-[#ff3b72] px-2 py-1 text-[9px] font-extrabold text-white">-{off}%</span>}
          {!hasPromo && product.isPromotion && <span className="absolute left-1.5 top-1.5 rounded-full bg-[#ff3b72] px-2 py-1 text-[9px] font-extrabold text-white">New</span>}
          <span className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-white/95 text-slate-700 shadow-sm"><Heart className="h-4 w-4" /></span>
          {!product.inStock && <span className="absolute inset-x-2 bottom-2 rounded-full bg-slate-950/75 px-2 py-1 text-center text-[9px] font-semibold text-white">Sold out</span>}
        </ShopLink>

        <div className="pt-2">
          <ShopLink to={to} className="font-display line-clamp-1 text-[11px] font-semibold leading-snug text-slate-950 transition hover:text-[#e11d48] sm:text-sm">
            {product.name}
          </ShopLink>
          <div className="mt-1 flex min-w-0 items-end justify-between gap-1">
            <div className="min-w-0">
              <span className="block truncate font-sans text-[11px] font-extrabold text-[#e11d48] sm:text-sm">{ks(price)}</span>
              {hasPromo && <span className="block truncate text-[8px] text-slate-400 line-through sm:text-[10px]">{ks(product.price)}</span>}
            </div>
            <button
              type="button"
              disabled={!product.inStock}
              aria-label="ခြင်းထဲထည့်မည်"
              onClick={quickAdd}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#fff0f5] text-[#e11d48] transition hover:bg-[#ffe3ec] disabled:cursor-not-allowed disabled:text-slate-300">
              <ShoppingBag className="h-4 w-4" />
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className={cx('group flex h-full flex-col overflow-hidden rounded-[20px] border border-[#f3e5ea] bg-white shadow-[0_10px_28px_rgba(88,52,64,0.10)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(88,52,64,0.14)]', className)}>
      <ShopLink to={to} className="relative block aspect-4/5 overflow-hidden bg-[#f8eef2]">
        {product.image ? <img src={product.image} alt={product.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]" /> : <div className="grid h-full w-full place-items-center text-[#8b7d6d]"><ImageOff className="h-8 w-8" /></div>}
        {hasPromo && off > 0 && <span className="absolute left-2 top-2 rounded-full bg-[#fffaf1] px-2.5 py-1 text-[10px] font-bold text-[#80561e] shadow-sm">-{off}%</span>}
        {!product.inStock && <span className="absolute right-2 top-2 rounded-full bg-[#24170e]/80 px-2.5 py-1 text-[10px] font-semibold text-white">Sold out</span>}
      </ShopLink>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        {product.category && <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#9b6d2b]">{product.category}</p>}
        <ShopLink to={to} className="font-display mt-1 line-clamp-2 text-base font-semibold leading-snug text-[#2a2018] transition hover:text-[#be123c]">{product.name}</ShopLink>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="font-sans text-sm font-bold text-[#251a12]">{ks(price)}</span>
          {hasPromo && <span className="text-[11px] text-[#8f8377] line-through">{ks(product.price)}</span>}
        </div>
        <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
          <button type="button" disabled={!product.inStock} onClick={quickAdd} className="inline-flex min-h-10 items-center justify-center gap-1 rounded-xl border border-[#e11d48] bg-white px-2 py-2 text-[11px] font-semibold text-[#e11d48] transition hover:bg-[#fff0f6] disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400">
            <ShoppingBag className="h-3.5 w-3.5" /> ခြင်းထဲထည့်မည်
          </button>
          <button type="button" disabled={!product.inStock} onClick={buyNow} className="min-h-10 rounded-xl bg-[#e11d48] px-2 py-2 text-[11px] font-semibold text-white transition hover:bg-[#be123c] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400">ဝယ်မည်</button>
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton({compact = false}: {compact?: boolean}) {
  return <div className={cx(compact ? '' : 'overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-[0_10px_28px_rgba(88,52,64,0.08)]')}><div className={cx(compact ? 'aspect-[0.86] rounded-[16px]' : 'aspect-4/5', 'animate-pulse bg-[#f8eef2]')} /><div className="space-y-2 pt-2"><div className="h-3 w-3/4 animate-pulse rounded bg-rose-50" /><div className="h-3 w-1/3 animate-pulse rounded bg-rose-50" /></div></div>;
}
