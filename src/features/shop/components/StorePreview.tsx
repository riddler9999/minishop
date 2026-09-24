// ---- SHOP: Store Design live preview ----------------------------------------
// Phone-sized, side-effect-free preview of the selected aesthetic. This preview
// intentionally mirrors the five layout families instead of showing five color
// swatches on the same structure.

import {ArrowRight, ImageOff, Search, ShoppingBag} from 'lucide-react';
import type {Product} from '@/domain/product';
import {getThemeVisual, type StorefrontTheme, type ThemePresetId} from '@/domain/theme';
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

const GRID: Record<ThemePresetId, string> = {
  'clean-minimal': 'grid grid-cols-2 gap-x-2 gap-y-4',
  'street-bold': 'grid grid-cols-2 gap-2',
  'soft-elegant': 'grid grid-cols-2 gap-2.5',
  'grid-catalog': 'grid grid-cols-3 gap-1.5',
  'dark-modern': 'grid grid-cols-2 gap-2',
};

function MiniProductCard({product, theme}: {product: Product; theme: StorefrontTheme}) {
  const img = productImage(product);
  const price = product.isPromotion && product.promoPrice ? product.promoPrice : product.price;
  const id = theme.presetId;
  const imageClass =
    id === 'clean-minimal' ? 'aspect-[4/5] bg-zinc-100' :
    id === 'street-bold' ? 'aspect-square border-b-2 border-black bg-white' :
    id === 'soft-elegant' ? 'aspect-[4/5] bg-[#f2e7e1]' :
    id === 'grid-catalog' ? 'aspect-square bg-[#f3f6fa]' :
    'aspect-square bg-[#0f0f12]';
  const cardClass =
    id === 'clean-minimal' ? 'bg-white' :
    id === 'street-bold' ? 'border-2 border-black bg-[#f2ff00]' :
    id === 'soft-elegant' ? 'overflow-hidden rounded-2xl border border-[#eadbd5] bg-[#fffaf7]' :
    id === 'grid-catalog' ? 'overflow-hidden rounded-md border border-[#dbe2ea] bg-white' :
    'overflow-hidden rounded-xl border border-[#2a2a30] bg-[#151518]';
  const titleColor = id === 'dark-modern' ? '#f8fafc' : id === 'soft-elegant' ? '#4a3337' : '#111111';
  const priceColor =
    id === 'street-bold' ? '#111111' :
    id === 'soft-elegant' ? '#8d5360' :
    id === 'grid-catalog' ? '#0f6fff' :
    id === 'dark-modern' ? '#73fbd3' :
    '#111111';

  return (
    <div className={cardClass}>
      <div className={imageClass}>
        {img ? <img src={img} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center opacity-35"><ImageOff className="h-5 w-5" /></div>}
      </div>
      <div className={id === 'clean-minimal' ? 'pt-1.5' : id === 'grid-catalog' ? 'p-1.5' : 'p-2'}>
        <p style={{fontFamily: FONT_PAIRINGS[theme.fontPairing].display, color: titleColor}} className={id === 'grid-catalog' ? 'truncate text-[8px] font-medium' : 'truncate text-[10px] font-semibold'}>{product.name}</p>
        <p style={{color: priceColor}} className={id === 'grid-catalog' ? 'mt-0.5 text-[8px] font-extrabold' : 'mt-0.5 text-[9px] font-bold'}>{ks(price)}</p>
      </div>
    </div>
  );
}

function PreviewHeader({theme, shopName, logoUrl}: {theme: StorefrontTheme; shopName: string; logoUrl: string | null}) {
  const visual = getThemeVisual(theme);
  const id = theme.presetId;
  if (id === 'street-bold') {
    return <div className="flex items-center justify-between border-b-2 border-black bg-black px-3 py-2 text-white"><b className="text-xs uppercase">{shopName}</b><span className="text-[8px] font-black text-[#f2ff00]">MENU / CART</span></div>;
  }
  if (id === 'grid-catalog') {
    return <div className="border-b border-[#dbe2ea] bg-white px-2.5 py-2"><div className="flex items-center gap-2 rounded-md border border-[#dbe2ea] bg-[#f5f7fb] px-2 py-1.5"><Search className="h-3 w-3 text-[#0f6fff]" /><span className="text-[8px] text-[#667085]">Search products</span></div></div>;
  }
  return (
    <div className="flex items-center justify-between px-3 py-2.5" style={{backgroundColor: visual.surface, borderBottom: `1px solid ${visual.border}`}}>
      <span className="text-[9px]" style={{color: visual.muted}}>☰</span>
      <span className="flex items-center gap-1.5 truncate text-[11px] font-bold" style={{color: visual.text}}>
        {logoUrl ? <img src={logoUrl} alt="" className="h-4 w-4 object-cover" style={{borderRadius: id === 'clean-minimal' ? 0 : 999}} /> : <ShoppingBag className="h-3.5 w-3.5" style={{color: visual.accent}} />}
        <span className="max-w-[145px] truncate">{shopName}</span>
      </span>
      <ShoppingBag className="h-3.5 w-3.5" style={{color: visual.muted}} />
    </div>
  );
}

function ThemeHero({theme, products, shopName}: {theme: StorefrontTheme; products: Product[]; shopName: string}) {
  const visual = getThemeVisual(theme);
  const image = theme.home.heroImageUrl ?? productImage(products[0]);
  const id = theme.presetId;

  if (id === 'clean-minimal') {
    return <div className="grid min-h-[170px] grid-cols-2 bg-white"><div className="flex flex-col justify-center p-3"><span className="text-[7px] uppercase tracking-[0.18em] text-zinc-500">Selected</span><b className="mt-2 text-[15px] leading-[1.05] text-black">{theme.home.heroHeadline}</b><span className="mt-3 w-fit border-b border-black pb-0.5 text-[8px] font-semibold">{theme.home.heroCtaLabel}</span></div><div className="bg-zinc-100">{image && <img src={image} alt="" className="h-full w-full object-cover" />}</div></div>;
  }

  if (id === 'street-bold') {
    return <div className="relative min-h-[180px] overflow-hidden border-b-2 border-black bg-black">{image && <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45" />}<div className="absolute inset-0 bg-gradient-to-r from-black to-transparent" /><div className="relative flex min-h-[180px] flex-col justify-end p-3"><span className="w-fit border border-white bg-[#ff4d00] px-1.5 py-0.5 text-[7px] font-black text-white">NEW DROP</span><b className="mt-2 text-[24px] font-black uppercase leading-[0.82] tracking-[-0.05em] text-white">{theme.home.heroHeadline}</b><span className="mt-3 w-fit border border-white bg-[#ff4d00] px-2 py-1 text-[8px] font-black text-white">SHOP NOW</span></div></div>;
  }

  if (id === 'soft-elegant') {
    return <div className="m-3 overflow-hidden rounded-2xl bg-[#fffaf7] p-2 text-center"><div className="overflow-hidden rounded-xl bg-[#eadbd5]">{image && <img src={image} alt="" className="h-28 w-full object-cover" />}</div><p className="mt-2 font-display text-[7px] italic text-[#a8717d]">{shopName}</p><b className="font-display mt-1 block text-[14px] leading-tight text-[#4a3337]">{theme.home.heroHeadline}</b><span className="mt-2 inline-flex rounded-full bg-[#b56b7a] px-2.5 py-1 text-[8px] font-semibold text-white">{theme.home.heroCtaLabel}</span></div>;
  }

  if (id === 'grid-catalog') {
    return <div className="m-2.5 grid grid-cols-[1fr_auto] gap-2 rounded-md border border-[#dbe2ea] bg-white p-2.5"><div><span className="text-[7px] font-bold uppercase text-[#0f6fff]">Browse fast</span><b className="mt-1 block text-[12px] leading-tight text-[#111827]">{theme.home.heroHeadline}</b></div><span className="self-center rounded bg-[#0f6fff] px-2 py-1 text-[7px] font-bold text-white">View</span></div>;
  }

  return <div className="relative m-3 min-h-[180px] overflow-hidden rounded-2xl border border-[#2a2a30] bg-[#111114]">{image && <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />}<div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_30%,rgba(115,251,211,.22),transparent_35%),linear-gradient(90deg,#09090b,transparent)]" /><div className="relative flex min-h-[180px] flex-col justify-end p-3"><span className="w-fit rounded-full border border-[#73fbd3]/40 bg-[#73fbd3]/10 px-2 py-0.5 text-[7px] text-[#73fbd3]">MODERN MODE</span><b className="mt-2 text-[19px] font-black leading-[0.95] text-white">{theme.home.heroHeadline}</b><span className="mt-3 w-fit rounded-lg bg-[#73fbd3] px-2.5 py-1 text-[8px] font-bold text-[#08110e]">{theme.home.heroCtaLabel}</span></div></div>;
}

function CategoryRail({theme, categories}: {theme: StorefrontTheme; categories: string[]}) {
  if (!theme.home.categoriesEnabled || categories.length === 0) return null;
  const id = theme.presetId;
  const chip =
    id === 'clean-minimal' ? 'border-b border-zinc-300 text-zinc-600' :
    id === 'street-bold' ? 'border-2 border-black bg-[#f2ff00] font-black uppercase text-black' :
    id === 'soft-elegant' ? 'rounded-full border border-[#decac5] bg-[#fffaf7] text-[#76565d]' :
    id === 'grid-catalog' ? 'rounded-md border border-[#dbe2ea] bg-white text-[#475467]' :
    'rounded-lg border border-[#2a2a30] bg-[#151518] text-[#c9c9d0]';
  return <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-3 py-2.5">{categories.slice(0, 6).map((c) => <span key={c} className={`shrink-0 px-2 py-1 text-[7px] font-semibold ${chip}`}>{c}</span>)}</div>;
}

function HomePreview({theme, products, categories, shopName}: Omit<PreviewProps, 'page' | 'logoUrl'>) {
  const visual = getThemeVisual(theme);
  return (
    <div style={{backgroundColor: visual.canvas, color: visual.text}}>
      {theme.home.heroEnabled && <ThemeHero theme={theme} products={products} shopName={shopName} />}
      <CategoryRail theme={theme} categories={categories} />
      <div className="px-3 pb-4 pt-2">
        <div className={theme.presetId === 'soft-elegant' ? 'mb-2 text-center' : 'mb-2'}>
          <p className={theme.presetId === 'street-bold' ? 'text-[15px] font-black uppercase' : 'text-[12px] font-bold'}>{theme.home.featuredTitle}</p>
          {theme.home.featuredSubtitle && theme.presetId !== 'grid-catalog' && <p className="text-[7px]" style={{color: visual.muted}}>{theme.home.featuredSubtitle}</p>}
        </div>
        <div className={GRID[theme.presetId]}>
          {products.slice(0, theme.presetId === 'grid-catalog' ? 6 : 4).map((p) => <MiniProductCard key={p.id} product={p} theme={theme} />)}
          {products.length === 0 && <p className="col-span-full py-6 text-center text-[8px]" style={{color: visual.muted}}>ပစ္စည်းမတင်ရသေးပါ။</p>}
        </div>
      </div>
    </div>
  );
}

function CategoryPreview({theme, products}: Omit<PreviewProps, 'page' | 'shopName' | 'logoUrl' | 'categories'>) {
  const visual = getThemeVisual(theme);
  return (
    <div className="px-3 py-3" style={{backgroundColor: visual.canvas, color: visual.text}}>
      <div className={theme.presetId === 'street-bold' ? 'mb-2 border-b-2 border-black pb-2' : 'mb-2'}>
        <p className={theme.presetId === 'street-bold' ? 'text-[15px] font-black uppercase' : 'text-[12px] font-bold'}>{theme.category.heading}</p>
        {theme.category.searchEnabled && <span className="mt-2 flex items-center gap-1 border px-2 py-1.5 text-[7px]" style={{borderColor: visual.border, backgroundColor: visual.surface, color: visual.muted}}><Search className="h-2.5 w-2.5" style={{color: visual.accent}} /> Search</span>}
      </div>
      <div className={GRID[theme.presetId]}>{products.slice(0, theme.presetId === 'grid-catalog' ? 9 : 6).map((p) => <MiniProductCard key={p.id} product={p} theme={theme} />)}</div>
    </div>
  );
}

function ProductPreview({theme, products}: Omit<PreviewProps, 'page' | 'shopName' | 'logoUrl' | 'categories'>) {
  const visual = getThemeVisual(theme);
  const p = products[0];
  const img = productImage(p);
  const price = p && p.isPromotion && p.promoPrice ? p.promoPrice : p?.price ?? 0;
  const id = theme.presetId;
  const imageClass =
    id === 'street-bold' ? 'aspect-square border-2 border-black bg-white' :
    id === 'clean-minimal' ? 'aspect-[4/5] bg-zinc-100' :
    id === 'soft-elegant' ? 'aspect-[4/5] rounded-2xl bg-[#eadbd5]' :
    id === 'grid-catalog' ? 'aspect-square rounded-md bg-[#f3f6fa]' :
    'aspect-square rounded-2xl border border-[#2a2a30] bg-[#0f0f12]';
  return (
    <div className="px-3 py-3" style={{backgroundColor: visual.canvas, color: visual.text}}>
      <div className={imageClass}>{img ? <img src={img} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center opacity-35"><ImageOff className="h-7 w-7" /></div>}</div>
      <p style={{fontFamily: FONT_PAIRINGS[theme.fontPairing].display}} className={id === 'street-bold' ? 'mt-2 text-[15px] font-black uppercase leading-tight' : 'mt-2 text-[13px] font-bold'}>{p?.name ?? 'ပစ္စည်းအမည်'}</p>
      <p className="mt-0.5 text-[11px] font-bold" style={{color: visual.accent}}>{ks(price)}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <span className="border py-1.5 text-center text-[8px] font-semibold" style={{borderColor: visual.accent, color: visual.accent, borderRadius: id === 'soft-elegant' ? 999 : id === 'clean-minimal' || id === 'street-bold' ? 0 : 8}}>{theme.product.addToCartLabel}</span>
        <span className="py-1.5 text-center text-[8px] font-semibold" style={{backgroundColor: visual.accent, color: visual.accentText, borderRadius: id === 'soft-elegant' ? 999 : id === 'clean-minimal' || id === 'street-bold' ? 0 : 8}}>{theme.product.buyNowLabel}</span>
      </div>
    </div>
  );
}

export default function StorePreview({theme, page, products, categories, shopName, logoUrl}: PreviewProps) {
  const announcement = theme.announcement.enabled && theme.announcement.text.trim();
  const visual = getThemeVisual(theme);
  return (
    <div style={{fontFamily: FONT_PAIRINGS[theme.fontPairing].body, backgroundColor: visual.canvas}} className="mx-auto w-full max-w-[360px] overflow-hidden rounded-[28px] border-[6px] border-slate-900 shadow-xl">
      <div className="max-h-[640px] overflow-y-auto">
        {announcement && <div style={{backgroundColor: visual.accent, color: visual.accentText}} className="px-3 py-1.5 text-center text-[9px] font-semibold">{theme.announcement.text}</div>}
        <PreviewHeader theme={theme} shopName={shopName} logoUrl={logoUrl} />
        {page === 'home' && <HomePreview theme={theme} products={products} categories={categories} shopName={shopName} />}
        {page === 'category' && <CategoryPreview theme={theme} products={products} />}
        {page === 'product' && <ProductPreview theme={theme} products={products} />}
      </div>
    </div>
  );
}
