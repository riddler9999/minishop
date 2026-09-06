# TASKS — Mini TikTok Shop (SaaS)

## Phase 1 — MVP (thin, sellable)

### Backend
- [x] Multi-tenant schema (`shops`, `products`, `orders`, `order_items`,
      `payment_accounts`, `shipping_zones`)
- [x] RLS policies (anon read active shops/products; owner manages own)
- [x] `place_order()` RPC — server-side repricing, atomic insert
- [x] `lookup_order()` RPC — single-order buyer lookup
- [x] Apply migration to dedicated Supabase project (`fsxdnmnycizjkgstokze`,
      "Mini Tiktok Shop" — separate from shared prod)
- [ ] Storage bucket + policy for shop logos
- [x] Generate TypeScript types from the live schema (`src/lib/database.types.ts`)

### Frontend — data layer
- [x] Env-driven Supabase client (`src/lib/supabase.ts`)
- [x] `src/lib/backend.ts` — real data layer over tables + RPCs, matching the
      `api.ts` / `adminApi` shapes (2 deliberate shape deviations — see
      memory/MEMORY.md)
- [x] Feature flag: `src/lib/store.ts` — uses Supabase only once configured
      AND a shop slug is set (`shopContext.ts`); demo `api.ts` otherwise
- [x] Switch admin pages to import from `src/lib/store.ts` instead of
      `src/lib/api.ts` directly (`adminApi` is unconditional in `store.ts` now
      — see memory/MEMORY.md). Buyer storefront pages still deferred until
      `/s/<slug>` routing exists to supply real shop context.

### Frontend — seller side
- [x] Seller auth (Supabase Auth: email/password — `src/lib/adminAuth.tsx`,
      `src/pages/admin/Login.tsx`; `App.tsx`'s `RequireAdmin` gates on it)
- [x] Shop onboarding (name → slug, phone, default fee —
      `src/pages/admin/Onboarding.tsx` + `src/lib/sellerShop.ts`; logo upload
      still not in scope — no storage bucket yet, see the row below)
- [x] Switch Dashboard/AdminProducts/AdminOrders from `lib/api.ts` (demo) to
      the live backend — `store.ts`'s gate fixed (`adminApi` unconditional,
      see memory/MEMORY.md); demo-only "Demo သို့ ပြန်" reset button removed
      from AdminProducts.tsx (no live equivalent)
- [x] Product CRUD (create/edit/hide) wired to Supabase (Milestone C) —
      `adminApi.createProduct` + extended `updateProduct`; `ProductModal(mode)`
      in AdminProducts.tsx (create + edit, ~12 fields, images = URL textarea).
- [x] Shipping-zone management (region/township/fee) (Milestone C) — new
      `/admin/shipping` page + `list/create/update/delete ShippingZone` in
      `backend.ts adminApi`.
- [x] Order dashboard: list, filter, **manual payment confirm** (match last-5),
      status change (Milestone C) — AdminOrders shows `paymentRefTail` + amount
      with confirm buttons (`pending_payment`→`checked`/`partial_checked`,
      `partial_checked`→`checked`) via `updateOrderStatus`; list-row last-5 chip.

### Frontend — buyer storefront
- [x] `/s/<slug>` multi-tenant storefront routing (Milestone A) — `ShopRoute`
      in `App.tsx` calls `setShopSlug()` from the `:slug` param; `store.ts`'s
      storefront `api` is now a reactive Proxy (per-call resolution, fixes the
      old frozen-const reactivity gap). `shopHref()`/`<ShopLink>`/
      `useShopNavigate()` keep all storefront nav shop-scoped. See
      memory/MEMORY.md "Milestone A" + decisions.md D19–D22.
- [x] Storefront reads (products/shop/payment accounts) from Supabase —
      buyer pages (Home/Products/ProductDetail/Checkout/OrderLookup/OrderSuccess/
      ProductCard) switched to import from `src/lib/store.ts` (Milestone B).
      `useShopSlugParam()` added to fetch-effect deps for cross-shop re-fetch.
- [x] Real "shop not found" 404 — `ShopRoute` (App.tsx) confirms the shop exists
      via exported `resolveShop()`, gated on `isLiveBackend()`, before mounting
      the storefront: checking → loader, missing → chromed 404 (Milestone B).
- [x] Checkout → `place_order` (COD | KBZPay/Wave + last-5 entry) — last-5-digit
      input (online methods only, digit-sanitized, required) wired to
      `createOrder`'s `paymentRefTail` (Milestone B).
- [x] Order lookup → `lookup_order` — **Order နံပါတ်** field added to
      OrderLookup.tsx (phone + order-no both required); OrderSuccess.tsx tracking
      link prefills `?phone=&orderNo=`. Phone-only lookup retired (Milestone B).
- [x] Remove slip upload (replaced by last-5 field) — Checkout slip UI/state
      removed; `backend.ts`'s `uploadSlip()` stays a no-op (Milestone B).
- [ ] **Live verification (owner)** — real order→lookup round-trip + cross-shop
      SPA nav + shop-not-found against `fsxdnmnycizjkgstokze` (sandbox egress
      blocked; can't test here).

### Validation / ops
- [ ] Real-device WebView test matrix (TikTok in-app browser): checkout, last-5
      entry, order lookup, payment-app deep-link behavior
- [ ] Vercel project Root Directory set to `projects/personal/mini-tiktok-shop`
- [ ] Pilot with 1 real seller (DM-deflection assumption)

### Follow-ups surfaced by Milestone C (not blockers)
- [x] **C.1 — storefront reads shop's shipping zones (DONE).** `backend.ts`
      storefront `api.shippingConfig()` (public read via `ship_public_read`) +
      `Checkout.tsx` computes the LIVE fee from the shop's zones (zone by
      region+township else `default_delivery_fee`) — matches `place_order()`
      exactly, so shown fee == charged fee. Demo mode still uses the static
      `data/locations.ts` table. Load failure surfaces an error + retry (no
      silent default fallback). Verified lint/build/smoke; live path owner-verified.
- [ ] Product image upload (storage bucket + policy) — currently images are
      entered as URL text (no bucket). Ties into the shop-logo bucket row above.
- [ ] `payment_accounts` self-serve admin (seller sets own KBZPay/Wave numbers) —
      no admin UI today; not in any milestone brief yet.
- [ ] Admin modal/drawer a11y — add `role="dialog"`/`aria-modal`, focus trap,
      Escape-to-close to `ProductModal`/`OrderDetail` (react-reviewer MEDIUM).
- [ ] Add ESLint (`eslint-plugin-react-hooks` + `jsx-a11y`) — `lint` is
      `tsc --noEmit` only; hook/a11y regressions aren't caught automatically
      (react-reviewer HIGH, project-wide).
- [ ] DB CHECK for `promo_price < price` when `is_promotion` (currently guarded
      client-side only — database-reviewer LOW).

## Explicitly NOT in v1 (scope guard)
- Auto payment verification (notification ingestion) — Phase 2 moat/upsell
- AI / chatbot features
- Custom domains, staff accounts, deep analytics
- Native mobile app, multi-courier API integration

## Phase 2 — after paying sellers exist
- [ ] Auto payment verify (KBZPay/Wave notification forwarder → webhook → match)
- [ ] Analytics, staff seats, custom domain
- [ ] Pricing finalized from real willingness-to-pay data
