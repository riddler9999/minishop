import {useEffect, useState} from 'react';
import {
  ArrowRight,
  Gem,
  Headphones,
  Heart,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
import {api, getCachedShopInfo, type Product} from '../lib/store';
import ProductCard, {ProductCardSkeleton} from '../components/ProductCard';
import {ShopLink, useShopSlugParam} from '../components/ShopLink';
import heroImage from '../data/jewelry/hero';
import floralRing from '../data/jewelry/floralRing';
import bangle from '../data/jewelry/bangle';
import diamondRing from '../data/jewelry/diamondRing';
import finalCta from '../data/jewelry/finalCta';

const collections = [
  {label: 'Traditional Gold', image: floralRing},
  {label: 'Diamond Jewellery', image: diamondRing},
  {label: 'Wedding Collection', image: heroImage},
  {label: 'Bangles & Bracelets', image: bangle},
  {label: 'Earrings', image: finalCta},
];

const topTrust = [
  {title: 'Authentic Quality', sub: 'Trusted Purity', icon: Gem},
  {title: 'Timeless Designs', sub: 'Modern & Traditional', icon: Sparkles},
  {title: 'Family Trusted', sub: 'For Generations', icon: Heart},
  {title: 'Personal Consultation', sub: 'Always Here for You', icon: Headphones},
];

const trustReasons = [
  {title: 'Certified Quality', sub: 'Carefully Selected', icon: Gem},
  {title: 'Transparent Process', sub: 'Clear & Honest', icon: ShieldCheck},
  {title: 'Personal Guidance', sub: 'Thoughtful Support', icon: Users},
  {title: 'Lasting Value', sub: 'Made to Be Treasured', icon: Star},
];

function Hero() {
  const shop = getCachedShopInfo();

  return (
    <section className="relative overflow-hidden bg-[#24170d]">
      <div className="relative min-h-[520px] sm:min-h-[610px] lg:min-h-[670px]">
        <img
          src={heroImage}
          alt="Fine jewellery collection"
          className="absolute inset-0 h-full w-full object-cover object-[63%_center] sm:object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1b1009]/95 via-[#27170d]/65 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/5" />

        <div className="relative z-10 mx-auto flex min-h-[520px] max-w-7xl items-center px-5 py-16 sm:min-h-[610px] sm:px-8 lg:min-h-[670px] lg:px-10">
          <div className="max-w-[620px] text-white">
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#e7c178] sm:text-xs">
              {shop?.name ?? 'Fine Jewellery'} · Fine Jewellery
            </p>
            <h1 className="font-display text-[43px] font-normal uppercase leading-[0.98] tracking-[-0.025em] sm:text-6xl lg:text-[72px]">
              Timeless Beauty
              <br />
              For Your
              <br />
              Special Moments
            </h1>
            <div className="mt-7 h-px w-16 bg-[#d8a84c]" />
            <p className="mt-5 max-w-sm text-xs font-medium uppercase leading-6 tracking-[0.22em] text-white/78 sm:text-sm">
              Fine jewellery crafted for generations
            </p>
            <ShopLink
              to="/products"
              className="jewel-cta mt-8 inline-flex min-h-12 items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold">
              Explore Our Collections <ArrowRight className="h-4 w-4" />
            </ShopLink>
          </div>
        </div>

        <div className="absolute bottom-6 right-6 z-10 flex items-center gap-2" aria-hidden="true">
          <span className="h-2 w-2 rounded-full bg-white" />
          <span className="h-2 w-2 rounded-full bg-white/35" />
          <span className="h-2 w-2 rounded-full bg-white/35" />
        </div>
      </div>
    </section>
  );
}

function TrustStrip() {
  return (
    <section className="border-b border-[#d9c8ab]/55 bg-[#fffdf9]">
      <div className="mx-auto grid max-w-7xl grid-cols-2 px-4 py-7 sm:px-8 lg:grid-cols-4 lg:py-8">
        {topTrust.map(({title, sub, icon: Icon}, index) => (
          <div
            key={title}
            className={`flex min-h-[118px] flex-col items-center justify-center px-3 text-center ${
              index % 2 === 0 ? 'border-r border-[#d9c8ab]/55 lg:border-r' : 'lg:border-r'
            } ${index === topTrust.length - 1 ? 'lg:border-r-0' : ''}`}>
            <Icon className="mb-3 h-8 w-8 text-[#b98428]" strokeWidth={1.6} />
            <p className="text-sm font-semibold text-[#23180f]">{title}</p>
            <p className="mt-1 text-xs text-[#766b60]">{sub}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Collections() {
  return (
    <section className="bg-[#fffdf9] px-4 py-12 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex items-center justify-between gap-4 sm:mb-9">
          <div className="flex items-center gap-4">
            <h2 className="font-display text-3xl font-normal text-[#21160e] sm:text-4xl">Our Collections</h2>
            <span className="hidden h-px w-20 bg-[#c58e33] sm:block" />
          </div>
          <ShopLink to="/products" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#9b6b20]">
            View All <ArrowRight className="h-4 w-4" />
          </ShopLink>
        </div>

        <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-5 sm:gap-4 sm:overflow-visible">
          {collections.map((item) => (
            <ShopLink key={item.label} to="/products" className="group w-[44%] min-w-[150px] shrink-0 snap-start sm:w-auto sm:min-w-0">
              <div className="aspect-square overflow-hidden rounded-xl bg-[#f1e8dc]">
                <img
                  src={item.image}
                  alt={item.label}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]"
                />
              </div>
              <div className="px-1 pt-3 text-center">
                <p className="text-sm font-medium text-[#2c2118]">{item.label}</p>
                <span className="mx-auto mt-2 block h-px w-8 bg-[#c58e33]" />
              </div>
            </ShopLink>
          ))}
        </div>
      </div>
    </section>
  );
}

function CraftedStory() {
  return (
    <section className="bg-[#fffdf9] px-4 pb-12 sm:px-8 sm:pb-16">
      <div className="mx-auto grid max-w-7xl overflow-hidden rounded-2xl border border-[#eadfce] bg-[#f7f0e5] lg:grid-cols-[0.9fr_1.4fr]">
        <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-12">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#a87325]">Our Craft</p>
          <h2 className="font-display text-4xl font-normal leading-[1.05] text-[#20160f] sm:text-5xl">
            Crafted
            <br />
            with Meaning
          </h2>
          <div className="mt-5 h-px w-12 bg-[#bf862d]" />
          <p className="mt-5 max-w-md text-sm leading-6 text-[#71665b] sm:text-base">
            Every piece is chosen to celebrate love, tradition and the moments you will remember for years to come.
          </p>
          <ShopLink to="/products" className="jewel-cta mt-7 inline-flex w-fit min-h-12 items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold">
            Shop the Story <ArrowRight className="h-4 w-4" />
          </ShopLink>
        </div>
        <div className="relative min-h-[330px] lg:min-h-[450px]">
          <img src={bangle} alt="Handcrafted gold jewellery" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#f7f0e5]/55 via-transparent to-transparent lg:block" />
        </div>
      </div>
    </section>
  );
}

function WhyTrust() {
  return (
    <section className="bg-[#fffdf9] px-4 pb-14 sm:px-8 sm:pb-18">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-center gap-5">
          <span className="hidden h-px w-24 bg-[#c99a52] sm:block" />
          <h2 className="text-center font-display text-3xl font-normal text-[#21160e] sm:text-4xl">Why Customers Trust Us</h2>
          <span className="hidden h-px w-24 bg-[#c99a52] sm:block" />
        </div>
        <div className="grid grid-cols-2 gap-y-8 lg:grid-cols-4 lg:gap-y-0">
          {trustReasons.map(({title, sub, icon: Icon}, index) => (
            <div
              key={title}
              className={`flex flex-col items-center px-4 text-center ${index < trustReasons.length - 1 ? 'lg:border-r lg:border-[#d9c8ab]/60' : ''}`}>
              <span className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-[#f4eadc]">
                <Icon className="h-8 w-8 text-[#5f4220]" strokeWidth={1.6} />
              </span>
              <p className="text-sm font-semibold text-[#261b12]">{title}</p>
              <p className="mt-1 text-xs text-[#766b60]">{sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ShopCollection({products, loading, error}: {products: Product[]; loading: boolean; error: string}) {
  return (
    <section className="bg-[#f8f2e9] px-4 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#9c6c26]">Shop Online</p>
            <h2 className="font-display text-3xl font-normal text-[#21160e] sm:text-4xl">Shop the Collection</h2>
          </div>
          <ShopLink to="/products" className="hidden min-h-11 items-center gap-2 text-sm font-semibold text-[#8d6223] sm:inline-flex">
            View All <ArrowRight className="h-4 w-4" />
          </ShopLink>
        </div>

        {error && <div className="mb-6 rounded-xl border border-[#d9c8ab] bg-white p-4 text-sm text-[#6f5c45]">{error}</div>}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
          {loading
            ? Array.from({length: 8}).map((_, index) => <ProductCardSkeleton key={index} compact />)
            : products.slice(0, 8).map((product) => <ProductCard key={product.id} product={product} variant="compact" />)}
        </div>

        {!loading && !error && products.length === 0 && (
          <div className="rounded-xl border border-[#d9c8ab] bg-white px-6 py-12 text-center text-sm text-[#766b60]">
            This shop has not added products yet.
          </div>
        )}
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="relative min-h-[430px] overflow-hidden bg-[#1e130a] sm:min-h-[500px]">
      <img src={finalCta} alt="Fine jewellery styling" loading="lazy" className="absolute inset-0 h-full w-full object-cover object-[65%_center]" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#160d07]/95 via-[#1c1009]/70 to-transparent" />
      <div className="relative z-10 mx-auto flex min-h-[430px] max-w-7xl items-center px-5 py-14 sm:min-h-[500px] sm:px-8 lg:px-10">
        <div className="max-w-[520px] text-white">
          <h2 className="font-display text-4xl font-normal leading-[1.06] sm:text-5xl">Make Every Moment More Special</h2>
          <div className="mt-5 h-px w-14 bg-[#d4a64e]" />
          <p className="mt-5 max-w-md text-sm leading-6 text-white/75 sm:text-base">
            Discover jewellery selected for celebrations, milestones and everything worth remembering.
          </p>
          <ShopLink to="/products" className="jewel-cta mt-7 inline-flex min-h-12 items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold">
            Shop the Collection <ArrowRight className="h-4 w-4" />
          </ShopLink>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState('');
  const slug = useShopSlugParam();

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const {products: nextProducts} = await api.products({scope: 'active', limit: 12});
        if (alive) setProducts(nextProducts);
      } catch (e: any) {
        if (alive) setError(e.message || 'We could not load products right now.');
      }
    })();

    return () => {
      alive = false;
    };
  }, [slug]);

  return (
    <div className="bg-[#fffdf9]">
      <Hero />
      <TrustStrip />
      <Collections />
      <CraftedStory />
      <WhyTrust />
      <ShopCollection products={products ?? []} loading={products === null && !error} error={error} />
      <FinalCta />
    </div>
  );
}
