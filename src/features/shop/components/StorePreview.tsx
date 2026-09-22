// ---- SHOP: Store Design live preview ----------------------------------------
// A self-contained, phone-framed mock of the buyer storefront driven by the
// DRAFT theme — the "canvas" half of the Shopify-style editor. It deliberately
// re-implements a compact version of the storefront layout (rather than
// embedding the real pages) so the preview updates instantly from local state,
// needs no tenant routing/data-source wiring, and can never mutate real data.
// The seller's real products/categories are passed in so it feels like their
// shop.

import {ArrowRight, ImageOff, Search, ShoppingBag} from 'lucide-react';
import type {Product} from '@/domain/product';
import type {StorefrontTheme} from '@/domain/theme';
import {FONT_PAIRINGS} from '@/domain/fontPairing';
import {ks} from '@/shared/lib/format';

export type PreviewPage = 'home' | 'category' | 'product';

interface PreviewProps {
  theme: StorefrontTheme;
  page: PreviewPage;
  products: Product[];
  categories: string[];
  shopName: string;
  logoUrl: string | null;
}

function productImage(p: Product | undefined): string | null {
  return p ? p.images[0] ?? p.image ?? null : null;
}

function MiniProductCard({product, theme}: {product: Product; theme: StorefrontTheme}) {
  const img = productImage(product);
  const price = product.isPromotion && product.promoPrice ? product.promoPrice : product.price;
  return (
    <div className="overflow-hidden rounded-xl border border-rose-100 bg-white">
      <div className="aspect-square bg-rose-50">
        {img ? <img src={img} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center text-rose-200"><ImageOff className="h-6 w-6" /></div>}
      </div>
      <div className="p-2">
        <p style={{fontFamily: FONT_PAIRINGS[theme.fontPairing].display}} className="truncate text-[11px] font-medium text-slate-700">{product.name}</p>
        <p className="text-[11px] font-bold text-slate-900">{ks(price)}</p>
      </div>
    </div>
  );
}

function PreviewHeader({shopName, logoUrl}: {shopName: string; logoUrl: string | null}) {
  return (
    <div className="flex items-center justify-between border-b border-rose-100 px-3 py-2.5">
      <span className="grid h-7 w-7 place-items-center rounded-full text-slate-500">☰</span>
      <span className="flex items-center gap-1.5 truncate text-sm font-bold text-slate-900">
        {logoUrl ? <img src={logoUrl} alt="" className="h-5 w-5 rounded-full object-cover" /> : <ShoppingBag className="h-4 w-4 text-rose-500" />}
        <span className="max-w-[140px] truncate">{shopName}</span>
      </span>
      <ShoppingBag className="h-4 w-4 text-slate-500" />
    </div>
  );
}

function HomePreview({theme, products, categories, shopName, logoUrl}: Omit<PreviewProps, 'page'>) {
  const hero = productImage(products[0]);
  const heroImg = theme.home.heroImageUrl ?? hero;
  return (
    <div>
      {theme.home.heroEnabled && (
        <div className="m-3 overflow-hidden rounded-2xl bg-[#fff0f6]">
          <div className="grid grid-cols-2">
            <div className="flex flex-col justify-center p-3">
              <p className="text-[10px] font-semibold" style={{color: theme.accentColor}}>{shopName}</p>
              <p style={{fontFamily: FONT_PAIRINGS[theme.fontPairing].display}} className="mt-1 text-sm font-bold leading-tight text-slate-950 line-clamp-3">{theme.home.heroHeadline}</p>
              {theme.home.heroSubtext && <p className="mt-1.5 text-[10px] leading-snug text-slate-600 line-clamp-3">{theme.home.heroSubtext}</p>}
              <span style={{backgroundColor: theme.accentColor}} className="mt-2.5 inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold text-white">{theme.home.heroCtaLabel} <ArrowRight className="h-2.5 w-2.5" /></span>
            </div>
            <div className="min-h-[120px] bg-gradient-to-br from-[#fbcfe8] to-[#fff0f6]">
              {heroImg ? <img src={heroImg} alt="" className="h-full w-full object-cover" /> : logoUrl ? <div className="grid h-full place-items-center"><img src={logoUrl} alt="" className="h-12 w-12 rounded-full bg-white object-contain p-1.5" /></div> : null}
            </div>
          </div>
        </div>
      )}

      {theme.home.categoriesEnabled && categories.length > 0 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-3 pb-1">
          {categories.slice(0, 6).map((c) => (
            <div key={c} className="flex shrink-0 flex-col items-center gap-1">
              <span className="grid h-9 w-9 place-items-center rounded-xl border border-rose-100 bg-[#fff7fa] text-[10px]" style={{color: theme.accentColor}}>◆</span>
              <span className="max-w-[52px] truncate text-[9px] text-slate-600">{c}</span>
            </div>
          ))}
        </div>
      )}

      <div className="px-3 py-3">
        <p className="text-sm font-bold text-slate-950">{theme.home.featuredTitle}</p>
        {theme.home.featuredSubtitle && <p className="mb-2 text-[10px] text-slate-500">{theme.home.featuredSubtitle}</p>}
        <div className="mt-2 grid grid-cols-2 gap-2">
          {products.slice(0, 4).map((p) => <MiniProductCard key={p.id} product={p} theme={theme} />)}
          {products.length === 0 && <p className="col-span-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-6 text-center text-[10px] text-slate-500">ပစ္စည်းမတင်ရသေးပါ။</p>}
        </div>
      </div>
    </div>
  );
}

