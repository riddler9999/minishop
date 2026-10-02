import {FileText} from 'lucide-react';

export default function StorePolicies() {
  return (
    <section className="space-y-4">
      <header>
        <p className="text-sm font-semibold text-violet-600">Store</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Policies</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Policy editing is not available yet in Admin V2. Existing storefront policy behavior remains unchanged.</p>
      </header>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <FileText className="h-6 w-6 text-slate-500" />
        <h2 className="mt-4 text-lg font-bold text-slate-950">Existing policy behavior is preserved</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">No draft or save controls are exposed until a real policy persistence contract is implemented.</p>
      </div>
    </section>
  );
}
