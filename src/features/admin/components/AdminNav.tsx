import type {ComponentType} from 'react';
import {BarChart3, CreditCard, LayoutDashboard, Megaphone, Package, Settings, ShoppingBag, Store, Users} from 'lucide-react';
import {NavLink} from 'react-router-dom';
import {cx} from '@/shared/lib/format';

export interface AdminNavItem {
  label: string;
  to?: string;
  end?: boolean;
  icon: ComponentType<{className?: string}>;
  children?: {label: string; to: string}[];
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {label: 'Dashboard', to: '/admin', end: true, icon: LayoutDashboard},
  {label: 'Orders', to: '/admin/orders', icon: ShoppingBag},
  {label: 'Products', to: '/admin/products', icon: Package},
  {label: 'Customers', to: '/admin/customers', icon: Users},
  {
    label: 'Store',
    icon: Store,
    children: [
      {label: 'Store Builder', to: '/admin/online-store/themes/customize'},
      {label: 'Navigation', to: '/admin/store/navigation'},
      {label: 'Domains', to: '/admin/store/domains'},
      {label: 'Policies', to: '/admin/store/policies'},
    ],
  },
  {label: 'Marketing', icon: Megaphone},
  {label: 'Analytics', to: '/admin/analytics', icon: BarChart3},
  {label: 'Settings', to: '/admin/settings', icon: Settings},
  {label: 'Billing', to: '/admin/billing', icon: CreditCard},
];

function DisabledNavItem({item}: {item: AdminNavItem}) {
  const Icon = item.icon;
  return (
    <div
      aria-disabled="true"
      className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--admin-sidebar-muted)]">
      <Icon className="h-[18px] w-[18px]" />
      <span>{item.label}</span>
    </div>
  );
}

export default function AdminNav({onNavigate}: {onNavigate?: () => void}) {
  return (
    <nav aria-label="Admin navigation" className="space-y-1">
      {ADMIN_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        if (item.children) {
          return (
            <div key={item.label} className="space-y-1">
              <div className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[var(--admin-sidebar-text)]">
                <Icon className="h-[18px] w-[18px]" />
                <span>{item.label}</span>
              </div>
              <div className="ml-7 space-y-1 border-l border-[var(--admin-sidebar-hover)] pl-3">
                {item.children.map((child) => (
                  <NavLink
                    key={child.label}
                    to={child.to}
                    onClick={onNavigate}
                    className={({isActive}) =>
                      cx(
                        'block rounded-lg px-3 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-focus)]',
                        isActive ? 'bg-[var(--admin-sidebar-hover)] text-white' : 'text-[var(--admin-sidebar-muted)] hover:bg-[var(--admin-sidebar-hover)] hover:text-white',
                      )
                    }>
                    {child.label}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        }
        if (!item.to) return <DisabledNavItem key={item.label} item={item} />;
        return (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({isActive}) =>
              cx(
                'flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-focus)]',
                isActive ? 'bg-[var(--admin-primary)] text-white' : 'text-[var(--admin-sidebar-muted)] hover:bg-[var(--admin-sidebar-hover)] hover:text-white',
              )
            }>
            <Icon className="h-[18px] w-[18px]" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
