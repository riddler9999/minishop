// ---- DEMO API (no backend) -------------------------------------------------
// The original Uthuya store proxied a Supabase DB through an Express server.
// This DEMO clone has NO server: every call is answered client-side from the
// in-memory demo catalog (./fixtures.ts). Orders are simulated and
// persisted to localStorage so the "Order စစ်ရန်" (lookup) page still works.
// This lets the store deploy as a pure static site with zero secrets.


import type {AdminOrder, OrderResult, TrackedOrder} from '@/domain/order';
import type {Product, ProductPatch} from '@/domain/product';
import type {MerchantAccount} from '@/domain/shop';
import {createDefaultStoreDesign, resolveProductSource, type ProductSource} from '@/domain/storeDesign';

// Loaded lazily to avoid a static import cycle with data/products.ts.
import {DEMO_MERCHANT_ACCOUNTS, DEMO_PRODUCTS, demoCategories} from '@/data/demo/fixtures';

const ORDERS_KEY = 'demo_store_orders_v1';
const OVERRIDES_KEY = 'demo_store_product_overrides_v1';

// Simulate network latency so skeleton loaders are visible (nicer demo feel).
const delay = (ms = 260) => new Promise((r) => setTimeout(r, ms));

function unit(p: Product): number {
  return p.isPromotion && p.promoPrice ? p.promoPrice : p.price;
}

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

function demoDemand(): Map<string, number> {
  const demand = new Map<string, number>();
  for (const orders of Object.values(loadOrders())) {
    for (const order of orders) {
      for (const item of order.items) {
        const product = resolvedProducts().find((candidate) => candidate.name === item.name);
        if (product) demand.set(product.id, (demand.get(product.id) ?? 0) + item.qty);
      }
    }
  }
  return demand;
}

export const api = {
  async loadPublishedStoreDesign() {
    return createDefaultStoreDesign();
  },

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
    list = [...list].sort((a, b) => (b.arrivalDate ?? '').localeCompare(a.arrivalDate ?? ''));
    const total = list.length;
    const offset = opts.offset ?? 0;
    const limit = opts.limit ?? total;
    return {products: list.slice(offset, offset + limit), total};
  },

  async sectionProducts(source: ProductSource): Promise<{products: Product[]}> {
    await delay(120);
    return {products: resolveProductSource(source, resolvedProducts(), {demandByProductId: demoDemand()})};
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

    const catalog = resolvedProducts();
    const lines = b.items.map((it) => {
      const p = catalog.find((x) => x.id === it.id);
      if (!p) throw new Error('ပစ္စည်း ရှာမတွေ့ပါ');
      if (!p.inStock || p.stock < it.qty) throw new Error(`${p.name} လက်ကျန်မလုံလောက်ပါ။`);
      if (!Number.isInteger(it.qty) || it.qty < 1) throw new Error('ပစ္စည်းအရေအတွက် မမှန်ပါ။');
      const price = unit(p);
      return {name: p.name, price, qty: it.qty};
    });

    const itemTotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
    const deliveryFee = b.shippingFee || 0;
    const grandTotal = itemTotal + deliveryFee;
    const paymentMethod = b.paymentMethod === 'kpay' || b.paymentMethod === 'wave' ? b.paymentMethod : 'cod';
    const amountNow = paymentMethod === 'cod' ? 0 : grandTotal;
    const methodLabel =
      paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod === 'wave' ? 'WavePay' : 'KBZPay';
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

  async ordersByPhone(phone: string, orderNo?: string): Promise<{orders: TrackedOrder[]}> {
    await delay();
    if (!orderNo?.trim()) {
      throw new Error('ဖုန်းနံပါတ်နှင့် Order နံပါတ် နှစ်ခုလုံး လိုအပ်ပါသည်။');
    }
    const all = loadOrders();
    const orders = all[normPhone(phone)] || [];
    const wanted = orderNo.trim().toUpperCase();
    return {orders: orders.filter((order) => order.order_id.toUpperCase() === wanted)};
  },
};

export const adminApi = {
  async listProducts(): Promise<{products: Product[]}> {
    await delay(120);
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

  async getEntitlement() {
    return {
      entitlement: {
        plan: 'business',
        active: true,
        monthlyQuota: 1000,
        monthlyUsed: 24,
        purchasedBalance: 0,
        unlimited: true,
        remainingOrders: 976,
        isQuotaExhausted: false,
        canAcceptOrders: true,
        cycleStart: new Date().toISOString(),
        cycleEnd: null,
        pendingPlan: null,
      },
    };
  },

  async getUsage() {
    return {
      usage: {
        shopId: 'demo-shop-id',
        plan: 'business',
        month: new Date().toISOString().slice(0, 7),
        billableOrders: 24,
        tier: 'unlimited',
      },
    };
  },
};
