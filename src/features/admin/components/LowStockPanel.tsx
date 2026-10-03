import {ArrowRight, Package} from 'lucide-react';
import {Link} from 'react-router-dom';
import type {Product} from '@/domain/product';
import AdminEmptyState from '@/features/admin/components/AdminEmptyState';
import AdminSurface from '@/features/admin/components/AdminSurface';

export default function LowStockPanel({products}: {products: Product[]}) {
  return (
    <AdminSurface>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-[#1F2421]">Low Stock</h2>
        <Link
          to="/admin/products"
          className="inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-[#35B99D] hover:text-[#29957F]">
          Manage products <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      {products.length === 0 ? (
        <div className="mt-4">
          <AdminEmptyState
            title="Stock levels look healthy"
            description="Products with five or fewer units will appear here."
          />
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-[#E1E7E3]">
          {products.slice(0, 5).map((product) => (
            <li key={product.id} className="flex items-center gap-3 py-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#F4F7F5] text-[#1F2421]">
                <Package className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#1F2421]">{product.name}</p>
                <p className="mt-1 text-xs text-[#66706C]">
                  {product.stock <= 0 ? (
                    <span className="font-semibold text-rose-600">Out of stock</span>
                  ) : (
                    <span>{product.stock} units left</span>
                  )}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminSurface>
  );
}
