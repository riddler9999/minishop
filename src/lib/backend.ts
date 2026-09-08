// ---- LIVE BACKEND (Supabase) ------------------------------------------------
// Real multi-tenant data layer over supabase/migrations/0001_init_saas.sql,
// shaped to match src/lib/api.ts's `api` / `adminApi` (same method names,
// same Product/MerchantAccount/OrderResult/TrackedOrder/AdminOrder/ProductPatch
// shapes — reused by type-import below) so pages can switch from the demo to
// this with a minimal import change, once src/lib/store.ts activates it.
//
// Two shapes deliberately DIVERGE from the demo, both forced by the schema
// design already committed in 0001_init_saas.sql (see memory/decisions.md):
//
// 1. `ordersByPhone(phone, orderNo)` takes a SECOND, required argument. The
//    `lookup_order()` RPC takes (shop_slug, order_no, phone) on purpose — a
//    phone number alone would let anyone who knows/guesses it enumerate every
//    order a buyer ever placed at this shop. The demo's phone-only lookup
//    can't be replicated without reopening that hole. `orderNo` is optional
//    only so this still type-checks against the demo's single-arg signature
//    in store.ts's `isSupabaseConfigured ? live : demo` union — omitting it
//    throws a clear error rather than silently degrading. OrderLookup.tsx now
//    surfaces an "Order နံပါတ်" field and OrderSuccess.tsx prefills it into the
//    tracking link (Milestone B).
// 2. `uploadSlip()` is a no-op. Decision D6 dropped slip upload for MVP in
//    favor of the `payment_ref_tail` (last-5-digits) field on `place_order` —
//    there is no slip storage table. Checkout.tsx's slip button was removed in
//    Milestone B; this no-op is kept only for API-shape compatibility.
// 3. `resetProducts()` throws — it's a demo-only affordance (clears the
//    localStorage override layer) with no equivalent on live shop data.

import {requireSupabase} from './supabase';
import {getShopSlug} from './shopContext';
import type {TablesInsert, TablesUpdate} from './database.types';
import type {
  AdminOrder,
  MerchantAccount,
  OrderResult,
  Product,
  ProductCreateInput,
  ProductPatch,
  TrackedOrder,
} from './api';

// A shop's per-township delivery-fee zone (seller-managed).
export interface ShippingZone {
  id: string;
  region: string;
  township: string;
  fee: number;
}
export interface ShippingZoneInput {
  region: string;
  township: string;
  fee: number;
}
export interface ShippingZonePatch {
  fee?: number;
}

function mapShippingZone(row: {id: string; region: string; township: string; fee: number}): ShippingZone {
  return {id: row.id, region: row.region, township: row.township, fee: row.fee};
}

// ---- platform: plan + monthly usage (migration 0003) ------------------------
export type ShopPlan = 'starter' | 'business';
export type UsageTier = '0-100' | '101-500' | '501-1500' | '1501-3000' | '3000+';

// Current-month billable-order usage for the signed-in seller's own shop.
// `billableOrders` counts confirmed orders EXCLUDING cancelled / test / duplicate.
export interface ShopUsage {
  shopId: string;
  plan: ShopPlan;
  month: string; // 'YYYY-MM'
  billableOrders: number;
  tier: UsageTier;
}

// Seller-editable shop settings (plan is platform-set → read-only here).
export interface ShopSettings {
  id: string;
  slug: string;
  name: string;
  phone: string | null;
  logoUrl: string | null;
  defaultDeliveryFee: number;
  plan: ShopPlan;
  isActive: boolean;
}
export interface ShopSettingsPatch {
  name?: string;
  phone?: string | null;
  logoUrl?: string | null;
  defaultDeliveryFee?: number;
}

