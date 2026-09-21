Acceptance criteria for this migration:

- Buyer shop resolution uses same-origin `/api/storefront`.
- Buyer product list/detail/category reads use same-origin `/api/storefront`.
- Supabase public product/logo media is rewritten to same-origin `/api/storefront/<bucket>/<path>`.
- Buyer checkout configuration and order placement use same-origin `/api/checkout`.
- Buyer order lookup uses same-origin `/api/storefront-orders`.
- `/api/health` reports the Vercel-to-Supabase server path.
- SPA fallback excludes `/api/*`.
- Seller authentication/admin operations remain direct Supabase traffic in this phase to preserve existing authenticated session and RLS semantics.
