import {
  Box,
  LayoutDashboard,
  Package,
  Palette,
  Settings,
  Truck,
} from "lucide-react";
const areas = [
  { icon: LayoutDashboard, name: "Dashboard" },
  { icon: Package, name: "Orders" },
  { icon: Box, name: "Products" },
  { icon: Palette, name: "Store Builder" },
  { icon: Truck, name: "Delivery" },
  { icon: Settings, name: "Settings" },
];
export function SellerPreview() {
  return (
    <div className="mm-seller">
      <div className="mm-seller-sidebar">
        <strong>The Everyday Edit</strong>
        <small>Seller Admin</small>
        {areas.map(({ icon: Icon, name }) => (
          <div key={name} className={name === "Orders" ? "is-active" : ""}>
            <Icon size={16} aria-hidden="true" />
            {name}
          </div>
        ))}
      </div>
      <div className="mm-seller-main">
        <div className="mm-seller-heading">
          <div>
            <span>YOUR WORKSPACE</span>
            <h3>Orders</h3>
          </div>
          <span className="mm-draft">Sample data</span>
        </div>
        <div className="mm-seller-metrics">
          {[
            ["New orders", "12"],
            ["Products", "48"],
            ["Low stock", "3 items"],
          ].map(([label, value]) => (
            <div key={label}>
              <small>{label}</small>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
        <div className="mm-seller-tabs">
          <b>All</b>
          <span>Pending</span>
          <span>Confirmed</span>
          <span>Delivered</span>
          <span>Return</span>
        </div>
        <div className="mm-order-list">
          {[
            ["#1042", "Classic Shirt", "35,000", "Pending"],
            ["#1041", "Floral Blouse", "22,500", "Confirmed"],
            ["#1040", "Summer Dress", "31,000", "Delivered"],
          ].map(([order, product, total, status]) => (
            <div key={order}>
              <strong>{order}</strong>
              <span>{product}</span>
              <b>{total} MMK</b>
              <small data-status={status}>{status}</small>
            </div>
          ))}
        </div>
        <p className="mm-caption">
          Illustrative interface with sample data. No live merchant or MiniShop
          business metrics.
        </p>
      </div>
    </div>
  );
}
