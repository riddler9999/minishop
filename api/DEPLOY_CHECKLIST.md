# Deployment checklist

1. Vercel has `SUPABASE_URL` and `SUPABASE_ANON_KEY` (or the existing VITE equivalents).
2. `/api/storefront-config` returns `{gateway:"first-party",version:1}`.
3. `/api/health` returns HTTP 200 and `database:true`.
4. Open a tenant storefront and verify products, categories, product detail, logo and product images.
5. Verify checkout config, place a test order, then verify order lookup with order number + phone.
6. Verify seller login/admin still works; those authenticated paths intentionally remain direct Supabase traffic.
7. Test the buyer storefront once with VPN on and once off from available Myanmar networks. Same-origin buyer API/media should remain the only critical public application path besides the main domain.
