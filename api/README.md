# First-party storefront gateway

Public buyer reads use `/api/storefront` so the browser no longer needs a direct Supabase connection for shop resolution and catalog browsing. The Vercel function uses the public anon key and existing RLS; no service-role key is used.

Required Vercel environment variables: `SUPABASE_URL` and `SUPABASE_ANON_KEY`. For compatibility the function also accepts the existing `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` values.

`/api/health` checks that the server-side Supabase path is reachable without exposing credentials.

Seller authentication/admin writes and checkout/order RPCs remain on the existing Supabase client until their authenticated proxy/session design is migrated separately. Supabase-hosted image URLs also remain direct and are allowed by CSP.