function CategoryPreview({theme, products}: Omit<PreviewProps, 'page' | 'shopName' | 'logoUrl' | 'categories'>) {
  return (
    <div className="px-3 py-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-slate-900">{theme.category.heading}</p>
        {theme.category.searchEnabled && (
          <span className="flex items-center gap-1 rounded-full border border-rose-200 px-2 py-1 text-[9px] text-slate-400"><Search className="h-3 w-3" style={{color: theme.accentColor}} /> ရှာရန်…</span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {products.slice(0, 6).map((p) => <MiniProductCard key={p.id} product={p} theme={theme} />)}
        {products.length === 0 && <p className="col-span-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-6 text-center text-[10px] text-slate-500">ပစ္စည်းမတင်ရသေးပါ။</p>}
      </div>
    </div>
  );
}

function ProductPreview({theme, products}: Omit<PreviewProps, 'page' | 'shopName' | 'logoUrl' | 'categories'>) {
  const p = products[0];
  const img = productImage(p);
  const price = p && p.isPromotion && p.promoPrice ? p.promoPrice : p?.price ?? 0;
  return (
    <div className="px-3 py-3">
      <div className="aspect-square overflow-hidden rounded-xl border border-rose-100 bg-rose-50">
        {img ? <img src={img} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-rose-200"><ImageOff className="h-8 w-8" /></div>}
      </div>
      <p style={{fontFamily: FONT_PAIRINGS[theme.fontPairing].display}} className="mt-2 text-sm font-bold text-slate-900">{p?.name ?? 'ပစ္စည်းအမည်'}</p>
      <p className="text-xs font-bold text-slate-700">{ks(price)}</p>
      <div className="mt-3 flex gap-2">
        <span className="flex-1 rounded-full border border-slate-300 py-1.5 text-center text-[10px] font-semibold text-slate-700">{theme.product.addToCartLabel}</span>
        <span style={{backgroundColor: theme.accentColor}} className="flex-1 rounded-full py-1.5 text-center text-[10px] font-semibold text-white">{theme.product.buyNowLabel}</span>
      </div>
      {theme.product.relatedEnabled && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-bold text-slate-800">ဆင်တူ ပစ္စည်းများ</p>
          <div className="grid grid-cols-2 gap-2">
            {products.slice(1, 3).map((rp) => <MiniProductCard key={rp.id} product={rp} theme={theme} />)}
          </div>
        </div>
      )}
    </div>
  );
}

export default function StorePreview({theme, page, products, categories, shopName, logoUrl}: PreviewProps) {
  const announcement = theme.announcement.enabled && theme.announcement.text.trim();
  return (
    <div style={{fontFamily: FONT_PAIRINGS[theme.fontPairing].body}} className="mx-auto w-full max-w-[360px] overflow-hidden rounded-[28px] border-[6px] border-slate-900 bg-white shadow-xl">
      <div className="max-h-[640px] overflow-y-auto">
        {announcement && (
          <div style={{backgroundColor: theme.accentColor}} className="px-3 py-1.5 text-center text-[10px] font-semibold text-white">
            {theme.announcement.text}
          </div>
        )}
        <PreviewHeader shopName={shopName} logoUrl={logoUrl} />
        {page === 'home' && <HomePreview theme={theme} products={products} categories={categories} shopName={shopName} logoUrl={logoUrl} />}
        {page === 'category' && <CategoryPreview theme={theme} products={products} />}
        {page === 'product' && <ProductPreview theme={theme} products={products} />}
      </div>
    </div>
  );
}
