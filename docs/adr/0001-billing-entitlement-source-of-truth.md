# ADR-0001: Billing activation must update the entitlement model

- Status: Accepted
- Date: 2026-09-23

## Context

MiniShop previously had two partially independent plan-payment paths. The older payment-proof RPC changed `shops.plan` directly and hardcoded old 50,000/80,000 Ks prices. Pricing V1 introduced Free Trial plus 30,000/60,000 Ks paid plans and made `shop_entitlements` the runtime enforcement state for order capacity.

A direct `shops.plan` update can therefore display one plan while checkout enforces a different entitlement state.

## Supersession

Pricing numbers in this ADR are historical. **ADR 0002 is the current commercial source of truth** and supersedes the 30,000/60,000 pricing references below. The architectural rule that payment activation must reconcile `shops.plan` and `shop_entitlements` remains valid.

## Historical Decision

1. Current plan prices are defined by the Pricing V1 contract: Starter 30,000 Ks and Business 60,000 Ks.
2. Payment-proof automation must treat OCR/vision output as untrusted and validate amount, receiver name, confidence, and unique full transaction ID in Postgres.
3. A successful payment-proof activation must delegate to the entitlement-aware subscription activation path; it must never update only `shops.plan`.
4. Existing applied migration files remain historical. Reconciliation is performed by a later migration that replaces the callable function.
5. TypeScript/domain values and the latest SQL reconciliation are guarded by a pricing-contract regression test.

## Consequences

- Plan display and checkout enforcement stay aligned.
- Future price changes require updating the domain contract and a new reconciliation migration/test together.
- Historical migrations may contain superseded amounts; current runtime truth is the latest migration plus `CONTEXT.md`.