// ---- payment accounts (seller-managed KBZPay / WavePay) ---------------------
export interface PaymentAccount {
  id: string;
  provider: 'kpay' | 'wave';
  accountName: string;
  phone: string;
  isActive: boolean;
}
export interface PaymentAccountInput {
  provider: 'kpay' | 'wave';
  accountName: string;
  phone: string;
  isActive?: boolean;
}
export interface PaymentAccountPatch {
  accountName?: string;
  phone?: string;
  isActive?: boolean;
}

function mapPaymentAccount(row: {
  id: string;
  provider: string;
  account_name: string;
  phone: string;
  is_active: boolean;
}): PaymentAccount {
  return {
    id: row.id,
    provider: row.provider as 'kpay' | 'wave',
    accountName: row.account_name,
    phone: row.phone,
    isActive: row.is_active,
  };
}

// Supabase Storage buckets (see supabase/migrations/0003_platform_plan_and_usage.sql).
// Tenant-safe by policy: the FIRST path segment must be the owner's shop_id.
const SHOP_LOGOS_BUCKET = 'shop-logos';
const PRODUCT_IMAGES_BUCKET = 'product-images';

// Keep a filename's extension, strip anything policy/URL-unfriendly from the stem.
function safeFileExt(filename: string): string {
  const m = /\.([a-zA-Z0-9]{1,8})$/.exec(filename);
  return m ? m[1].toLowerCase() : 'bin';
}

type ProductRow = {
  id: string;
  item_code: string | null;
  name: string;
  category: string | null;
  color: string | null;
  size: string | null;
  price: number;
  promo_price: number | null;
  is_promotion: boolean;
  stock: number;
  status: string;
  images: string[];
  description: string;
  arrival_date: string | null;
  created_at: string;
};

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    itemCode: row.item_code ?? '',
    name: row.name,
    category: row.category,
    color: row.color,
    size: row.size,
    price: row.price,
    promoPrice: row.promo_price,
    isPromotion: row.is_promotion,
    stock: row.stock,
    inStock: row.stock > 0,
    status: row.status,
    images: row.images,
    image: row.images[0] ?? null,
    description: row.description,
    arrivalDate: row.arrival_date,
    createdAt: row.created_at,
  };
}

// Escape PostgREST `.or()` filter-list syntax (comma separates conditions,
// parens group them) so a search term containing them can't break the query.
function escapeOrFilter(s: string): string {
  // Escape backslash FIRST, then the PostgREST filter-list metachars, so a
  // literal `\` in the search term can't perturb the `or=(...)` grouping.
  return s.replace(/[\\,()]/g, '\\$&');
}

// ---- shop (tenant) resolution -----------------------------------------------
interface ShopInfo {
  id: string;
  defaultDeliveryFee: number;
}

let cachedShop: {slug: string; info: ShopInfo} | null = null;

// True when `slug` is already resolved+cached this session, so ShopRoute can
// skip its 'checking' loading state (and the remount it causes) on a revisit.
export function isShopCached(slug: string): boolean {
  return cachedShop?.slug === slug;
}

// Exported so App.tsx's ShopRoute can reuse the SAME cached existence check the
// storefront `api` performs — a confirmed shop is then a cache hit for the
// page-level queries that follow, not a second round trip.
export async function resolveShop(): Promise<ShopInfo> {
  const slug = getShopSlug();
  if (!slug) throw new Error('ဆိုင် အချက်အလက် မတွေ့ပါ — link မှားနေနိုင်ပါသည်။');
  if (cachedShop && cachedShop.slug === slug) return cachedShop.info;

  const sb = requireSupabase();
  const {data, error} = await sb
    .from('shops')
    .select('id, default_delivery_fee')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();
  if (error || !data) throw new Error('ဆိုင် ရှာမတွေ့ပါ။');

  const info: ShopInfo = {id: data.id, defaultDeliveryFee: data.default_delivery_fee};
  cachedShop = {slug, info};
  return info;
}

// The signed-in seller's own shop (owner_id = auth.uid(), enforced by RLS).
// NOTE: cached per browser session, not per user — fine for the current
// one-seller-per-browser admin console; revisit if that ever changes.
let cachedOwnerShopId: string | null = null;

