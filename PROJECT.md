# Mini Shop (SaaS)

## Project အကျဉ်းချုပ်

Mini Shop က Myanmar online seller တွေအတွက် multi-tenant SaaS storefront တစ်ခုဖြစ်တယ်။ အစပိုင်းမှာ localStorage demo အနေနဲ့ စခဲ့ပြီး အခု Supabase backend နဲ့ production-oriented product အဖြစ်ပြောင်းထားပြီးပြီ။

အဓိက use case က seller တစ်ယောက်က သူ့ TikTok bio သို့မဟုတ် social channel မှာ Mini Shop link ထည့်ထားပြီး buyer က အဲဒီ link ကနေ product ကြည့်၊ checkout လုပ်၊ order တင်နိုင်အောင်လုပ်ပေးတာဖြစ်တယ်။ TikTok မှာ Myanmar seller တွေအတွက် native checkout မရှိသေးသလို public bot/messaging API ကိုလည်း ဒီ product က အားကိုးထားတာမဟုတ်ဘူး။ ဒါကြောင့် ဒီ system ကို **Sales Agent / Chatbot မဟုတ်ဘဲ self-service Mini Shop** အဖြစ်သတ်မှတ်ထားတယ်။

## လက်ရှိအခြေအနေ

**Live + Owner Verified — Pilot အဆင့်ကို ဆက်သွားရန်**

Owner: Moe Htet  
Current production: `https://minishopmm.vercel.app`

အဓိက Milestone တွေဖြစ်တဲ့ routing, buyer storefront, seller admin နဲ့ checkout delivery-fee logic တွေကို live deployment ပေါ်မှာ စမ်းသပ်ပြီး အလုပ်လုပ်တာအတည်ပြုပြီးပြီ။ Starter / Business plan gating ကိုလည်း real browser automation နဲ့ စမ်းပြီးဖြစ်တယ်။ 2026-09-21 မှာ storefront product-image 404 ကို first-party Vercel media gateway rewrite နဲ့ပြင်ပြီး production မှာ catalog API + proxied WebP image endpoint နှစ်ခုလုံး 200 OK ဖြစ်တာ verify လုပ်ထားတယ်။

လက်ရှိ pilot မစခင် အရေးအကြီးဆုံး blocker က **seller signup email flow** ဖြစ်တယ်။ Frontend ဘက်မှာ 6-digit OTP confirmation flow ရှိပြီးသားဖြစ်ပေမယ့် Supabase Auth က default/shared mailer ကိုပဲ သုံးနေသေးတယ်။ Production seller တွေအတွက် reliable auth email ပို့နိုင်ဖို့ **Custom SMTP** configure လုပ်ဖို့လိုတယ်။ SMTP မပြီးမချင်း signup confirmation နဲ့ password reset email delivery ကို production-ready လို့ မယူဆရ။

## Tech Stack

- Frontend — React + Vite + TypeScript + Tailwind CSS v4
- Hosting — Vercel
- Backend / Database / Auth / Storage — Supabase
- Supabase project — `Mini Tiktok Shop`
- Project ref — `fsxdnmnycizjkgstokze`
- Region — `ap-southeast-1`
- Repository — `riddler9999/minishop`
- Routing — `/s/:slug/...`

### Database

အဓိက tables:

- `shops`
- `products`
- `orders`
- `order_items`
- `payment_accounts`
- `shipping_zones`

Tables အားလုံးမှာ RLS သုံးထားတယ်။ Anonymous buyer က order table ကို တိုက်ရိုက် write မလုပ်နိုင်ဘူး။ Order creation ကို `place_order()` RPC ကနေ server-side repricing + atomic write နဲ့လုပ်တယ်။ Buyer order lookup ကို `lookup_order()` RPC ကနေ `(shop_slug, order_no, phone)` နဲ့လုပ်တယ်။

### Source Layout (feature-first, layering ကို lint နဲ့ enforce လုပ်ထား)

Import direction က တစ်လမ်းသွားပဲ — `eslint.config.js` မှာ `no-restricted-imports` နဲ့
ရေးထားလို့ လမ်းကြောင်းမှားရင် `npm run lint` ကျတယ်။ စည်းမျဉ်းမဟုတ်ဘူး၊ build gate ဖြစ်တယ်။

```
domain/  ←  core/ , shared/  ←  features/*  ←  data/  ←  app/
```

| Layer | ပါဝင်တာ |
|---|---|
| `src/domain/` | Type + rule သက်သက် (`product`, `order`, `shop`, `plan`, `slug`, `orderStatus`) — React မပါ, I/O မပါ |
| `src/core/` | Infrastructure — `supabase/client`, `supabase/database.types`, `storage/` |
| `src/shared/` | Feature ကျော်သုံးတဲ့ UI/util — `ui/Layout`, `ui/NotFound`, `hooks/`, `lib/format`, `lib/brand` |
| `src/features/*` | `tenancy`, `catalog`, `cart`, `checkout`, `orders`, `shipping`, `billing`, `shop`, `auth`, `admin` — တစ်ခုချင်းစီက ကိုယ့် `api/`, `components/`, `pages/` ကို ပိုင်တယ် |
| `src/data/` | `dataSource.ts` (demo ↔ live switch) + `liveApi.ts` (feature အားလုံးကို compose လုပ်ခွင့်ရှိတဲ့ တစ်ခုတည်းသော module) |
| `src/app/` | Composition root — `App.tsx` + `routes/` |

### Data Layer

- `src/features/tenancy/shopContext.ts` — လက်ရှိ shop slug context
- `src/features/tenancy/shopResolver.ts` — slug → shop branding (buyer ဘက်)
- `src/features/tenancy/ownShop.ts` — `owner_id` → shop (seller ဘက်, RLS enforce)
- `src/features/*/api/` — feature တစ်ခုချင်းစီရဲ့ Supabase query များ
- `src/data/liveApi.ts` — ၎င်းတို့ကို `api` / `adminApi` အဖြစ် compose လုပ်တယ်
- `src/data/dataSource.ts` — storefront page တွေ import လုပ်ရမယ့် **တစ်ခုတည်းသော** နေရာ
- `src/data/demo/` — demo/localStorage API (root route အတွက်သာ)
- `src/core/supabase/database.types.ts` — generated Supabase types

⚠️ `api.<method>` ကို React dependency array ထဲ ဘယ်တော့မှ မထည့်ရ၊ method ကို variable
ထဲ သိမ်းပြီး နောက်မှ မခေါ်ရ — dispatch က property access လုပ်တဲ့အချိန်မှာ ဖြစ်တယ်။

### Commercial / Plan Layer

Current domain truth ကို `CONTEXT.md` မှာထားတယ်။ `PROJECT.md` ရဲ့ အောက်ပိုင်း decision log က historical/superseded state ပါဝင်နိုင်တယ်။

- `src/domain/plan.ts` — plan resolution rule (**fail-closed**: မသိရင် `free_trial`)
- `src/domain/subscription.ts` — current plan prices + paid-onboarding payment config
- `src/domain/entitlement.ts` — order quota / Extra Orders consumption rules
- `src/features/billing/plan.tsx` — seller-console feature presentation
- `src/features/billing/api.ts` — live entitlement read model

Current plans:

- `free_trial` — 0 Ks, 20 lifetime orders, max 10 products
- `starter` — 30,000 Ks/cycle, 60 orders/cycle
- `business` — 60,000 Ks/cycle, 150 orders/cycle
- Extra Orders — 500 Ks/order, purchased balance never expires

Plan ကို seller က သူ့ဘာသာပြောင်းလို့မရဘူး။ Paid activation/renewal က `shops.plan` တစ်ခုတည်းကိုပြောင်းတာမဟုတ်ဘဲ `shop_entitlements` ကိုပါ တစ်ပြိုင်နက်တည်း reconcile လုပ်ရမယ်။

Township shipping နဲ့ last-5 buyer payment verification က core features ဖြစ်တယ်။ Business-only UI features တွေက promotions, advanced dashboard, branding/Store Design နဲ့ integrations ဖြစ်တယ်။ Downgrade လုပ်ရင် data မဖျက်ဘူး။

## Authentication & Onboarding

Seller authentication ကို Supabase email/password သုံးထားတယ်။

Flow:

`Signup → Email Confirmation → Login/Session → /admin/onboarding → Shop Creation → Admin Console`

`RequireAdmin` က session ရှိရုံတင်မဟုတ်ဘဲ seller မှာ shop ရှိ/မရှိပါစစ်တယ်။ Shop မရှိသေးရင် `/admin/onboarding` ကို redirect လုပ်တယ်။

Fresh signup confirmation အတွက် frontend မှာ 6-digit OTP flow ထည့်ပြီးသား။ Email link ကို fallback အနေနဲ့ထားနိုင်ပေမယ့် OTP ကို primary flow အဖြစ်သုံးထားတယ်။

## Order Flow

Order statuses:

- `cod_pending`
- `pending_payment`
- `partial_checked`
- `checked`
- `shipped`
- `completed`
- `cancelled`

Payment methods:

- `cod`
- `kpay`
- `wave`

