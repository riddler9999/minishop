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
  items: {product_id: string; qty: number}[];
  idempotencyKey: string | null;
}

const clean = (value: unknown, max = 200): string =>
  String(value ?? '').trim().slice(0, max);

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
      : null;

  const rawItems = Array.isArray(b.items) ? b.items.slice(0, 25) : [];
  const items = rawItems
    .map((item: any) => ({
      product_id: clean(item?.id, 100),
      qty: Math.min(Math.max(Math.floor(Number(item?.qty) || 0), 0), 100),
    }))
    .filter((item: {product_id: string; qty: number}) => item.product_id && item.qty > 0);

  if (
    !slug ||
    !customer.name ||
    !customer.phone ||
    !customer.street ||
    !customer.region ||
    !customer.township ||
    !paymentMethod ||
    items.length === 0
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
  };
}
