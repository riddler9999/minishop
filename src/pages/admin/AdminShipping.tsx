import {useEffect, useMemo, useState} from 'react';
import {Plus, Trash2, Check, Pencil, Truck} from 'lucide-react';
import {adminApi, type ShippingZone} from '../../lib/store';
import {ks, cx} from '../../lib/format';
import {usePlan} from '../../lib/plan';
import {UpgradeCard} from '../../components/PlanGate';
import {regionNames, shippingFee, townshipsOf} from '../../data/locations';

export default function AdminShipping() {
  const {features} = usePlan();
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  // Add-zone form.
  const [region, setRegion] = useState('');
  const [township, setTownship] = useState('');
  const [fee, setFee] = useState('');
  const [adding, setAdding] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFee, setEditFee] = useState('');

  const townships = useMemo(() => townshipsOf(region), [region]);

  useEffect(() => {
    if (!features.advancedShipping) {
      setLoading(false);
      return;
    }
    let alive = true;
    adminApi
      .listShippingZones()
      .then((r) => alive && setZones(r.zones))
      .catch((e) => alive && setErr(e.message || 'ဆွဲယူ၍မရပါ'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [features.advancedShipping]);

  // Prefill the fee input with the static-table suggestion whenever both
  // region+township are chosen (seller can still override — it's just a hint).
  const onTownship = (t: string) => {
    setTownship(t);
    if (region && t) {
      const suggested = shippingFee(region, t);
      if (suggested != null) setFee(String(suggested));
    }
  };

  const add = async () => {
    const feeN = Number(fee);
    setErr('');
    if (!region || !township) return setErr('တိုင်း/မြို့နယ် ရွေးပါ။');
    if (!Number.isFinite(feeN) || feeN < 0) return setErr('ပို့ခ မမှန်ပါ။');
    setAdding(true);
    try {
      const {zone} = await adminApi.createShippingZone({region, township, fee: feeN});
      setZones((prev) => [...prev, zone].sort((a, b) => a.region.localeCompare(b.region) || a.township.localeCompare(b.township)));
      setRegion('');
      setTownship('');
      setFee('');
    } catch (e: any) {
      setErr(e.message || 'ထည့်၍မရပါ။');
    } finally {
      setAdding(false);
    }
  };

  const saveEdit = async (id: string) => {
    const feeN = Number(editFee);
    if (!Number.isFinite(feeN) || feeN < 0) return setErr('ပို့ခ မမှန်ပါ။');
    setErr('');
    try {
      const {zone} = await adminApi.updateShippingZone(id, {fee: feeN});
      setZones((prev) => prev.map((z) => (z.id === id ? zone : z)));
      setEditingId(null);
    } catch (e: any) {
      setErr(e.message || 'ပြင်၍မရပါ။');
    }
  };

  const remove = async (z: ShippingZone) => {
    if (!confirm(`${z.region} / ${z.township} ပို့ခ ဇုန်ကို ဖျက်မည်။ သေချာပါသလား?`)) return;
    setErr('');
    try {
      await adminApi.deleteShippingZone(z.id);
      setZones((prev) => prev.filter((x) => x.id !== z.id));
    } catch (e: any) {
      setErr(e.message || 'ဖျက်၍မရပါ။');
    }
  };

  const field = 'w-full rounded-xl border border-cream-200 bg-cream-50 px-3 py-2 text-sm outline-none focus:border-brand-400';

  // Advanced (per-township) shipping zones are a Business feature. Starter shops
  // charge the single default delivery fee set in "ဆိုင် ချိန်ညှိ".
  if (!features.advancedShipping) {
    return (
      <div className="space-y-5">
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-ink">
          <Truck className="h-6 w-6 text-brand-500" /> ပို့ဆောင်ခ ဇုန်များ
        </h1>
        <UpgradeCard title="မြို့နယ်အလိုက် ပို့ဆောင်ခ ဇုန်များ">
          မြို့နယ်တစ်ခုချင်းစီအတွက် ပို့ခ သီးသန့်သတ်မှတ်ခြင်းသည် Business package feature ဖြစ်သည်။ Starter package တွင်
          ဆိုင်၏ default ပို့ခ တစ်ခုတည်းကို “ဆိုင် ချိန်ညှိ” တွင် သတ်မှတ်နိုင်သည်။
        </UpgradeCard>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-ink">
          <Truck className="h-6 w-6 text-brand-500" /> ပို့ဆောင်ခ ဇုန်များ
        </h1>
        <p className="my mt-1 text-sm text-ink-soft">
          မြို့နယ်အလိုက် ပို့ခ သတ်မှတ်ပါ။ ဇုန်မသတ်မှတ်ရသေးသော မြို့နယ်များအတွက် ဆိုင်၏ default ပို့ခကို အသုံးပြုပါမည်။
        </p>
      </div>

      {/* Add zone */}
      <div className="rounded-2xl border border-cream-200 bg-white p-4">
        <h2 className="my mb-3 text-sm font-bold text-ink">ဇုန်အသစ် ထည့်ရန်</h2>
        <div className="grid gap-3 sm:grid-cols-4">
          <select
            value={region}
            aria-label="တိုင်း/ပြည်နယ်"
            onChange={(e) => {
              setRegion(e.target.value);
              setTownship('');
            }}
            className={field}>
            <option value="">— တိုင်း/ပြည်နယ် —</option>
            {regionNames().map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <select value={township} aria-label="မြို့နယ်" disabled={!region} onChange={(e) => onTownship(e.target.value)} className={cx(field, !region && 'opacity-60')}>
            <option value="">{region ? '— မြို့နယ် —' : 'တိုင်းအရင်ရွေးပါ'}</option>
            {townships.map((t) => (
              <option key={t.name} value={t.name}>{t.name}</option>
            ))}
          </select>
          <input inputMode="numeric" value={fee} aria-label="ပို့ခ" onChange={(e) => setFee(e.target.value)} placeholder="ပို့ခ (Ks)" className={field} />
          <button
            onClick={add}
            disabled={adding}
            className="my inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50">
            <Plus className="h-4 w-4" /> ထည့်ရန်
          </button>
        </div>
        {err && <p className="my mt-2 text-sm text-brand-600">{err}</p>}
      </div>

      {/* Zone list */}
      <div className="overflow-hidden rounded-2xl border border-cream-200 bg-white">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({length: 4}).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-cream-100" />
            ))}
          </div>
        ) : zones.length === 0 ? (
          <p className="my px-4 py-12 text-center text-sm text-ink-soft">ဇုန် မသတ်မှတ်ရသေးပါ။</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-cream-200 bg-cream-50 text-xs uppercase text-ink-soft">
              <tr>
                <th className="px-4 py-3 font-semibold">တိုင်း/ပြည်နယ်</th>
                <th className="px-4 py-3 font-semibold">မြို့နယ်</th>
                <th className="px-4 py-3 text-right font-semibold">ပို့ခ</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-200">
              {zones.map((z) => (
                <tr key={z.id} className="hover:bg-cream-50/60">
                  <td className="my px-4 py-3 text-ink">{z.region}</td>
                  <td className="my px-4 py-3 text-ink">{z.township}</td>
                  <td className="px-4 py-3 text-right">
                    {editingId === z.id ? (
                      <input
                        inputMode="numeric"
                        value={editFee}
                        aria-label="ပို့ခ ပြင်ရန်"
                        onChange={(e) => setEditFee(e.target.value)}
                        className="w-28 rounded-lg border border-cream-200 bg-cream-50 px-2 py-1 text-right text-sm outline-none focus:border-brand-400"
                      />
                    ) : (
                      <span className="font-semibold text-ink">{ks(z.fee)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {editingId === z.id ? (
                        <button
                          onClick={() => saveEdit(z.id)}
                          className="my inline-flex items-center gap-1 rounded-lg bg-brand-500 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-600">
                          <Check className="h-3.5 w-3.5" /> သိမ်း
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingId(z.id);
                            setEditFee(String(z.fee));
                          }}
                          className="my inline-flex items-center gap-1 rounded-lg border border-cream-200 px-2.5 py-1.5 text-xs font-semibold text-ink hover:bg-cream-100">
                          <Pencil className="h-3.5 w-3.5" /> ပြင်
                        </button>
                      )}
                      <button
                        onClick={() => remove(z)}
                        aria-label="delete"
                        className="grid h-8 w-8 place-items-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
