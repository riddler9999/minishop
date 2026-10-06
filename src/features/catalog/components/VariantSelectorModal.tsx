import {useState, useEffect, useMemo} from 'react';
import {Check, Minus, Plus, ShoppingBag, X, ImageOff} from 'lucide-react';
import type {Product, ProductVariant} from '@/domain/product';
import {resolveVariantPrice} from '@/domain/product';
import {useCart} from '@/features/cart/state';
import {useShopNavigate} from '@/features/tenancy/ShopLink';
import {ks} from '@/shared/lib/format';
import {useModalA11y} from '@/shared/hooks/useModalA11y';

export default function VariantSelectorModal({
  product,
  isOpen,
  onClose,
  initialBuyNow: _initialBuyNow = false,
}: {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  initialBuyNow?: boolean;
}) {
  const {add} = useCart();
  const nav = useShopNavigate();

  const variants = useMemo(() => product.variants ?? [], [product.variants]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    variants[0] ?? null,
  );
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const panelRef = useModalA11y<HTMLDivElement>(onClose);

  useEffect(() => {
    if (variants.length > 0) {
      // Default to first in-stock variant or first variant
      const firstInStock = variants.find((v) => v.stock > 0) ?? variants[0];
      setSelectedVariant(firstInStock ?? null);
    } else {
      setSelectedVariant(null);
    }
    setQty(1);
    setAdded(false);
  }, [product, isOpen, variants]);

  if (!isOpen) return null;

  const activePrice = resolveVariantPrice(product, selectedVariant);
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;
  const isAvailable = currentStock > 0;

  const handleAddToCart = () => {
    if (!isAvailable) return;
    add(product, qty, selectedVariant);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 1200);
  };

  const handleBuyNow = () => {
    if (!isAvailable) return;
    add(product, qty, selectedVariant);
    onClose();
    nav('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close variant selector"
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs"
        onClick={onClose}
      />

      {/* Modal Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="variant-selector-title"
        className="relative flex w-full max-w-lg flex-col rounded-t-3xl bg-white p-5 shadow-2xl transition-all sm:rounded-2xl border border-slate-200">
        <header className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex gap-3">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="h-16 w-16 shrink-0 rounded-xl border border-slate-200 object-cover"
              />
            ) : (
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-slate-400">
                <ImageOff className="h-6 w-6" />
              </div>
            )}
            <div>
              <h3 id="variant-selector-title" className="font-bold text-slate-900 text-base line-clamp-1">
                {product.name}
              </h3>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-base font-extrabold text-[#be123c]">
                  {ks(activePrice.effectivePrice)}
                </span>
                {activePrice.isPromotion && activePrice.price > activePrice.effectivePrice && (
                  <span className="text-xs text-slate-400 line-through">
                    {ks(activePrice.price)}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-500 font-medium">
                {isAvailable ? (
                  <span className="text-emerald-700 font-semibold">In stock ({currentStock})</span>
                ) : (
                  <span className="text-rose-600 font-semibold">Out of stock</span>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Variants List */}
        <div className="my-4 max-h-[50vh] overflow-y-auto space-y-4 pr-1">
          <div>
            <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Select Option / Variant
            </span>
            <div className="grid gap-2">
              {variants.map((v) => {
                const isSelected = selectedVariant?.id === v.id;
                const vPrice = resolveVariantPrice(product, v);
                const outOfStock = v.stock <= 0;

                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariant(v)}
                    className={`flex items-center justify-between rounded-xl border p-3 text-left transition ${
                      isSelected
                        ? 'border-[#be123c] bg-rose-50/60 ring-2 ring-rose-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    } ${outOfStock ? 'opacity-60 bg-slate-50' : ''}`}>
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border text-white transition ${
                          isSelected ? 'border-[#be123c] bg-[#be123c]' : 'border-slate-300 bg-white'
                        }`}>
                        {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{v.name}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          {v.sku && <span>SKU: {v.sku}</span>}
                          {v.size && <span>Size: {v.size}</span>}
                          {v.color && <span>Color: {v.color}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold text-slate-900 block">
                        {ks(vPrice.effectivePrice)}
                      </span>
                      <span className={`text-[11px] font-semibold ${outOfStock ? 'text-rose-600' : 'text-slate-500'}`}>
                        {outOfStock ? 'Out of stock' : `${v.stock} left`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity Selector */}
          <div>
            <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Quantity
            </span>
            <div className="flex w-fit items-center rounded-xl border border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={!isAvailable}
                className="grid h-10 w-10 place-items-center text-slate-700 hover:text-black disabled:opacity-30">
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center font-bold text-slate-900 text-sm">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(Math.max(currentStock, 1), q + 1))}
                disabled={!isAvailable}
                className="grid h-10 w-10 place-items-center text-slate-700 hover:text-black disabled:opacity-30">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <footer className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            disabled={!isAvailable}
            onClick={handleAddToCart}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#be123c] bg-white px-4 py-3 text-sm font-bold text-[#be123c] transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400">
            {added ? (
              <>
                <Check className="h-4 w-4" /> Added
              </>
            ) : (
              <>
                <ShoppingBag className="h-4 w-4" /> Add to cart
              </>
            )}
          </button>
          <button
            type="button"
            disabled={!isAvailable}
            onClick={handleBuyNow}
            className="min-h-12 rounded-xl bg-[#be123c] px-4 py-3 text-sm font-bold text-white transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400">
            Buy Now
          </button>
        </footer>
      </div>
    </div>
  );
}
