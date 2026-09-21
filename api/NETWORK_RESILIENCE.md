# Network resilience architecture

Buyer traffic is intentionally kept same-origin where practical:

`Browser -> Vercel domain -> /api/* -> Supabase`

Public shop/catalog reads, checkout configuration, order placement, order lookup, product images and shop logos use the Vercel first-party gateway. This reduces the number of independent DNS/routing paths a Myanmar buyer must reach.

Seller dashboard authentication/admin operations remain direct Supabase traffic because moving authenticated sessions requires a separate cookie/BFF migration and must not weaken RLS. The CSP therefore still permits Supabase connections and images for admin compatibility.

This design improves reachability but cannot guarantee every VPN exit/ISP path. `/api/health` distinguishes origin/backend failure from a client network path problem.
