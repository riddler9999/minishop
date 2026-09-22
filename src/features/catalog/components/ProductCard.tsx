import {ImageOff, ShoppingBag} from 'lucide-react';
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
  const buyNow = () => {add(product); nav('/checkout');};
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
  return (
    <article className={cx('group flex h-full flex-col overflow-hidden rounded-2xl border border-[#f0dfE6] bg-white shadow-[0_12px_32px_rgba(86,46,62,0.10)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(86,46,62,0.14)]', className)}>
      <ShopLink to={to} className={cx('relative block overflow-hidden bg-[#f8eef2]', compact ? 'aspect-square' : 'aspect-4/5')}>
        {product.image ? <img src={product.image} alt={product.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]" /> : <div className="grid h-full w-full place-items-center text-[#8b7d6d]"><ImageOff className="h-8 w-8" /></div>}
        {hasPromo && off > 0 && <span className="absolute left-2 top-2 rounded-full bg-[#fffaf1] px-2.5 py-1 text-[10px] font-bold text-[#80561e] shadow-sm">-{off}%</span>}
        {!product.inStock && <span className="absolute right-2 top-2 rounded-full bg-[#24170e]/80 px-2.5 py-1 text-[10px] font-semibold text-white">Sold out</span>}
      </ShopLink>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        {!compact && product.category && <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#9b6d2b]">{product.category}</p>}
        <ShopLink to={to} className={cx('font-display line-clamp-2 font-semibold leading-snug text-[#2a2018] transition hover:text-[#be123c]', compact ? 'text-[15px] sm:text-base' : 'mt-1 text-base')}>{product.name}</ShopLink>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="font-sans text-[13px] font-bold text-[#251a12] sm:text-sm">{ks(price)}</span>
          {hasPromo && <span className="text-[10px] text-[#8f8377] line-through sm:text-[11px]">{ks(product.price)}</span>}
        </div>

        <div className="mt-auto flex flex-col gap-1.5 pt-3">
          <button type="button" disabled={!product.inStock} onClick={quickAdd} className="inline-flex min-h-8 items-center justify-center gap-1 rounded-lg border border-[#e11d48] bg-white px-2 py-1.5 text-[10px] font-semibold text-[#e11d48] transition hover:bg-[#fff0f6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e11d48] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 sm:text-[11px]">
            <ShoppingBag className="h-3.5 w-3.5 shrink-0" /> ခြင်းထဲထည့်မည်
          </button>
          <button type="button" disabled={!product.inStock} onClick={buyNow} className="min-h-8 rounded-lg bg-[#e11d48] px-2 py-1.5 text-[10px] font-semibold text-white transition hover:bg-[#be123c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e11d48] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 sm:text-[11px]">ဝယ်မည်</button>
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton({compact = false}: {compact?: boolean}) {
  return <div className="overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-[0_12px_32px_rgba(86,46,62,0.08)]"><div className={cx(compact ? 'aspect-square' : 'aspect-4/5', 'animate-pulse bg-[#f8eef2]')} /><div className="space-y-2 p-3"><div className="h-4 w-3/4 animate-pulse rounded bg-rose-50" /><div className="h-4 w-1/3 animate-pulse rounded bg-rose-50" /><div className="space-y-1.5 pt-2"><div className="h-8 animate-pulse rounded-lg bg-rose-50" /><div className="h-8 animate-pulse rounded-lg bg-rose-50" /></div></div></div>;
}
