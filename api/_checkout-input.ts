export interface CheckoutQuoteInput {
  slug: string;
  region: string;
  township: string;
  items: CheckoutLineInput[];
}

export interface CheckoutLineInput {
  product_id: string;
  variant_id: string | null;
  qty: number;
}

export interface CheckoutInput {
  slug: string;
  customer: {
    name: string;
    phone: string;
    street: string;
    region: string;
    township: string;
  };
  paymentMethod: string;
  paymentRefTail: string;
  items: CheckoutLineInput[];
  idempotencyKey: string;
  expectedItemTotal: number | null;
  expectedDeliveryFee: number | null;
}

const clean = (value: unknown, max = 200): string =>
  String(value ?? '').trim().slice(0, max);

function normalizeUuid(value: unknown): string {
  const candidate = clean(value, 100);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidate)
    ? candidate
    : '';
}

function normalizeItems(value: unknown): CheckoutLineInput[] {
  const rawItems = Array.isArray(value) ? value.slice(0, 25) : [];
  return rawItems
    .map((item: any): CheckoutLineInput => {
      const rawVariantId = item?.variantId ?? item?.variant_id ?? null;
      return {
        product_id: normalizeUuid(item?.productId ?? item?.product_id),
        variant_id: rawVariantId == null || rawVariantId === '' ? null : normalizeUuid(rawVariantId),
        qty: Math.min(Math.max(Math.floor(Number(item?.qty) || 0), 0), 100),
      };
    })
    .filter((item) => item.product_id && item.qty > 0 && item.variant_id !== '');
}

function safeMoney(value: unknown): number | null {
  const n = Number(value);
  return Number.isSafeInteger(n) && n >= 0 ? n : null;
}

export function normalizeCheckoutQuoteInput(body: unknown): CheckoutQuoteInput | null {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, any>;
  const slug = clean(b.slug, 100);
  const region = clean(b.region, 100);
  const township = clean(b.township, 100);
  const items = normalizeItems(b.items);

  if (!slug || !region || !township || items.length === 0) return null;
  return {slug, region, township, items};
}

export function normalizeCheckoutInput(body: unknown): CheckoutInput | null {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, any>;
  const customerRaw =
    b.customer && typeof b.customer === 'object'
      ? (b.customer as Record<string, unknown>)
      : {};

  const slug = clean(b.slug, 100);
  const customer = {
    name: clean(customerRaw.name, 120),
    phone: clean(customerRaw.phone, 30),
    street: clean(customerRaw.street, 300),
    region: clean(customerRaw.region, 100),
    township: clean(customerRaw.township, 100),
  };
  const paymentMethod = clean(b.paymentMethod, 30);
  const paymentRefTail = clean(b.paymentRefTail, 20);

  const rawKey = clean(b.idempotencyKey, 40);
  const idempotencyKey =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawKey)
      ? rawKey
      : '';

  const items = normalizeItems(b.items);
  const expectedItemTotal = safeMoney(b.expectedItemTotal);
  const expectedDeliveryFee = safeMoney(b.expectedDeliveryFee);

  if (
    !slug ||
    !customer.name ||
    !customer.phone ||
    !customer.street ||
    !customer.region ||
    !customer.township ||
    !paymentMethod ||
    !idempotencyKey ||
    items.length === 0 ||
    expectedItemTotal == null ||
    expectedDeliveryFee == null
  ) {
    return null;
  }

  return {
    slug,
    customer,
    paymentMethod,
    paymentRefTail,
    items,
    idempotencyKey,
    expectedItemTotal,
    expectedDeliveryFee,
  };
}
