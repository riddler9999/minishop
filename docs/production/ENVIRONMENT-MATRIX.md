# MiniShop Environment Matrix

Official product status: **PRE-PRODUCTION / PRODUCTION HARDENING**

This is the canonical environment contract. Secret values are intentionally omitted.

| Environment | Purpose | Git source | Vercel | Supabase | Data policy | Deployment |
| --- | --- | --- | --- | --- | --- | --- |
| LOCAL | Developer work/tests | Any feature branch/worktree | Local tooling | Local or dedicated non-production Supabase | Synthetic/test data only | Developer-run |
| PREVIEW | PR validation | PR head SHA | Vercel Preview | **Must use MiniShop Staging** | Staging test data only | Automatic PR preview after scopes are configured |
| STAGING | Release-candidate validation | SHA being promoted | Preview/custom staging target | Preferred persistent data-less Supabase branch | Isolated Auth/DB/Storage/payment proofs | Reconciled migrations + staging tests |
| PRODUCTION | Live customer system | Exact approved main SHA | Vercel Production / `minishopmm.vercel.app` | `Mini Tiktok Shop` / `fsxdnmnycizjkgstokze` / `ap-southeast-1` | Live customer data | Approved PR -> exact SHA; DDL needs separate approval |

## Verified state — 2026-09-25

- GitHub `main` audit SHA: `0c39e49ab452aa99748b6a058ce87d8751b15ba7`.
- Vercel Production: `dpl_AGEjZDsfJgG3TQJn88E2ftBtye46`, SHA `e832dd1e695640211d64ffffedf0d25fd94368a2`.
- Production was therefore behind GitHub `main`.
- No Supabase staging branch existed.
- Supabase branch quote: **$0.01344/hour**; creation is blocked pending explicit cost approval.
- The available Vercel connector can inspect deployments/logs but cannot list/edit environment variables. Preview/Production scopes therefore remain unverified.
- Until staging exists and scopes are verified, Preview is **not approved for customer-data testing**.

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

PREVIEW: use only Staging Supabase values. If superadmin is enabled, use a staging service role and staging-only allowlist. Production project refs/privileged keys are prohibited.

STAGING: test identities, isolated buckets/objects, synthetic payment proofs, sanitized/minimal deterministic seed only. Never copy live customer/payment rows.

PRODUCTION: Production Supabase only; service role server-only; deploy exact approved SHA and verify `/api/version` + `/api/health`.

## Manual Vercel scope closure

Until authorized env-var management is available, verify in Vercel Project Settings:

1. Production Supabase values target **Production only**.
2. Staging values target **Preview** (and staging custom environment if used), never Production.
3. Development values target **Development only**.
4. `SUPABASE_SERVICE_ROLE_KEY` is never prefixed `VITE_` and differs between Staging and Production.
5. Record variable names/scopes and timestamp only; never copy secret values into GitHub/chat.
