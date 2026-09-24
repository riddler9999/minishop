# MiniShop Release Checklist

Official status: **PRE-PRODUCTION / PRODUCTION HARDENING**

Every PASS requires evidence.

## Pre-deploy

- [ ] Approved release PR.
- [ ] Exact Git SHA: `________________`
- [ ] `CI / verify` PASS.
- [ ] `CI / release-safety` PASS.
- [ ] `Network resilience / check` PASS.
- [ ] Vercel deployment check healthy; platform rate/quota failures block release.
- [ ] Repo/Staging/Production migration state compared.
- [ ] Required migrations PASS on Staging.
- [ ] Staging Security + Performance Advisor reviewed.
- [ ] Preview proven to use Staging, not Production.
- [ ] Environment variable names/scopes verified; values not recorded.
- [ ] Service-role key server-only; never `VITE_`.
- [ ] Backup/recovery checkpoint verified when applicable.
- [ ] Separate explicit Production DDL approval recorded when needed.

Evidence — PR / SHA / CI / Staging / config scopes / recovery / migration approval:

## Deploy

- [ ] Deploy exact approved SHA.
- [ ] Vercel deployment READY and Production alias targets it.
- [ ] `GET /api/version` returns expected SHA/environment with safe metadata only.
- [ ] `GET /api/health` healthy.
- [ ] Separately approved Production migration applied per migration runbook, if any.

Evidence — deployment ID/URL / version / health / migration record:

## Post-deploy

- [ ] Tenant storefront.
- [ ] Product catalog.
- [ ] Product image.
- [ ] Cart.
- [ ] Checkout config.
- [ ] Synthetic test order.
- [ ] Order lookup.
- [ ] Seller login.
- [ ] Seller admin.
- [ ] Superadmin authorization.
- [ ] Storage boundaries.
- [ ] Payment test path.
- [ ] Auth path when enabled.
- [ ] VPN OFF test requirement.
- [ ] VPN ON test requirement.
- [ ] Mobile/WebView later gate recorded separately.

Evidence — test tenant/order / seller-admin / storage / payment-auth / VPN / mobile:

Release status: `PASS | CONDITIONAL | FAIL`  
Known blockers:  
Rollback candidate:  
Operator/date:
