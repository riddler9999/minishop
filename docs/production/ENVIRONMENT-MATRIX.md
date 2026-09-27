# MiniShop Environment Matrix

Official product status: **PRE-PRODUCTION / PRODUCTION HARDENING**

This is the canonical environment contract. Secret values are intentionally omitted. Environment/deployment observations must be re-verified for each release; historical observations are not current-state guarantees.

| Environment | Purpose | Git source | Vercel | Supabase | Data policy | Deployment |
| --- | --- | --- | --- | --- | --- | --- |
| LOCAL | Developer work/tests | Any feature branch/worktree | Local tooling | Local or dedicated non-production Supabase | Synthetic/test data only | Developer-run |
| PREVIEW | PR validation | PR head SHA | Vercel Preview | **Must use an isolated non-production Supabase target** | Test data only | Automatic PR preview when configured |
| STAGING | Release-candidate validation | SHA being promoted | Preview/custom staging target | Preferred persistent isolated Supabase branch/project | Isolated Auth/DB/Storage/payment proofs | Reconciled migrations + staging tests |
| PRODUCTION | Live customer system | Exact approved main SHA | Vercel Production / `minishopmm.vercel.app` | Production Supabase | Live customer data | Approved PR -> exact SHA; DDL needs separate approval |

## Historical audit — 2026-09-25 (not current-state evidence)

The PR #94 audit recorded the following observations on 2026-09-25. They are retained only as historical evidence and **must not be treated as current facts without re-verification**:

- audited GitHub `main` SHA: `0c39e49ab452aa99748b6a058ce87d8751b15ba7`;
- observed Vercel Production deployment: `dpl_AGEjZDsfJgG3TQJn88E2ftBtye46`, SHA `e832dd1e695640211d64ffffedf0d25fd94368a2`;
- at that audit, Production was behind the audited GitHub `main`;
- at that audit, no Supabase staging branch was observed;
- the audit recorded a Supabase branch quote of **$0.01344/hour**;
- the connector used for that audit could not verify Vercel environment-variable scopes.

Before any release, verify the current deployment SHA, current environment scopes, and current non-production data target. Preview is not approved for customer-data testing unless isolation from Production is positively verified.

## Variables actually consumed by the codebase

Browser/public:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_DEFAULT_PLAN` (optional; `free_trial | starter | business`; unknown/unset fails closed to `free_trial`)

Server:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — privileged, superadmin boundary only
- `SUPERADMIN_EMAILS` — server-only allowlist

The gateway temporarily accepts public `VITE_SUPABASE_*` values as a server fallback. A service-role key must never have a `VITE_` prefix.

No n8n runtime environment variable is consumed by the current repository. n8n appears in payment-automation documentation only; do not invent a variable until executable code needs one.

## Scope contract

LOCAL: use only non-production Supabase; secrets remain gitignored; Production PII/Auth/Storage/payment data is prohibited.

PREVIEW: use only an isolated non-production Supabase target. If superadmin is enabled, use a non-production service role and non-production allowlist. Production project refs/privileged keys are prohibited.

STAGING: test identities, isolated buckets/objects, synthetic payment proofs, sanitized/minimal deterministic seed only. Never copy live customer/payment rows.

PRODUCTION: Production Supabase only; service role server-only; deploy exact approved SHA and verify `/api/version` + `/api/health`.

## Manual Vercel scope closure

Before release, verify in Vercel Project Settings (or another authorized source of current configuration):

1. Production Supabase values target **Production only**.
2. Non-production values target **Preview** (and staging custom environment if used), never Production.
3. Development values target **Development only**.
4. `SUPABASE_SERVICE_ROLE_KEY` is never prefixed `VITE_` and differs between non-production and Production.
5. Record variable names/scopes and timestamp only; never copy secret values into GitHub/chat.
