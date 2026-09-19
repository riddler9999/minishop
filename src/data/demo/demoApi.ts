// ---- DEMO API (no backend) -------------------------------------------------
// The original Uthuya store proxied a Supabase DB through an Express server.
// This DEMO clone has NO server: every call is answered client-side from the
// in-memory demo catalog (src/data/products.ts). Orders are simulated and
// persisted to localStorage so the "Order စစ်ရန်" (lookup) page still works.
// This lets the store deploy as a pure static site with zero secrets.


import type {AdminOrder, OrderResult, TrackedOrder} from '@/domain/order';
import type {Product, ProductPatch} from '@/domain/product';
import type {MerchantAccount} from '@/domain/shop';

// Loaded lazily to avoid a static import cycle with data/products.ts.
import {DEMO_MERCHANT_ACCOUNTS, DEMO_PRODUCTS, demoCategories} from '@/data/demo/fixtures';

const ORDERS_KEY = 'demo_store_orders_v1';
const OVERRIDES_KEY = 'demo_store_product_overrides_v1';

// Simulate network latency so skeleton loaders are visible (nicer demo feel).
const delay = (ms = 260) => new Promise((r) => setTimeout(r, ms));

function unit(p: Product): number {
  return p.isPromotion && p.promoPrice ? p.promoPrice : p.price;
}

// ---- PRODUCT OVERRIDE LAYER ------------------------------------------------
// The demo catalog (DEMO_PRODUCTS) is a compile-time constant, so admin edits
// can't mutate it. Instead we persist a per-id patch to localStorage and merge
// it over the catalog on every read. This keeps ONE product source of truth
// that both the storefront and the admin console read through, so an edit made
// in /admin is immediately visible on the shop.
function loadOverrides(): Record<string, ProductPatch> {
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY);
    return raw ? (JSON.parse(raw) as Record<string, ProductPatch>) : {};
  } catch {
    return {};
  }
}

function saveOverrides(all: Record<string, ProductPatch>) {
  try {
    localStorage.setItem(OVERRIDES_KEY, JSON.stringify(all));
  } catch {
    /* ignore quota / private mode */
  }
}

// Apply a stored patch over a base product, re-deriving the computed fields
// (inStock, image) so the merged product is always internally consistent.
function applyOverride(base: Product, patch: ProductPatch | undefined): Product {
  if (!patch) return base;
  const price = patch.price ?? base.price;
  const promoPrice = patch.promoPrice !== undefined ? patch.promoPrice : base.promoPrice;
  const isPromotion = patch.isPromotion !== undefined ? patch.isPromotion : promoPrice != null;
  const stock = patch.stock ?? base.stock;
  const status = patch.status ?? base.status;
  return {
    ...base,
    price,
    promoPrice,
    isPromotion: isPromotion && promoPrice != null,
    stock,
    inStock: stock > 0,
    status,
  };
}

// The resolved catalog — DEMO_PRODUCTS with any admin overrides applied.
function resolvedProducts(): Product[] {
  const overrides = loadOverrides();
  return DEMO_PRODUCTS.map((p) => applyOverride(p, overrides[p.id]));
}

function loadOrders(): Record<string, TrackedOrder[]> {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, TrackedOrder[]>) : {};
  } catch {
    return {};
  }
}

function saveOrders(all: Record<string, TrackedOrder[]>) {
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(all));
  } catch {
    /* ignore quota / private mode */
  }
}

function normPhone(p: string): string {
  return p.replace(/[^0-9]/g, '');
}

