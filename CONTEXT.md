# MiniShop Domain Context

MiniShop is a multi-tenant SaaS storefront for Myanmar online sellers. A seller owns one Shop and shares a tenant URL (`/s/:slug`); anonymous buyers browse and place Orders without creating an account.

## Core vocabulary

- **Seller** — authenticated platform user who owns one Shop.
- **Shop** — tenant storefront identified by a unique slug and owned by one Seller.
- **Buyer** — anonymous storefront customer.
- **Order** — buyer checkout result. One valid newly-created Order consumes one order entitlement.
- **Plan** — commercial tier: `free_trial`, `starter`, or `business`.
- **Plan Application** — pre-Shop request selecting a Plan. Free Trial self-approves; paid plans require verified payment.
- **Subscription Cycle** — active prepaid period for Starter or Business. A lapsed/cancelled paid cycle cannot consume entitlements.
- **Entitlement** — the Shop's order-taking capacity. It keeps monthly/lifetime quota and purchased Extra Orders separate.
- **Extra Orders** — permanent purchased order balance. It never expires, but it can only be consumed while a paid subscription is active.
- **Payment Proof** — screenshot-derived evidence used for platform-plan payment verification. OCR/vision extraction is untrusted until deterministic server-side checks pass.
- **Delivery Service** — Shop-selected delivery mode. Delivery price is resolved server-side during checkout.

## Current commercial rules

- Free Trial: 0 Ks, 20 billable Orders lifetime, maximum 10 Products.
- Starter: 30,000 Ks per prepaid cycle, 60 Orders per cycle.
- Business: 60,000 Ks per prepaid cycle, 150 Orders per cycle.
- Extra Orders: 500 Ks/order, purchased balance never expires.
- Paid plan activation/renewal must update both `shops.plan` and `shop_entitlements`; changing `shops.plan` alone is invalid.
- Consumption order is monthly/lifetime quota first, then purchased balance.
- Seller-controlled Order status changes and cancellation do not refund entitlement automatically.
- Township shipping, last-5 buyer payment verification, Store Branding, Store Design, and Analytics are core features on every plan; promotions and integrations remain plan-gated capabilities.

## Security and consistency invariants

- RLS/database functions are the enforcement seam; frontend plan gating is presentation only.
- Anonymous buyers never write order tables directly; `place_order()` reprices products and writes atomically.
- Order creation is idempotent by Shop + idempotency key and consumes at most one entitlement.
- Monetary/payment extraction from screenshots is untrusted input. Supported plan amounts and receiver identity are checked in Postgres.
- Full transaction IDs are unique for payment-proof automation.
- Storage writes follow upload -> DB write -> rollback-new-upload-on-failure; old files are deleted only after DB success.
- Unknown/malformed Plan values fail closed to `free_trial`.
- Network/data-load failure is not a Plan value and must be represented as an explicit error state.

## Architecture

Import direction is enforced:

`domain/ <- core/, shared/ <- features/* <- data/ <- app/`

Storefront pages read through `data/dataSource.ts`. Admin and billing features use authenticated Supabase paths. Cross-feature database composition belongs in `data/liveApi.ts` or a deliberately documented deep module.

See `docs/adr/` for durable architectural decisions.
