# First-party storefront gateway

Public buyer traffic uses same-origin `/api/*` endpoints so the browser no longer needs a direct Supabase connection for shop resolution, catalog browsing, checkout configuration, order placement, order lookup, or Supabase-backed storefront media. Those public buyer functions use the public anon key and existing RLS; no service-role key is used on the buyer path.

Required Vercel environment variables: `SUPABASE_URL` and `SUPABASE_ANON_KEY`. For compatibility the gateway also accepts the existing `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` values.

Authenticated AI Store Builder operations use `/api/ai`. BYOK credentials and
trusted media registration require server-only `SUPABASE_SERVICE_ROLE_KEY` and
`AI_CREDENTIALS_ENCRYPTION_KEY` (32 random bytes, base64 encoded). Neither value
may use a `VITE_` prefix or be returned to the browser. Provider credentials are
AES-256-GCM encrypted per write and the browser receives masked metadata only.

`/api/health` checks that the server-side Supabase path is reachable without exposing credentials. `/api/storefront-config` identifies the active gateway architecture.

Seller authentication/admin writes remain on the existing browser Supabase client until an authenticated cookie/BFF session migration can be done without weakening RLS. Legacy/non-Supabase image URLs remain compatible; Supabase-hosted image URLs returned to buyers are rewritten through the first-party media proxy.


## Release diagnostics

`GET /api/version` returns safe deployment metadata (`app`, Git SHA/ref, Vercel environment, deployment ID) so operators can identify the exact running commit. It must never expose Supabase credentials or other secrets. Canonical release procedures live under `docs/production/`.
