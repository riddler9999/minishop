import {useEffect, useRef, useState} from 'react';
import {Check, Eye, EyeOff, Trash2, Upload, X} from 'lucide-react';
import {PRODUCT_IMAGES_BUCKET} from '@/core/storage/buckets';
import {adminApi} from '@/data/dataSource';
import type {Product, ProductCreateInput, ProductPatch} from '@/domain/product';
import {deriveStoragePath, prepareImageForUpload, validateImageFile} from '@/core/storage/imageUpload';
import {cx} from '@/shared/lib/format';
import {usePlan} from '@/features/billing/plan';
import {UpgradeInline} from '@/features/billing/PlanGate';
import {useModalA11y} from '@/shared/hooks/useModalA11y';

const todayInYangon = () => new Intl.DateTimeFormat('en-CA', {timeZone: 'Asia/Yangon'}).format(new Date());

export default function AdminProductEditor({
  mode,
  product,
  onClose,
  onSaved,
  onDeleted,
}: {
  mode: 'create' | 'edit';
  product?: Product;
  onClose: () => void;
  onSaved: (product: Product) => void;
  onDeleted?: (product: Product) => void;
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
  const [existingImages, setExistingImages] = useState<string[]>(product?.images ?? []);
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<{file: File; previewUrl: string}[]>([]);
  const [imageErr, setImageErr] = useState('');
  const [description, setDescription] = useState(product?.description ?? '');
  const [arrivalDate, setArrivalDate] = useState(product?.arrivalDate ? product.arrivalDate.slice(0, 10) : isEdit ? '' : todayInYangon());
  const [hidden, setHidden] = useState(product ? product.status !== 'active' : false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [err, setErr] = useState('');

  const newFilesRef = useRef(newFiles);
  newFilesRef.current = newFiles;
  useEffect(() => () => newFilesRef.current.forEach((file) => URL.revokeObjectURL(file.previewUrl)), []);

  const panelRef = useModalA11y<HTMLDivElement>(onClose);
  const field = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-violet-400 focus-visible:ring-2 focus-visible:ring-violet-200';
  const label = 'mb-1 block text-xs font-semibold text-slate-600';

  const onFilesSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
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
    if (accepted.length) setNewFiles((previous) => [...previous, ...accepted]);
  };

  const save = async () => {
    const priceN = Number(price);
    const stockN = Number(stock);
    const promoN = promoPrice.trim() === '' ? null : Number(promoPrice);
    if (!name.trim()) return setErr('Product name is required.');
    if (!Number.isFinite(priceN) || priceN < 0) return setErr('Enter a valid price.');
    if (!Number.isInteger(stockN) || stockN < 0) return setErr('Enter a valid stock quantity.');
    if (isPromotion && (promoN == null || !Number.isFinite(promoN) || promoN < 0 || promoN >= priceN)) {
      return setErr('Promotion price must be lower than the regular price.');
    }

    setErr('');
    setSaving(true);
    const newlyUploaded: {url: string; path: string}[] = [];

    try {
      for (const {file} of newFiles) {
        const prepared = await prepareImageForUpload(file);
        newlyUploaded.push(await adminApi.uploadProductImage(prepared, product?.id));
      }

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
        images: [...existingImages, ...newlyUploaded.map((item) => item.url)],
        description: description.trim(),
        arrivalDate: arrivalDate ? new Date(arrivalDate).toISOString() : null,
      };

      let saved: Product;
      if (isEdit && product) {
        const patch: ProductPatch = {...common, itemCode: itemCode.trim()};
        saved = (await adminApi.updateProduct(product.id, patch)).product;
      } else {
        const input: ProductCreateInput = {...common, itemCode: itemCode.trim() || undefined};
        saved = (await adminApi.createProduct(input)).product;
      }

      await Promise.all(removedImages.map((url) => {
        const path = deriveStoragePath(url, PRODUCT_IMAGES_BUCKET);
        return path ? adminApi.deleteProductImage(path).catch(() => {}) : Promise.resolve();
      }));

      onSaved(saved);
    } catch (error: any) {
      await Promise.all(newlyUploaded.map(({path}) => adminApi.deleteProductImage(path).catch(() => {})));
      setErr(error.message || 'Product could not be saved.');
      setSaving(false);
    }
  };

  const removeProduct = async () => {
    if (!product || !onDeleted) return;
    if (!window.confirm(`Delete "${product.name}"? This will free one product slot.`)) return;
    setDeleting(true);
    setErr('');
    try {
      await adminApi.deleteProduct(product.id);
      await Promise.all(product.images.map((url) => {
        const path = deriveStoragePath(url, PRODUCT_IMAGES_BUCKET);
        return path ? adminApi.deleteProductImage(path).catch(() => {}) : Promise.resolve();
      }));
      onDeleted(product);
    } catch (error: any) {
      setErr(error.message || 'Product could not be deleted.');
      setDeleting(false);
    }
  };

  const section = (title: string, children: React.ReactNode) => (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-bold text-slate-950">{title}</h3>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button type="button" aria-label="Close product editor" className="absolute inset-0 bg-slate-950/50" onClick={onClose} />
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="product-editor-title" tabIndex={-1} className="relative flex max-h-[94vh] w-full max-w-2xl flex-col rounded-t-2xl bg-slate-50 shadow-xl outline-none sm:rounded-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:rounded-t-2xl">
          <div>
            <h2 id="product-editor-title" className="text-lg font-bold text-slate-950">{isEdit ? 'Edit Product' : 'Add Product'}</h2>
            <p className="mt-1 text-xs text-slate-500">Manage existing catalog fields without changing product-domain behavior.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close product editor" className="grid h-10 w-10 place-items-center rounded-lg text-slate-600 hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          {section('General', <>
            <label className="block"><span className={label}>Name</span><input value={name} onChange={(e) => setName(e.target.value)} className={field} /></label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label><span className={label}>Item code</span><input value={itemCode} onChange={(e) => setItemCode(e.target.value)} className={field} /></label>
              <label><span className={label}>Category</span><input value={category} onChange={(e) => setCategory(e.target.value)} className={field} /></label>
              <label><span className={label}>Color</span><input value={color} onChange={(e) => setColor(e.target.value)} className={field} /></label>
              <label><span className={label}>Size</span><input value={size} onChange={(e) => setSize(e.target.value)} className={field} /></label>
            </div>
            <label className="block"><span className={label}>Description</span><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={cx(field, 'resize-y')} /></label>
          </>)}

          {section('Media', <>
            <div className="flex flex-wrap gap-2">
              {existingImages.map((url) => (
                <div key={url} className="relative">
                  <img src={url} alt="" className="h-16 w-16 rounded-lg border border-slate-200 object-cover" />
                  <button type="button" onClick={() => {setExistingImages((prev) => prev.filter((item) => item !== url)); setRemovedImages((prev) => [...prev, url]);}} aria-label="Remove image" className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-slate-950 text-white"><X className="h-3 w-3" /></button>
                </div>
              ))}
              {newFiles.map(({previewUrl}) => (
                <div key={previewUrl} className="relative">
                  <img src={previewUrl} alt="" className="h-16 w-16 rounded-lg border border-slate-200 object-cover" />
                  <button type="button" onClick={() => setNewFiles((prev) => prev.filter((item) => item.previewUrl !== previewUrl))} aria-label="Remove staged image" className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-slate-950 text-white"><X className="h-3 w-3" /></button>
                </div>
              ))}
              <label className="grid h-16 w-16 cursor-pointer place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-500 hover:bg-slate-100">
                <Upload className="h-5 w-5" /><input type="file" accept="image/png,image/webp" multiple className="hidden" onChange={onFilesSelected} />
              </label>
            </div>
            <p className="text-xs text-slate-500">PNG or WebP only.</p>
            {imageErr ? <p className="text-sm text-rose-700">{imageErr}</p> : null}
          </>)}

          {section('Pricing', <>
            <div className="grid gap-3 sm:grid-cols-2">
              <label><span className={label}>Price (Ks)</span><input inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} className={field} /></label>
              {features.promotions ? (
                <label><span className={label}>Promotion price (Ks)</span><input inputMode="numeric" disabled={!isPromotion} value={promoPrice} onChange={(e) => setPromoPrice(e.target.value)} className={field} /></label>
              ) : <UpgradeInline label="Promotion pricing" />}
            </div>
            {features.promotions ? <label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={isPromotion} onChange={(e) => setIsPromotion(e.target.checked)} /> Enable promotion price</label> : null}
          </>)}

          {section('Inventory', <>
            <div className="grid gap-3 sm:grid-cols-2">
              <label><span className={label}>Stock</span><input inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value)} className={field} /></label>
              <label><span className={label}>Arrival date</span><input type="date" value={arrivalDate} onChange={(e) => setArrivalDate(e.target.value)} className={field} /></label>
            </div>
          </>)}

          {section('Store Visibility', <>
            <button type="button" onClick={() => setHidden((value) => !value)} className={cx('flex w-full items-center justify-between rounded-lg border px-3 py-3 text-sm font-semibold', hidden ? 'border-slate-200 bg-slate-100 text-slate-700' : 'border-emerald-200 bg-emerald-50 text-emerald-800')}>
              <span className="flex items-center gap-2">{hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}{hidden ? 'Hidden from storefront' : 'Visible on storefront'}</span>
              <span className="text-xs">{hidden ? 'Show' : 'Hide'}</span>
            </button>
          </>)}

          {err ? <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{err}</p> : null}
        </div>

        <footer className="flex flex-wrap gap-2 border-t border-slate-200 bg-white p-4 sm:rounded-b-2xl">
          {isEdit && product ? <button type="button" onClick={removeProduct} disabled={saving || deleting} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-rose-200 px-3 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"><Trash2 className="h-4 w-4" /> {deleting ? 'Deleting…' : 'Delete'}</button> : null}
          <button type="button" onClick={onClose} disabled={deleting} className="ml-auto min-h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
          <button type="button" onClick={() => void save()} disabled={saving || deleting} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-violet-600 px-4 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"><Check className="h-4 w-4" /> {saving ? 'Saving…' : 'Save Product'}</button>
        </footer>
      </div>
    </div>
  );
}
