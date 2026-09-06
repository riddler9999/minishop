import {useEffect, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {
  Package,
  ShoppingCart,
  Banknote,
  Clock,
  AlertTriangle,
  EyeOff,
  ArrowRight,
} from 'lucide-react';
import {adminApi, type AdminOrder, type Product} from '../../lib/store';
import {ks} from '../../lib/format';
import {statusMeta, PAID_STATUSES, OPEN_STATUSES, type OrderStatus} from '../../lib/orderStatus';

interface StatCard {
  key: string;
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{className?: string}>;
  tone: string; // icon chip classes
}

const LOW_STOCK_THRESHOLD = 5;

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.all([adminApi.listProducts(), adminApi.listOrders()])
      .then(([p, o]) => {
        if (!alive) return;
        setProducts(p.products);
        setOrders(o.orders);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const stats = useMemo<StatCard[]>(() => {
    const active = products.filter((p) => p.status === 'active');
    const hidden = products.filter((p) => p.status !== 'active');
    const outOfStock = products.filter((p) => p.stock <= 0);
    const revenue = orders
      .filter((o) => PAID_STATUSES.includes(o.status as OrderStatus))
      .reduce((s, o) => s + (o.grand_total || 0), 0);
    const openOrders = orders.filter((o) => OPEN_STATUSES.includes(o.status as OrderStatus));

    return [
      {
        key: 'revenue',
        label: 'ရရှိပြီး ဝင်ငွေ',
        value: ks(revenue),
        sub: `${orders.length} order စုစုပေါင်း`,
        icon: Banknote,
        tone: 'bg-emerald-100 text-emerald-700',
      },
      {
        key: 'open',
        label: 'ဆောင်ရွက်ရန် Order',
        value: String(openOrders.length),
        sub: 'ငွေစစ် / ပို့ရန် ကျန်',
        icon: Clock,
        tone: 'bg-amber-100 text-amber-700',
      },
      {
        key: 'products',
        label: 'ပစ္စည်း',
        value: String(products.length),
        sub: `${active.length} ဖော်ပြ · ${hidden.length} ဖုံး`,
        icon: Package,
        tone: 'bg-brand-100 text-brand-600',
      },
      {
        key: 'stock',
        label: 'ကုန်ပြီး',
        value: String(outOfStock.length),
        sub: 'stock ပြန်ဖြည့်ရန်',
        icon: AlertTriangle,
        tone: 'bg-red-100 text-red-600',
      },
    ];
  }, [products, orders]);

  const recentOrders = orders.slice(0, 6);
  const lowStock = useMemo(
    () =>
      [...products]
        .filter((p) => p.stock <= LOW_STOCK_THRESHOLD)
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 6),
    [products],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">ခြုံငုံ အခြေအနေ</h1>
        <p className="my mt-1 text-sm text-ink-soft">ဆိုင်၏ လက်ရှိ အနှစ်ချုပ် (demo · localStorage data)</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {loading
          ? Array.from({length: 4}).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl border border-cream-200 bg-white" />
            ))
          : stats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.key} className="rounded-2xl border border-cream-200 bg-white p-4">
                  <div className={`grid h-10 w-10 place-items-center rounded-xl ${s.tone}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="my mt-3 text-2xl font-bold text-ink">{s.value}</p>
                  <p className="my text-xs font-semibold text-ink-soft">{s.label}</p>
                  {s.sub && <p className="my mt-0.5 text-[11px] text-ink-soft/80">{s.sub}</p>}
                </div>
              );
            })}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Recent orders */}
        <section className="lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-ink">နောက်ဆုံး Order များ</h2>
            <Link
              to="/admin/orders"
              className="my inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
              အားလုံး <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="overflow-hidden rounded-2xl border border-cream-200 bg-white">
            {loading ? (
              <div className="space-y-2 p-4">
                {Array.from({length: 4}).map((_, i) => (
                  <div key={i} className="h-10 animate-pulse rounded-lg bg-cream-100" />
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <ShoppingCart className="h-8 w-8 text-ink-soft/40" />
                <p className="my text-sm text-ink-soft">Order မရှိသေးပါ။ ဆိုင်တွင် order တင်ကြည့်ပါ။</p>
              </div>
            ) : (
              <ul className="divide-y divide-cream-200">
                {recentOrders.map((o) => {
                  const st = statusMeta(o.status);
                  return (
                    <li key={o.order_id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="font-display text-sm font-bold text-brand-700">{o.order_id}</p>
                        <p className="my truncate text-xs text-ink-soft">
                          {o.customer_name || '—'} · {new Date(o.created_at).toLocaleDateString('en-GB')}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-sm font-bold text-ink">{ks(o.grand_total)}</span>
                        <span className={`my rounded-full px-2.5 py-1 text-[11px] font-semibold ${st.cls}`}>
                          {st.admin}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        {/* Low stock */}
        <section className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-ink">Stock နည်းနေသည်</h2>
            <Link
              to="/admin/products"
              className="my inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
              စီမံ <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="overflow-hidden rounded-2xl border border-cream-200 bg-white">
            {loading ? (
              <div className="space-y-2 p-4">
                {Array.from({length: 3}).map((_, i) => (
                  <div key={i} className="h-10 animate-pulse rounded-lg bg-cream-100" />
                ))}
              </div>
            ) : lowStock.length === 0 ? (
              <p className="my px-4 py-10 text-center text-sm text-ink-soft">
                Stock နည်းနေသော ပစ္စည်း မရှိပါ 👍
              </p>
            ) : (
              <ul className="divide-y divide-cream-200">
                {lowStock.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                    <img
                      src={p.image || ''}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-lg object-cover"
                      loading="lazy"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="my truncate text-sm font-semibold text-ink">{p.name}</p>
                      <p className="my text-xs text-ink-soft">{p.itemCode}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        p.stock <= 0 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'
                      }`}>
                      {p.stock <= 0 ? 'ကုန်ပြီး' : `${p.stock} ကျန်`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <p className="my flex items-center gap-1.5 text-xs text-ink-soft/70">
        <EyeOff className="h-3.5 w-3.5" />
        Data အားလုံးသည် ဤ browser ၏ localStorage ထဲတွင်သာ သိမ်းထားသည် — demo အတွက်သာ။
      </p>
    </div>
  );
}
