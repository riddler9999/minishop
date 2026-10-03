import {useEffect, useMemo, useState} from 'react';
import {Plus, Trash2, Check, Pencil, Truck} from 'lucide-react';
import {adminApi} from '@/data/dataSource';
import type {ShippingZone} from '@/domain/shop';
import {ks, cx} from '@/shared/lib/format';
import {regionNames, shippingFee, townshipsOf} from '@/shared/data/locations';
import AdminPageHeader from '@/features/admin/components/AdminPageHeader';
import AdminSurface from '@/features/admin/components/AdminSurface';
import AdminLoadingState from '@/features/admin/components/AdminLoadingState';
import AdminEmptyState from '@/features/admin/components/AdminEmptyState';
import AdminErrorState from '@/features/admin/components/AdminErrorState';

export default function AdminShipping() {
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  // Add-zone form.
  const [region, setRegion] = useState('');
  const [township, setTownship] = useState('');
  const [fee, setFee] = useState('');
  const [adding, setAdding] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFee, setEditFee] = useState('');

  const townships = useMemo(() => townshipsOf(region), [region]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr('');
    adminApi
      .listShippingZones()
      .then((r) => alive && setZones(r.zones))
      .catch((e) => alive && setErr(e.message || 'Could not load shipping zones.'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [reloadKey]);

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
    if (!region || !township) return setErr('Please select a region and township.');
    if (!Number.isFinite(feeN) || feeN < 0) return setErr('Please enter a valid delivery fee.');
    setAdding(true);
    try {
      const {zone} = await adminApi.createShippingZone({region, township, fee: feeN});
      setZones((prev) =>
        [...prev, zone].sort(
          (a, b) => a.region.localeCompare(b.region) || a.township.localeCompare(b.township),
        ),
      );
      setRegion('');
      setTownship('');
      setFee('');
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Could not add shipping zone.');
    } finally {
      setAdding(false);
    }
  };

  const saveEdit = async (id: string) => {
    const feeN = Number(editFee);
    if (!Number.isFinite(feeN) || feeN < 0) return setErr('Please enter a valid delivery fee.');
    setErr('');
    try {
      const {zone} = await adminApi.updateShippingZone(id, {fee: feeN});
      setZones((prev) => prev.map((z) => (z.id === id ? zone : z)));
      setEditingId(null);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Could not update shipping zone.');
    }
  };

  const remove = async (z: ShippingZone) => {
    if (!confirm(`Delete shipping zone for ${z.region} / ${z.township}?`)) return;
    setErr('');
    try {
      await adminApi.deleteShippingZone(z.id);
      setZones((prev) => prev.filter((x) => x.id !== z.id));
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Could not delete shipping zone.');
    }
  };

  const field =
    'w-full rounded-xl border border-[#E1E7E3] bg-[#F4F7F5] px-3.5 py-2.5 text-sm text-[#1F2421] outline-none focus:border-[#35B99D] focus:ring-1 focus:ring-[#35B99D]';

  return (
    <div className="space-y-6 pb-12">
      <AdminPageHeader
        title="Shipping Zones"
        description="Set custom delivery rates by township. Unconfigured townships use your store default delivery fee."
      />

      {err ? (
        <AdminErrorState
          title="Shipping Error"
          description={err}
          onRetry={() => setReloadKey((k) => k + 1)}
        />
      ) : null}

      {/* Add zone form */}
      <AdminSurface>
        <h2 className="text-base font-bold text-[#1F2421]">Add New Zone</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <select
            value={region}
            aria-label="Region / State"
            onChange={(e) => {
              setRegion(e.target.value);
              setTownship('');
            }}
            className={field}
          >
            <option value="">— Region / State —</option>
            {regionNames().map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <select
            value={township}
            aria-label="Township"
            disabled={!region}
            onChange={(e) => onTownship(e.target.value)}
            className={cx(field, !region && 'opacity-60')}
          >
            <option value="">{region ? '— Township —' : 'Select region first'}</option>
            {townships.map((t) => (
              <option key={t.name} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>
          <input
            inputMode="numeric"
            value={fee}
            aria-label="Delivery fee"
            onChange={(e) => setFee(e.target.value)}
            placeholder="Fee (Ks)"
            className={field}
          />
          <button
            type="button"
            onClick={add}
            disabled={adding}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-[#1F2421] px-4 py-2 text-sm font-bold text-white hover:bg-[#303a35] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35B99D] disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Add Zone
          </button>
        </div>
      </AdminSurface>

      {/* Zone list */}
      <AdminSurface>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#1F2421]">Configured Zones</h2>
            <p className="mt-0.5 text-xs text-[#66706C]">
              {zones.length} zone{zones.length === 1 ? '' : 's'} configured
            </p>
          </div>
          <Truck className="h-5 w-5 text-[#66706C]" aria-hidden="true" />
        </div>

        {loading ? (
          <AdminLoadingState message="Loading shipping zones..." />
        ) : zones.length === 0 ? (
          <AdminEmptyState
            title="No custom shipping zones"
            description="All orders will use your default store delivery fee until specific township zones are added."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#E1E7E3] bg-[#F4F7F5] text-xs font-semibold text-[#66706C]">
                <tr>
                  <th className="px-4 py-3">Region / State</th>
                  <th className="px-4 py-3">Township</th>
                  <th className="px-4 py-3 text-right">Delivery Fee</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1E7E3]">
                {zones.map((z) => (
                  <tr key={z.id} className="hover:bg-[#F4F7F5]/60 transition">
                    <td className="px-4 py-3 font-medium text-[#1F2421]">{z.region}</td>
                    <td className="px-4 py-3 text-[#1F2421]">{z.township}</td>
                    <td className="px-4 py-3 text-right">
                      {editingId === z.id ? (
                        <input
                          inputMode="numeric"
                          value={editFee}
                          aria-label="Edit fee"
                          onChange={(e) => setEditFee(e.target.value)}
                          className="w-28 rounded-lg border border-[#E1E7E3] bg-[#FFFFFF] px-2 py-1 text-right text-sm outline-none focus:border-[#35B99D]"
                        />
                      ) : (
                        <span className="font-semibold tabular-nums text-[#1F2421]">{ks(z.fee)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {editingId === z.id ? (
                          <button
                            type="button"
                            onClick={() => saveEdit(z.id)}
                            className="inline-flex min-h-[36px] items-center gap-1 rounded-lg bg-[#35B99D] px-2.5 py-1.5 text-xs font-bold text-white hover:bg-[#29957F] transition"
                          >
                            <Check className="h-3.5 w-3.5" /> Save
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(z.id);
                              setEditFee(String(z.fee));
                            }}
                            className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-[#E1E7E3] px-2.5 py-1.5 text-xs font-semibold text-[#1F2421] hover:bg-[#F4F7F5] transition"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => remove(z)}
                          aria-label="Delete shipping zone"
                          className="grid h-9 w-9 place-items-center rounded-lg border border-[#E1E7E3] text-[#66706C] hover:border-rose-300 hover:text-rose-600 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminSurface>
    </div>
  );
}
