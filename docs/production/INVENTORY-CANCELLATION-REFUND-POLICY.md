# Task 13 — Inventory movement and cancellation/refund operating policy

## Current verified behavior

MiniShop decrements product stock inside the existing atomic `place_order()` transaction when an order is successfully created. If order creation fails, the transaction rolls back the stock mutation along with order, item, and entitlement changes.

A successfully created order consumes one entitlement immediately. Per the canonical pricing contract, later reject, cancel, buyer no-show, RTO, or refund does not restore that entitlement.

Order status currently includes `cancelled`, but there is no accepted product rule saying that cancellation or refund automatically returns stock to sellable inventory. Automatically restocking would be unsafe because the system does not know whether goods were never shipped, returned, damaged, lost, partially returned, or physically inspected.

## Task 13 invariant

Every product stock change must be explainable through an append-only inventory movement record.

Supported pilot paths:

- Order creation: stock decreases according to the existing `place_order()` behavior and the decrement is audited against the actual `orders.id` that caused it.
- Seller stock correction/restock: the shop owner uses the authorized manual adjustment RPC and must provide a reason.
- Existing product editor stock changes remain supported; they are recorded as seller-authored manual adjustments with the authenticated actor and a standardized editor reason rather than being mislabeled as order consumption.
- Permanent product deletion does not delete inventory movement history; the original product UUID and product-name snapshot remain in the ledger.
- Failed order creation: transaction rollback leaves stock unchanged and therefore creates no committed inventory movement.
- Cancellation/refund: changing order status does not automatically mutate stock.

## Manual cancellation/refund procedure

If a cancelled/refunded order's goods are physically back in sellable inventory, the seller must make an explicit stock adjustment and record the operational reason. Examples include `cancelled before dispatch`, `customer return inspected and sellable`, or a stock-count correction.

If goods are damaged, missing, in transit, or otherwise not sellable, do not restock them through this procedure.

Refund processing itself remains manual and outside Task 13. This task does not implement automated refunds, RTO workflows, carrier events, or new order statuses.

## Future product decision required

Before automatic cancellation/refund restocking can be implemented, MiniShop needs an explicit policy covering at least shipment state, partial returns, damaged returns, RTO, and who is authorized to confirm physical receipt. Until then, automatic restock is intentionally blocked by design.
