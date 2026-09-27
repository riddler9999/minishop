export type DemandRow = {product_id?: string | null; qty?: number | null};

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
