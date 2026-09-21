# First-party storefront gateway

Public buyer traffic uses same-origin `/api/*` endpoints so the browser no longer needs a direct Supabase connection for shop resolution, catalog browsing, checkout configuration, order placement, order lookup, or Supabase-backed storefront media. The Vercel functions use the public anon key and existing RLS; no service-role key is used.

Required Vercel environment variables: `SUPABASE_URL` and `SUPABASE_ANON_KEY`. For compatibility the gateway also accepts the existing `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` values.

`/api/health` checks that the server-side Supabase path is reachable without exposing credentials. `/api/storefront-config` identifies the active gateway architecture.

Seller authentication/admin writes remain on the existing browser Supabase client until an authenticated cookie/BFF session migration can be done without weakening RLS. Legacy/non-Supabase image URLs remain compatible; Supabase-hosted image URLs returned to buyers are rewritten through the first-party media proxy.
