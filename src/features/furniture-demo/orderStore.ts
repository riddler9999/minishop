import type {CartItem} from '@/features/cart/state';

const ORDER_STORAGE_KEY = 'minishop:furniture-demo:orders:v1';

export interface FurnitureDemoOrder {
  orderNo: string;
  customerName: string;
  phone: string;
  address: string;
  note: string;
  paymentMethod: 'cod' | 'kpay';
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  createdAt: string;
}

function readOrders(): FurnitureDemoOrder[] {
  try {
    const raw = localStorage.getItem(ORDER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FurnitureDemoOrder[]) : [];
  } catch {
    return [];
  }
}

function writeOrders(orders: FurnitureDemoOrder[]): void {
  try {
    localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orders));
  } catch {
    // Demo-only persistence. The confirmation route still receives the order in navigation state.
  }
}

export function createFurnitureDemoOrder(
  input: Omit<FurnitureDemoOrder, 'orderNo' | 'createdAt' | 'shippingFee' | 'total'>,
): FurnitureDemoOrder {
  const shippingFee = input.subtotal >= 1_500_000 ? 0 : 15_000;
  const order: FurnitureDemoOrder = {
    ...input,
    orderNo: `RF-${Date.now().toString().slice(-8)}`,
    createdAt: new Date().toISOString(),
    shippingFee,
    total: input.subtotal + shippingFee,
  };
  writeOrders([order, ...readOrders()].slice(0, 20));
  return order;
}

export function findFurnitureDemoOrder(orderNo: string, phone: string): FurnitureDemoOrder | null {
  const normalizedOrder = orderNo.trim().toUpperCase();
  const normalizedPhone = phone.replace(/\s+/g, '');
  return (
    readOrders().find(
      (order) =>
        order.orderNo.toUpperCase() === normalizedOrder &&
        order.phone.replace(/\s+/g, '') === normalizedPhone,
    ) ?? null
  );
}

export function getFurnitureDemoOrder(orderNo: string | undefined): FurnitureDemoOrder | null {
  if (!orderNo) return null;
  return readOrders().find((order) => order.orderNo === orderNo) ?? null;
}
