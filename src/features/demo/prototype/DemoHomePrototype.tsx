// THROWAWAY PROTOTYPE — do not promote directly to production.
 // Design question: which visual direction should replace the dated /demo home composition?
import {useState} from 'react';
import {ArrowRight, Grid2X2, Heart, Home, Search, ShoppingBag, Sparkles} from 'lucide-react';
import {useSearchParams} from 'react-router-dom';

type VariantId = 'editorial' | 'social' | 'minimal' | 'bold';

type Product = {
  name: string;
  price: string;
  oldPrice?: string;
  discount: string;
  image: string;
};

const VARIANTS: Array<{id: VariantId; label: string; note: string}> = [
  {id: 'editorial', label: 'Editorial', note: 'Fashion editorial / image-led'},
  {id: 'social', label: 'Social', note: 'Friendly social-commerce energy'},
  {id: 'minimal', label: 'Minimal', note: 'Maximum product focus / minimum chrome'},
  {id: 'bold', label: 'Bold', note: 'High-contrast MiniShop brand statement'},
];

const PRODUCTS: Product[] = [
  {
    name: 'Classic White Shirt (ရှပ်အဖြူ)',
    price: '17,500 Ks',
    oldPrice: '22,000 Ks',
    discount: '-20%',
    image: '/demo/fashion/classic-white-shirt.png',
  },
  {
    name: 'Floral Blouse (ပန်းရိုက် ဘလောက်စ်)',
    price: '19,500 Ks',
    discount: '-21%',
    image: '/demo/fashion/floral-blouse-pink.png',
  },
  {
    name: 'Basic Cotton Tee (တီရှပ်)',
    price: '12,000 Ks',
    discount: '-15%',
    image: '/demo/fashion/fashion-01.png',
  },
  {
    name: 'Summer Sky Blue Dress (ဂါဝန်)',
    price: '28,500 Ks',
    discount: '-18%',
    image: '/demo/fashion/fashion-04.png',
  },
];

const CATEGORIES = ['All', 'Tops', 'Dresses', 'Bags & Shoes'];

function MiniShopWordmark({light = false}: {light?: boolean}) {
  return (
    <div className={`text-[18px] font-black tracking-[-0.045em] ${light ? 'text-white' : 'text-[#0F1D31]'}`}>
      <span className="text-[#EC1F62]">Mini</span>Shop <span className="text-[#EC1F62]">MM</span>
    </div>
  );
}

