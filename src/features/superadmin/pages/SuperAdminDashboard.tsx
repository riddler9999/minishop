import {useCallback, useEffect, useMemo, useState} from 'react';
import {Navigate} from 'react-router-dom';
import {Activity, CreditCard, RefreshCw, ShieldCheck, Store, WalletCards} from 'lucide-react';
import {useAdminAuth} from '@/features/auth/adminAuth';

type Payload = {
  metrics: {shops:number; activeShops:number; pendingApplications:number; pendingOrderPacks:number; recordedRevenue:number};
  shops: any[]; applications:any[]; packs:any[]; entitlements:any[];
};

const money = (n:number) => new Intl.NumberFormat('en-US').format(n) + ' Ks';

export default function SuperAdminDashboard() {
  const {loading, session, signOut} = useAdminAuth();
  const [data,setData]=useState<Payload|null>(null);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState('');
  const token=session?.access_token;

  const load=useCallback(async()=>{
    if(!token) return;
    setError('');
    const r=await fetch('/api/superadmin',{headers:{Authorization:`Bearer ${token}`}});
    const j=await r.json().catch(()=>({}));
    if(!r.ok){setError(j.error||'Unable to load');return;}
    setData(j);
  },[token]);

  useEffect(()=>{void load()},[load]);
  const ent=useMemo(()=>new Map((data?.entitlements||[]).map((e:any)=>[e.shop_id,e])),[data]);

  async function act(key:string, body:Record<string,unknown>, confirmText?:string){
    if(confirmText && !window.confirm(confirmText)) return;
    if(!token) return;
    setBusy(key); setError('');
    const r=await fetch('/api/superadmin',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(body)});
    const j=await r.json().catch(()=>({}));
    setBusy('');
    if(!r.ok){setError(j.error||'Action failed');return;}
    await load();
  }

  if(loading) return <div className="grid min-h-screen place-items-center">Loading…</div>;
  if(!session) return <Navigate to="/admin/login" replace />;
  if(error==='Forbidden') return <div className="grid min-h-screen place-items-center bg-slate-950 p-6 text-white"><div className="text-center"><ShieldCheck className="mx-auto mb-3 h-10 w-10"/><h1 className="text-xl font-bold">Super Admin only</h1><p className="mt-2 text-sm text-slate-400">This account is not in SUPERADMIN_EMAILS.</p></div></div>;

  const cards=[
    ['Total Shops',data?.metrics.shops||0,Store],
    ['Active Shops',data?.metrics.activeShops||0,Activity],
    ['Pending Plans',data?.metrics.pendingApplications||0,CreditCard],
    ['Pending Packs',data?.metrics.pendingOrderPacks||0,WalletCards],
  ] as const;

  return <main className="min-h-screen bg-slate-50 text-slate-950">
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <div><p className="text-xs font-semibold uppercase tracking-[.2em] text-rose-600">MiniShop MM</p><h1 className="text-xl font-black">Super Admin</h1></div>
        <div className="flex gap-2"><button onClick={()=>void load()} className="rounded-xl border px-3 py-2 text-sm"><RefreshCw className="h-4 w-4"/></button><button onClick={()=>void signOut()} className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Sign out</button></div>
      </div>
    </header>
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {cards.map(([label,value,Icon])=><div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><Icon className="mb-3 h-5 w-5 text-rose-600"/><p className="text-2xl font-black">{value}</p><p className="text-xs text-slate-500">{label}</p></div>)}
        <div className="col-span-2 rounded-2xl bg-slate-950 p-4 text-white lg:col-span-1"><p className="text-2xl font-black">{money(data?.metrics.recordedRevenue||0)}</p><p className="mt-1 text-xs text-slate-400">Approved payments recorded</p></div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b p-4"><h2 className="font-bold">Pending subscription applications</h2></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="p-3">Owner</th><th>Plan</th><th>Amount</th><th>Payment</th><th>Submitted</th><th>Action</th></tr></thead><tbody>
          {(data?.applications||[]).filter((a:any)=>a.status==='pending').map((a:any)=><tr key={a.owner_id} className="border-t"><td className="p-3 font-mono text-xs">{a.owner_id}</td><td className="font-semibold capitalize">{a.plan}</td><td>{money(a.amount)}</td><td>{a.payment_method} {a.payment_ref_tail&&`••${a.payment_ref_tail}`}</td><td>{new Date(a.created_at).toLocaleDateString()}</td><td className="py-2"><span className="text-xs text-slate-500">Create shop after approval/onboarding, then activate from Shops.</span></td></tr>)}
          {!(data?.applications||[]).some((a:any)=>a.status==='pending')&&<tr><td colSpan={6} className="p-8 text-center text-slate-400">No pending applications</td></tr>}
        </tbody></table></div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b p-4"><h2 className="font-bold">Shops & subscriptions</h2><p className="text-xs text-slate-500">Platform-owner controls. Destructive actions require confirmation.</p></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="p-3">Shop</th><th>Plan</th><th>Usage</th><th>Extra</th><th>Cycle end</th><th>Status</th><th>Actions</th></tr></thead><tbody>
          {(data?.shops||[]).map((s:any)=>{const e:any=ent.get(s.id);return <tr key={s.id} className="border-t align-top"><td className="p-3"><p className="font-bold">{s.name}</p><p className="text-xs text-slate-400">/{s.slug}</p></td><td className="capitalize">{e?.plan||s.plan}{e?.pending_plan&&<p className="text-xs text-amber-600">→ {e.pending_plan}</p>}</td><td>{e?`${e.monthly_used}/${e.monthly_quota}`:'—'}</td><td>{e?.purchased_balance??'—'}</td><td>{e?.cycle_end?new Date(e.cycle_end).toLocaleDateString():'—'}</td><td><span className={`rounded-full px-2 py-1 text-xs font-semibold ${s.is_active&&e?.active!==false?'bg-emerald-50 text-emerald-700':'bg-slate-100 text-slate-500'}`}>{s.is_active&&e?.active!==false?'Active':'Inactive'}</span></td><td className="py-2"><div className="flex flex-wrap gap-1.5">
            <button disabled={!!busy} onClick={()=>void act(s.id+'renew',{action:'renew',shopId:s.id,paymentRef:`manual-${Date.now()}`})} className="rounded-lg border px-2.5 py-1.5 text-xs font-semibold">Renew</button>
            {s.plan==='starter'&&<button disabled={!!busy} onClick={()=>void act(s.id+'up',{action:'upgrade',shopId:s.id,paymentRef:`manual-${Date.now()}`})} className="rounded-lg border px-2.5 py-1.5 text-xs font-semibold">Upgrade</button>}
            <button disabled={!!busy} onClick={()=>void act(s.id+'toggle',{action:'toggle-shop',shopId:s.id,active:!s.is_active},`${s.is_active?'Suspend':'Activate'} ${s.name}?`)} className="rounded-lg border px-2.5 py-1.5 text-xs font-semibold">{s.is_active?'Suspend shop':'Activate shop'}</button>
            {e?.active!==false&&<button disabled={!!busy} onClick={()=>void act(s.id+'cancel',{action:'cancel',shopId:s.id},`Cancel subscription for ${s.name}?`)} className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600">Cancel sub</button>}
          </div></td></tr>})}
        </tbody></table></div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b p-4"><h2 className="font-bold">Extra-order purchase requests</h2></div>
        <div className="divide-y">{(data?.packs||[]).filter((p:any)=>p.status==='pending').map((p:any)=><div key={p.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between"><div><p className="font-semibold">{p.qty} extra orders · {money(p.amount)}</p><p className="text-xs text-slate-500">{p.payment_method} {p.payment_ref_tail&&`••${p.payment_ref_tail}`} · shop {p.shop_id}</p></div><button disabled={!!busy} onClick={()=>void act(p.id,{action:'credit-pack',purchaseId:p.id},`Approve and credit ${p.qty} orders?`)} className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Approve & credit</button></div>)}{!(data?.packs||[]).some((p:any)=>p.status==='pending')&&<p className="p-8 text-center text-sm text-slate-400">No pending requests</p>}</div>
      </section>
    </div>
  </main>;
}
