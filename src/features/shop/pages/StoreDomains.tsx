import {Globe2} from 'lucide-react';

export default function StoreDomains() {
  return (
    <section className="space-y-4">
      <header>
        <p className="text-sm font-semibold text-violet-600">Store</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Domains</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Custom domain setup is not configured yet in this admin. Your existing MiniShop storefront URL continues to work normally.</p>
      </header>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <Globe2 className="h-6 w-6 text-slate-500" />
        <h2 className="mt-4 text-lg font-bold text-slate-950">No domain changes available</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">This page is intentionally read-only until domain verification and attachment have an authoritative backend workflow.</p>
      </div>
    </section>
  );
}