function ProductTile({
  product,
  mode,
}: {
  product: Product;
  mode: 'editorial' | 'social' | 'minimal' | 'bold';
}) {
  const shell =
    mode === 'social'
      ? 'rounded-[24px] bg-white p-2.5 shadow-[0_16px_40px_rgba(15,29,49,0.08)]'
      : mode === 'bold'
        ? 'rounded-[18px] bg-white/5 p-2'
        : '';

  const imageRadius =
    mode === 'editorial'
      ? 'rounded-[2px]'
      : mode === 'minimal'
        ? 'rounded-none'
        : mode === 'bold'
          ? 'rounded-[14px]'
          : 'rounded-[18px]';

  return (
    <article className={shell}>
      <div className="relative overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className={`aspect-[4/5] w-full object-cover ${imageRadius}`}
        />
        <span
          className={`absolute left-2 top-2 px-2 py-1 text-[10px] font-bold ${
            mode === 'minimal'
              ? 'bg-[#0F1D31] text-white'
              : mode === 'bold'
                ? 'rounded-full bg-[#EC1F62] text-white'
                : 'rounded-full bg-white/94 text-[#EC1F62] shadow-sm'
          }`}>
          {product.discount}
        </span>
        <button
          type="button"
          aria-label={`Favorite ${product.name}`}
          className={`absolute right-2 top-2 grid h-8 w-8 place-items-center ${
            mode === 'minimal'
              ? 'bg-white/90'
              : 'rounded-full bg-white/90 shadow-sm backdrop-blur'
          }`}>
          <Heart className="h-4 w-4 text-[#0F1D31]" strokeWidth={1.8} />
        </button>
      </div>
      <div className={mode === 'minimal' ? 'pt-3' : 'px-0.5 pb-1 pt-3'}>
        <h3
          className={`line-clamp-2 text-[13px] font-semibold leading-[1.55] ${
            mode === 'bold' ? 'text-white' : 'text-[#0F1D31]'
          }`}>
          {product.name}
        </h3>
        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
          <span className={`text-[15px] font-extrabold ${mode === 'bold' ? 'text-white' : 'text-[#0F1D31]'}`}>
            {product.price}
          </span>
          {product.oldPrice && (
            <span className={`text-[11px] line-through ${mode === 'bold' ? 'text-white/45' : 'text-[#6E788A]'}`}>
              {product.oldPrice}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

function BottomNav({dark = false}: {dark?: boolean}) {
  const item = dark ? 'text-white/58' : 'text-[#6E788A]';
  return (
    <nav
      className={`mt-8 grid grid-cols-3 border-t px-5 pb-5 pt-3 ${
        dark ? 'border-white/10 bg-[#0F1D31]' : 'border-[#E7EBF1] bg-white'
      }`}>
      <button type="button" className="flex min-h-12 flex-col items-center justify-center gap-1 text-[#EC1F62]">
        <Home className="h-[19px] w-[19px]" strokeWidth={2.1} />
        <span className="text-[10px] font-bold">Home</span>
      </button>
      <button type="button" className={`flex min-h-12 flex-col items-center justify-center gap-1 ${item}`}>
        <Grid2X2 className="h-[19px] w-[19px]" strokeWidth={1.8} />
        <span className="text-[10px] font-semibold">ပစ္စည်းစုံ</span>
      </button>
      <button type="button" className={`flex min-h-12 flex-col items-center justify-center gap-1 ${item}`}>
        <ShoppingBag className="h-[19px] w-[19px]" strokeWidth={1.8} />
        <span className="text-[10px] font-semibold">ခြင်းတောင်း</span>
      </button>
    </nav>
  );
}

function CategoryStrip({
  mode,
  selected,
  onSelect,
}: {
  mode: VariantId;
  selected: string;
  onSelect: (category: string) => void;
}) {
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto">
      {CATEGORIES.map((category) => {
        const active = selected === category;
        const className =
          mode === 'minimal'
            ? `shrink-0 border-b-2 px-1 pb-2 text-[12px] font-bold ${
                active ? 'border-[#EC1F62] text-[#0F1D31]' : 'border-transparent text-[#7D8797]'
              }`
            : mode === 'bold'
              ? `shrink-0 rounded-full border px-4 py-2 text-[11px] font-bold ${
                  active ? 'border-[#EC1F62] bg-[#EC1F62] text-white' : 'border-white/18 text-white/68'
                }`
              : `shrink-0 rounded-full px-4 py-2 text-[11px] font-bold ${
                  active
                    ? 'bg-[#EC1F62] text-white'
                    : mode === 'social'
                      ? 'bg-white text-[#0F1D31] shadow-sm'
                      : 'border border-[#D7DEE9] bg-white text-[#596475]'
                }`;

        return (
          <button key={category} type="button" onClick={() => onSelect(category)} className={className}>
            {category}
          </button>
        );
      })}
    </div>
  );
}

function Editorial({selected, onSelect}: {selected: string; onSelect: (value: string) => void}) {
  return (
    <main className="min-h-screen bg-[#FAF9F7] text-[#0F1D31]">
      <div className="mx-auto max-w-[430px]">
        <header className="flex items-center justify-between px-5 pb-4 pt-5">
          <MiniShopWordmark />
          <div className="flex items-center gap-1">
            <button type="button" aria-label="Search" className="grid h-10 w-10 place-items-center">
              <Search className="h-5 w-5" />
            </button>
            <button type="button" aria-label="Cart" className="relative grid h-10 w-10 place-items-center">
              <ShoppingBag className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#EC1F62]" />
            </button>
          </div>
        </header>

        <div className="px-5 pb-4">
          <label className="flex min-h-12 items-center gap-3 border-b border-[#C9CED6]">
            <Search className="h-[18px] w-[18px] text-[#6E788A]" />
            <input
              aria-label="ရှာချင်တာ ရိုက်ထည့်ပါ..."
              placeholder="ရှာချင်တာ ရိုက်ထည့်ပါ..."
              className="w-full bg-transparent py-3 text-[13px] outline-none placeholder:text-[#87909E]"
            />
          </label>
        </div>

        <section className="relative mx-3 min-h-[485px] overflow-hidden bg-[#171A1F]">
          <img
            src="/demo/fashion/fashion-banner-4x3.png"
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 text-white">
            <p className="mb-3 text-[11px] font-bold tracking-[0.16em] text-white/75">အထူးပရိုမိုးရှင်း</p>
            <h1 className="max-w-[330px] text-[36px] font-black leading-[1.05] tracking-[-0.045em]">
              ဒီနေ့ အရောင်းရဆုံး <span className="text-[#FF79A6]">Trending Items</span>
            </h1>
            <p className="mt-3 max-w-[320px] text-[12px] leading-6 text-white/76">
              Instock အသစ်တွေရော Discount တွေပါ အစုံရှိတယ်
            </p>
            <button type="button" className="mt-5 inline-flex min-h-11 items-center gap-2 border-b-2 border-[#EC1F62] text-[13px] font-bold">
              ဈေးဝယ်မယ် <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>

        <section className="px-5 pb-4 pt-9">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#EC1F62]">New arrivals</p>
              <h2 className="mt-2 text-[27px] font-black leading-[1.25] tracking-[-0.04em]">
                Instock အသစ်ရောက်<br />ပစ္စည်းများ
              </h2>
            </div>
            <button type="button" className="pb-1 text-[11px] font-bold text-[#6E788A]">See all</button>
          </div>
          <div className="mt-6">
            <CategoryStrip mode="editorial" selected={selected} onSelect={onSelect} />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8">
            {PRODUCTS.map((product) => <ProductTile key={product.name} product={product} mode="editorial" />)}
          </div>
        </section>

        <BottomNav />
      </div>
    </main>
  );
}

function Social({selected, onSelect}: {selected: string; onSelect: (value: string) => void}) {
  return (
    <main className="min-h-screen bg-[#FFF4F7] text-[#0F1D31]">
      <div className="mx-auto max-w-[430px] px-4 pb-3 pt-4">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-[13px] bg-[#EC1F62] text-lg font-black text-white">m</div>
            <MiniShopWordmark />
          </div>
          <button type="button" aria-label="Cart" className="relative grid h-11 w-11 place-items-center rounded-full bg-white shadow-sm">
            <ShoppingBag className="h-5 w-5" />
            <span className="absolute right-1 top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-[#0F1D31] px-1 text-[9px] font-bold text-white">2</span>
          </button>
        </header>

        <label className="mt-4 flex min-h-12 items-center gap-3 rounded-full bg-white px-4 shadow-[0_8px_28px_rgba(15,29,49,0.07)]">
          <Search className="h-[18px] w-[18px] text-[#6E788A]" />
          <input
            aria-label="ရှာချင်တာ ရိုက်ထည့်ပါ..."
            placeholder="ရှာချင်တာ ရိုက်ထည့်ပါ..."
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#87909E]"
          />
        </label>

        <section className="relative mt-4 overflow-hidden rounded-[30px] bg-[#EC1F62] px-5 pb-5 pt-6 text-white">
          <div className="relative z-10 max-w-[230px]">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/14 px-3 py-1.5 text-[10px] font-bold">
              <Sparkles className="h-3.5 w-3.5" /> အထူးပရိုမိုးရှင်း
            </div>
            <h1 className="mt-4 text-[31px] font-black leading-[1.08] tracking-[-0.04em]">
              ဒီနေ့ အရောင်းရဆုံး Trending Items
            </h1>
            <p className="mt-3 text-[12px] leading-5 text-white/80">
              Instock အသစ်တွေရော Discount တွေပါ အစုံရှိတယ်
            </p>
            <button type="button" className="mt-5 min-h-11 rounded-full bg-white px-5 text-[12px] font-black text-[#EC1F62]">
              ဈေးဝယ်မယ် 👉
            </button>
          </div>
          <div className="absolute -bottom-10 -right-9 h-[250px] w-[185px] rotate-[7deg] overflow-hidden rounded-[28px] border-[5px] border-white/25 shadow-2xl">
            <img src="/demo/fashion/fashion-04.png" alt="" className="h-full w-full object-cover" />
          </div>
        </section>

        <section className="pt-7">
          <div className="flex items-center justify-between">
            <h2 className="text-[23px] font-black leading-snug tracking-[-0.035em]">Instock အသစ်ရောက် ပစ္စည်းများ</h2>
            <span className="text-[11px] font-bold text-[#EC1F62]">See all</span>
          </div>
          <div className="mt-4">
            <CategoryStrip mode="social" selected={selected} onSelect={onSelect} />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {PRODUCTS.map((product) => <ProductTile key={product.name} product={product} mode="social" />)}
          </div>
        </section>
        <BottomNav />
      </div>
    </main>
  );
}

function Minimal({selected, onSelect}: {selected: string; onSelect: (value: string) => void}) {
  return (
    <main className="min-h-screen bg-white text-[#0F1D31]">
      <div className="mx-auto max-w-[430px]">
        <header className="flex items-center justify-between border-b border-[#ECEFF3] px-5 py-4">
          <MiniShopWordmark />
          <div className="flex gap-1">
            <button type="button" className="grid h-10 w-10 place-items-center" aria-label="Search">
              <Search className="h-[19px] w-[19px]" />
            </button>
            <button type="button" className="grid h-10 w-10 place-items-center" aria-label="Cart">
              <ShoppingBag className="h-[19px] w-[19px]" />
            </button>
          </div>
        </header>

        <div className="px-5 py-4">
          <input
            aria-label="ရှာချင်တာ ရိုက်ထည့်ပါ..."
            placeholder="ရှာချင်တာ ရိုက်ထည့်ပါ..."
            className="w-full border-b border-[#AAB2BE] bg-transparent py-3 text-[13px] outline-none placeholder:text-[#7E8794]"
          />
        </div>

        <section className="grid grid-cols-[0.92fr_1.08fr] border-y border-[#ECEFF3]">
          <div className="flex flex-col justify-center px-5 py-8">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#EC1F62]">အထူးပရိုမိုးရှင်း</p>
            <h1 className="mt-4 text-[27px] font-black leading-[1.08] tracking-[-0.05em]">ဒီနေ့ အရောင်းရဆုံး Trending Items</h1>
            <p className="mt-4 text-[11px] leading-5 text-[#6E788A]">Instock အသစ်တွေရော Discount တွေပါ အစုံရှိတယ်</p>
            <button type="button" className="mt-5 inline-flex w-fit items-center gap-2 text-[12px] font-black text-[#EC1F62]">
              ဈေးဝယ်မယ် <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <img src="/demo/fashion/fashion-banner-4x3.png" alt="" className="h-full min-h-[330px] w-full object-cover" />
        </section>

        <section className="px-5 pb-4 pt-8">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="max-w-[270px] text-[25px] font-black leading-[1.25] tracking-[-0.04em]">Instock အသစ်ရောက် ပစ္စည်းများ</h2>
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#6E788A]">04 items</span>
          </div>
          <div className="mt-6">
            <CategoryStrip mode="minimal" selected={selected} onSelect={onSelect} />
          </div>
          <div className="-mx-5 mt-5 grid grid-cols-2 gap-x-px gap-y-8 bg-[#E8ECF1]">
            {PRODUCTS.map((product) => (
              <div key={product.name} className="bg-white px-2 pb-1 pt-2">
                <ProductTile product={product} mode="minimal" />
              </div>
            ))}
          </div>
        </section>
        <BottomNav />
      </div>
    </main>
  );
}

function Bold({selected, onSelect}: {selected: string; onSelect: (value: string) => void}) {
  return (
    <main className="min-h-screen bg-[#0F1D31] text-white">
      <div className="mx-auto max-w-[430px] overflow-hidden">
        <header className="flex items-center justify-between px-5 pb-3 pt-5">
          <MiniShopWordmark light />
          <button type="button" aria-label="Cart" className="grid h-10 w-10 place-items-center rounded-full border border-white/15">
            <ShoppingBag className="h-[19px] w-[19px]" />
          </button>
        </header>

        <label className="mx-5 mt-2 flex min-h-12 items-center gap-3 border border-white/12 bg-white/[0.06] px-4">
          <Search className="h-[18px] w-[18px] text-white/55" />
          <input
            aria-label="ရှာချင်တာ ရိုက်ထည့်ပါ..."
            placeholder="ရှာချင်တာ ရိုက်ထည့်ပါ..."
            className="w-full bg-transparent text-[13px] text-white outline-none placeholder:text-white/45"
          />
        </label>

        <section className="relative mt-5 px-5 pb-8 pt-3">
          <div className="absolute -right-16 top-0 h-56 w-56 rounded-full bg-[#EC1F62] blur-[1px]" />
          <p className="relative z-10 text-[10px] font-black uppercase tracking-[0.18em] text-[#FF8CB4]">အထူးပရိုမိုးရှင်း</p>
          <h1 className="relative z-10 mt-4 max-w-[360px] text-[47px] font-black leading-[0.98] tracking-[-0.065em]">
            ဒီနေ့ အရောင်းရဆုံး <span className="text-[#FF7FA9]">Trending Items</span>
          </h1>
          <p className="relative z-10 mt-5 max-w-[290px] text-[12px] leading-6 text-white/63">
            Instock အသစ်တွေရော Discount တွေပါ အစုံရှိတယ်
          </p>
          <button type="button" className="relative z-10 mt-5 inline-flex min-h-11 items-center gap-2 bg-[#EC1F62] px-5 text-[12px] font-black text-white">
            ဈေးဝယ်မယ် 👉
          </button>

          <div className="relative z-10 mt-7 grid grid-cols-[1.2fr_0.8fr] gap-2">
            <img src="/demo/fashion/fashion-banner-4x3.png" alt="" className="h-[245px] w-full object-cover" />
            <div className="grid gap-2">
              <img src="/demo/fashion/floral-blouse-pink.png" alt="" className="h-[119px] w-full object-cover" />
              <img src="/demo/fashion/classic-white-shirt.png" alt="" className="h-[119px] w-full object-cover" />
            </div>
          </div>
        </section>

        <section className="border-t border-white/10 px-5 pb-4 pt-7">
          <div className="flex items-end justify-between gap-4">
            <h2 className="max-w-[280px] text-[27px] font-black leading-[1.22] tracking-[-0.045em]">Instock အသစ်ရောက် ပစ္စည်းများ</h2>
            <span className="pb-1 text-[10px] font-bold text-[#FF8CB4]">SEE ALL</span>
          </div>
          <div className="mt-5">
            <CategoryStrip mode="bold" selected={selected} onSelect={onSelect} />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 gap-y-6">
            {PRODUCTS.map((product) => <ProductTile key={product.name} product={product} mode="bold" />)}
          </div>
        </section>
        <BottomNav dark />
      </div>
    </main>
  );
}

export default function DemoHomePrototype() {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get('variant');
  const currentId: VariantId = VARIANTS.some((item) => item.id === raw) ? (raw as VariantId) : 'editorial';
  const [selectedCategory, setSelectedCategory] = useState('All');
  const current = VARIANTS.find((item) => item.id === currentId) ?? VARIANTS[0];

  const switchVariant = (variant: VariantId) => {
    const next = new URLSearchParams(searchParams);
    next.set('variant', variant);
    setSearchParams(next, {replace: true});
    setSelectedCategory('All');
  };

  return (
    <div className="min-h-screen bg-[#E9EDF2] pb-28">
      <div className="mx-auto min-h-screen max-w-[430px] bg-white shadow-[0_0_60px_rgba(15,29,49,0.12)]">
        {current.id === 'editorial' && <Editorial selected={selectedCategory} onSelect={setSelectedCategory} />}
        {current.id === 'social' && <Social selected={selectedCategory} onSelect={setSelectedCategory} />}
        {current.id === 'minimal' && <Minimal selected={selectedCategory} onSelect={setSelectedCategory} />}
        {current.id === 'bold' && <Bold selected={selectedCategory} onSelect={setSelectedCategory} />}
      </div>

      <aside className="fixed inset-x-0 bottom-3 z-[100] mx-auto w-[calc(100%-20px)] max-w-[620px] rounded-[18px] border border-white/15 bg-[#08111F]/95 p-2 text-white shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3 px-2 pb-2">
          <div className="min-w-0">
            <div className="text-[9px] font-black uppercase tracking-[0.15em] text-[#FF7FA9]">THROWAWAY PROTOTYPE</div>
            <div className="truncate text-[11px] font-semibold">
              {current.label} · {current.note} · Category: {selectedCategory}
            </div>
          </div>
          <a href="https://github.com/riddler9999/minishop/issues/92" className="shrink-0 text-[10px] font-bold text-white/55 underline">
            Issue #92
          </a>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {VARIANTS.map((variant) => (
            <button
              key={variant.id}
              type="button"
              onClick={() => switchVariant(variant.id)}
              className={`min-h-10 rounded-[12px] px-2 text-[10px] font-black transition ${
                current.id === variant.id
                  ? 'bg-[#EC1F62] text-white'
                  : 'bg-white/8 text-white/68 hover:bg-white/12'
              }`}>
              {variant.label}
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}
