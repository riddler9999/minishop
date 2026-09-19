import {useEffect, useMemo, useRef, useState} from 'react';
import {Search, Pencil, Plus, X, Check, EyeOff, Eye, Upload} from 'lucide-react';
import {PRODUCT_IMAGES_BUCKET} from '@/core/storage/buckets';
import {adminApi} from '@/data/dataSource';
import type {Product, ProductCreateInput, ProductPatch} from '@/domain/product';
import {validateImageFile, prepareImageForUpload, deriveStoragePath} from '@/core/storage/imageUpload';
import {ks, cx} from '@/shared/lib/format';
import {usePlan} from '@/features/billing/plan';
import {UpgradeInline} from '@/features/billing/PlanGate';
import {useModalA11y} from '@/shared/hooks/useModalA11y';

// Today's date (YYYY-MM-DD) in the seller's timezone (Asia/Yangon, UTC+6:30) —
// NOT UTC, so a product entered in the early Myanmar morning still dates today.
const todayInYangon = () => new Intl.DateTimeFormat('en-CA', {timeZone: 'Asia/Yangon'}).format(new Date());

// ---- Create / edit modal ---------------------------------------------------
// One modal for both flows: `create` (no product) inserts a new row; `edit`
// patches an existing one. Consolidated because the two forms are otherwise
// near-identical over ~12 fields.
function ProductModal({
  mode,
  product,
  onClose,
  onSaved,
}: {
  mode: 'create' | 'edit';
  product?: Product;
  onClose: () => void;
  onSaved: (p: Product) => void;
}) {
  const {features} = usePlan();
  const isEdit = mode === 'edit';
  const [name, setName] = useState(product?.name ?? '');
  const [itemCode, setItemCode] = useState(product?.itemCode ?? '');
  const [category, setCategory] = useState(product?.category ?? '');
  const [color, setColor] = useState(product?.color ?? '');
  const [size, setSize] = useState(product?.size ?? '');
  const [price, setPrice] = useState(product ? String(product.price) : '');
  const [isPromotion, setIsPromotion] = useState(product?.isPromotion ?? false);
  const [promoPrice, setPromoPrice] = useState(product?.promoPrice != null ? String(product.promoPrice) : '');
  const [stock, setStock] = useState(product ? String(product.stock) : '0');
  // Images the seller kept from a prior save (URLs only — no Storage path on
  // hand, see PROJECT.md Task B point 4) versus ones removed this session
  // (deleted from Storage only after a successful write stops referencing
  // them) versus newly-picked local files (uploaded only inside save()).
  const [existingImages, setExistingImages] = useState<string[]>(product?.images ?? []);
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<{file: File; previewUrl: string}[]>([]);
  const [imageErr, setImageErr] = useState('');
  const [description, setDescription] = useState(product?.description ?? '');
  // Default a NEW product's arrival date to today so it sorts newest-first.
  // In edit mode, preserve the product's existing value (blank if it was null) —
  // never silently backdate a null-arrival product to today on an unrelated edit,
  // which would jump it to the top of "newest arrivals" (an empty input saves null).
  const [arrivalDate, setArrivalDate] = useState(
    product?.arrivalDate ? product.arrivalDate.slice(0, 10) : isEdit ? '' : todayInYangon(),
  );
  const [hidden, setHidden] = useState(product ? product.status !== 'active' : false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  // Cancel (onClose) never uploads anything, so the only cleanup a staged
  // pick needs is its local object-URL preview — a ref keeps this a
  // once-on-unmount effect rather than re-running on every pick.
  const newFilesRef = useRef(newFiles);
  newFilesRef.current = newFiles;
  useEffect(
    () => () => {
      newFilesRef.current.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    },
    [],
  );

  const onFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ''; // allow re-selecting the same file later
    if (files.length === 0) return;
    setImageErr('');
    const accepted: {file: File; previewUrl: string}[] = [];
    for (const file of files) {
      const validationError = validateImageFile(file);
      if (validationError) {
        setImageErr(validationError);
        continue;
      }
      accepted.push({file, previewUrl: URL.createObjectURL(file)});
    }
    if (accepted.length) setNewFiles((prev) => [...prev, ...accepted]);
  };

  const removeExistingImage = (url: string) => {
    setExistingImages((prev) => prev.filter((u) => u !== url));
    setRemovedImages((prev) => [...prev, url]);
  };

  const removeNewFile = (previewUrl: string) => {
    setNewFiles((prev) => {
      const found = prev.find((f) => f.previewUrl === previewUrl);
      if (found) URL.revokeObjectURL(found.previewUrl);
      return prev.filter((f) => f.previewUrl !== previewUrl);
    });
  };

  const save = async () => {
    const priceN = Number(price);
    const stockN = Number(stock);
    const promoN = promoPrice.trim() === '' ? null : Number(promoPrice);
    if (!name.trim()) return setErr('အမည် ဖြည့်ပါ။');
    if (!Number.isFinite(priceN) || priceN < 0) return setErr('ဈေးနှုန်း မမှန်ပါ။');
    if (!Number.isInteger(stockN) || stockN < 0) return setErr('Stock မမှန်ပါ။');
    if (isPromotion) {
      if (promoN == null || !Number.isFinite(promoN) || promoN < 0) return setErr('Promo ဈေး ဖြည့်ပါ။');
      if (promoN >= priceN) return setErr('Promo ဈေးသည် ပုံမှန်ဈေးထက် နည်းရမည်။');
    }
    const arrival = arrivalDate ? new Date(arrivalDate).toISOString() : null;
    setErr('');
    setSaving(true);

    // Upload every staged file BEFORE writing the row, tracking what THIS
    // attempt uploaded — if a later file in the batch fails, undo only that
    // (nothing else has been touched yet). See PROJECT.md Task B invariant.
    const newlyUploaded: {url: string; path: string}[] = [];
    try {
      for (const {file} of newFiles) {
        const prepared = await prepareImageForUpload(file);
        const {url, path} = await adminApi.uploadProductImage(prepared, product?.id);
        newlyUploaded.push({url, path});
      }
    } catch (e: any) {
      await Promise.all(newlyUploaded.map(({path}) => adminApi.deleteProductImage(path).catch(() => {})));
      setErr(e.message || 'ပုံ တင်၍မရပါ။');
      setSaving(false);
      return;
    }

    // The write must receive the COMPLETE final list — appending after a
    // successful write would persist the stale one instead.
    const imageList = [...existingImages, ...newlyUploaded.map((u) => u.url)];

    try {
      const common = {
        name: name.trim(),
        category: category.trim() || null,
        color: color.trim() || null,
        size: size.trim() || null,
        price: priceN,
        stock: stockN,
        isPromotion,
        promoPrice: isPromotion ? promoN : null,
        status: hidden ? 'hidden' : 'active',
        images: imageList,
        description: description.trim(),
        arrivalDate: arrival,
      };
      let saved: Product;
      if (isEdit && product) {
        const patch: ProductPatch = {...common, itemCode: itemCode.trim()};
        const {product: updated} = await adminApi.updateProduct(product.id, patch);
        saved = updated;
      } else {
        const input: ProductCreateInput = {...common, itemCode: itemCode.trim() || undefined};
        const {product: created} = await adminApi.createProduct(input);
        saved = created;
      }
      // Only after the write succeeds is it safe to delete images the seller
      // removed this session — deleting first risks stranding a live
      // reference if the write above had failed instead.
      await Promise.all(
        removedImages.map((url) => {
          const path = deriveStoragePath(url, PRODUCT_IMAGES_BUCKET);
          return path ? adminApi.deleteProductImage(path).catch(() => {}) : Promise.resolve();
        }),
      );
      onSaved(saved);
    } catch (e: any) {
      // The row write failed — undo only this attempt's uploads. The
      // removed-image objects are untouched: the row was never rewritten, so
      // they're still correctly referenced.
      await Promise.all(newlyUploaded.map(({path}) => adminApi.deleteProductImage(path).catch(() => {})));
      setErr(e.message || 'သိမ်း၍ မရပါ။');
      setSaving(false);
    }
  };

  const field = 'w-full rounded-xl border border-cream-200 bg-cream-50 px-3 py-2 text-sm outline-none focus:border-brand-400';
  const lbl = 'my mb-1 block text-xs font-semibold text-ink-soft';

  const panelRef = useModalA11y<HTMLDivElement>(onClose);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button type="button" aria-label="close" className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
        tabIndex={-1}
        className="relative flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-2xl bg-white shadow-xl outline-none sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-cream-200 px-5 py-4">
          <h3 id="product-modal-title" className="font-display text-base font-bold text-ink">
            {isEdit ? 'ပစ္စည်း ပြင်ဆင်ရန်' : 'ပစ္စည်းအသစ် ထည့်ရန်'}
          </h3>
          <button onClick={onClose} aria-label="close" className="grid h-8 w-8 place-items-center rounded-lg text-ink-soft hover:bg-cream-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          <label className="block">
            <span className={lbl}>အမည် <span className="text-brand-600">*</span></span>
            <input value={name} onChange={(e) => setName(e.target.value)} className={field} placeholder="ပစ္စည်းအမည်" />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={lbl}>Item code</span>
              <input value={itemCode} onChange={(e) => setItemCode(e.target.value)} className={field} placeholder="(optional)" />
            </label>
            <label className="block">
              <span className={lbl}>အမျိုးအစား</span>
              <input value={category} onChange={(e) => setCategory(e.target.value)} className={field} placeholder="ဥပမာ — အင်္ကျီ" />
            </label>
            <label className="block">
              <span className={lbl}>အရောင်</span>
              <input value={color} onChange={(e) => setColor(e.target.value)} className={field} placeholder="(optional)" />
            </label>
            <label className="block">
              <span className={lbl}>Size</span>
              <input value={size} onChange={(e) => setSize(e.target.value)} className={field} placeholder="(optional)" />
            </label>
            <label className="block">
              <span className={lbl}>ဈေးနှုန်း (Ks) <span className="text-brand-600">*</span></span>
              <input inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} className={field} placeholder="0" />
            </label>
            <label className="block">
              <span className={lbl}>Stock</span>
              <input inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value)} className={field} placeholder="0" />
            </label>
          </div>

          {features.promotions ? (
            <>
              <label className="flex items-center justify-between rounded-xl border border-cream-200 bg-cream-50 px-3 py-2.5">
                <span className="my text-sm font-semibold text-ink">Promotion</span>
                <input type="checkbox" checked={isPromotion} onChange={(e) => setIsPromotion(e.target.checked)} className="h-4 w-4 accent-brand-500" />
              </label>
              {isPromotion && (
                <label className="block">
                  <span className={lbl}>Promo ဈေး (Ks)</span>
                  <input inputMode="numeric" value={promoPrice} onChange={(e) => setPromoPrice(e.target.value)} className={field} placeholder="ဥပမာ 17500" />
                </label>
              )}
            </>
          ) : (
            <UpgradeInline label="Promotion ဈေးနှုန်း" />
          )}

          <div className="block">
            <span className={lbl}>ပုံများ</span>
            <div className="flex flex-wrap gap-2">
              {existingImages.map((url) => (
                <div key={url} className="relative">
                  <img src={url} alt="" className="h-16 w-16 rounded-lg border border-cream-200 object-cover" />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(url)}
                    aria-label="ပုံ ဖယ်ရှားရန်"
                    className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-ink text-white shadow">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {newFiles.map(({previewUrl}) => (
                <div key={previewUrl} className="relative">
                  <img src={previewUrl} alt="" className="h-16 w-16 rounded-lg border border-cream-200 object-cover" />
                  <button
                    type="button"
                    onClick={() => removeNewFile(previewUrl)}
                    aria-label="ပုံ ဖယ်ရှားရန်"
                    className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-ink text-white shadow">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <label className="grid h-16 w-16 cursor-pointer place-items-center rounded-lg border border-dashed border-cream-300 bg-cream-50 text-ink-soft hover:bg-cream-100">
                <Upload className="h-5 w-5" />
                <input type="file" accept="image/png,image/webp" multiple className="hidden" onChange={onFilesSelected} />
              </label>
            </div>
            <span className="my mt-1.5 block text-[11px] text-ink-soft">PNG သို့မဟုတ် WebP ပုံဖိုင်သာ တင်နိုင်သည် (JPG/JPEG လက်မခံပါ)။</span>
            {imageErr && <p className="my mt-1 text-sm text-brand-600">{imageErr}</p>}
          </div>

          <label className="block">
            <span className={lbl}>ဖော်ပြချက်</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={cx(field, 'resize-y')} placeholder="(optional)" />
          </label>

          <label className="block">
            <span className={lbl}>ရောက်ရှိသည့်ရက်</span>
            <input type="date" value={arrivalDate} onChange={(e) => setArrivalDate(e.target.value)} className={field} />
          </label>

          <button
            onClick={() => setHidden((v) => !v)}
            className={cx(
              'my flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-semibold transition',
              hidden ? 'border-cream-200 bg-cream-100 text-ink-soft' : 'border-emerald-200 bg-emerald-50 text-emerald-700',
            )}>
            <span className="flex items-center gap-2">
              {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {hidden ? 'ဆိုင်တွင် ဖုံးထားသည်' : 'ဆိုင်တွင် ဖော်ပြသည်'}
            </span>
            <span className="text-xs">{hidden ? 'ပြန်ဖော်ရန် နှိပ်ပါ' : 'ဖုံးရန် နှိပ်ပါ'}</span>
          </button>

          {err && <p className="my text-sm text-brand-600">{err}</p>}
        </div>

        <div className="flex gap-2 border-t border-cream-200 p-4">
          <button onClick={onClose} className="my flex-1 rounded-xl border border-cream-200 py-2.5 text-sm font-semibold text-ink hover:bg-cream-100">
            မလုပ်တော့ပါ
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="my flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-500 py-2.5 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50">
            <Check className="h-4 w-4" /> {saving ? 'သိမ်းနေသည်…' : isEdit ? 'သိမ်းရန်' : 'ထည့်ရန်'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Page ------------------------------------------------------------------
export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);

  const load = () => {
    setLoading(true);
    adminApi.listProducts().then((r) => {
      setProducts(r.products);
      setLoading(false);
    });
  };

  useEffect(load, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.itemCode.toLowerCase().includes(term) ||
        (p.category ?? '').toLowerCase().includes(term),
    );
  }, [products, q]);

  const onEdited = (updated: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setEditing(null);
  };

  const onCreated = (created: Product) => {
    setProducts((prev) => [created, ...prev]);
    setCreating(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">ပစ္စည်း စီမံခန့်ခွဲမှု</h1>
          <p className="my mt-1 text-sm text-ink-soft">{products.length} မျိုး · အသစ်ထည့် / ပြင်ဆင် / ဖော်ပြမှု စီမံနိုင်သည်</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="my inline-flex items-center justify-center gap-1.5 rounded-full bg-brand-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-600">
          <Plus className="h-4 w-4" /> ပစ္စည်းအသစ်ထည့်ရန်
        </button>
      </div>

      <div className="flex items-center gap-2 rounded-full border border-cream-200 bg-white px-4 py-2 shadow-sm focus-within:border-brand-400 sm:max-w-sm">
        <Search className="h-4 w-4 text-ink-soft" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="အမည် / code / အမျိုးအစား ရှာရန်…"
          className="my w-full bg-transparent text-sm outline-none placeholder:text-ink-soft"
        />
      </div>

      {/* Table (desktop) / cards (mobile) */}
      <div className="overflow-hidden rounded-2xl border border-cream-200 bg-white">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({length: 6}).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-cream-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="my px-4 py-12 text-center text-sm text-ink-soft">ကိုက်ညီသော ပစ္စည်း မတွေ့ပါ။</p>
        ) : (
          <>
            {/* Desktop table */}
            <table className="hidden w-full text-left text-sm md:table">
              <thead className="border-b border-cream-200 bg-cream-50 text-xs uppercase text-ink-soft">
                <tr>
                  <th className="px-4 py-3 font-semibold">ပစ္စည်း</th>
                  <th className="px-4 py-3 font-semibold">အမျိုးအစား</th>
                  <th className="px-4 py-3 text-right font-semibold">ဈေး</th>
                  <th className="px-4 py-3 text-right font-semibold">Stock</th>
                  <th className="px-4 py-3 text-center font-semibold">အခြေအနေ</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-cream-50/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={p.image || ''} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" loading="lazy" />
                        <div className="min-w-0">
                          <p className="my max-w-[220px] truncate font-semibold text-ink">{p.name}</p>
                          <p className="my text-xs text-ink-soft">{p.itemCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="my px-4 py-3 text-ink-soft">{p.category || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      {p.isPromotion && p.promoPrice != null ? (
                        <span>
                          <span className="font-bold text-brand-600">{ks(p.promoPrice)}</span>
                          <span className="my ml-1 text-xs text-ink-soft line-through">{ks(p.price)}</span>
                        </span>
                      ) : (
                        <span className="font-semibold text-ink">{ks(p.price)}</span>
                      )}
                    </td>
                    <td className={cx('px-4 py-3 text-right font-semibold', p.stock <= 0 ? 'text-red-600' : p.stock <= 5 ? 'text-amber-600' : 'text-ink')}>
                      {p.stock}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusPill status={p.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setEditing(p)}
                        className="my inline-flex items-center gap-1 rounded-lg border border-cream-200 px-2.5 py-1.5 text-xs font-semibold text-ink hover:bg-cream-100">
                        <Pencil className="h-3.5 w-3.5" /> ပြင်
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile cards */}
            <ul className="divide-y divide-cream-200 md:hidden">
              {filtered.map((p) => (
                <li key={p.id} className="flex items-center gap-3 p-3">
                  <img src={p.image || ''} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" loading="lazy" />
                  <div className="min-w-0 flex-1">
                    <p className="my truncate text-sm font-semibold text-ink">{p.name}</p>
                    <p className="my text-xs text-ink-soft">{p.itemCode} · {p.category || '—'}</p>
                    <div className="my mt-1 flex items-center gap-2 text-sm">
                      {p.isPromotion && p.promoPrice != null ? (
                        <span className="font-bold text-brand-600">{ks(p.promoPrice)}</span>
                      ) : (
                        <span className="font-semibold text-ink">{ks(p.price)}</span>
                      )}
                      <span className={cx('text-xs font-semibold', p.stock <= 0 ? 'text-red-600' : p.stock <= 5 ? 'text-amber-600' : 'text-ink-soft')}>
                        · {p.stock} ကျန်
                      </span>
                      <StatusPill status={p.status} />
                    </div>
                  </div>
                  <button
                    onClick={() => setEditing(p)}
                    aria-label="edit"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-cream-200 text-ink hover:bg-cream-100">
                    <Pencil className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {editing && <ProductModal mode="edit" product={editing} onClose={() => setEditing(null)} onSaved={onEdited} />}
      {creating && <ProductModal mode="create" onClose={() => setCreating(false)} onSaved={onCreated} />}
    </div>
  );
}

function StatusPill({status}: {status: string}) {
  const active = status === 'active';
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold',
        active ? 'bg-emerald-100 text-emerald-700' : 'bg-cream-200 text-ink-soft',
      )}>
      {active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
      {active ? 'ဖော်ပြ' : 'ဖုံး'}
    </span>
  );
}
