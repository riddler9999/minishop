import {Eye, EyeOff, Pencil} from 'lucide-react';
import type {Product} from '@/domain/product';
import {ks, cx} from '@/shared/lib/format';
import AdminStatusBadge from '@/features/admin/components/AdminStatusBadge';

function visibilityLabel(product: Product) {
  return product.status === 'active' ? 'Visible' : 'Hidden';
}

export default function AdminProductTable({
  products,
  onEdit,
}: {
  products: Product[];
  onEdit: (product: Product) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-[880px] w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {['Product', 'Status', 'Stock', 'Category', 'Price', 'Visibility'].map((label) => (
                <th key={label} className="px-4 py-3 font-semibold">{label}</th>
              ))}
              <th className="px-4 py-3 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex min-w-[220px] items-center gap-3">
                    {product.image ? (
                      <img src={product.image} alt="" className="h-10 w-10 rounded-lg border border-slate-200 object-cover" loading="lazy" />
                    ) : (
                      <div className="h-10 w-10 rounded-lg border border-dashed border-slate-300 bg-slate-50" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-950">{product.name}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">{product.itemCode || 'No item code'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <AdminStatusBadge tone={product.status === 'active' ? 'success' : 'neutral'}>
                    {product.status === 'active' ? 'Active' : 'Hidden'}
                  </AdminStatusBadge>
                </td>
                <td className={cx('px-4 py-3 font-semibold', product.stock <= 0 ? 'text-rose-700' : product.stock <= 5 ? 'text-amber-700' : 'text-slate-800')}>
                  {product.stock}
                </td>
                <td className="px-4 py-3 text-slate-600">{product.category || '—'}</td>
                <td className="px-4 py-3 font-semibold text-slate-950">{ks(product.promoPrice ?? product.price)}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700">
                    {product.status === 'active' ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    {visibilityLabel(product)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onEdit(product)}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-slate-100 md:hidden">
        {products.map((product) => (
          <li key={product.id} className="flex items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-slate-950">{product.name}</p>
              <p className="mt-1 text-xs text-slate-500">{product.category || 'Uncategorized'} · {product.stock} in stock</p>
              <p className="mt-1 text-sm font-semibold text-slate-950">{ks(product.promoPrice ?? product.price)}</p>
            </div>
            <button type="button" onClick={() => onEdit(product)} className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700">Edit</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
