import {ListTree} from 'lucide-react';

export default function StoreNavigation() {
  return (
    <section className="space-y-4">
      <header>
        <p className="text-sm font-semibold text-violet-600">Store</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Navigation</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Store menu management is not available yet. MiniShop will keep the current storefront navigation unchanged until a backed configuration API exists.</p>
      </header>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <ListTree className="h-6 w-6 text-slate-500" />
        <h2 className="mt-4 text-lg font-bold text-slate-950">Current navigation is preserved</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">No controls are shown here because changing navigation without a persisted domain contract could create a false setup state.</p>
      </div>
    </section>
  );
}