export const api = {
  async products(opts: {
    scope?: 'active' | 'all';
    featured?: boolean;
    category?: string;
    q?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{products: Product[]; total: number}> {
    await delay();
    let list = resolvedProducts().filter((p) => (opts.scope === 'all' ? true : p.status === 'active'));
    if (opts.featured) list = list.filter((p) => p.isPromotion);
    if (opts.category) list = list.filter((p) => p.category === opts.category);
    if (opts.q) {
      const q = opts.q.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.category ?? '').toLowerCase().includes(q) ||
          (p.color ?? '').toLowerCase().includes(q),
      );
    }
    // Newest first by arrivalDate.
    list = [...list].sort((a, b) => (b.arrivalDate ?? '').localeCompare(a.arrivalDate ?? ''));
    const total = list.length;
    const offset = opts.offset ?? 0;
    const limit = opts.limit ?? total;
    return {products: list.slice(offset, offset + limit), total};
  },

  async product(id: string): Promise<{product: Product}> {
    await delay();
    const product = resolvedProducts().find((p) => p.id === id);
    if (!product) throw new Error('ပစ္စည်း ရှာမတွေ့ပါ');
    return {product};
  },

  async categories(): Promise<{categories: string[]}> {
    await delay(120);
    return {categories: demoCategories()};
  },

  async merchantAccounts(): Promise<{accounts: MerchantAccount[]}> {
    await delay(120);
    return {accounts: DEMO_MERCHANT_ACCOUNTS};
  },

  // Demo storefront computes fees from the static locations table (Checkout
  // branches on isLiveBackend), so this is unused — present only for type
  // compatibility with the live `api` (see lib/store.ts Proxy).
  async shippingConfig(): Promise<{zones: {region: string; township: string; fee: number}[]; defaultFee: number}> {
    return {zones: [], defaultFee: 0};
  },

  async createOrder(body: unknown): Promise<OrderResult> {
    await delay(400);
    const b = body as {
      customer: {name: string; phone: string; street: string; region: string; township: string};
      items: {id: string; qty: number}[];
      paymentMethod: 'cod' | 'kpay' | 'wave';
      shippingFee: number;
    };

    // Re-price server-side style: trust the (resolved) demo catalog, not the client.
    const catalog = resolvedProducts();
    const lines = b.items
      .map((it) => {
        const p = catalog.find((x) => x.id === it.id);
        if (!p) return null;
        const price = unit(p);
        return {name: p.name, price, qty: it.qty};
      })
      .filter(Boolean) as {name: string; price: number; qty: number}[];

    const itemTotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
    const deliveryFee = b.shippingFee || 0;
    const grandTotal = itemTotal + deliveryFee;
    const paymentMethod = b.paymentMethod === 'kpay' || b.paymentMethod === 'wave' ? b.paymentMethod : 'cod';
    // Cash on Delivery pays on delivery, so nothing is due now.
    const amountNow = paymentMethod === 'cod' ? 0 : grandTotal;
    const methodLabel =
      paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod === 'wave' ? 'WavePay' : 'KBZPay';
    // COD orders are simply awaiting delivery; online orders await payment check.
    const status = paymentMethod === 'cod' ? 'cod_pending' : 'pending_payment';

    const orderId = 'DEMO-' + Date.now().toString(36).toUpperCase().slice(-6);

    const c = b.customer || ({} as typeof b.customer);
    const address = [c.street, c.township, c.region].filter(Boolean).join(', ');
    const tracked: TrackedOrder = {
      order_id: orderId,
      items: lines,
      item_total: itemTotal,
      delivery_fee: deliveryFee,
      grand_total: grandTotal,
      payment_method: methodLabel,
      status,
      slip_url: null,
      created_at: new Date().toISOString(),
      customer_name: c.name,
      customer_phone: c.phone,
      customer_address: address || undefined,
    };

    const all = loadOrders();
    const key = normPhone(b.customer.phone);
    all[key] = [tracked, ...(all[key] || [])];
    saveOrders(all);

    return {orderId, itemTotal, deliveryFee, grandTotal, amountNow, paymentMethod};
  },

  async uploadSlip(orderId: string, _imageBase64: string, _filename?: string): Promise<{ok: boolean; slipUrl: string}> {
    await delay(300);
    // Demo: mark the stored order as having a slip (no real upload).
    const all = loadOrders();
    for (const key of Object.keys(all)) {
      const o = all[key].find((x) => x.order_id === orderId);
      if (o) {
        o.slip_url = 'demo-slip';
        saveOrders(all);
        break;
      }
    }
    return {ok: true, slipUrl: 'demo-slip'};
  },

  async ordersByPhone(phone: string): Promise<{orders: TrackedOrder[]}> {
    await delay();
    const all = loadOrders();
    return {orders: all[normPhone(phone)] || []};
  },
};

// ---- ADMIN API -------------------------------------------------------------
// Client-side admin surface over the SAME demo data. Product edits write to the
// override layer; order edits write to the per-phone order store. Everything is
// localStorage-backed, so it's per-browser demo state — there is no real server
// here. (The admin console's login gate is real Supabase Auth — see
// src/lib/adminAuth.tsx — but these pages still read/write the demo store; see
// tasks/TASKS.md "Switch pages to store.ts".)
export const adminApi = {
  // --- Products ---
  async listProducts(): Promise<{products: Product[]}> {
    await delay(120);
    // Admin sees ALL products (including hidden), newest first.
    const list = [...resolvedProducts()].sort((a, b) =>
      (b.arrivalDate ?? '').localeCompare(a.arrivalDate ?? ''),
    );
    return {products: list};
  },

  async updateProduct(id: string, patch: ProductPatch): Promise<{product: Product}> {
    await delay(200);
    const base = DEMO_PRODUCTS.find((p) => p.id === id);
    if (!base) throw new Error('ပစ္စည်း ရှာမတွေ့ပါ');
    const all = loadOverrides();
    const merged: ProductPatch = {...all[id], ...patch};
    all[id] = merged;
    saveOverrides(all);
    return {product: applyOverride(base, merged)};
  },

  async resetProducts(): Promise<{ok: true}> {
    await delay(120);
    saveOverrides({});
    return {ok: true};
  },

  // --- Orders ---
  async listOrders(): Promise<{orders: AdminOrder[]}> {
    await delay(160);
    const all = loadOrders();
    const flat: AdminOrder[] = [];
    for (const key of Object.keys(all)) {
      for (const o of all[key]) flat.push({...o, phone_key: key});
    }
    flat.sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''));
    return {orders: flat};
  },

  async updateOrderStatus(orderId: string, status: string): Promise<{ok: true}> {
    await delay(180);
    const all = loadOrders();
    for (const key of Object.keys(all)) {
      const o = all[key].find((x) => x.order_id === orderId);
      if (o) {
        o.status = status;
        saveOrders(all);
        return {ok: true};
      }
    }
    throw new Error('Order ရှာမတွေ့ပါ');
  },

  async deleteOrder(orderId: string): Promise<{ok: true}> {
    await delay(160);
    const all = loadOrders();
    for (const key of Object.keys(all)) {
      const idx = all[key].findIndex((x) => x.order_id === orderId);
      if (idx >= 0) {
        all[key].splice(idx, 1);
        if (all[key].length === 0) delete all[key];
        saveOrders(all);
        return {ok: true};
      }
    }
    throw new Error('Order ရှာမတွေ့ပါ');
  },
};
