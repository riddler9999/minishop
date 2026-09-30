import {ArrowRight, ExternalLink, Heart, Search, ShoppingBag, SlidersHorizontal} from 'lucide-react';
import {Link} from 'react-router-dom';

const demoProducts = [
  {
    name: 'ရှပ်အင်္ကျီ — Classic White Shirt',
    price: '17,500 Ks',
    originalPrice: '22,000 Ks',
    discount: 'SALE',
    image: '/demo/fashion/classic-white-shirt.png',
  },
  {
    name: 'ဘလောက်စ်အင်္ကျီ — Floral Blouse',
    price: '19,500 Ks',
    image: '/demo/fashion/floral-blouse-pink.png',
  },
  {
    name: 'တီရှပ် — Cotton Tee',
    price: '8,900 Ks',
    originalPrice: '12,000 Ks',
    discount: 'SALE',
    image: '/demo/fashion/fashion-01.png',
  },
  {
    name: 'ဂါဝန် — Summer Dress',
    price: '22,000 Ks',
    originalPrice: '28,000 Ks',
    discount: 'SALE',
    image: '/demo/fashion/fashion-04.png',
  },
];

export default function HeroSection() {
  return (
    <section className="landing-hero" aria-labelledby="landing-title">
      <div className="landing-topbar">
        <Link className="landing-wordmark" to="/" aria-label="MiniShop homepage">
          <span className="landing-wordmark-mark" aria-hidden="true">m</span>
          <span className="landing-wordmark-text"><strong>Mini</strong><b>Shop</b><em>MM</em></span>
        </Link>
        <div className="landing-topbar-actions">
          <Link className="landing-topbar-cta" to="/admin">
            Seller Dashboard သို့သွားရန် <ArrowRight size={16} aria-hidden="true"/>
          </Link>
        </div>
      </div>

      <div className="landing-hero-copy">
        <h1 id="landing-title">ဝယ်သူကို မြင်အောင်ပိုပြနိုင်လေ<br/>ရောင်းအား ပိုတက်လေပါပဲ</h1>
        <p className="landing-hero-lede">တစ်ခုချင်းလိုက်မပြဘဲ ကိုယ့်ဆိုင်မှာရှိသမျှ ပစ္စည်းအားလုံးကို Link တစ်ခုတည်းနဲ့ စုစည်းပြပေးထားပါ။</p>
        <div className="landing-hero-buttons">
          <Link className="landing-primary-cta" to="/admin/login?mode=signup&from=%2Fadmin%2Fsubscribe">အခမဲ့ စတင်မည် <ArrowRight size={18} aria-hidden="true"/></Link>
          <Link className="landing-demo-cta" to="/demo">နမူနာကြည့်မယ် <ExternalLink size={17} aria-hidden="true"/></Link>
        </div>
      </div>

      <div className="landing-hero-visual" aria-label="MiniShop demo storefront animation">
        <div className="landing-demo-device" role="img" aria-label="MiniShop demo home page mobile mockup">
          <div className="landing-demo-screen">
            <div className="landing-demo-header">
              <div className="landing-demo-brand">
                <small>MiniShop</small>
                <strong>FASHION</strong>
              </div>
              <div className="landing-demo-header-icons">
                <span className="landing-demo-icon"><Heart size={14}/></span>
                <span className="landing-demo-icon landing-demo-cart-icon"><ShoppingBag size={14}/><b className="landing-demo-badge">2</b></span>
              </div>
            </div>

            <div className="landing-demo-search">
              <Search size={14}/>
              <span>ပစ္စည်းများ ရှာဖွေရန်...</span>
            </div>

            <div className="landing-demo-banner-real">
              <img src="/demo/fashion/banner.webp" alt="MiniShop Fashion Promotion Banner" />
              <div className="landing-demo-banner-overlay">
                <small>NEW COLLECTION</small>
                <strong>Summer Special Sales</strong>
              </div>
            </div>

            <div className="landing-demo-arrivals">
              <div className="landing-demo-title">
                <strong>New arrivals</strong>
                <SlidersHorizontal size={16}/>
              </div>
              <div className="landing-demo-categories">
                <b>All</b>
                <span>အင်္ကျီ</span>
                <span>ဂါဝန်</span>
                <span>စကတ် & ဘောင်းဘီ</span>
              </div>
              <div className="landing-demo-products">
                {demoProducts.map((product) => (
                  <article key={product.name} className="landing-demo-product">
                    <div className="landing-demo-product-image">
                      <img src={product.image} alt={product.name} loading="lazy" />
                      {product.discount && <small className="landing-demo-sale-tag">{product.discount}</small>}
                      <Heart size={13} className="landing-demo-product-fav" />
                    </div>
                    <strong className="landing-demo-product-title">{product.name}</strong>
                    <div className="landing-demo-product-price-row">
                      <b className="landing-demo-price">{product.price}</b>
                      {product.originalPrice && <i className="landing-demo-old-price">{product.originalPrice}</i>}
                    </div>
                    <div className="landing-demo-product-btns">
                      <button type="button" className="landing-demo-btn-cart">ခြင်းထဲထည့်မည်</button>
                      <button type="button" className="landing-demo-btn-buy">ဝယ်မည်</button>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="landing-demo-nav">
              <span className="active">⌂<small>Home</small></span>
              <span>▦<small>Shop</small></span>
              <span>▢<small>Cart (2)</small></span>
              <span>📦<small>Orders</small></span>
            </div>
          </div>
          <div className="landing-demo-pointer" aria-hidden="true"/>
        </div>
      </div>
    </section>
  );
}
