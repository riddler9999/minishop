import { useEffect, useRef, useState } from "react";
import * as Accordion from "@radix-ui/react-accordion";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle,
  ChevronDown,
  Menu,
  Package,
  Palette,
  Settings,
  Share2,
  ShoppingBag,
  Smartphone,
  Truck,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { THEME_PRESETS, type ThemePresetId } from "@/domain/theme";
import {
  EXTRA_ORDER_UNIT_PRICE_KS,
  PLAN_MONTHLY_QUOTA,
  PLAN_PRODUCT_LIMIT,
} from "@/domain/entitlement";
import { pricingPlans, signupHref } from "@/features/landing/pricing";
import { BrowserPreview, ProductPreview } from "../components/ProductPreview";
import { BuilderDemo } from "../components/BuilderDemo";
import { SellerPreview } from "../components/SellerPreview";
import "./landing-mm.css";

const navigation = [
  ["Features", "#features"],
  ["How It Works", "#how-it-works"],
  ["Themes", "#themes"],
  ["Pricing", "#pricing"],
  ["FAQ", "#faq"],
];
const features: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Palette,
    title: "Store Builder",
    description:
      "Customize your storefront without coding. Edit a draft, preview it, then publish.",
  },
  {
    icon: Package,
    title: "Product Management",
    description:
      "Manage products, pricing, images and inventory in one organized catalog.",
  },
  {
    icon: ShoppingBag,
    title: "Order Management",
    description:
      "Keep customer orders organized and update their status as they move.",
  },
  {
    icon: Truck,
    title: "Delivery Setup",
    description:
      "Configure delivery options and township fees for your business.",
  },
  {
    icon: Wallet,
    title: "Payment Options",
    description:
      "Set up your local payment accounts for customer transfers, alongside COD.",
  },
  {
    icon: Smartphone,
    title: "Responsive Storefront",
    description:
      "Give customers a consistent shopping experience across devices.",
  },
];
const faqs = [
  [
    "Do I need coding knowledge to use MiniShop?",
    "No. Set up your shop, add products and customize your storefront through the seller workspace. You do not need to write code.",
  ],
  [
    "Can I customize my store design?",
    "Yes. Choose one of five theme families, customize your branding and edit storefront sections. Store Builder keeps your Draft separate from the Published storefront.",
  ],
  [
    "Can customers shop from their phones?",
    "Yes. Customers can browse products, use the cart and place orders through the mobile-friendly storefront without creating a buyer account.",
  ],
  [
    "How do I manage products and orders?",
    "Use the seller workspace to manage product images, prices and stock, review customer orders and update order statuses.",
  ],
  [
    "Can I configure delivery options?",
    "Yes. Configure delivery options and township fees in your delivery settings. Checkout uses the delivery configuration for the customer’s address.",
  ],
  [
    "What payment methods can I use?",
    "Buyer checkout supports COD, KBZPay and WavePay. For transfers, configure your payment accounts; customers enter the last five transaction digits and you verify the payment manually. MiniShop does not automatically collect or settle these customer payments.",
  ],
];
function Wordmark() {
  return (
    <Link to="/" className="mm-wordmark" aria-label="MiniShop MM home">
      <span aria-hidden="true">
        <ShoppingBag size={20} />
      </span>
      MiniShop <small>MM</small>
    </Link>
  );
}
function Actions({ demoLabel = "View Live Demo" }: { demoLabel?: string }) {
  return (
    <div className="mm-actions">
      <Link className="mm-button mm-button-primary" to={signupHref()}>
        Create Your Store <ArrowRight size={17} aria-hidden="true" />
      </Link>
      <Link className="mm-button mm-button-secondary" to="/demo">
        {demoLabel} <ArrowUpRight size={17} aria-hidden="true" />
      </Link>
    </div>
  );
}
function SectionHead({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body?: string;
}) {
  return (
    <div className="mm-section-head">
      <span className="mm-eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {body && <p>{body}</p>}
    </div>
  );
}
function Navbar() {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open]);
  return (
    <header className="mm-navbar">
      <div className="mm-nav-inner">
        <Wordmark />
        <nav className="mm-desktop-nav" aria-label="Main navigation">
          {navigation.map(([label, href]) => (
            <a key={label} href={href}>
              {label}
            </a>
          ))}
        </nav>
        <div className="mm-nav-actions">
          <Link className="mm-nav-demo" to="/demo">
            View Demo
          </Link>
          <Link
            className="mm-button mm-button-primary mm-button-small"
            to={signupHref()}
          >
            Create Store <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
          <button
            ref={toggle}
            className="mm-menu-toggle"
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="mm-mobile-nav"
            aria-label={open ? "Close navigation" : "Open navigation"}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      <nav
        id="mm-mobile-nav"
        className="mm-mobile-nav"
        hidden={!open}
        aria-label="Mobile navigation"
      >
        {navigation.map(([label, href]) => (
          <a key={label} href={href} onClick={() => setOpen(false)}>
            {label}
          </a>
        ))}
        <Link to="/demo" onClick={() => setOpen(false)}>
          View Demo
        </Link>
      </nav>
    </header>
  );
}