MVP မှာ payment verification ကို manual လုပ်ထားတယ်။ Buyer က KBZPay / WavePay transaction reference ရဲ့ last 5 digits ထည့်ပြီး seller က amount + last-5 ကို စစ်တယ်။ Slip upload ကို MVP မှာ မသုံးဘူး။ TikTok in-app WebView မှာ file picker reliability မကောင်းနိုင်တာကြောင့် ဒီဆုံးဖြတ်ချက်ချထားတာဖြစ်တယ်။

## Image Upload

Shop logo နဲ့ product image upload UI ပြီးထားတယ်။

Rules:

- PNG / WebP ပဲလက်ခံတယ်
- JPG / JPEG ကို client-side reject လုပ်တယ်
- PNG ကို upload မတင်ခင် browser မှာ WebP ပြောင်းတယ်
- Manual image URL input မရှိတော့ဘူး
- Default pre-conversion size cap ~5MB

Storage + DB row နှစ်ခုကြား shared transaction မရှိတဲ့အတွက် အောက်က invariant ကို မဖောက်ရ:

1. File အသစ်ကို အရင် upload လုပ်မယ်
2. Final URL list အပြည့်အစုံနဲ့ DB row ကို write လုပ်မယ်
3. Write fail ရင် ဒီ attempt မှာ upload လုပ်ထားတဲ့ object အသစ်တွေကို rollback/delete လုပ်မယ်
4. DB write အောင်မြင်မချင်း old/removed object ကို မဖျက်ရ

ဒီ rule က logo နဲ့ product images နှစ်ခုလုံးအတွက် သက်ဆိုင်တယ်။

## UI / Design

Buyer storefront ကို **white + blush-pink mobile-first fashion shop** direction နဲ့ ship လုပ်ထားတယ်။ Admin Dashboard ကတော့ compact analytics direction နဲ့ သီးခြားရှိတယ်။

Buyer storefront direction:

- White canvas + blush-pink surfaces + hot-pink CTA
- Burmese-first buyer copy
- Tenant shop name/logo
- Real product-image hero
- Query-based search နဲ့ tenant-derived category links
- Real promotion product ရှိမှသာ promotion banner ပြခြင်း
- Mobile bottom navigation
- Existing ProductCard / cart / checkout / tenant routing ကို preserve လုပ်ခြင်း

Design specs တွေကို `design/` အောက်မှာ reference အနေနဲ့ထားတယ်။

## ပြီးထားပြီးသား အဓိကအလုပ်များ

