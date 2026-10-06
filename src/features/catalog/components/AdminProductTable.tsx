import {Eye, EyeOff, Pencil, Layers} from 'lucide-react';
import type {Product} from '@/domain/product';
import {getProductPriceRange} from '@/domain/product';
import {ks, cx} from '@/shared/lib/format';
import AdminStatusBadge from '@/features/admin/components/AdminStatusBadge';
import AdminButton from '@/features/admin/components/AdminButton';

function visibilityLabel(product: Product) {
  return product.status === 'active' ? 'Visible' : 'Hidden';
}

function stockDisplay(stock: number) {
  if (stock <= 0) return '0 (Out of stock)';
  if (stock <= 5) return `${stock} (Low)`;
  return String(stock);
}

export default function AdminProductTable({
  products,
  onEdit,
}: {
  products: Product[];
  onEdit: (product: Product) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#E1E7E3] bg-white shadow-sm">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-[880px] w-full text-left text-sm">
          <thead className="border-b border-[#E1E7E3] bg-[#F4F7F5] text-xs uppercase tracking-wide text-[#66706C]">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Product</th>
              <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              <th scope="col" className="px-4 py-3 font-semibold">Stock</th>
              <th scope="col" className="px-4 py-3 font-semibold">Category</th>
              <th scope="col" className="px-4 py-3 font-semibold">Price</th>
              <th scope="col" className="px-4 py-3 font-semibold">Visibility</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E1E7E3]">
            {products.map((product) => {
              const hasVars = Boolean(product.variants && product.variants.length > 0);
              const priceRange = getProductPriceRange(product);
              return (
                <tr key={product.id} className="hover:bg-[#F4F7F5]/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex min-w-[220px] items-center gap-3">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-11 w-11 shrink-0 rounded-lg border border-[#E1E7E3] object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-11 w-11 shrink-0 rounded-lg border border-dashed border-[#E1E7E3] bg-[#F4F7F5]" />
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate font-semibold text-[#1F2421]">{product.name}</p>
                          {hasVars && (
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#D8F1EA] px-2 py-0.5 text-[10px] font-bold text-[#29957F]">
                              <Layers className="h-3 w-3" /> {product.variants?.length} variants
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-[#66706C]">{product.itemCode || 'No item code'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <AdminStatusBadge tone={product.status === 'active' ? 'success' : 'neutral'}>
                      {product.status === 'active' ? 'Active' : 'Hidden'}
                    </AdminStatusBadge>
                  </td>
                  <td className={cx('px-4 py-3 font-medium', product.stock <= 0 ? 'text-rose-700 font-semibold' : product.stock <= 5 ? 'text-amber-700 font-semibold' : 'text-[#1F2421]')}>
                    {stockDisplay(product.stock)}
                  </td>
                  <td className="px-4 py-3 text-[#66706C]">{product.category || '—'}</td>
                  <td className="px-4 py-3 font-semibold text-[#1F2421]">
                    {hasVars && priceRange.hasVariantPrices ? (
                      <span>{ks(priceRange.minPrice)} - {ks(priceRange.maxPrice)}</span>
                    ) : product.isPromotion && product.promoPrice != null ? (
                      <div>
                        <span>{ks(product.promoPrice)}</span>
                        <span className="ml-1.5 text-xs text-[#66706C] line-through font-normal">{ks(product.price)}</span>
                      </div>
                    ) : (
                      ks(product.price)
                    )}
                  </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1F2421]">
                    {product.status === 'active' ? <Eye className="h-4 w-4 text-[#29957F]" /> : <EyeOff className="h-4 w-4 text-[#66706C]" />}
                    {visibilityLabel(product)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <AdminButton
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => onEdit(product)}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </AdminButton>
                </td>
              </tr>
            );
          })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card/List View */}
      <ul className="md:hidden divide-y divide-[#E1E7E3] w-full overflow-x-hidden">
        {products.map((product) => {
          const hasVars = Boolean(product.variants && product.variants.length > 0);
          const priceRange = getProductPriceRange(product);
          return (
            <li key={product.id} className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-14 w-14 shrink-0 rounded-lg border border-[#E1E7E3] object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-14 w-14 shrink-0 rounded-lg border border-dashed border-[#E1E7E3] bg-[#F4F7F5]" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-[#1F2421] truncate">{product.name}</p>
                      {hasVars && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#29957F] mt-0.5">
                          <Layers className="h-3 w-3" /> {product.variants?.length} variants
                        </span>
                      )}
                    </div>
                    <AdminStatusBadge tone={product.status === 'active' ? 'success' : 'neutral'}>
                      {product.status === 'active' ? 'Active' : 'Hidden'}
                    </AdminStatusBadge>
                  </div>
                  <p className="mt-0.5 text-xs text-[#66706C] truncate">{product.itemCode || 'No item code'} · {product.category || 'Uncategorized'}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs">
                    <span className={cx('font-medium', product.stock <= 0 ? 'text-rose-700 font-semibold' : product.stock <= 5 ? 'text-amber-700 font-semibold' : 'text-[#66706C]')}>
                      Stock: {stockDisplay(product.stock)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-xs text-[#66706C] block">Price</span>
                  <span className="text-sm font-semibold text-[#1F2421]">
                    {hasVars && priceRange.hasVariantPrices ? (
                      <span>{ks(priceRange.minPrice)} - {ks(priceRange.maxPrice)}</span>
                    ) : product.isPromotion && product.promoPrice != null ? (
                      <span>
                        {ks(product.promoPrice)}
                        <span className="ml-1 text-xs text-[#66706C] line-through font-normal">{ks(product.price)}</span>
                      </span>
                    ) : (
                      ks(product.price)
                    )}
                  </span>
                </div>
                <AdminButton
                  type="button"
                  variant="secondary"
                  size="md"
                  className="min-h-[44px] min-w-[88px]"
                  onClick={() => onEdit(product)}>
                  <Pencil className="h-4 w-4" /> Edit
                </AdminButton>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