export default function Landing() {
  return (
    <div className="mm-landing" lang="en" id="minishop-mm-landing">
      <a className="mm-skip" href="#main">
        Skip to content
      </a>
      <Navbar />
      <main id="main">
        <section className="mm-hero mm-container" aria-labelledby="mm-title">
          <div className="mm-hero-copy">
            <span className="mm-pill">
              <span />
              Built for Myanmar Sellers
            </span>
            <h1 id="mm-title">
              Your Store.
              <br />
              Your Brand.
              <br />
              <em>Start Selling.</em>
            </h1>
            <p>
              Create a beautiful online store, add your products, customize your
              brand, and start selling — without writing a single line of code.
            </p>
            <Actions />
            <div className="mm-trust">
              {["No coding required", "Mobile ready", "Easy to manage"].map(
                (text) => (
                  <span key={text}>
                    <CheckCircle size={15} aria-hidden="true" />
                    {text}
                  </span>
                ),
              )}
            </div>
          </div>
          <div className="mm-hero-visual">
            <div className="mm-visual-label">
              <span>YOUR BRAND, FRONT AND CENTRE</span>
              <ArrowUpRight size={18} aria-hidden="true" />
            </div>
            <BrowserPreview eager />
            <div className="mm-float mm-float-order">
              <span className="mm-icon-tile">
                <ShoppingBag size={18} aria-hidden="true" />
              </span>
              <div>
                <small>New order · Example</small>
                <strong>Order #1042</strong>
                <span>35,000 MMK</span>
              </div>
              <span className="mm-status-dot" />
            </div>
            <div className="mm-float mm-float-product">
              <img
                src="/landing/classic-white-shirt-240.webp"
                width="44"
                height="50"
                alt=""
              />
              <div>
                <small>Product · Example</small>
                <strong>Classic Shirt</strong>
                <span>25,000 MMK · In Stock</span>
              </div>
            </div>
            <div className="mm-live">
              <CheckCircle size={15} aria-hidden="true" />
              Your store is live <small>Example</small>
            </div>
          </div>
        </section>
        <section
          className="mm-value-strip mm-container"
          aria-label="Platform capabilities"
        >
          <p>Everything you need to start selling online</p>
          <div>
            {[
              [Palette, "Store Builder"],
              [Package, "Product Management"],
              [ShoppingBag, "Order Management"],
              [Smartphone, "Mobile Storefront"],
              [Settings, "Custom Branding"],
              [Truck, "Delivery Setup"],
            ].map(([Icon, label]) => {
              const CapabilityIcon = Icon as LucideIcon;
              return (
                <span key={String(label)}>
                  <CapabilityIcon size={18} aria-hidden="true" />
                  {String(label)}
                </span>
              );
            })}
          </div>
        </section>
        <section className="mm-section mm-container" id="store-builder">
          <SectionHead
            eyebrow="STORE BUILDER"
            title="Build your store. Your way."
            body="Choose a style, customize your storefront, add your products, and publish your shop from one simple workspace."
          />
          <BuilderDemo />
        </section>
        <section className="mm-band" id="how-it-works">
          <div className="mm-container mm-section">
            <SectionHead
              eyebrow="HOW IT WORKS"
              title="From zero to selling in minutes."
            />
            <p className="mm-caption mm-setup-note">
              Set up at your own pace. Paid plans require payment verification
              before activation.
            </p>
            <div className="mm-steps">
              {[
                [
                  "Create your store",
                  "Set your shop name and basic information.",
                ],
                [
                  "Add your products",
                  "Upload product images, prices, stock, and details.",
                ],
                [
                  "Make it yours",
                  "Choose your theme and customize your storefront.",
                ],
                [
                  "Publish & sell",
                  "Share your store link with customers and start receiving orders.",
                ],
              ].map(([title, body], i) => (
                <article key={title}>
                  <span className="mm-step-number">0{i + 1}</span>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="mm-section mm-container" id="themes">
          <SectionHead
            eyebrow="THEMES"
            title="A storefront that feels like your brand."
            body="Start with a professionally designed layout and make it yours."
          />
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- This horizontal scroll region needs keyboard focus. */}
          <div tabIndex={0}
            className="mm-theme-carousel"
            role="region"
            aria-label="Five storefront theme examples"
          >
            {Object.entries(THEME_PRESETS).map(([id, preset]) => (
              <article key={id} className="mm-theme-card">
                <div className="mm-theme-preview" aria-hidden="true">
                  <ProductPreview
                    theme={id as ThemePresetId}
                    compact
                    interactive={false}
                  />
                </div>
                <div className="mm-theme-card-label">
                  <h3>{preset.label}</h3>
                  <span>0{Object.keys(THEME_PRESETS).indexOf(id) + 1}</span>
                </div>
              </article>
            ))}
          </div>
          <div className="mm-section-action">
            <a className="mm-button mm-button-secondary" href="#store-builder">
              Explore Themes <ArrowRight size={17} aria-hidden="true" />
            </a>
            <p className="mm-caption">
              Example storefronts using MiniShop’s five existing theme families.
            </p>
          </div>
        </section>
        <section className="mm-section mm-container mm-mobile-section">
          <div className="mm-phone-stage">
            <div className="mm-phone">
              <div className="mm-phone-notch" aria-hidden="true" />
              <ProductPreview compact />
              <Link className="mm-phone-cart" to="/demo/cart">
                <ShoppingBag size={17} aria-hidden="true" /> Cart &amp; checkout{" "}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <span className="mm-phone-note">
              <Share2 size={17} aria-hidden="true" />
              One link. Ready to share.
            </span>
          </div>
          <div>
            <SectionHead
              eyebrow="MOBILE FIRST"
              title="Built for how your customers actually shop."
              body="Your storefront is designed to work beautifully across phones, tablets, and desktops."
            />
            <ul className="mm-check-list">
              {[
                "Responsive storefront",
                "Fast product browsing",
                "Simple cart experience",
                "Mobile-friendly checkout",
                "Shareable store link",
              ].map((text) => (
                <li key={text}>
                  <CheckCircle size={18} aria-hidden="true" />
                  {text}
                </li>
              ))}
            </ul>
            <Link className="mm-text-link" to="/demo">
              Try the shopping experience{" "}
              <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </section>
        <section className="mm-band">
          <div className="mm-section mm-container">
            <SectionHead
              eyebrow="ONE PLACE TO MANAGE YOUR STORE"
              title="Run your shop without the chaos."
              body="Your products, orders, storefront and settings. Together in one seller workspace."
            />
            <SellerPreview />
          </div>
        </section>
        <section className="mm-section mm-container" id="features">
          <SectionHead
            eyebrow="EVERYTHING IN ONE PLACE"
            title="The tools you need to run your online store."
          />
          <div className="mm-bento">
            {features.map(({ icon: Icon, title, description }, i) => (
              <article key={title} className={`mm-feature mm-feature-${i}`}>
                <span className="mm-icon-tile">
                  <Icon size={24} aria-hidden="true" />
                </span>
                <h3>{title}</h3>
                <p>{description}</p>
                {i === 0 && (
                  <div className="mm-feature-mini">
                    <span>Draft</span>
                    <ArrowRight size={16} aria-hidden="true" />
                    <span>Preview</span>
                    <ArrowRight size={16} aria-hidden="true" />
                    <b>Publish</b>
                  </div>
                )}
                {i === 1 && (
                  <div className="mm-feature-product">
                    <img
                      src="/landing/classic-white-shirt-240.webp"
                      alt=""
                      width="60"
                      height="70"
                      loading="lazy"
                    />
                    <div>
                      <strong>Classic Shirt</strong>
                      <span>25,000 MMK · In Stock</span>
                    </div>
                  </div>
                )}
                {i === 4 && (
                  <div className="mm-payment-pills">
                    <span>COD</span>
                    <span>KBZPay</span>
                    <span>WavePay</span>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
        <section className="mm-container mm-local">
          <div>
            <SectionHead
              eyebrow="MADE FOR MYANMAR COMMERCE"
              title="Built around the way Myanmar businesses sell."
              body="MMK prices. Local payment configuration. Township delivery fees. A store link you can share wherever your customers are."
            />
            <p className="mm-caption">
              Customer transfers are verified by the seller. No automatic
              payment settlement or messaging integrations are implied.
            </p>
          </div>
          <div className="mm-local-card">
            <div>
              <Package aria-hidden="true" />
              <span>
                Product<strong>Classic Shirt</strong>
              </span>
              <b>25,000 MMK</b>
            </div>
            <div>
              <Truck aria-hidden="true" />
              <span>
                Delivery<strong>Yangon · Township fees</strong>
              </span>
              <Check size={17} aria-hidden="true" />
            </div>
            <div>
              <Wallet aria-hidden="true" />
              <span>
                Payment<strong>COD / KBZPay / WavePay</strong>
              </span>
              <Check size={17} aria-hidden="true" />
            </div>
            <small>Illustrative shop configuration</small>
          </div>
        </section>
        <section className="mm-section mm-container">
          <SectionHead
            eyebrow="LESS BACK AND FORTH. MORE CLARITY."
            title="Stop managing your whole business through chat."
          />
          <div className="mm-comparison">
            <article>
              <span>WITHOUT MINISHOP</span>
              <h3>Scattered conversations.</h3>
              <ul>
                {[
                  "Product photos scattered across chats",
                  "Prices manually repeated",
                  "Orders difficult to track",
                  "Customers constantly asking for product details",
                ].map((text) => (
                  <li key={text}>
                    <span aria-hidden="true">—</span>
                    {text}
                  </li>
                ))}
              </ul>
            </article>
            <article>
              <span>WITH MINISHOP</span>
              <h3>One place to sell.</h3>
              <ul>
                {[
                  "One shareable storefront",
                  "Organized product catalog",
                  "Structured customer orders",
                  "Central store management",
                ].map((text) => (
                  <li key={text}>
                    <CheckCircle size={17} aria-hidden="true" />
                    {text}
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </section>
        <section className="mm-band" id="pricing">
          <div className="mm-section mm-container">
            <SectionHead
              eyebrow="START YOUR STORE"
              title="A simple start. Room to grow."
              body="Start with a free trial, then choose the capacity that fits your shop."
            />
            <div className="mm-pricing">
              {pricingPlans.map(({ plan, name, price }) => (
                <article
                  key={plan}
                  className={plan === "starter" ? "mm-price-featured" : ""}
                >
                  <span className="mm-eyebrow">
                    {plan === "free_trial"
                      ? "TRY IT FIRST"
                      : plan === "starter"
                        ? "FOR YOUR EVERYDAY BUSINESS"
                        : "FOR A GROWING CATALOG"}
                  </span>
                  <h3>{name}</h3>
                  <div className="mm-price">
                    {price.toLocaleString("en-US")}
                    <small>MMK{price > 0 ? " / month" : ""}</small>
                  </div>
                  <ul className="mm-check-list">
                    <li>
                      <Check size={16} aria-hidden="true" />
                      {PLAN_MONTHLY_QUOTA[plan]} created orders{" "}
                      {plan === "free_trial" ? "lifetime" : "/ cycle"}
                    </li>
                    <li>
                      <Check size={16} aria-hidden="true" />
                      {PLAN_PRODUCT_LIMIT[plan]} total products
                    </li>
                    <li>
                      <Check size={16} aria-hidden="true" />
                      Store Builder &amp; all five themes
                    </li>
                    <li>
                      <Check size={16} aria-hidden="true" />
                      Products, orders &amp; delivery setup
                    </li>
                    <li>
                      <Check size={16} aria-hidden="true" />
                      COD, KBZPay &amp; WavePay
                    </li>
                  </ul>
                  <Link
                    className={`mm-button ${plan === "starter" ? "mm-button-primary" : "mm-button-secondary"}`}
                    to={signupHref(plan)}
                  >
                    {plan === "free_trial"
                      ? "Start Free Trial"
                      : `Choose ${name}`}
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </article>
              ))}
            </div>
            <p className="mm-pricing-note">
              Active, draft and archived products count toward the product
              limit. Each successfully created order uses one order entitlement;
              cancellation or return does not restore it. Extra Orders cost{" "}
              {EXTRA_ORDER_UNIT_PRICE_KS.toLocaleString("en-US")} MMK each, do
              not expire, and require an active paid plan to use. Paid
              activation follows payment verification.
            </p>
          </div>
        </section>
        <section className="mm-section mm-container mm-faq-section" id="faq">
          <SectionHead
            eyebrow="A LITTLE MORE CLARITY"
            title="Good questions. Simple answers."
          />
          <Accordion.Root
            type="single"
            defaultValue="faq-0"
            collapsible
            className="mm-faq"
          >
            {faqs.map(([q, a], i) => (
              <Accordion.Item
                value={`faq-${i}`}
                key={q}
                className="mm-faq-item"
              >
                <Accordion.Header>
                  <Accordion.Trigger className="mm-faq-trigger">
                    {q}
                    <ChevronDown size={20} aria-hidden="true" />
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content className="mm-faq-content">
                  <p>{a}</p>
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </section>
        <section className="mm-container mm-final">
          <div>
            <span className="mm-eyebrow">YOUR NEXT CHAPTER STARTS HERE</span>
            <h2>
              Your business deserves
              <br />
              its own store.
            </h2>
            <p>
              Build your storefront, share your link, and start selling with
              MiniShop MM.
            </p>
            <div className="mm-actions">
              <Link className="mm-button mm-button-primary" to={signupHref()}>
                Create Your Store <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <a className="mm-button mm-button-secondary" href="#how-it-works">
                See How It Works
              </a>
            </div>
          </div>
          <div className="mm-final-preview" aria-hidden="true">
            <BrowserPreview compact interactive={false} />
          </div>
        </section>
      </main>
      <footer className="mm-footer">
        <div className="mm-container mm-footer-main">
          <div>
            <Wordmark />
            <p>
              A simple way for Myanmar businesses to build and manage their
              online store.
            </p>
          </div>
          <nav aria-label="Footer product navigation">
            <strong>Product</strong>
            <a href="#features">Features</a>
            <a href="#themes">Themes</a>
            <a href="#pricing">Pricing</a>
            <Link to="/demo">Demo</Link>
          </nav>
          <nav aria-label="Footer help navigation">
            <strong>Get started</strong>
            <a href="#how-it-works">How It Works</a>
            <a href="#faq">Help &amp; FAQ</a>
            <Link to="/admin/login">Seller Login</Link>
            <Link to={signupHref()}>Create Store</Link>
          </nav>
        </div>
        <div className="mm-container mm-footer-bottom">
          <span>© {new Date().getFullYear()} MiniShop MM</span>
          <span>Your store. Your brand.</span>
        </div>
      </footer>
    </div>
  );
}