async function resolveOwnShopId(): Promise<string> {
  if (cachedOwnerShopId) return cachedOwnerShopId;
  const sb = requireSupabase();
  const {data: auth} = await sb.auth.getUser();
  if (!auth.user) throw new Error('Login လိုအပ်ပါသည်။');

  const {data, error} = await sb.from('shops').select('id').eq('owner_id', auth.user.id).maybeSingle();
  if (error || !data) throw new Error('ဤအကောင့်တွင် ဆိုင် မရှိသေးပါ။');

  cachedOwnerShopId = data.id;
  return cachedOwnerShopId;
}

function mapPlaceOrderError(msg: string): string {
  if (msg.includes('shop_not_found')) return 'ဆိုင် ရှာမတွေ့ပါ။';
  if (msg.includes('empty_cart')) return 'ခြင်းထဲတွင် ပစ္စည်းမရှိပါ။';
  if (msg.includes('missing_customer')) return 'အမည် / ဖုန်းနံပါတ် ဖြည့်ပါ။';
  if (msg.includes('product_unavailable')) return 'ပစ္စည်းအချို့ မရရှိတော့ပါ — refresh လုပ်ပြီး ပြန်စမ်းကြည့်ပါ။';
  if (msg.includes('invalid_payment_method')) return 'ငွေပေးချေမှုနည်းလမ်း မှားနေပါသည်။';
  return 'Order တင်၍မရပါ — ပြန်လည်ကြိုးစားပါ။';
}

