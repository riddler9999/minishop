# Deployment checklist

1. Vercel has `SUPABASE_URL` and `SUPABASE_ANON_KEY` (or the existing VITE equivalents).
2. `/api/storefront-config` returns `{gateway:"first-party",version:1}`.
3. `/api/health` returns HTTP 200 and `database:true`.
4. Open a tenant storefront and verify products, categories, product detail, logo and product images.
5. Verify checkout config, place a test order, then verify order lookup with order number + phone.
6. Verify seller login/admin still works; those authenticated paths intentionally remain direct Supabase traffic.
7. Test the buyer storefront once with VPN on and once off from available Myanmar networks. Same-origin buyer API/media should remain the only critical public application path besides the main domain.


## Super Admin dashboard

For `/superadmin`, configure these **server-only** Vercel environment variables:

- `SUPABASE_SERVICE_ROLE_KEY` — never prefix with `VITE_`; never expose to the browser.
- `SUPERADMIN_EMAILS` — comma-separated Supabase Auth emails allowed to operate the platform owner dashboard.

The browser sends its normal Supabase access token to `/api/superadmin`. The server verifies the token with Supabase Auth, checks the email allowlist, and only then creates a service-role client for owner-only RPCs. Do not move service-role calls into React.
