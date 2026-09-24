# ADR 0002 — Final Pricing & Packaging Contract

**Status:** Accepted / CONFIRMED  
**Date:** 2026-09-25  
**Supersedes:** conflicting commercial/package rules in D56/D57, ADR 0001 pricing numbers, and `docs/pricing-strategy.md`.

## Decision

| Plan | Monthly price | Created Orders / cycle | Total Products |
|---|---:|---:|---:|
| Starter | **29,000 Ks** | **60** | **100** |
| Business | **79,000 Ks** | **200** | **500** |

Free Trial remains unchanged at 0 Ks / 20 created Orders lifetime / 10 total Products. Extra Orders remain 500 Ks/order under the existing purchased-balance contract unless a later owner decision explicitly replaces them.

## Billable Order

A valid checkout becomes billable when MiniShop successfully creates the Order and generates an Order No. Exactly one entitlement is consumed immediately and idempotently.

Seller-controlled lifecycle outcomes do not restore quota: Reject, Cancel, buyer no-show, RTO/delivery failure, or later refund. Only a verified MiniShop/system duplicate or platform error may be corrected administratively. Seller status is never the billing source of truth.

## Product limits

The cap counts total catalog rows: Active + Draft + Archived. Archiving does not free capacity; permanent deletion does.

## Packaging philosophy

Do not reduce a seller's ability to sell merely to force an upgrade. Starter and Business both receive Core selling/conversion capabilities.

Core includes the implemented equivalents of storefront/catalog, product detail, cart/checkout/order tracking, COD/local payment flow and verification, shipping/township fees, Store Branding, Store Design/themes, basic promotions, and basic analytics/order visibility.

Business differentiates through scale and operational leverage: higher capacity plus staff/permissions, bulk operations, advanced operational reporting, scheduling, automation, integrations/API/webhooks, and priority operations as those capabilities ship.

A feature whose primary effect is storefront conversion/selling should default to Core. A feature whose primary value is saving operator time, reducing manual work/headcount, coordinating staff, or automating workflows is a valid Business differentiator.

## Business-only paid Add-ons

Business eligibility may unlock separately priced add-ons. They are not bundled into the 79,000 Ks base subscription.

Candidate add-ons include ChatGPT Operator / MiniShop ChatGPT integration, advanced AI analytics, automation packs/custom n8n workflows, custom integrations, extra staff seats, and premium/paid messaging. Exact add-on prices and usage limits require separate decisions.

## Runtime reconciliation

Historical migrations remain immutable. `0021_final_pricing_packaging_reconciliation.sql` reconciles repository runtime functions/read models with this ADR when explicitly applied.

Production application is a separate owner-approved operation. Committing this ADR/migration does not prove the live database has changed.