// ---- storefront (buyer-facing) API -----------------------------------------
export const api = {
  async products(
    opts: {
      scope?: 'active' | 'all';
      featured?: boolean;
      category?: string;
      q?: string;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<{products: Product[]; total: number}> {
    const shop = await resolveShop();
    const sb = requireSupabase();
    let query = sb.from('products').select('*', {count: 'exact'}).eq('shop_id', shop.id);
    if (opts.scope !== 'all') query = query.eq('status', 'active');
    if (opts.featured) query = query.eq('is_promotion', true);
    if (opts.category) query = query.eq('category', opts.category);
    if (opts.q) {
      const q = escapeOrFilter(opts.q);
      query = query.or(`name.ilike.%${q}%,category.ilike.%${q}%,color.ilike.%${q}%`);
    }
    query = query.order('arrival_date', {ascending: false, nullsFirst: false});
    const offset = opts.offset ?? 0;
    if (opts.limit != null) query = query.range(offset, offset + opts.limit - 1);

    const {data, error, count} = await query;
    if (error) throw new Error(error.message);
    return {products: (data ?? []).map(mapProduct), total: count ?? data?.length ?? 0};
  },

  async product(id: string): Promise<{product: Product}> {
    const shop = await resolveShop();
    const sb = requireSupabase();
    const {data, error} = await sb
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('shop_id', shop.id)
      .eq('status', 'active')
      .maybeSingle();
    if (error || !data) throw new Error('ပစ္စည်း ရှာမတွေ့ပါ');
    return {product: mapProduct(data)};
  },

  async categories(): Promise<{categories: string[]}> {
    const shop = await resolveShop();
    const sb = requireSupabase();
    const {data, error} = await sb
      .from('products')
      .select('category')
      .eq('shop_id', shop.id)
      .eq('status', 'active')
      .not('category', 'is', null);
    if (error) throw new Error(error.message);
    return {categories: Array.from(new Set((data ?? []).map((r) => r.category).filter(Boolean) as string[]))};
  },

  async merchantAccounts(): Promise<{accounts: MerchantAccount[]}> {
    const shop = await resolveShop();
    const sb = requireSupabase();
    const {data, error} = await sb
      .from('payment_accounts')
      .select('*')
      .eq('shop_id', shop.id)
      .eq('is_active', true);
    if (error) throw new Error(error.message);
    return {
      accounts: (data ?? []).map((r) => ({
        provider: r.provider as 'kpay' | 'wave',
        label: r.provider === 'kpay' ? 'KBZPay' : 'WavePay',
        accountName: r.account_name,
        phone: r.phone,
        tail: '',
      })),
    };
  },

  // Public read of the shop's delivery-fee zones + default fee, so the storefront
  // can SHOW the same fee place_order() will CHARGE (zone match by region+township,
  // else the shop default). Anon read allowed by the shipping_zones RLS.
  async shippingConfig(): Promise<{zones: {region: string; township: string; fee: number}[]; defaultFee: number}> {
    const shop = await resolveShop();
    const sb = requireSupabase();
    const {data, error} = await sb
      .from('shipping_zones')
      .select('region, township, fee')
      .eq('shop_id', shop.id);
    if (error) throw new Error(error.message);
    return {zones: data ?? [], defaultFee: shop.defaultDeliveryFee};
  },

  async createOrder(body: unknown): Promise<OrderResult> {
    const slug = getShopSlug();
    if (!slug) throw new Error('ဆိုင် အချက်အလက် မတွေ့ပါ။');
    await resolveShop(); // validates the shop exists/active before the RPC call

    const b = body as {
      customer: {name: string; phone: string; street: string; region: string; township: string};
      items: {id: string; qty: number}[];
      paymentMethod: 'cod' | 'kpay' | 'wave';
      shippingFee: number;
      paymentRefTail?: string;
    };

    const sb = requireSupabase();
    const {data, error} = await sb.rpc('place_order', {
      p_shop_slug: slug,
      p_customer_name: b.customer.name,
      p_customer_phone: b.customer.phone,
      p_street: b.customer.street,
      p_region: b.customer.region,
      p_township: b.customer.township,
      p_payment_method: b.paymentMethod,
      p_payment_ref_tail: b.paymentRefTail ?? '',
      p_items: b.items.map((i) => ({product_id: i.id, qty: i.qty})),
    });
    if (error) throw new Error(mapPlaceOrderError(error.message));

    const r = data as {
      order_no: string;
      item_total: number;
      delivery_fee: number;
      grand_total: number;
      payment_method: 'cod' | 'kpay' | 'wave';
      amount_now: number;
    };
    return {
      orderId: r.order_no,
      itemTotal: r.item_total,
      deliveryFee: r.delivery_fee,
      grandTotal: r.grand_total,
      amountNow: r.amount_now,
      paymentMethod: r.payment_method,
    };
  },

  // No-op — see the file header (D6: slip upload dropped for MVP).
  async uploadSlip(_orderId: string, _imageBase64: string, _filename?: string): Promise<{ok: boolean; slipUrl: string}> {
    return {ok: true, slipUrl: ''};
  },

  // `orderNo` is required in practice — see the file header. Optional only to
  // keep the call signature compatible with the demo API's single-arg shape.
  async ordersByPhone(phone: string, orderNo?: string): Promise<{orders: TrackedOrder[]}> {
    if (!orderNo) {
      throw new Error(
        'ဤဆိုင်တွင် ဖုန်းနံပါတ်တစ်ခုတည်းဖြင့် Order ရှာ၍မရပါ — Order နံပါတ်လည်း လိုအပ်ပါသည်။',
      );
    }
    const slug = getShopSlug();
    if (!slug) throw new Error('ဆိုင် အချက်အလက် မတွေ့ပါ။');

    const sb = requireSupabase();
    const {data, error} = await sb.rpc('lookup_order', {
      p_shop_slug: slug,
      p_order_no: orderNo,
      p_phone: phone,
    });
    if (error) throw new Error('Order ရှာမတွေ့ပါ။');

    const o = data as {
      order_no: string;
      status: string;
      payment_method: string;
      item_total: number;
      delivery_fee: number;
      grand_total: number;
      created_at: string;
      items: {name: string; price: number; qty: number}[];
    };
    const tracked: TrackedOrder = {
      order_id: o.order_no,
      items: o.items,
      item_total: o.item_total,
      delivery_fee: o.delivery_fee,
      grand_total: o.grand_total,
      payment_method: o.payment_method,
      status: o.status,
      slip_url: null,
      created_at: o.created_at,
    };
    return {orders: [tracked]};
  },
};

// ---- admin (seller-facing) API ----------------------------------------------
export const adminApi = {
  async listProducts(): Promise<{products: Product[]}> {
    const shopId = await resolveOwnShopId();
    const sb = requireSupabase();
    const {data, error} = await sb
      .from('products')
      .select('*')
      .eq('shop_id', shopId)
      .order('arrival_date', {ascending: false, nullsFirst: false});
    if (error) throw new Error(error.message);
    return {products: (data ?? []).map(mapProduct)};
  },

  async updateProduct(id: string, patch: ProductPatch): Promise<{product: Product}> {
    const shopId = await resolveOwnShopId();
    const sb = requireSupabase();
    const dbPatch: TablesUpdate<'products'> = {};
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.itemCode !== undefined) dbPatch.item_code = patch.itemCode;
    if (patch.category !== undefined) dbPatch.category = patch.category;
    if (patch.color !== undefined) dbPatch.color = patch.color;
    if (patch.size !== undefined) dbPatch.size = patch.size;
    if (patch.price !== undefined) dbPatch.price = patch.price;
    if (patch.promoPrice !== undefined) dbPatch.promo_price = patch.promoPrice;
    if (patch.isPromotion !== undefined) dbPatch.is_promotion = patch.isPromotion;
    if (patch.stock !== undefined) dbPatch.stock = patch.stock;
    if (patch.status !== undefined) dbPatch.status = patch.status;
    if (patch.images !== undefined) dbPatch.images = patch.images;
    if (patch.description !== undefined) dbPatch.description = patch.description;
    if (patch.arrivalDate !== undefined) dbPatch.arrival_date = patch.arrivalDate;

    const {data, error} = await sb
      .from('products')
      .update(dbPatch)
      .eq('id', id)
      .eq('shop_id', shopId)
      .select()
      .maybeSingle();
    if (error || !data) throw new Error('ပစ္စည်း ရှာမတွေ့ပါ');
    return {product: mapProduct(data)};
  },

  async createProduct(input: ProductCreateInput): Promise<{product: Product}> {
    const shopId = await resolveOwnShopId();
    const sb = requireSupabase();
    const promoPrice = input.promoPrice ?? null;
    const row: TablesInsert<'products'> = {
      shop_id: shopId,
      name: input.name,
      price: input.price,
      item_code: input.itemCode ?? null,
      category: input.category ?? null,
      color: input.color ?? null,
      size: input.size ?? null,
      promo_price: promoPrice,
      is_promotion: (input.isPromotion ?? false) && promoPrice != null,
      stock: input.stock ?? 0,
      status: input.status ?? 'active',
      images: input.images ?? [],
      description: input.description ?? '',
      arrival_date: input.arrivalDate ?? null,
    };
    const {data, error} = await sb.from('products').insert(row).select().maybeSingle();
    if (error || !data) throw new Error(error?.message || 'ပစ္စည်း ဖန်တီး၍မရပါ။');
    return {product: mapProduct(data)};
  },

  // Demo-only affordance (clears the localStorage override layer) — no
  // equivalent on live shop data. See the file header.
  async resetProducts(): Promise<{ok: true}> {
    throw new Error('Live ဆိုင်တွင် reset လုပ်ခွင့်မရှိပါ — ပစ္စည်းတစ်ခုစီကို ကိုယ်တိုင် ပြင်ပေးပါ။');
  },

  async listOrders(): Promise<{orders: AdminOrder[]}> {
    const shopId = await resolveOwnShopId();
    const sb = requireSupabase();
    const {data, error} = await sb
      .from('orders')
      .select('*, order_items(name, unit_price, qty)')
      .eq('shop_id', shopId)
      .order('created_at', {ascending: false});
    if (error) throw new Error(error.message);

    const orders: AdminOrder[] = (data ?? []).map((o) => ({
      order_id: o.order_no,
      items: (o.order_items ?? []).map((it) => ({name: it.name, price: it.unit_price, qty: it.qty})),
      item_total: o.item_total,
      delivery_fee: o.delivery_fee,
      grand_total: o.grand_total,
      payment_method: o.payment_method,
      status: o.status,
      slip_url: null,
      created_at: o.created_at,
      customer_name: o.customer_name,
      customer_phone: o.customer_phone,
      customer_address: o.customer_address ?? undefined,
      paymentRefTail: o.payment_ref_tail ?? null,
      phone_key: o.customer_phone.replace(/\D/g, ''),
    }));
    return {orders};
  },

  async updateOrderStatus(orderId: string, status: string): Promise<{ok: true}> {
    const shopId = await resolveOwnShopId();
    const sb = requireSupabase();
    const {data, error} = await sb
      .from('orders')
      .update({status})
      .eq('order_no', orderId)
      .eq('shop_id', shopId)
      .select('id')
      .maybeSingle();
    if (error || !data) throw new Error('Order ရှာမတွေ့ပါ');
    return {ok: true};
  },

  async deleteOrder(orderId: string): Promise<{ok: true}> {
    const shopId = await resolveOwnShopId();
    const sb = requireSupabase();
    const {data, error} = await sb
      .from('orders')
      .delete()
      .eq('order_no', orderId)
      .eq('shop_id', shopId)
      .select('id')
      .maybeSingle();
    if (error || !data) throw new Error('Order ရှာမတွေ့ပါ');
    return {ok: true};
  },

  // ---- shipping zones (per-township delivery fee, owner-managed) -------------
  async listShippingZones(): Promise<{zones: ShippingZone[]}> {
    const shopId = await resolveOwnShopId();
    const sb = requireSupabase();
    const {data, error} = await sb
      .from('shipping_zones')
      .select('id, region, township, fee')
      .eq('shop_id', shopId)
      .order('region', {ascending: true})
      .order('township', {ascending: true});
    if (error) throw new Error(error.message);
    return {zones: (data ?? []).map(mapShippingZone)};
  },

  async createShippingZone(input: ShippingZoneInput): Promise<{zone: ShippingZone}> {
    const shopId = await resolveOwnShopId();
    const sb = requireSupabase();
    const row: TablesInsert<'shipping_zones'> = {
      shop_id: shopId,
      region: input.region,
      township: input.township,
      fee: input.fee,
    };
    const {data, error} = await sb.from('shipping_zones').insert(row).select('id, region, township, fee').maybeSingle();
    if (error || !data) {
      if (error?.code === '23505') throw new Error('ဒီဒေသ/မြို့နယ်အတွက် ပို့ခ ရှိပြီးသားပါ။');
      throw new Error(error?.message || 'ပို့ဆောင်ခ ဇုန် ဖန်တီး၍မရပါ။');
    }
    return {zone: mapShippingZone(data)};
  },

  async updateShippingZone(id: string, patch: ShippingZonePatch): Promise<{zone: ShippingZone}> {
    const shopId = await resolveOwnShopId();
    const sb = requireSupabase();
    const dbPatch: TablesUpdate<'shipping_zones'> = {};
    if (patch.fee !== undefined) dbPatch.fee = patch.fee;
    const {data, error} = await sb
      .from('shipping_zones')
      .update(dbPatch)
      .eq('id', id)
      .eq('shop_id', shopId)
      .select('id, region, township, fee')
      .maybeSingle();
    if (error || !data) throw new Error(error?.message || 'ပို့ဆောင်ခ ဇုန် ရှာမတွေ့ပါ။');
    return {zone: mapShippingZone(data)};
  },

  async deleteShippingZone(id: string): Promise<{ok: true}> {
    const shopId = await resolveOwnShopId();
    const sb = requireSupabase();
    const {data, error} = await sb
      .from('shipping_zones')
      .delete()
      .eq('id', id)
      .eq('shop_id', shopId)
      .select('id')
      .maybeSingle();
    if (error || !data) throw new Error(error?.message || 'ပို့ဆောင်ခ ဇုန် ရှာမတွေ့ပါ။');
    return {ok: true};
  },

  // ---- shop settings (seller reads plan + edits own logo/name/phone/fee) -----
  async getShopSettings(): Promise<{shop: ShopSettings}> {
    const shopId = await resolveOwnShopId();
    const sb = requireSupabase();
    const {data, error} = await sb
      .from('shops')
      .select('id, slug, name, phone, logo_url, default_delivery_fee, plan, is_active')
      .eq('id', shopId)
      .maybeSingle();
    if (error || !data) throw new Error(error?.message || 'ဆိုင် ရှာမတွေ့ပါ။');
    return {
      shop: {
        id: data.id,
        slug: data.slug,
        name: data.name,
        phone: data.phone,
        logoUrl: data.logo_url,
        defaultDeliveryFee: data.default_delivery_fee,
        plan: (data.plan as ShopPlan) ?? 'starter',
        isActive: data.is_active,
      },
    };
  },

  // NOTE: `plan` is intentionally NOT patchable here — it is platform-set.
  async updateShopSettings(patch: ShopSettingsPatch): Promise<{ok: true}> {
    const shopId = await resolveOwnShopId();
    const sb = requireSupabase();
    const dbPatch: TablesUpdate<'shops'> = {};
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.phone !== undefined) dbPatch.phone = patch.phone;
    if (patch.logoUrl !== undefined) dbPatch.logo_url = patch.logoUrl;
    if (patch.defaultDeliveryFee !== undefined) dbPatch.default_delivery_fee = patch.defaultDeliveryFee;
    const {data, error} = await sb.from('shops').update(dbPatch).eq('id', shopId).select('id').maybeSingle();
    if (error || !data) throw new Error(error?.message || 'ဆိုင် အချက်အလက် သိမ်း၍မရပါ။');
    return {ok: true};
  },

  // ---- monthly usage (billable = confirmed, minus cancelled/test/duplicate) ---
  async getUsage(): Promise<{usage: ShopUsage}> {
    const sb = requireSupabase();
    const {data, error} = await sb.rpc('current_shop_usage');
    if (error) throw new Error(error.message);
    if (!data) throw new Error('ဤအကောင့်တွင် ဆိုင် မရှိသေးပါ။');
    const r = data as {
      shop_id: string;
      plan: string;
      month: string;
      billable_orders: number;
      tier: string;
    };
    return {
      usage: {
        shopId: r.shop_id,
        plan: (r.plan as ShopPlan) ?? 'starter',
        month: r.month,
        billableOrders: r.billable_orders,
        tier: r.tier as UsageTier,
      },
    };
  },

  // ---- payment accounts (KBZPay / WavePay, owner self-service) ---------------
  async listPaymentAccounts(): Promise<{accounts: PaymentAccount[]}> {
    const shopId = await resolveOwnShopId();
    const sb = requireSupabase();
    const {data, error} = await sb
      .from('payment_accounts')
      .select('id, provider, account_name, phone, is_active')
      .eq('shop_id', shopId)
      .order('provider', {ascending: true});
    if (error) throw new Error(error.message);
    return {accounts: (data ?? []).map(mapPaymentAccount)};
  },

  async createPaymentAccount(input: PaymentAccountInput): Promise<{account: PaymentAccount}> {
    const shopId = await resolveOwnShopId();
    const sb = requireSupabase();
    const row: TablesInsert<'payment_accounts'> = {
      shop_id: shopId,
      provider: input.provider,
      account_name: input.accountName,
      phone: input.phone,
      is_active: input.isActive ?? true,
    };
    const {data, error} = await sb
      .from('payment_accounts')
      .insert(row)
      .select('id, provider, account_name, phone, is_active')
      .maybeSingle();
    if (error || !data) throw new Error(error?.message || 'ငွေပေးချေမှုအကောင့် ဖန်တီး၍မရပါ။');
    return {account: mapPaymentAccount(data)};
  },

  async updatePaymentAccount(id: string, patch: PaymentAccountPatch): Promise<{account: PaymentAccount}> {
    const shopId = await resolveOwnShopId();
    const sb = requireSupabase();
    const dbPatch: TablesUpdate<'payment_accounts'> = {};
    if (patch.accountName !== undefined) dbPatch.account_name = patch.accountName;
    if (patch.phone !== undefined) dbPatch.phone = patch.phone;
    if (patch.isActive !== undefined) dbPatch.is_active = patch.isActive;
    const {data, error} = await sb
      .from('payment_accounts')
      .update(dbPatch)
      .eq('id', id)
      .eq('shop_id', shopId)
      .select('id, provider, account_name, phone, is_active')
      .maybeSingle();
    if (error || !data) throw new Error(error?.message || 'ငွေပေးချေမှုအကောင့် ရှာမတွေ့ပါ။');
    return {account: mapPaymentAccount(data)};
  },

  async deletePaymentAccount(id: string): Promise<{ok: true}> {
    const shopId = await resolveOwnShopId();
    const sb = requireSupabase();
    const {data, error} = await sb
      .from('payment_accounts')
      .delete()
      .eq('id', id)
      .eq('shop_id', shopId)
      .select('id')
      .maybeSingle();
    if (error || !data) throw new Error(error?.message || 'ငွေပေးချေမှုအကောင့် ရှာမတွေ့ပါ။');
    return {ok: true};
  },

  // ---- storage: shop logo + product images (tenant-safe paths) ---------------
  // Uploads to `<shop_id>/…` — the FIRST path segment is the shop_id the storage
  // RLS policy checks against the owner. Returns the public URL to persist on the
  // shop/product row (shops.logo_url / products.images[]). The seller must then
  // call updateShopSettings/updateProduct to save it.
  async uploadShopLogo(file: File): Promise<{url: string; path: string}> {
    const shopId = await resolveOwnShopId();
    const sb = requireSupabase();
    const path = `${shopId}/logo-${Date.now()}.${safeFileExt(file.name)}`;
    const {error} = await sb.storage
      .from(SHOP_LOGOS_BUCKET)
      .upload(path, file, {upsert: true, contentType: file.type || undefined});
    if (error) throw new Error(error.message);
    const {data} = sb.storage.from(SHOP_LOGOS_BUCKET).getPublicUrl(path);
    return {url: data.publicUrl, path};
  },

  async uploadProductImage(file: File, productId?: string): Promise<{url: string; path: string}> {
    const shopId = await resolveOwnShopId();
    const sb = requireSupabase();
    const folder = productId ?? 'unassigned';
    const path = `${shopId}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeFileExt(file.name)}`;
    const {error} = await sb.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(path, file, {upsert: true, contentType: file.type || undefined});
    if (error) throw new Error(error.message);
    const {data} = sb.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path);
    return {url: data.publicUrl, path};
  },

  // Remove a previously-uploaded media object (e.g. replacing a logo). `bucket`
  // must be one of the tenant media buckets; the path is owner-scoped by policy.
  async deleteShopLogo(path: string): Promise<{ok: true}> {
    const sb = requireSupabase();
    const {error} = await sb.storage.from(SHOP_LOGOS_BUCKET).remove([path]);
    if (error) throw new Error(error.message);
    return {ok: true};
  },

  async deleteProductImage(path: string): Promise<{ok: true}> {
    const sb = requireSupabase();
    const {error} = await sb.storage.from(PRODUCT_IMAGES_BUCKET).remove([path]);
    if (error) throw new Error(error.message);
    return {ok: true};
  },
};