- [x] Multi-tenant `/s/:slug` routing
- [x] Live Supabase buyer storefront
- [x] Seller authentication
- [x] Seller onboarding
- [x] Seller admin dashboard
- [x] Product management
- [x] Order management
- [x] Shipping zones
- [x] Server-side order repricing
- [x] COD / KBZPay / WavePay flow
- [x] Manual last-5 payment verification
- [x] Starter / Business plan gating
- [x] Seller Settings / branding
- [x] Shop logo upload
- [x] Product image upload
- [x] PNG → WebP conversion
- [x] Promotion price DB constraint
- [x] Admin modal / drawer accessibility improvements
- [x] ESLint + React Hooks + JSX accessibility checks
- [x] Production Vercel deployment
- [x] Core live browser verification
- [x] First-party storefront network gateway + Vercel product-image proxy routing (PR #42–#43)
- [x] Production product image endpoint 200 OK + WebP response verification (2026-09-21)
- [x] CI + Network resilience suites green on PR #43 before merge
- [x] Automated Starter ↔ Business gating verification
- [x] Buyer storefront ကို white/blush-pink fashion direction ပြောင်းပြီး Burmese copy, real search/category links, product-image hero, real promotions နဲ့ mobile buyer chrome ship လုပ် (PR #31)
- [x] CI pipeline (`lint → test → build`) နဲ့ ပထမဆုံး test suite (PR #24)
- [x] Production hardening — rate limiting, plan/owner/billing ကို DB trigger နဲ့ enforce,
      CSP/HSTS header, fail-closed plan နဲ့ tenant routing (PR #25, migrations 0005–0007)
- [x] `src/` ကို feature-first အဖြစ် ပြန်ဖွဲ့စည်း — 822-LOC `backend.ts` god module ကို
      feature အလိုက် ခွဲ၊ domain type တွေကို demo layer ထဲကနေ ဆွဲထုတ်၊ layering ကို lint နဲ့
      enforce လုပ် (PR #26)
- [x] `AGENTS.md` ထည့် — Codex/အခြား agent တွေအတွက် (သူတို့က `CLAUDE.md` ကို မဖတ်ဘူး)
- [x] Documentation audit — ကုဒ်နဲ့ ဆန့်ကျင်နေတဲ့ `.env.example` / `README.md` /
      `supabase/README.md` အမှားများနဲ့ comment ထဲက path အဟောင်း ၂၄ ခု ပြင် (PR #26)

## လက်ရှိလုပ်ရန်ကျန်တာ

### P0 — Pilot မစခင် မဖြစ်မနေလုပ်ရန်

- [ ] **Custom SMTP configure လုပ်ရန်**
  - Supabase default/shared mailer ကို production မှာ မအားကိုးရ
  - Resend ကို အဓိကရွေးချယ်ထားတယ်
  - SMTP setup ပြီးမှ seller auth email ကို production-ready လို့ယူဆမယ်

- [ ] **Confirm signup email template ပြင်ရန်**
  - Supabase Dashboard → Authentication → Email Templates → Confirm signup
  - Email ထဲမှာ `{{ .Token }}` ထည့်ရန်
  - App ရဲ့ 6-digit OTP confirmation UI နဲ့ချိတ်ရန်

- [ ] **Production redirect allow-list စစ်ရန်**
  - `/admin/onboarding` production URL ကို Supabase Auth → URL Configuration → Redirect URLs ထဲထည့်ရန်

### P0 — Code (frontend)

- [x] **`0007` ရဲ့ DB error code တွေကို မြန်မာစာအဖြစ် mapping လုပ်ရန်** (D48, PR #29)
  - `src/domain/dbError.ts` — typed code ၁၈ ခုလုံးအတွက် `DB_ERROR_MESSAGES` + `mapDbError()`
  - checkout `place_order`၊ orders `lookup_order`၊ `sellerShop.updateOwnShop()` (Settings ရဲ့ တကယ်
    သုံးတဲ့ write path)၊ product create/update ရဲ့ API boundary တွေမှာ ချိတ်ထားပြီ
  - `tests/dbError.test.ts` က migration SQL နဲ့ catalog ကို တိုက်စစ်တဲ့ drift guard ပါဝင်

### P2 — Agent tooling (owner ဆုံးဖြတ်ရန်, blocking မဟုတ်)

- [ ] `.mcp.json` မရှိ — Supabase/Vercel/GitHub MCP server တွေကို session တိုင်း ကိုယ်တိုင်ပြင်ရနေတယ်
- [ ] PR template / `CONTRIBUTING.md` / `LICENSE` / formatter config မရှိ

### P1 — Real Device Verification

- [ ] TikTok in-app WebView မှာ real-device test လုပ်ရန်
  - Checkout
  - Payment last-5 entry
  - Order lookup
  - KBZPay/WavePay deep-link behavior
  - Reload / navigation behavior

### P1 — Pilot

- [ ] Real seller ၁ ယောက်နဲ့ pilot စမ်းရန်
- [ ] Buyer တွေ self-service order flow ကို တကယ်သုံး/မသုံးတိုင်းရန်
- [ ] Seller DM workload လျော့/မလျော့တိုင်းရန်
- [ ] Checkout drop-off ကို စောင့်ကြည့်ရန်
- [ ] Seller feedback မှာ friction point တွေစုရန်

### P2 — Platform Operations

- [x] Billing / subscription model ဆုံးဖြတ် (Pricing V1, D56 — Free Trial/Starter/Business + Extra Orders)
- [x] Shop plan ကို owner ဘက်ကပြောင်းနိုင်မယ့် backend path (`admin_*` entitlement RPCs, service_role)
- [x] Usage → commercial pricing (order entitlement consumption in `place_order()`)
- [ ] **`0016` migration ကို owner go-ahead နဲ့ live project သို့ apply ရန်** (D7 — apply ပြီးမှ types regenerate)
- [ ] Owner runbook — dashboard မှာ RPC တွေ call လုပ်နည်း (activate/renew/upgrade/credit) မှတ်တမ်းတင်ရန်

## 2026-09-21 Repository Update

- PR #42 ကို merge လုပ်ပြီး storefront/catalog/checkout/order network traffic ကို first-party gateway architecture သို့ပြောင်းထားတယ်။
- PR #43 မှာ Vercel dynamic media route 404 ကို `/api/storefront/product-images/:path*` နှင့် `/api/storefront/shop-logos/:path*` rewrite → stable `/api/storefront` function proxy ဖြင့်ပြင်ထားတယ်။
- Product catalog က same-origin image URL ပြန်ပေးပြီး production image request က 200 OK WebP ပြန်လာတာ verify လုပ်ထားတယ်။
- Gateway tests ကို hardened checkout/health implementation နဲ့ sync လုပ်ပြီး PR merge မတိုင်ခင် CI နဲ့ Network resilience checks နှစ်ခုလုံး PASS ဖြစ်တယ်။
- Region → Township dependent checkout, seller shipping-zone CRUD, delivery-fee calculation, COD/KBZPay/WavePay, payment-account management, order creation/lookup နဲ့ admin order status/payment verification flow တွေက implementation ရှိပြီးသားဖြစ်လို့ open feature work အဖြစ်မယူရ။

## နောက် Session မှာ ဒီကနေစရန်

1. Custom SMTP configure ပြီး/မပြီး အရင်စစ်ပါ။ မပြီးသေးရင် ဒီအလုပ်ကို အရင်ဆုံးလုပ်ပါ။
2. SMTP ပြီးရင် Confirm signup email template ထဲ `{{ .Token }}` ထည့်ထား/မထားစစ်ပါ။
3. Production `/admin/onboarding` redirect URL ကို Supabase allow-list ထဲရှိ/မရှိစစ်ပါ။
4. Fresh seller account အသစ်နဲ့ `signup → OTP confirm → onboarding → admin` flow ကို end-to-end ပြန်စမ်းပါ။
5. အဲဒီ flow PASS မှ TikTok real-device WebView test ကိုဆက်သွားပါ။
6. WebView PASS မှ real seller pilot စပါ။

## V1 မှာ မပါသေးတဲ့အရာများ

အောက်က feature တွေကို V1 scope ထဲမထည့်သေးဘူး:

- Auto payment verification
- AI chatbot / sales agent
- Custom domains
- Staff accounts / seats
- Deep analytics
- Native mobile app
- Multi-courier API integrations

Scope creep မဖြစ်အောင် paying seller / pilot evidence မရမချင်း ဒီ feature တွေကို မတိုးရ။

## Phase 2 — Paying Seller ရလာပြီးမှ

- KBZPay / Wave notification → webhook → transaction matching → auto payment verification
- Advanced analytics
- Staff seats / permissions
- Custom domains
- Integration hooks
- Commercial billing
- Real willingness-to-pay data ပေါ်မူတည်တဲ့ pricing

## အရေးကြီး Architecture Decisions

### D54 — Buyer Storefront + Admin Console Typography Redesign (Font Pairing)

`/ui-ux-pro-max` skill ရဲ့ data-driven design-system search ("fashion clothing boutique storefront mobile") က လက်ရှိ visual identity (rose/blush accent, white background, minimal layout) ကို confirm လုပ်ပေးခဲ့တယ် — ဒါကြောင့် redesign ကို color/layout ground-up rebuild မလုပ်ဘဲ **typography + interaction polish** အဖြစ်ပဲ scope ချထားတယ် (owner ရွေးချယ်ချက်)။

**ဆုံးဖြတ်ချက်:** App-wide default typography ကို system-sans ကနေ **Calistoga (display) / Inter (body)** ("boutique" pairing) အဖြစ် `src/index.css`-ရဲ့ `--font-display`/`--font-sans` tokens မှာ ပြောင်းထားတယ် — `font-display`/`font-sans` utility class တွေက admin console + buyer storefront (Products, ProductDetail, Checkout, OrderLookup, OrderSuccess) တစ်ခုလုံးမှာ ရှိပြီးသားဖြစ်လို့ token တစ်ခုတည်း ပြောင်းရုံနဲ့ site တစ်ခုလုံး အလိုအလျောက် retint ဖြစ်သွားတယ်။ **Myanmar glyph fallback အမြဲ ဦးစားပေးထားတယ်** — pairing တစ်ခုစီရဲ့ `font-family` stack မှာ Latin display face ပြီးရင် `Pyidaungsu`/`Noto Sans Myanmar` ချက်ချင်းလိုက်ထားတယ်၊ ဒါကြောင့် Burmese စာလုံး (buyer-facing copy အများစု) က မပြောင်းဘဲ ဆက်ပေါ်၊ Latin character (ဈေးနှုန်း၊ English label၊ brand name) ချည်းသာ boutique feel ရရှိတယ်။

**Store Design (D52) theme system ကို ချဲ့ထားတယ်:** `StorefrontTheme.fontPairing` (`'boutique' | 'classic' | 'minimal'`, `src/domain/fontPairing.ts`) — seller တစ်ယောက်စီက Store Design > အထွေထွေ ကနေ ရွေးနိုင်တယ်။ Curated preset ၃ ခုပဲ ခွင့်ပြုထားတယ် (free-text font name/URL မဟုတ်ဘူး) — attacker-chosen remote stylesheet load ခံရနိုင်တဲ့ risk ကို ကာကွယ်ဖို့။ `theme.ts`'s existing fail-safe philosophy အတိုင်း `normalizeTheme()` က unknown value ကို default (`boutique`) ပြန်ပေးတယ်။ `jsonb` column (migration 0009) ရှိပြီးသားမို့ **schema migration အသစ် မလိုအပ်ပါ**။ Data model အနေနဲ့ D52 ရဲ့ "unopened theme = original hardcoded COPY" invariant ကို fontPairing က မဖျက်ဘူး — ဒါက app-wide design token (D51 ရဲ့ site-wide fashion redesign ကဲ့သို့) ဖြစ်ပြီး seller-authored COPY မဟုတ်လို့ပါ။

**Admin console polish:** `AdminLayout.tsx` ရဲ့ nav link/button (desktop sidebar, mobile bottom nav, mobile drawer, header menu) တွေမှာ `focus-visible` ring မရှိတာကို skill ရဲ့ Accessibility Quick Reference (`keyboard-nav`, `focus-states`) အတိုင်း ထည့်ခဲ့တယ်။ Storefront ရဲ့ search icon link နဲ့ desktop CTA link မှာလည်း focus ring ချို့တဲ့နေတာကို ပြင်ခဲ့တယ်။

**Verification:** `tests/theme.test.ts` + `tests/fontPairing.test.ts` က fail-safe normalization ကို cover လုပ်တယ်။ Browser screenshot verification (Playwright, Chromium) — Home/Products/ProductDetail — Myanmar text shaping အတွက် container ထဲမှာ Noto Sans Myanmar font install လုပ်ပြီးမှ စစ်ခဲ့တယ် (dev-only verification step, production concern မဟုတ်ဘူး — real device တွေမှာ Myanmar font ရှိပြီးသားဖြစ်မယ်)။

### D52 — Store Design (Storefront Customization / Theme)

Seller က Admin Dashboard ကနေ storefront ရဲ့ **Homepage / Category page / Product page**
တွေကို Shopify store-builder ပုံစံ customize လုပ်နိုင်အောင် "Store Design" feature ထည့်ထားတယ်။
Editor က inspector (ဘယ်ဘက် form) + live phone preview (ညာဘက် canvas) ဆိုတဲ့ two-pane
ပုံစံဖြစ်ပြီး draft `StorefrontTheme` တစ်ခုတည်းက drive လုပ်တယ် (`/admin/design`)။

**Data model** — `shops.theme` (jsonb) column အသစ် (migration `0009_shop_theme.sql`)။
Customization က cosmetic သက်သက် — hero/section copy, section toggle (hero / category rail /
search box / related products), hero image, announcement bar, accent colour။ Security boundary
မဟုတ်ဘူး — RLS (`shops_owner_all`) က owner-scoped write ကို ဆက်ထိန်းပြီး၊ 0007 trigger က
`theme` ကို မကိုင်လို့ trigger ပြင်စရာမလို။

**Fail-safe** — `src/domain/theme.ts` (pure leaf, `plan.ts`/`orderStatus.ts` pattern) မှာ
`DEFAULT_THEME` + `normalizeTheme()` ရှိတယ်။ `normalizeTheme()` က မည်သည့် untrusted value
(raw jsonb, null, partial/old blob, garbage) ကိုမဆို complete + valid `StorefrontTheme`
အဖြစ် ပြန်ပေးတယ် — invalid/missing field တိုင်း default ဆီ fall back လုပ်တာမို့ storefront ဘယ်တော့မှ
ပျက်လို့မရ။ `DEFAULT_THEME` က storefront ရဲ့ မူလ hardcoded Burmese copy အတိအကျဖြစ်လို့ theme
မသတ်မှတ်ရသေးတဲ့ ဆိုင် (theme = `{}`) က အရင်အတိုင်းပဲ မြင်ရမယ်။

**Read paths (defensive)** — write/read နှစ်ဖက်လုံးမှာ `normalizeTheme()` ဖြတ်တယ်။
Storefront gateway (`api/storefront.ts` action=shop) က `theme` ကို **သီးခြား query** နဲ့ဆွဲပြီး
error ဖြစ်ရင် null → default; core shop payload ဘယ်တော့မှ မကျ။ `shopResolver` က `ShopInfo`
ကို slug + normalized theme နဲ့ဆောက်ပြီး hero image ကို first-party media proxy
(`/api/storefront/shop-logos/…`, PR #43) ဆီ rewrite လုပ်တယ်။ Admin `getShopTheme()` က column
မရှိသေးရင် `supported:false` ပြန်ပေးပြီး editor မှာ migration-pending banner ပြတယ်။

**Plan gating** — `features.branding` (Business) အောက်မှာ gate လုပ်ထားတယ် (logo/branding နဲ့
ကိုက်ညီအောင်)။ Starter မှာ `UpgradeCard` ပြတယ်။ Downgrade လုပ်ရင် theme data မဖျက် — upgrade
ပြန်လုပ်ရင် ပြန်ပေါ်တယ်။

**Hero image** — `uploadShopLogo` (shop-logos bucket) ကို ပြန်သုံးပြီး upload-before-write
invariant (unsaved upload ကို replace/save-fail/unmount မှာ cleanup၊ old object ကို write
အောင်မြင်မှသာ ဖျက်) ကို Settings logo နဲ့တူအောင် လိုက်နာထားတယ်။

**Applied (2026-09-21):** `0009_shop_theme` ကို owner go-ahead ဖြင့် live project
(`fsxdnmnycizjkgstokze`) သို့ apply လုပ်ပြီးပြီ — `list_migrations` မှာ `20260921221919 shop_theme`
အဖြစ်တည်ရှိတယ်။ `database.types.ts` ရဲ့ `shops` block က live schema (`theme: Json`) နဲ့ တိတိကျကျ
sync ဖြစ်နေတာ regenerate output နဲ့တိုက်စစ်ပြီးဖြစ်တယ် (ကျန် generator drift ကို မထည့်ဘဲ hand-maintained
version ကို ထားတယ် — CLAUDE.md type-maintenance standing rule အတိုင်း)။ `tests/theme.test.ts` က
normalizeTheme contract ကို guard လုပ်တယ်။ (`0008_shop_owner_unique` ကတော့ pending ဆက်ဖြစ်တယ် —
ဒီ migration က မထိ။)

### D49 — Shop တစ်ဆိုင် per Owner ကို DB Invariant အဖြစ် Enforce လုပ်တယ်

Seller signup flow ကို audit လုပ်ရာမှာ latent lockout risk တစ်ခုတွေ့ခဲ့တယ်။ Admin flow တစ်ခုလုံး (`RequireAdmin`, `Onboarding` self-guard, `ownShop`) က "owner တစ်ယောက် = shop တစ်ဆိုင်" ဆိုတဲ့ invariant ကို `.maybeSingle()` နဲ့ မှီခိုနေပြီး၊ `.maybeSingle()` က row ၂ ခုတွေ့ရင် **throw** ဖြစ်တယ်။ ဒါပေမဲ့ `shops` table မှာ `owner_id` အပေါ် unique constraint မရှိခဲ့ဘူး (non-unique index `shops_owner_idx` သာ)။ Double-submit / two-tab / navigate မဖြစ်မီ retry ကနေ shop ၂ ခုဖြစ်သွားရင် နောက်ပိုင်း login တိုင်း `getOwnShop()` throw → seller ဟာ console ထဲ ဘယ်တော့မှ ဝင်လို့မရတော့တဲ့ dead-lock ဖြစ်နိုင်တယ်။

**ဆုံးဖြတ်ချက်:** migration `0008_shop_owner_unique.sql` နဲ့ `unique(owner_id)` constraint (`shops_owner_unique`) ထည့်ပြီး DB level မှာ invariant ကို enforce လုပ်တယ်။ Unique constraint က ကိုယ်ပိုင် unique index တစ်ခု ဆောက်ပေးတာမို့ အရင်ရှိပြီးသား non-unique `shops_owner_idx` က redundant ဖြစ်သွားတယ် — အဲဒါကို migration ထဲမှာပဲ `drop index` လုပ်တယ်။ `createOwnShop()` က owner-collision (23505) တိုင်းမှာ owner ရဲ့ ဆိုင်ကို အရင်ရှာ → ရှိရင် idempotent recover (double-submit လုပ်သူကို သူ့ dashboard သို့ပို့) → မရှိမှသာ slug collision ဟု သတ်မှတ်တယ်။ `RequireAdmin`/`Onboarding` ကလည်း transient fetch error နဲ့ "no shop" ကို ခွဲ (error မှာ retry screen ပြ၊ redirect မလုပ်)။ `slugify` က slice ပြီးမှ hyphen trim (trailing `-` fail ရှောင်ရန်)။ ဒီ behaviour တွေအားလုံးကို `tests/sellerShop.test.ts` နဲ့ `tests/slug.test.ts` မှာ regression test နဲ့ ချုပ်ထားတယ်။

**Pending:** `0008` ကို live project သို့ **မ apply ရသေးပါ** — owner go-ahead လိုအပ်ပြီး duplicate `owner_id` row ရှိရင် constraint add မအောင်မြင်။ Apply မလုပ်ခင် operator က migration ထဲက read-only duplicate-detection query ကို run ပြီး duplicate မရှိကြောင်း အရင်စစ်ရမယ် (`0001`–`0007` applied; `0008` pending)။ (PR #28)

### D48 — DB Typed Error တွေကို Domain Catalog တစ်ခုတည်းက Burmese အဖြစ် Map လုပ်တယ်

`0007` က raise လုပ်တဲ့ typed exception တွေ (`rate_limit_exceeded`, `duplicate_order_limit`,
`business_plan_required`, `plan_is_platform_managed` စသည် ၁၈ ခု) ကို buyer/seller တွေ raw English
Postgres code အဖြစ် မြင်နေရတာကို ဖြေရှင်းဖို့ `src/domain/dbError.ts` (pure leaf, `orderStatus.ts`
pattern) ကို single source of truth အဖြစ်ထည့်ထားတယ် — `DB_ERROR_MESSAGES` catalog + `mapDbError()`
(stock code ရဲ့ `:<product_id>` suffix ဖြုတ်၊ exact-match ပြီး longest-substring fallback)။

Mapping ကို **API boundary** မှာသာ ချိတ်ထားတယ် (UI component မဟုတ်) — checkout `place_order`၊ orders
`lookup_order`၊ seller shop update ရဲ့ **တကယ်သုံးတဲ့ write path** `sellerShop.updateOwnShop()`
(Settings page က `adminApi.updateShopSettings()` ကို မခေါ်ဘူးဆိုတာ code review က ဖော်ထုတ်ခဲ့လို့
အဲဒီ path ကို ဦးစားပေးချိတ်ထားတယ်)၊ နဲ့ product create/update။ DB က enforcement boundary
(RLS + trigger) ဆက်ဖြစ်ပြီး frontend က render/copy သာ ဆုံးဖြတ်တဲ့ separation ကို ထိန်းထားတယ်။
`tests/dbError.test.ts` က migration SQL ထဲက raised code တွေကို ထုတ်ဖတ်ပြီး catalog နဲ့ တိုက်စစ်တဲ့
drift guard ပါဝင်တယ် — migration 0007 ထဲက code တိုး/ဖယ်/အမည်ပြောင်းတာနဲ့ catalog မကိုက်ရင် test fail ဖြစ်မယ်။ နောက် migration မှာ typed code အသစ်ထည့်ရင် catalog နဲ့ contract test scope ကို အတူ update လုပ်ရမယ်။

### D47 — Agent Readiness နဲ့ Documentation Truth Audit

D46 restructure ပြီးတဲ့နောက် repo ကို coding agents တွေအတွက် တကယ်အသင့်ဖြစ်/မဖြစ်နဲ့ documentation က code အတိုင်းမှန်/မမှန် ပြန်စစ်ခဲ့တယ်။

တွေ့ခဲ့တာ နှစ်မျိုးရှိတယ်:

1. D46 မှာ file တွေရွှေ့ပြီးနောက် comment 24 နေရာက path အဟောင်းတွေကို ဆက်ညွှန်နေတယ်။ `src/lib/backend.ts`, `src/lib/store.ts`, `src/lib/api.ts`, `src/pages/admin/Onboarding.tsx`, `src/data/products.ts` စတဲ့ stale path တွေကို လက်ရှိ path အသစ်တွေနဲ့ပြင်ထားတယ်။ Coding agent တွေအတွက် comment က navigation map ဖြစ်လို့ path မှားတာကို cosmetic issue လို့မယူဆရ။
2. `.env.example`, `README.md`, `supabase/README.md`, `CLAUDE.md` ထဲက code နဲ့မကိုက်တော့တဲ့အချက်တွေကိုပြင်ထားတယ်။ အထူးသဖြင့် plan fallback က `business` မဟုတ်ဘဲ fail-closed `starter` ဖြစ်တာ၊ migration `0001`–`0007` အကုန်ရှိတာ၊ Storage နဲ့ anon rate limiting က ship ပြီးသားဖြစ်တာတွေကို မှန်အောင်ညှိထားတယ်။

Codex နဲ့ အခြား non-Claude agents တွေအတွက် `AGENTS.md` အသစ်ထည့်ထားတယ်။ Rule နှစ်စုံ drift မဖြစ်အောင် `CLAUDE.md` ကို single source of truth အဖြစ်ညွှန်ထားတယ်။ Local Node version ကို CI နဲ့တူအောင် `.nvmrc` နဲ့ `package.json#engines` မှာ Node 22 သတ်မှတ်ထားတယ်။

Owner ဆုံးဖြတ်ရန်ကျန်တာတွေက `.mcp.json`, repo ထဲ commit လုပ်ထားတဲ့ personal Claude plugin settings, vendored third-party skills နဲ့ PR template / formatter config ဖြစ်တယ်။ ဒီအချက်တွေက pilot blocker မဟုတ်ဘူး။

### D46 — `src/` ကို Feature-first Architecture အဖြစ်ပြန်ဖွဲ့ပြီး Layering ကို Lint နဲ့ Enforce လုပ်ထားတယ်

အရင် structure မှာ `src/lib/` က infrastructure, domain types, React providers နဲ့ utilities တွေ ရောနေတဲ့ 19-file dumping ground ဖြစ်နေတယ်။ `backend.ts` တစ်ဖိုင်တည်းမှာ buyer နဲ့ seller နှစ်ဖက်လုံးရဲ့ query တွေ 822 LOC အထိစုနေတယ်။ ပိုအရေးကြီးတာက production Supabase layer က domain types တွေကို localStorage demo backend ဖြစ်တဲ့ `lib/api.ts` ဆီက import လုပ်နေတဲ့ dependency inversion ရှိတယ်။

Structure အသစ်:

`domain/ ← core/, shared/ ← features/* ← data/ ← app/`

- `domain/` — pure types နဲ့ rules
- `core/` — Supabase client နဲ့ Storage infrastructure
- `shared/` — cross-feature UI, hooks နဲ့ utilities
- `features/*` — tenancy, catalog, cart, checkout, orders, shipping, billing, shop, auth, admin
- `data/` — demo/live switch နဲ့ cross-feature API composition
- `app/` — composition root နဲ့ routes

ဒီ layering ကို convention အဖြစ်ရေးထားရုံမဟုတ်ဘဲ `eslint.config.js` ရဲ့ `no-restricted-imports` နဲ့ enforce လုပ်ထားတယ်။ Feature တစ်ခုက နောက် feature ရဲ့ `api/` ကို import လုပ်တာ၊ page က `liveApi` ကိုတိုက်ရိုက်ခေါ်တာ၊ `domain/` က React/Supabase ကိုယူတာတွေ lint fail ဖြစ်မယ်။ `@/*` alias ကို repo root မဟုတ်ဘဲ `src/*` ကိုညွှန်ထားတယ်။

ဒီပြောင်းလဲမှုက behavior-preserving restructure ဖြစ်ပြီး runtime logic ကိုပြန်မရေးထားဘူး။ Verification မှာ TypeScript clean, ESLint 0 errors, tests 7/7 pass, Vite build pass ဖြစ်တယ်။ မပါသေးတာတွေက DB error code 16 မျိုးကို Burmese copy နဲ့ map လုပ်ခြင်း၊ production bundle က demo layer ဖယ်ခြင်းနဲ့ test/CI hardening ဖြစ်ပြီး open tasks အဖြစ်ဆက်ထားတယ်။

### D45 — PR #24 နဲ့ PR #25 ကို Decision Log ထဲ Backfill လုပ်ထားတယ်

PR #24 မှာ repo ရဲ့ ပထမဆုံး CI workflow ထည့်ခဲ့တယ်။ PR တိုင်းနဲ့ `main` မှာ lint → test → build run တယ်။ Native `node --test` test suite, `npm test` နဲ့ `npm run check` ကိုလည်းထည့်ထားတယ်။

PR #25 production hardening မှာ migrations `0005_fix_storage_policy_path`, `0006_optimize_rls_and_fk_index`, `0007_production_hardening` ထည့်ပြီး 2026-09-16 ရက်နေ့မှာ live project ကို apply လုပ်ထားတယ်။ Plan resolution ကို fail-closed `starter` လုပ်ထားတယ်။ Supabase မရှိတဲ့ tenant route က demo shop ပြမယ့်အစား service unavailable ပြတယ်။ `vercel.json` မှာ CSP, HSTS နဲ့ `frame-ancestors` headers ထည့်ထားတယ်။

`0007` ကြောင့် plan gating က frontend-only မဟုတ်တော့ဘဲ database ကပါ enforce လုပ်တယ်။ ဒါပေမယ့် DB typed error 16 မျိုးကို frontend မှာ Burmese message မပြောင်းရသေးလို့ ဥပမာ rate limit တိုက်ရင် buyer က `rate_limit_exceeded` raw string မြင်နိုင်တယ်။ ဒီအလုပ်ကို open task အဖြစ်ထားတယ်။

### D44 — Custom SMTP က Pilot Blocker

Project မှာ custom SMTP မ configure ရသေးတာကို signup OTP rollout လုပ်ချိန်မှာတွေ့ခဲ့တယ်။ ဒီအချက်ကြောင့် Supabase email template editing ပိတ်ထားပြီး default mailer ကို production auth delivery အတွက် ယုံကြည်လို့မရဘူး။

ဆုံးဖြတ်ချက် — Custom SMTP configure မပြီးမချင်း real seller pilot ကို auth-ready လို့မယူဆရ။ Resend ကို initial provider အဖြစ်ရွေးထားတယ်။

### D43 — Email Link ထက် 6-digit OTP ကို Primary Confirmation Flow လုပ်မယ်

Fresh signup မှာ confirmation link က `otp_expired` ဖြစ်ခဲ့တယ်။ Email security scanner / prefetcher က single-use link ကို user မနှိပ်ခင် consume လုပ်နိုင်တဲ့ failure mode ကိုရှောင်ဖို့ `verifyOtp({ email, token, type: 'signup' })` သုံးတဲ့ 6-digit code flow ထည့်ထားတယ်။

### D42 — Plan Gating Live Verification

Starter / Business plan နှစ်ခုအတွက် gated surfaces တွေကို real browser automation နဲ့ စမ်းပြီး HIDE/SHOW behavior မှန်တာအတည်ပြုထားတယ်။ Test data ကို production Supabase ထဲမှာ temporary create လုပ်ပြီး test ပြီးတာနဲ့ cleanup လုပ်ထားတယ်။

### D40 — Admin Dashboard Retheme + Gold Token Fix

Admin dashboard ကို storefront design direction နဲ့ညီအောင်ပြောင်းထားတယ်။ `PlanGate.tsx` ကသုံးနေတဲ့ gold Tailwind tokens တချို့ မရှိတာကြောင့် Business upsell UI styling မပေါ်တဲ့ bug ကိုလည်း ပြင်ထားတယ်။

### D39 — Premium Minimalist Storefront

Pink/cyan TikTok-derived palette ကနေ near-black + porcelain + muted-gold visual system ကိုပြောင်းထားတယ်။ Mobile bottom navigation, category quick links နဲ့ simplified product actions ထည့်ထားတယ်။

### D38 — Supabase Migration Procedure ကို Skill အဖြစ်ခွဲထားတယ်

Migration checklist ကို `CLAUDE.md` ထဲအမြဲ load မလုပ်တော့ဘဲ `.claude/skills/supabase-migration/SKILL.md` ထဲခွဲထားတယ်။ Production migration ကို owner approval မရှိဘဲ apply မလုပ်ရဆိုတဲ့ safety rule ကတော့ standing rule အဖြစ်ဆက်ရှိတယ်။

### D37 — Design System Groundwork

`design/design.md` နဲ့ theme specs တွေထည့်ထားတယ်။ `.claude/skills/` ထဲမှာ UI/UX, accessibility နဲ့ React-related skills တွေပါရှိတယ်။ ဒါတွေက runtime application code မဟုတ်ဘဲ development/session tooling ဖြစ်တယ်။

### D36 — Signup Redirect Fix

`emailRedirectTo` ကို hardcoded localhost မသုံးတော့ဘဲ `${window.location.origin}/admin/onboarding` သုံးထားတယ်။ Production URL ကို Supabase redirect allow-list ထဲထည့်ထားဖို့လိုတယ်။

### D35 — Storage Upload UI

Existing `adminApi.uploadShopLogo`, `uploadProductImage`, `deleteShopLogo`, `deleteProductImage` methods တွေကိုပဲသုံးထားတယ်။ Storage layer အသစ်မဖန်တီးဘူး။ Upload/write/delete ordering invariant ကို strict လိုက်နာထားတယ်။

### D34 — Image Upload Owner Decisions

Manual URL input ဖယ်ထားတယ်။ PNG/WebP ပဲလက်ခံတယ်။ PNG ကို WebP ပြောင်းပြီး upload လုပ်တယ်။ Orphaned Vercel project link ကို owner ဘက်ကဖျက်ပြီးဖြစ်တယ်။

### D33 — Storage + DB Consistency Lesson

Storage နဲ့ DB က shared transaction မရှိတာကြောင့် UI implementation ကို individual error case တစ်ခုချင်း patch မလုပ်ဘဲ consistency invariant တစ်ခုတည်းကနေ derive လုပ်ရမယ်။ Existing backend capability ရှိ/မရှိကို schema ကြည့်ရုံနဲ့မဆုံးဖြတ်ဘဲ codebase ကိုအရင် search လုပ်ရမယ်။

### D32 — Promotion Price Constraint

`0004_product_promo_price_check.sql` ကို live Supabase project မှာ owner approval နဲ့ apply လုပ်ပြီးပြီ။ Promotion ဖြစ်ရင် `promo_price` က null မဖြစ်ရဘဲ regular `price` ထက်ငယ်ရမယ်။

### D31 — Owner Live Verification

Production deployment ပေါ်မှာ owner က core buyer/admin flow ကို live verify လုပ်ပြီးဖြစ်တယ်။ ဒီ verification က TikTok real-device WebView test ကို အစားမထိုးဘူး။

### D30 — Vercel Production Deployment

`minishop` Vercel project ကို `riddler9999/minishop` `main` ကနေ deploy လုပ်ထားပြီး production env မှာ Supabase URL / anon key configure လုပ်ထားတယ်။

### D29 — Merge ပြီးတိုင်း `main` ကို ပြန် Verify လုပ်ရမယ်

PR review thread resolved ဖြစ်တာနဲ့ fix က `main` ထဲတကယ်ဝင်သွားပြီလို့ မယူဆရ။ ဒီ repo မှာ merge timing ကြောင့် နောက်ဆုံး push မပါဘဲ merge သွားတဲ့ incident ဖြစ်ဖူးတယ်။

Standing rule:

`merge → fetch main → diff/verify actual main → ပြီးမှ fixed လို့သတ်မှတ်`

### D28 — SQL/RLS Validation ≠ Real Browser Validation

Supabase SQL/RLS level test pass ဖြစ်တာနဲ့ real browser / WebView flow pass လို့မယူဆရ။ Backend security validation နဲ့ actual UI/device validation ကို သီးခြားစစ်ရမယ်။

### D27 — ESLint

React Hooks နဲ့ JSX accessibility checks ထည့်ထားတယ်။ `npm run lint` က TypeScript check + ESLint ကို run တယ်။ Existing `no-explicit-any` တွေကို warning အဖြစ်ထားပြီး scope မချဲ့ထားဘူး။

### D26 — Standalone Repository

Project ကို `MyProjects` monorepo ကနေ `riddler9999/minishop` standalone repo အဖြစ်ပြောင်းထားတယ်။ Vercel Root Directory က repo root ဖြစ်တယ်။

### D25 — Platform Phase 1.5 Backend

`shops.plan`, usage tracking, billable-order logic နဲ့ tenant-scoped Storage infrastructure ထည့်ထားတယ်။ Migration က additive ဖြစ်ပြီး existing storefront RPC contract မဖျက်ဘူး။

### D23 — Plan Gating က Frontend Layer

Plan gating ကို RLS feature authorization အဖြစ်မသုံးဘူး။ လက်ရှိမှာ frontend commercial gating layer ဖြစ်တယ်။ Seller က plan ကို self-upgrade မလုပ်နိုင်ရ။

### D24 — Tenant Branding

Storefront မှာ platform brand တစ်ခုတည်းမပြဘဲ tenant shop ရဲ့ `name` / `logo_url` ကိုပြတယ်။ Shop slug ကို Settings မှာ read-only ထားတယ်။ Slug ပြောင်းရင် shared link တွေပျက်နိုင်လို့ဖြစ်တယ်။

### D19–D22 — Storefront Routing

Storefront routing ကို localStorage shop context မဟုတ်ဘဲ `/s/:slug/...` path-based routing သုံးတယ်။ TikTok WebView storage မတည်ငြိမ်နိုင်တာကြောင့် reload လုပ်လည်း shop identity မပျောက်စေရ။

`store.ts` storefront API ကို reactive Proxy သုံးထားတယ်။ `api.<method>` ကို React dependency array ထဲမထည့်ရ — access တစ်ခါစီ fresh function ဖြစ်နိုင်လို့ effect loop ဖြစ်နိုင်တယ်။

Shop navigation ကို `shopHref()`, `<ShopLink>`, `useShopNavigate()` သုံးတယ်။

### D15–D16 — Seller Auth / Onboarding

Seller auth ကို email/password သုံးတယ်။ Phone OTP မသုံးဘူး။ Shop onboarding က hard gate ဖြစ်တယ်။

### D12–D13 — Backend Contract / Feature Switch

`lookup_order()` anti-enumeration အတွက် order number + phone + shop context လိုတယ်။ Backend switch ကို Supabase env ရှိတာတစ်ခုတည်းနဲ့မလုပ်ဘဲ valid shop context ရှိမှလုပ်တယ်။

### D9 — Dedicated Supabase Project

Mini Shop က shared production database မသုံးဘူး။ Dedicated Supabase project သီးသန့်သုံးတယ်။

### D4–D6 — Anonymous Buyer Security + Manual Payment Verification

Anonymous buyer က tables ကိုတိုက်ရိုက် write မလုပ်နိုင်ဘူး။ Order creation ကို `place_order()` RPC ကနေသွားတယ်။ MVP payment verification က manual last-5 matching ဖြစ်တယ်။ Auto payment verification ကို Phase 2 အတွက်ထားတယ်။

### D8 — Discovery Risk ကို သိပြီး Build-first သွားထားတယ်

Phase-0 customer discovery pilot ကိုကျော်ပြီး product ကိုအရင် build လုပ်ဖို့ owner က risk ကိုလက်ခံထားတယ်။ ဒါကြောင့် အခုနောက်တစ်ဆင့်မှာ real seller pilot evidence က အရေးကြီးဆုံးဖြစ်တယ်။

### D7 — Production Migration Safety Rule

**Owner ရဲ့ explicit approval မရှိဘဲ production Supabase migration ကို apply မလုပ်ရ။**

### D51 — Buyer Fashion Storefront + Repository Cleanup

Buyer storefront ကို jewellery-specific presentation ကနေ white + blush-pink fashion direction ပြောင်းထားတယ်။ Buyer-facing copy က Burmese-first ဖြစ်ပြီး search နဲ့ category chips တွေက existing `/products?q=` / `/products?category=` contracts ကိုသုံးတယ်။ Promotion banner က real `isPromotion` product ရှိမှသာပြပြီး tenant routing, ProductCard, cart/checkout နဲ့ Supabase data flow ကိုမပြောင်းထားဘူး။

Repo cleanup အနေနဲ့ runtime မှာမသုံးတော့တဲ့ jewellery assets နဲ့ `.jewel-cta` style ကိုဖယ်ထားတယ်။ Personal `.claude/settings.json` နဲ့ vendored third-party skills/data ကို repo ထဲမထားတော့ဘူး။ Project-specific `.claude/skills/supabase-migration/SKILL.md` တစ်ခုပဲထားမယ်။ Third-party tools/skills ကို developer environment ကနေ install/use လုပ်ရမယ်။

### D53 — `ui-ux-pro-max` Skill ကို D51 Policy ရဲ့ Named Exception အဖြစ် Vendor လုပ်တယ်

D51 က personal `.claude/settings.json` နဲ့ vendored third-party skills/data ကို repo ထဲမထားရ၊ project-specific `supabase-migration` skill တစ်ခုပဲ commit လုပ်ရမယ်လို့ ဆုံးဖြတ်ခဲ့တယ်။ Project owner ရဲ့ explicit request အရ ဒီ policy ကို named exception တစ်ခုနဲ့ ချိန်ညှိထားတယ် — blanket reopening မဟုတ်ဘူး။

**ဆုံးဖြတ်ချက်:** `nextlevelbuilder/ui-ux-pro-max-skill` (MIT license, npm package `ui-ux-pro-max-cli@2.15.0`) ကို `.claude/skills/ui-ux-pro-max/` + ၎င်းရဲ့ bundled sub-skills (`banner-design`, `brand`, `design`, `design-system`, `slides`, `ui-styling`) အဖြစ် repo ထဲ vendor လုပ်ထားတယ်။ Install လုပ်ခင် `npm pack` နဲ့ tarball ကို download ပြီး `dist/index.js` ကို manual review လုပ်ခဲ့တယ် — `init` command (non-`--legacy`) က bundled templates/assets ကို local file copy + text substitution ချည်းသာ လုပ်တာ (network call, `child_process` exec, credential access မပါ) ဆိုတာ confirm ဖြစ်ခဲ့လို့ `npx` ကို run မယ့်အစား ဒီ repo ထဲမှာပဲ ထပ်တူ manual reproduce လုပ်ခဲ့တယ်။ `--legacy` mode ကိုသာ GitHub release ကနေ download လုပ်တာမို့ မသုံးထားဘူး။ `ui-styling` sub-skill ရဲ့ upstream `LICENSE.txt` ကို ဖျက်မထားဘူး။

**Scope/maintenance:** ဒီ exception ကို ဒီ skill bundle တစ်ခုတည်းအတွက်ပဲ သတ်မှတ်တယ်; နောက်ထပ် third-party skill/plugin ကို repo ထဲ vendor လုပ်ချင်ရင် project owner ဆီက အသစ် go-ahead ထပ်လိုတယ်။ Skill ကို update ချင်ရင် အသစ် tarball ကို ထပ် download/review ပြီးမှ diff ကို manual verify လုပ်ပြီးမှ commit လုပ်ရမယ် — CI/lint ကနေ ဒီ skill data files တွေကို validate မလုပ်ဘူး, third-party content အနေနဲ့ trust boundary အပြင်ဘက်ကထားရမယ်။

### D50 — Admin Analytics Dashboard English + Shipping Removed

Admin analytics dashboard copy ကို English-only အဖြစ်ထားမယ်။ Buyer storefront နဲ့ တခြား screen တွေရဲ့ language rule ကို ဒီ decision က မပြောင်းဘူး။ Screen-specific exception အဖြစ်ပဲ သတ်မှတ်တယ်။

Redesigned admin navigation မှာ Shipping entry ကို မပြတော့ဘူး။ Underlying shipping capability / route / data ကို ဒီ UI change က မဖျက်ဘူး; navigation surface ကနေပဲ ဖယ်ထားတာ။

"New Orders" section က badge နဲ့ list ကို တစ်မျိုးတည်းသော source (`OPEN_STATUSES`) ကနေယူရမယ်။ Action လိုတဲ့ order count ကိုပြပြီး completed order list ပြတာမျိုး semantic mismatch မဖြစ်စေရ။


### D55 — Paid Onboarding Gate (historical pricing; superseded by D56/D57)

Seller တစ်ယောက် ဆိုင်စဖွင့်ခွင့်မရမီ **plan ကို ကြိုဝယ်** ရမယ်: Starter (50,000 Ks) သို့ Business
(80,000 Ks) ရွေး → KBZPay/WavePay/AYA (`09969222535`, MOE HTET KYAW) သို့ ငွေလွှဲ → ငွေလွှဲ
screenshot upload → **owner က manual approve** ပြီးမှ `/admin/onboarding` ကို ရောက်တယ်။

**Approval surface — Supabase dashboard (manual, owner-only).** App ထဲမှာ super-admin console
မဆောက်ဘူး — repo ရဲ့ manual last-5 payment-verification MVP philosophy (D4–D6) နဲ့ ကိုက်ညီစေဖို့နဲ့
scope creep ရှောင်ဖို့ဖြစ်တယ်။ Owner က `shop_applications` row + `payment-proofs` object ကို Supabase
dashboard (service_role) မှာကြည့်ပြီး `status` ကို `approved`/`rejected` သတ်မှတ်တယ်။ Business ဝယ်သူ
အတွက် `shops.plan` ကိုလည်း owner ကပဲ dashboard ကနေ သတ်မှတ်ရမယ် — `0007` trigger က shop insert
တိုင်းကို `plan='starter'` force လုပ်ထားလို့ (plan က platform-managed) seller က self-upgrade မလုပ်နိုင်။

**Data model** — `shop_applications` table အသစ် (migration `0010_shop_application_gate.sql`),
PK = `owner_id` (auth.uid()) မို့ seller တစ်ယောက် application တစ်ခုပဲ။ Columns: `plan`,
`payment_method` (kpay/wave/aya), `payment_ref_tail` (optional last-5), `screenshot_path`, `amount`
(informational — owner က တကယ့်လွှဲငွေကို screenshot နဲ့တိုက်စစ်တာမို့ enforcement မဟုတ်), `status`
(pending/approved/rejected, default pending), `review_note`, timestamps။

**Security** — RLS: seller က ကိုယ့် row ကိုသာ select/insert/update လုပ်နိုင်။ `status` က
platform-managed: `protect_shop_application()` trigger (0007 ရဲ့ `protect_shop_managed_fields`
pattern) က authenticated caller ကို insert/resubmit မှာ `status='pending'` သာခွင့်ပြု —
`approved`/`rejected` ကို ကိုယ်တိုင်မသတ်မှတ်နိုင်၊ approved ဖြစ်ပြီးသား row ကို ပြန်မထိနိုင်၊ `owner_id`
immutable။ Owner (service_role, `auth.uid()` null) က dashboard ကနေ လွတ်လပ်စွာ approve/reject လုပ်နိုင်။

**Storage** — `payment-proofs` bucket အသစ် (**private**, `public=false`): ငွေလွှဲ screenshot က sensitive
မို့ shop-logos/product-images လို world-readable မဖြစ်ရ။ Path owner-scoped: `payment-proofs/<owner_id>/…`
(RLS က first folder segment = auth.uid() ကိုစစ်)။ JPEG ကိုပါ လက်ခံ (banking-app screenshot က JPG
များ), PNG→WebP conversion မလုပ် (proof က capture, storefront media pipeline မဟုတ်)။ Seller ဘက် proof
upload က in-app WebView constraint (D-log slip-upload no-op) နဲ့မဆန့်ကျင် — အဲဒါက buyer WebView အတွက်;
ဒါက seller admin-side, logo/product image upload capability အတိုင်း established။

**Fail-closed + invariant** — `resolveOnboardingGate()` (`src/domain/subscription.ts`, pure leaf) က gate
decision ကို တစ်နေရာတည်းမှာထား; RequireAdmin/Onboarding/Subscribe သုံးဖက်လုံး `resolveSellerGate()`
(`features/billing/application.ts`) ကနေ route လုပ်တယ်။ Application upload က upload-before-write invariant
လိုက်နာ (proof အရင်တင် → row write → write fail ရင် uploaded object ကို delete; resubmit မှာ အဟောင်း
delete write အောင်မြင်မှသာ)။ Lookup fail (network/RLS) ကို retry screen ပြ — redirect မလုပ် (D49 pattern)။

**Applied (2026-09-21):** `0010_shop_application_gate` ကို owner go-ahead ဖြင့် live project
(`fsxdnmnycizjkgstokze`) သို့ apply လုပ်ပြီး (`list_migrations`: `20260921224420 shop_application_gate`)။
`database.types.ts` ရဲ့ `shop_applications` block က regenerate output နဲ့ 1:1 sync; security advisor မှာ
new table အတွက် RLS/policy warning မရှိ။ DB error code ၃ ခု (`application_status_is_platform_managed`,
`application_owner_is_immutable`, `application_already_approved`) ကို `dbError.ts` catalog ထဲထည့်ပြီး
`tests/subscription.test.ts` က gate + pricing ကို guard လုပ်တယ်။ (`0008_shop_owner_unique` က pending ဆက်ဖြစ် —
ဒီ migration က မထိ။)

### D56 — Pricing V1: Free Trial တီးယာ + Auditable Order Entitlement Model

Commercial pricing ကို အပြီးသတ်ဆုံးဖြတ်ပြီး entitlement (quota + purchased balance) system ကို
end-to-end ထည့်ထားတယ် (migration `0016_entitlements_and_pricing.sql`)။

**Plans (finalized):**

| Plan | ဈေး/လ | လစဉ် Order | ပစ္စည်း | Extra Orders |
|---|---|---|---|---|
| Free Trial | 0 Ks | 20 (**တစ်သက်တာ — reset မဖြစ်**) | 10 အထိ (server-enforced) | ဝယ်၍မရ |
| Starter | 30,000 Ks | 60 / cycle | အကန့်အသတ်မဲ့ | ဝယ်နိုင် |
| Business | 60,000 Ks | 150 / cycle | အကန့်အသတ်မဲ့ | ဝယ်နိုင် (+ advanced features) |

Extra Orders — 500 Ks/order, preset 1/5/10/20/30/50, volume discount မရှိ။ ဝယ်ထားသည့်
အရေအတွက် **ဘယ်တော့မှ သက်တမ်းမကုန်** — renewal / upgrade / downgrade / cancellation ကို
ကျော်၍ ကျန်နေမည်။ active paid subscription မရှိလျှင် consume မလုပ်နိုင် (reactivate ပြီးမှ ပြန်သုံးနိုင်)။

**Billable order:** valid customer order တစ်ခု အောင်မြင်စွာ ဖန်တီးတာနဲ့ entitlement ၁ ခုကို
**ချက်ချင်း** consume လုပ်တယ် (Accepted/Shipped/Completed မစောင့် — seller-controlled status က
billing ကို မထိစေရ)။ Cancellation/rejection က auto-refund မလုပ်။ **Monthly quota ကို အရင်ကုန်အောင်
သုံးပြီးမှ purchased balance ကို သုံးတယ်။** Consumption ကို `place_order()` (0016) ထဲမှာ atomic +
idempotent (`orders.idempotency_key`) လုပ်ပြီး entitlement row ကို `FOR UPDATE` lock လုပ်ထားလို့
double-click / retry / concurrent final-slot order များကို ကာကွယ်တယ်။ Pure math ကို
`src/domain/entitlement.ts` မှာ single source of truth အဖြစ်ထားပြီး SQL RPC က တစ်သဝေမတိမ်း mirror လုပ်တယ်။

**Data model (concept ၄ ခုကို သီးခြားထား — "orders_remaining" တစ်ခုတည်း မဖြစ်စေရ):**
`shop_entitlements` (plan, active, monthly_quota, monthly_used, purchased_balance, cycle_start/end,
pending_plan) · append-only `entitlement_ledger` (grant/consume/purchase/renewal/upgrade/downgrade/
cancel/adjust — money-in event တိုင်း `(shop_id, source_type, source_id)` unique index နဲ့ **duplicate
payment protection**) · `order_pack_purchases` (seller ရဲ့ Extra-Orders ဝယ်ယူ request, manual proof)။
RLS: seller က ကိုယ့် shop ရဲ့ row ကိုသာ read; write အားလုံး SECURITY DEFINER function ကနေ။

**Manual prepaid billing** (D4–D6/D55 philosophy — in-app super-admin မဆောက်): owner က Supabase
dashboard (service_role) ကနေ `admin_activate_subscription` / `admin_renew_subscription` /
`admin_upgrade_plan` / `admin_schedule_downgrade` / `admin_credit_order_pack` /
`admin_cancel_subscription` / `admin_adjust_entitlement` RPC တွေကို screenshot စစ်ပြီး run တယ်။
Free Trial ကတော့ payment/approval မလို — application ကို trigger က auto-approve လုပ်လို့ seller က
ချက်ချင်း onboarding သို့ ဆက်သွားနိုင်တယ်။

**Mid-cycle upgrade (Starter → Business) — anti-loophole rule (chosen):** upgrade လုပ်ရင် monthly cap
ကို 150 သို့ တင်ပေးမယ်၊ ဒါပေမယ့် **ဒီ cycle မှာ သုံးပြီးသား order အရေအတွက် (`monthly_used`) ကို
ထိန်းထားတယ်** — fresh 150 မဟုတ်။ ဒါကြောင့် Starter 60 ကုန်အောင်သုံးပြီးမှ difference ပဲပေးပြီး
fresh 150 ရအောင်လုပ်တဲ့ loophole မဖြစ်နိုင်။ Seller က ကျန် cycle အတွက် ဈေးနှုန်း **ကွာခြားချက်**
(30,000 Ks) ကိုသာ ပေးရမယ်။ cycle_end မပြောင်း။ **Downgrade** ကတော့ `pending_plan` အဖြစ်မှတ်ပြီး
**နောက် renewal မှသာ** သက်ရောက်တယ် — Business data ကို ဘယ်တော့မှ မဖျက် (cap ပဲ လျှော့)။

**Feature gating ပြောင်းလဲမှု:** မြို့နယ်အလိုက် ပို့ခ (township shipping) ကို plan အားလုံးအတွက်
**core** ဖြစ်အောင် Business-only gate (UI + `shipping_zones` RLS) ကို ဖယ်ထားတယ်။ ငွေလွှဲ
အတည်ပြုစစ်ဆေးမှု (last-5) ကို plan differentiator မဟုတ်တော့ — plan အားလုံးမှာ ရနိုင်။ Business-only
ကျန်သည်မှာ genuinely advanced features (promotions, analytics dashboard, branding/Store Design,
integrations) သာ။ Free trial ရဲ့ ၁၁ ခုမြောက် ပစ္စည်းကို server-side (products trigger) မှာ ပိတ်တယ်။

**Validation:** migration ၁၁ ခုလုံးကို local Postgres (Supabase objects stub) ပေါ်မှာ clean apply
လုပ်ပြီး functional test နဲ့ အောက်ပါတို့ကို အတည်ပြုထားတယ် — Free 20 lifetime block, Free 10-product
block, Starter 60, monthly-first-then-purchased, purchased permanence (renewal ကို ကျော်), idempotent
order (retry = order တစ်ခုတည်း, consume ၁ ကြိမ်), duplicate-payment block, upgrade anti-loophole
(used preserved, quota 150), downgrade-at-renewal, cancel → `subscription_inactive`။ Domain math ကို
`tests/entitlement.test.ts`, migration invariant တွေကို `tests/entitlementMigration.test.ts` က guard လုပ်တယ်။
`npm run check` — lint + test (332 pass) + build အားလုံး green။

**Applied (2026-09-23):** `0016_entitlements_and_pricing` ကို live project (`fsxdnmnycizjkgstokze`) သို့ apply လုပ်ပြီး entitlement tables/indexes/functions ကို runtime မှာ verify လုပ်ထားတယ်။ Existing shops အားလုံးမှာ entitlement row ရှိပြီး `shops.plan ↔ shop_entitlements.plan` drift = 0။ `0008_shop_owner_unique` က pending ဆက်ဖြစ်။

### D57 — Pricing V1 (0016) နှင့် Parallel Payment-proof Auto-verification (0011/0012) ကို ညှိရန်

Pricing V1 (D56, `0016_entitlements_and_pricing.sql`) ကို branch ခွဲပြီး develop လုပ်နေစဉ်
`main` မှာ **သီးခြား parallel work** ဝင်လာတယ် — `0011_payment_proof_auto_plan.sql`
(`payment_proofs` table + `activate_plan_from_verified_payment()` OCR/auto-verification RPC) နှင့်
`0012_shop_application_transaction_id.sql` (`shop_applications.transaction_id`)။ ဒါကြောင့် ကျွန်တော်တို့
migration ကို `0011` ကနေ **`0013` သို့ renumber** လုပ်ပြီး `main` ကို merge ခဲ့တယ်။ DDL objects မတူလို့
table/function collision မရှိ; local Postgres မှာ 0001–0013 အားလုံး clean apply + entitlement functest PASS။

**Resolved 2026-09-23 — Pricing V1 reconciliation**

D57 မှာဖော်ပြထားတဲ့ semantic conflict နှစ်ခုကို `0017_reconcile_payment_activation.sql` နဲ့ ဖြေရှင်းထားတယ်။

1. Current paid-plan amounts ကို Starter **30000** / Business **60000** အဖြစ် server-side validate လုပ်တယ်။
2. Auto-verification RPC က `shops.plan` ကို တိုက်ရိုက်မပြောင်းတော့ဘဲ `admin_activate_subscription()` ကိုခေါ်ပြီး `shops.plan`, `shop_entitlements`, cycle counters နဲ့ ledger ကို တစ်လမ်းတည်း reconcile လုပ်တယ်။
3. Already-approved payment proof retry ကို idempotent return လုပ်ပြီး subscription cycle အသစ်ထပ်မဖွင့်ဘူး။
4. Historical migration `0011` ကို rewrite မလုပ်ဘဲ later migration နဲ့ runtime contract ကို replace လုပ်ထားတယ်။

**Applied (2026-09-23):** live migration history ကို reconcile လုပ်ပြီး `0011_payment_proof_auto_plan` foundation နဲ့ `0017_reconcile_payment_activation` ကို production သို့ apply လုပ်ထားတယ်။ Runtime verification မှာ 30,000/60,000 pricing, entitlement-aware activation, replay safety, entitlement rows အားလုံး PASS ဖြစ်တယ်။ Delivery migrations `0013`–`0015` ကတော့ production မှာ pending ဆက်ဖြစ်။


### D58 — Checkout API regression coverage + distributed rate limit + payment-proof storage seam

2026-09-23 audit မှာ checkout API boundary, Vercel process-local rate limiting, billing proof storage responsibilities နဲ့ stale migration docs ကို cleanup လုပ်တယ်။

- `api/checkout.ts` ကို injectable handler seam နဲ့ဖွဲ့ပြီး POST checkout regression tests ထည့်ထားတယ်: valid idempotency forwarding, malformed UUID fail-safe, incomplete payload reject, DB rate-limit → HTTP 429, cart cap = DB contract 25 items။
- Vercel memory `Map` rate limiter ကိုဖယ်ထားတယ်။ Anonymous abuse limiting ရဲ့ source of truth က migration `0007` ရဲ့ `private.api_rate_limits` + advisory lock + `private.enforce_rate_limit()` ဖြစ်ပြီး `place_order()` / `lookup_order()` နှစ်ခုလုံး DB-side enforce လုပ်တယ်။
- `src/features/billing/paymentProofStorage.ts` က validation + upload → persist → rollback-new-upload-on-failure → old-proof-delete-after-success invariant ကိုတစ်နေရာတည်း encapsulate လုပ်တယ်။ `application.ts` နဲ့ `orderPacks.ts` က DB persistence ပဲပိုင်တော့တယ်။
- Migration references ကို `0016`/`0017` runtime truth နဲ့ညှိပြီး `supabase/README.md` ကို live history အတိုင်းပြင်ထားတယ်။ `0013`–`0015` delivery migrations က production pending ဖြစ်တာကို explicit မှတ်ထားတယ်။

## Engineering Notes / Standing Rules

- `plan.tsx` က JSX provider export လုပ်တဲ့အတွက် `.tsx` ဖြစ်ရမယ်။
- `usePlan()` ကို `PlanProvider` အောက်မှာပဲသုံးရမယ်။
- Storefront branding cache က reactive မဟုတ်ဘူး။ Mid-session rename လုပ်ရင် navigation/reload မတိုင်ခင် header မပြောင်းနိုင်ဘူး။
- TikTok WebView constraint ကို architecture decision တွေချတဲ့အခါ အမြဲထည့်တွက်ရမယ်။
- Schema change လုပ်ရင် migration file + production apply + `database.types.ts` sync ကိုစစ်ရမယ်။ Type shape မပြောင်းတဲ့ CHECK-only migration လို case တွေမှာ type regeneration မလိုနိုင်ဘူး။
- `place_order()` / `lookup_order()` က anonymous buyer အတွက် ရည်ရွယ်ထားတဲ့ controlled RPC paths ဖြစ်တယ်။
- Merge ပြီးတိုင်း actual `main` state ကို verify လုပ်ရမယ်။
- Documentation မှာရေးထားတာကို code/repo state ထက်အမှန်လို့ မယူဆရ။ Conflict ဖြစ်ရင် actual repository + live backend state ကိုပြန်စစ်ရမယ်။
- Production data ကို test လုပ်ရင် owner approval, minimal temporary data, cleanup verification သုံးရမယ်။
- Real-device WebView test မပြီးမချင်း desktop Chromium PASS ကို WebView PASS လို့မယူဆရ။

## Definition of Done — Pilot Ready

Pilot Ready လို့သတ်မှတ်ဖို့ အနည်းဆုံး အောက်ကအချက်တွေ PASS ဖြစ်ရမယ်:

- [ ] Custom SMTP working
- [ ] Signup email contains OTP
- [ ] Fresh signup → OTP → onboarding → admin PASS
- [ ] Password reset email delivery PASS
- [ ] Production redirect configuration PASS
- [ ] TikTok real-device WebView checkout PASS
- [ ] Order lookup PASS
- [ ] Payment last-5 flow PASS
- [ ] KBZPay/Wave behavior documented on real devices
- [ ] One real seller ready for pilot

ဒီ checklist မပြည့်သေးရင် "production complete" လို့မသတ်မှတ်ရ။
