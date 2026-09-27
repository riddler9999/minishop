export const MAX_PRODUCT_SOURCE_LIMIT = 24;
export const MAX_BEST_SELLING_ORDER_ITEMS = 2000;

export type DemandRow = {product_id?: string | null; qty?: number | null};

export function normalizeProductSourceLimit(value: unknown): number {
  const parsed = Number(value ?? 12);
  if (!Number.isFinite(parsed)) return 12;
  return Math.min(MAX_PRODUCT_SOURCE_LIMIT, Math.max(1, Math.trunc(parsed)));
}

export function aggregateBestSellingDemand(rows: readonly DemandRow[]): Map<string, number> {
  const demand = new Map<string, number>();
  for (const row of rows) {
    const productId = typeof row.product_id === 'string' ? row.product_id : '';
    const qty = Number(row.qty ?? 0);
    if (!productId || !Number.isFinite(qty) || qty <= 0) continue;
    demand.set(productId, (demand.get(productId) ?? 0) + qty);
  }
  return demand;
}
