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
import AdminButton from '@/features/admin/components/AdminButton';

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
  const field = 'w-full min-h-11 rounded-lg border border-[#E1E7E3] bg-white px-3 py-2 text-sm text-[#1F2421] outline-none transition focus:border-[#35B99D] focus-visible:ring-2 focus-visible:ring-[#D8F1EA]';
  const label = 'mb-1.5 block text-xs font-semibold text-[#66706C]';

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
    <section className="rounded-xl border border-[#E1E7E3] bg-white p-4 sm:p-5 shadow-sm">
      <h3 className="text-sm font-bold text-[#1F2421]">{title}</h3>
      <div className="mt-3.5 space-y-3">{children}</div>
    </section>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button type="button" aria-label="Close product editor" className="absolute inset-0 bg-[#1F2421]/60 backdrop-blur-xs" onClick={onClose} />
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="product-editor-title" tabIndex={-1} className="relative flex max-h-[94vh] w-full max-w-2xl flex-col rounded-t-2xl bg-[#F4F7F5] shadow-xl outline-none sm:rounded-2xl border border-[#E1E7E3]">
        <header className="flex items-center justify-between border-b border-[#E1E7E3] bg-white px-5 py-4 sm:rounded-t-2xl">
          <div>
            <h2 id="product-editor-title" className="text-lg font-bold text-[#1F2421]">{isEdit ? 'Edit Product' : 'Add Product'}</h2>
            <p className="mt-0.5 text-xs text-[#66706C]">Manage existing catalog fields without changing product-domain behavior.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close product editor"
            className="grid h-11 w-11 place-items-center rounded-lg text-[#66706C] hover:bg-[#F4F7F5] hover:text-[#1F2421] transition">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          {section('General', <>
            <label className="block">
              <span className={label}>Name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Classic Linen Shirt" className={field} />
            </label>
            <label className="block">
              <span className={label}>Description</span>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Describe product details, fit, and materials" className={cx(field, 'min-h-[80px] resize-y')} />
            </label>
          </>)}

          {section('Media', <>
            <div className="flex flex-wrap gap-2.5">
              {existingImages.map((url) => (
                <div key={url} className="relative">
                  <img src={url} alt="" className="h-16 w-16 rounded-lg border border-[#E1E7E3] object-cover" />
                  <button
                    type="button"
                    onClick={() => {setExistingImages((prev) => prev.filter((item) => item !== url)); setRemovedImages((prev) => [...prev, url]);}}
                    aria-label="Remove image"
                    className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-[#1F2421] text-white hover:bg-rose-600 transition shadow-sm">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {newFiles.map(({previewUrl}) => (
                <div key={previewUrl} className="relative">
                  <img src={previewUrl} alt="" className="h-16 w-16 rounded-lg border border-[#35B99D] object-cover" />
                  <button
                    type="button"
                    onClick={() => setNewFiles((prev) => prev.filter((item) => item.previewUrl !== previewUrl))}
                    aria-label="Remove staged image"
                    className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-[#1F2421] text-white hover:bg-rose-600 transition shadow-sm">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <label className="grid h-16 w-16 min-h-[44px] min-w-[44px] cursor-pointer place-items-center rounded-lg border-2 border-dashed border-[#E1E7E3] bg-[#F4F7F5] text-[#66706C] hover:border-[#35B99D] hover:text-[#1F2421] transition">
                <Upload className="h-5 w-5" />
                <input type="file" accept="image/png,image/webp" multiple className="hidden" onChange={onFilesSelected} />
              </label>
            </div>
            <p className="text-xs text-[#66706C]">PNG or WebP only. Maximum upload size applies.</p>
            {imageErr ? <p className="text-sm font-medium text-rose-700">{imageErr}</p> : null}
          </>)}

          {section('Pricing', <>
            <div className="grid gap-3 sm:grid-cols-2">
              <label>
                <span className={label}>Price (Ks)</span>
                <input inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" className={field} />
              </label>
              {features.promotions ? (
                <label>
                  <span className={label}>Promotion price (Ks)</span>
                  <input inputMode="numeric" disabled={!isPromotion} value={promoPrice} onChange={(e) => setPromoPrice(e.target.value)} placeholder="0" className={field} />
                </label>
              ) : <UpgradeInline label="Promotion pricing" />}
            </div>
            {features.promotions ? (
              <label className="flex items-center gap-2 text-sm font-medium text-[#1F2421] cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isPromotion}
                  onChange={(e) => setIsPromotion(e.target.checked)}
                  className="h-4 w-4 rounded border-[#E1E7E3] text-[#35B99D] focus:ring-[#35B99D]"
                />
                Enable promotion price
              </label>
            ) : null}
          </>)}

          {section('Inventory', <>
            <div className="grid gap-3 sm:grid-cols-3">
              <label>
                <span className={label}>Stock</span>
                <input inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="0" className={field} />
              </label>
              <label>
                <span className={label}>Item code</span>
                <input value={itemCode} onChange={(e) => setItemCode(e.target.value)} placeholder="e.g. SKU-001" className={field} />
              </label>
              <label>
                <span className={label}>Arrival date</span>
                <input type="date" value={arrivalDate} onChange={(e) => setArrivalDate(e.target.value)} className={field} />
              </label>
            </div>
          </>)}

          {section('Product Organization', <>
            <div className="grid gap-3 sm:grid-cols-3">
              <label>
                <span className={label}>Category</span>
                <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Tops" className={field} />
              </label>
              <label>
                <span className={label}>Color</span>
                <input value={color} onChange={(e) => setColor(e.target.value)} placeholder="e.g. White" className={field} />
              </label>
              <label>
                <span className={label}>Size</span>
                <input value={size} onChange={(e) => setSize(e.target.value)} placeholder="e.g. Medium" className={field} />
              </label>
            </div>
          </>)}

          {section('Store Visibility', <>
            <button
              type="button"
              onClick={() => setHidden((value) => !value)}
              className={cx(
                'flex w-full min-h-11 items-center justify-between rounded-lg border px-4 py-3 text-sm font-semibold transition',
                hidden
                  ? 'border-[#E1E7E3] bg-[#F4F7F5] text-[#66706C]'
                  : 'border-[#D8F1EA] bg-[#EEF9F6] text-[#29957F]',
              )}>
              <span className="flex items-center gap-2">
                {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {hidden ? 'Hidden from storefront' : 'Visible on storefront'}
              </span>
              <span className="text-xs font-bold underline">{hidden ? 'Show' : 'Hide'}</span>
            </button>
          </>)}

          {err ? <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-sm font-medium text-rose-800">{err}</div> : null}
        </div>

        <footer className="flex flex-wrap items-center gap-2.5 border-t border-[#E1E7E3] bg-white p-4 sm:rounded-b-2xl">
          {isEdit && product ? (
            <AdminButton
              type="button"
              variant="danger"
              size="md"
              onClick={removeProduct}
              disabled={saving || deleting}>
              <Trash2 className="h-4 w-4" /> {deleting ? 'Deleting…' : 'Delete'}
            </AdminButton>
          ) : null}
          <div className="ml-auto flex items-center gap-2">
            <AdminButton
              type="button"
              variant="secondary"
              size="md"
              onClick={onClose}
              disabled={deleting}>
              Cancel
            </AdminButton>
            <AdminButton
              type="button"
              variant="mint"
              size="md"
              onClick={() => void save()}
              disabled={saving || deleting}>
              <Check className="h-4 w-4" /> {saving ? 'Saving…' : 'Save Product'}
            </AdminButton>
          </div>
        </footer>
      </div>
    </div>
  );
}

