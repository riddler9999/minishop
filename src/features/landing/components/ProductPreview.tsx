import type { CSSProperties } from "react";
import { ArrowUpRight, ShoppingBag, Store } from "lucide-react";
import { Link } from "react-router-dom";
import { THEME_PRESETS, type ThemePresetId } from "@/domain/theme";

const products = [
  {
    name: "Classic Shirt",
    price: "25,000",
    image: "/landing/classic-white-shirt-240.webp",
  },
  {
    name: "Floral Blouse",
    price: "19,500",
    image: "/landing/floral-blouse-pink-240.webp",
  },
  {
    name: "Cotton Tee",
    price: "12,000",
    image: "/landing/fashion-01-240.webp",
  },
  {
    name: "Summer Dress",
    price: "28,000",
    image: "/landing/fashion-04-240.webp",
  },
];

// Compact product demonstrations use existing assets and the real theme tokens.
// They never read seller data or imply the example orders belong to MiniShop.
export function ProductPreview({
  theme = "clean-minimal",
  compact = false,
  eager = false,
  shopName = "The Everyday Edit",
  headline = "Good things. Everyday.",
  interactive = true,
}: {
  theme?: ThemePresetId;
  compact?: boolean;
  eager?: boolean;
  shopName?: string;
  headline?: string;
  interactive?: boolean;
}) {
  const { visual } = THEME_PRESETS[theme];
  const style = {
    "--preview-canvas": visual.canvas,
    "--preview-text": visual.text,
    "--preview-accent": visual.accent,
    "--preview-accent-text": visual.accentText,
    "--preview-border": visual.border,
    "--preview-surface": visual.surface,
  } as CSSProperties;
  return (
    <div
      className={`mm-store mm-store--${visual.layout} ${compact ? "mm-store--compact" : ""}`}
      style={style}
    >
      <div className="mm-store-header">
        <span>
          <Store size={16} aria-hidden="true" />
          <b>{shopName}</b>
        </span>
        <span>
          <ShoppingBag size={17} aria-hidden="true" />
          <small>Cart · 0</small>
        </span>
      </div>
      <div className="mm-store-hero">
        <div>
          <span>THOUGHTFULLY CHOSEN</span>
          <p>{headline}</p>
          <small>Find your next favourite.</small>
        </div>
        <img
          src="/landing/fashion-06-240.webp"
          srcSet="/landing/fashion-06-240.webp 240w, /landing/fashion-06-480.webp 480w"
          sizes="(max-width: 767px) 140px, 220px"
          alt="Everyday fashion collection"
          width="180"
          height="200"
          loading={eager ? "eager" : "lazy"}
        />
      </div>
      <div className="mm-store-collection">
        <span>New arrivals</span>
        <small>Made for your everyday</small>
      </div>
      <div className="mm-store-products">
        {products.slice(0, compact ? 2 : 4).map((product) => (
          <div className="mm-product" key={product.name}>
            <div className="mm-product-image">
              <img
                src={product.image}
                srcSet={`${product.image} 240w, ${product.image.replace("-240", "-480")} 480w`}
                sizes={
                  compact
                    ? "(max-width: 767px) 120px, 200px"
                    : "(max-width: 767px) 140px, 220px"
                }
                alt={product.name}
                width="240"
                height="280"
                loading={eager ? "eager" : "lazy"}
              />
            </div>
            <p>{product.name}</p>
            <div className="mm-product-buy">
              <b>
                {product.price} <small>MMK</small>
              </b>
              {interactive ? (
                <Link
                  to="/demo"
                  aria-label={`Try ${product.name} in the live demo`}
                >
                  ADD <ArrowUpRight size={12} aria-hidden="true" />
                </Link>
              ) : (
                <span className="mm-add">ADD</span>
              )}
            </div>
          </div>
        ))}
      </div>
      {!compact &&
        (interactive ? (
          <Link className="mm-store-checkout" to="/demo/cart">
            Open cart &amp; checkout{" "}
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        ) : (
          <div className="mm-store-checkout">Cart &amp; checkout</div>
        ))}
    </div>
  );
}

export function BrowserPreview(props: Parameters<typeof ProductPreview>[0]) {
  return (
    <div className="mm-browser">
      <div className="mm-browser-bar" aria-hidden="true">
        <i />
        <i />
        <i />
        <span>minishop / your-store</span>
        <ArrowUpRight size={12} />
      </div>
      <ProductPreview {...props} />
    </div>
  );
}
