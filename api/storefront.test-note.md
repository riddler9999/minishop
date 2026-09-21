Acceptance criteria for this migration:

- Buyer shop resolution uses same-origin `/api/storefront`.
- Buyer product list/detail/category reads use same-origin `/api/storefront`.
- Supabase public product/logo media is rewritten to same-origin `/api/storefront/<bucket>/<path>`.
- `/api/health` reports the Vercel-to-Supabase server path.
- SPA fallback excludes `/api/*`.
- Seller auth/admin and checkout/order writes remain unchanged in this phase to preserve RLS/session semantics.
