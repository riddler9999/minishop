# Mini TikTok Shop

> **⚠️ In transition: demo → multi-tenant SaaS.** This project is being evolved
> from the client-side demo below into a real **multi-tenant storefront SaaS for
> Myanmar TikTok sellers**. The backend foundation (Supabase schema, RLS, RPCs)
> lives in [`supabase/`](supabase/README.md); the plan, decisions and task list
> live in [`memory/`](memory/MEMORY.md), [`status/`](status/STATUS.md) and
> [`tasks/`](tasks/TASKS.md). **Read `memory/MEMORY.md` first.**
>
> The storefront UI described below is the reused foundation. The data layer is
> migrating from `localStorage` (`src/lib/api.ts`) to Supabase
> (`src/lib/supabase.ts`); until the frontend is wired over, the demo surface
> still builds and runs on static hosting with no secrets.

---

## The original demo

A **demo storefront** originally cloned from the Uthuya (ထွန်းဝမ်းဆက်) store, now
re-themed as a standalone "mini TikTok Shop"-style demo. Everything is fake,
client-side demo data — products, prices, merchant accounts and orders — so it
runs as a **pure static site with no backend and no secrets**.

Distinct from the original store:

- **TikTok-inspired theme** — pink/cyan/porcelain palette with the geometric
  Space Grotesk display font, instead of the warm maroon / cream / gold serif
  theme of the real store.
- **Client-side admin dashboard** — a `/admin` console (overview KPIs, product
  management, order management) that runs entirely in the browser over the same
  demo data. See **Admin dashboard** below.
- **No Supabase / Express** — the `/api/*` proxy is replaced by an in-memory
  mock (`src/lib/api.ts`) served from the demo catalog (`src/data/products.ts`).
  Orders are simulated and saved to `localStorage` so "Order စစ်ရန်" still works.
- **Demo product images** — real clothing photos from `loremflickr.com`,
  keyword-matched per garment (shirt, dress, skirt, jacket, …) with a fixed
  `lock` so each product keeps a stable image. Product names match the garment
  shown. Nothing depends on real product assets.

## Stack

React 19 + Vite + TypeScript + Tailwind v4. Static SPA — deploys to Vercel.

## Dev

```bash
npm install
npm run dev       # http://localhost:5173
npm run lint      # tsc --noEmit
npm run build     # → dist/
```

## Deploy (Vercel)

No env vars needed. `vercel.json` builds with Vite and rewrites all non-asset
routes to `index.html` for client-side routing.

## Storefront flow

Pick products → cart → name / phone / street → region + township dropdown
(shipping fee auto) → choose **Cash on Delivery / KBZPay / WavePay** (online
methods show the account + optional slip upload) → order placed. The thank-you
page lets you track the order by phone number, and orders can also be looked up
later on **Order စစ်ရန်**.

## Admin dashboard

A client-side merchant console at **`/admin`**, gated by a **demo passcode**
(`admin123`, shown on the login screen). Three views:

- **ခြုံငုံ (Overview)** — KPI cards (revenue from settled orders, open orders,
  product counts, out-of-stock), recent orders, and a low-stock list.
- **ပစ္စည်းများ (Products)** — search + edit any product's **price, promo price,
  stock, and visibility (show/hide)**. Edits persist to a `localStorage`
  **override layer** merged over the demo catalog, so they show up on the
  storefront immediately. "Demo သို့ ပြန်" clears all overrides.
- **Order များ (Orders)** — every order placed on this browser, filterable by
  status; open one to see items/customer/slip and **change its status** or
  delete it.

**Architecture note.** There is **no backend**, so this is a demo console, not a
production admin:

- The passcode check runs in the browser and the "session" is just a
  `localStorage` flag (`src/lib/adminAuth.tsx`). A real console must authenticate
  **server-side** (httpOnly session/JWT, RBAC, rate limiting).
- All admin state (product overrides, order edits) lives in **this browser's
  `localStorage`** — it is per-device demo data, not shared or durable.
- Product edits and order/status writes go through `adminApi` in
  `src/lib/api.ts`, which reads through the same resolver the storefront uses —
  one product source of truth for both surfaces.

> ⚠️ This is a **demo only** — not a real shop, and not affiliated with TikTok.
> Do not enter real payment info. The admin passcode is intentionally public.
