# MiniShop — Pricing, Packaging & Order-Economics Strategy

> Status: **Strategy draft for owner decision.** Not implemented. Produced as a pricing/product/unit-economics
> audit of the current order-based model. Challenges assumptions rather than endorsing them.
>
> Currency assumption: **1 USD ≈ 4,500 MMK** (2026 unofficial market rate; official ≈ 2,100). MMK is
> volatile, so figures are directional bands, not forecasts.
>
> Reference point analysed: [EasySell](https://easysellapp.com/pages/pricing) (Shopify COD form app) —
> used as a comparison, **not** copied, because MiniShop is a full standalone storefront/store-builder,
> not a form-on-top-of-Shopify add-on.

---

## 0. Executive summary — three structural risks to fix before tier numbers

Three foundation-level risks matter more than any tier price:

1. **No billable-order definition (biggest loophole).** Myanmar COD RTO (return-to-origin) rates run
   30–50%. Charging 500 MMK per *created* order bills sellers for cancelled orders, failed COD, and fake
   orders — sellers will revolt. Defining a billable order (`created` vs `checked` vs `completed`) is ~10×
   more important than the tier prices.
2. **How subscriptions get collected (Myanmar payment reality).** No card-on-file auto-renewal exists.
   Only KBZPay/Wave manual transfer. So "monthly subscription" is really **monthly manual prepay** — high
   passive churn, hundreds of manual reconciliations. This makes the non-expiring prepaid model an
   **advantage**: it matches Myanmar payment behaviour.
3. **Flat per-order fee is regressive** — it crushes low-AOV sellers and under-prices high-AOV sellers.

**Codebase mismatch (concrete finding):** `PROJECT.md` (line 92) states the current code gates
**township shipping zones** and **last-5 payment verification** as *Business-only*. This directly violates
two decisions already made (township = core; payment verification ≠ differentiator). Any architecture must
move these to Core.

---

## 1. Order economics — is 500 MMK/order sensible?

### Platform cost as % of GMV (500 MMK/order)

| AOV (MMK) | Fee / GMV | Typical category |
|---|---|---|
| 5,000 | **10.0%** | low-ticket accessories, snacks |
| 10,000 | **5.0%** | accessories, cheap cosmetics |
| 20,000 | **2.5%** | clothing, mid cosmetics |
| 30,000 | **1.67%** | clothing sets, skincare |
| 50,000 | **1.0%** | premium fashion, bundles |
| 100,000 | **0.5%** | higher-ticket goods, electronics |

### Fee as % of gross margin (the worse picture)

| Category | AOV | Margin % | Profit/order | 500 MMK = % of margin |
|---|---|---|---|---|
| Low-margin reseller | 5,000 | 15% | 750 | **67%** ⚠️ |
| Fashion (typical) | 20,000 | 40% | 8,000 | 6.3% |
| Cosmetics (high) | 15,000 | 65% | 9,750 | 5.1% |
| Digital product | 8,000 | 95% | 7,600 | 6.6% |
| Higher-ticket | 100,000 | 30% | 30,000 | 1.7% |

**Findings**
- A flat per-order fee **does** create unfair outcomes. A low-AOV × low-margin reseller pays 67% of gross
  profit — unworkable; they churn back to Facebook DMs.
- A high-AOV seller pays 0.5% — money left on the table.
- 500 MMK is a **defensible anchor for the target segment** (fashion/cosmetics, AOV 15,000–30,000 → 1.7–3.3%).

**Recommendation:** keep 500 MMK as the target-segment anchor, but (a) explicitly position MiniShop for
AOV 10,000+ sellers, and (b) recapture value at the top via a lower effective per-order price on Business
(volume discount). Do **not** switch to a flat-% (GMV) model — with manual COD you cannot trust actual
collected GMV, and per-order metering is simpler and auditable.

---

## 2. Starter plan — 60 orders × 500 = 30,000 MMK

| Question | Answer |
|---|---|
| Too expensive? | Fine for an active seller (2.5% of GMV at 20k AOV). Expensive for a hobby seller (~3,000 MMK effective/order at 10 orders/mo) → churn risk. |
| Too cheap? | Cheap for a serious seller — 60 orders is **very low** for an active Myanmar social seller (a single campaign can burn it in days). |
| Sustainable? | Yes — healthy margin (§9). |
| Room for Business? | Yes — 30,000 → 60,000 gives 2× headroom. |
| Free→paid conversion? | Weak — see §3. |

**Core issue:** utilization mismatch. Sellers rarely hit exactly 60. Underuse makes 30,000 feel expensive;
overuse triggers extra-order purchases (good revenue, but a "nickel-and-dime" feeling).

**Options**
- **Keep:** 30,000 / 60 orders — simple, clear for the target segment.
- **Better for conversion:** lower base to 20,000–25,000 with ~50 included orders; recapture upside via
  extra orders + Business. Lets low-usage sellers in.

---

## 3. Free tier — 20 orders lifetime is a trial, not a free plan

- 20 lifetime orders can be consumed within days of go-live, before the seller feels the "aha" (real sales
  through the storefront). That's a trial dressed as a free plan.
- EasySell gives **60 orders/month forever free**. 20 lifetime is far tighter.

**Recommendation:** pick one honestly.
- **(a) Honest trial:** "30 orders or 14 days, whichever ends first" — call it a trial.
- **(b) True free tier:** 10–15 orders/month forever (branding forced) — widens funnel top; control
  free-rider infra cost via dormant-shop cleanup.

---

## 4. EasySell analysis (live data, 2026)

| Plan | Price/mo | Orders/mo | Overage |
|---|---|---|---|
| Free | $0 | **60** | — |
| Professional | $9.95 | 440 | $0.05/order |
| Advanced | $24.95 | 10,000 | $0.05/order |
| Unlimited | $59.95 | Unlimited | — |

**Key insight — EasySell gates almost no features.** Upsells, abandoned cart, WhatsApp/SMS, multi-currency,
fraud protection, analytics, Google Sheets are all in the **Free** plan. Tiers differ almost purely by
**order capacity**; feature differences are minor (form templates, live chat, partial payment, tax
settings). EasySell is essentially **pure usage-based (capacity) monetization**.

**What MiniShop should learn**
- Capacity as the primary revenue lever is simple, clear, and scales.
- `$0.05/order` overage is the single pay-as-you-go rail — no non-expiring credit liability; Shopify
  auto-bills it.
- Large tier gaps (440 → 10,000) reduce quota anxiety.

**What MiniShop should NOT copy**
- The feature-flat model. EasySell rides Shopify (theme, hosting, payments, catalog free), so it has little
  to gate. MiniShop **is** the whole storefront — remove-branding, custom domain, staff seats, analytics,
  integrations are legitimate differentiators it **should** use (§5).
- The `$0.05` (~225 MMK) overage — EasySell's marginal cost is near zero; MiniShop carries hosting/storage/
  support, so 500 MMK is justified.
- The overage auto-charge rail — impossible in Myanmar (no card rails), which is why prepaid is mandatory.

**Ecosystem difference:** EasySell can price low as an add-on because the merchant already pays Shopify
($29+/mo) and a payment gateway. MiniShop is the seller's **only** commerce infra, so its willingness-to-pay
ceiling is higher — but value must be made visible (it competes with "free" Facebook selling).

Sources: [EasySell Pricing](https://easysellapp.com/pages/pricing) ·
[EasySell on Shopify App Store](https://apps.shopify.com/easy-order-form)

---

## 5. Feature strategy — A vs B vs C, and full classification

### Differentiation model

| Model | Pros | Cons | Verdict |
|---|---|---|---|
| **A. Capacity only** | Simple, fair, clear upsell | Can't monetize high-value features; under-prices low-volume/high-value sellers | Insufficient |
| **B. Features only** | Captures willingness-to-pay | Doesn't cover capacity cost; heavy users under-priced; easy to over-gate essentials | Insufficient |
| **C. Hybrid** ✅ | Capacity covers infra; features capture value; two natural upgrade paths (volume **or** capability) | More complex | **Recommended** |

**Recommendation:** Hybrid, **capacity primary, features secondary**. Capacity ties to infra/support cost
(fair, defensible). Feature gates never touch essential commerce — only value-add + real-cost items.

### Feature classification

**Principle:** gate on **(value-add) AND (cost/opex)** — never on the essential ability to sell.

#### Tier 1 — CORE (every paid seller, incl. Starter)

| Feature | Why core | Cost |
|---|---|---|
| Storefront, product mgmt, cart/checkout, order mgmt | Required to sell | base |
| KBZPay/Wave/COD + **payment verification** | Payment = core; decided ≠ differentiator | ~0 (manual) |
| **Township shipping** | Decided core; core of Myanmar delivery | ~0 |
| **Unlimited products** (or high soft cap) | Catalog gating hurts success; rows are cheap | negligible |
| Store branding (logo/name) | Tenant identity; core on every plan | ~0 |
| Basic promotions + coupons | Baseline selling | ~0 |
| Buyer order notifications | Part of order flow | low |
| Basic inventory + low-stock **display** | Prevents overselling | ~0 |
| Basic + advanced analytics/dashboard | Current product decision: core on every plan | low |
| CSV order export | Data ownership; lock-in breaks trust | ~0 |

#### Tier 2 — GROWTH

| Feature | Tier | Why |
|---|---|---|
| Promotion **scheduling** | Business | Power feature, low cost |
| Premium/custom themes | Business or add-on | Cosmetic, high perceived value |
| **Remove MiniShop branding** | **Business** | ⭐ Classic upsell — ~0 cost, high perceived value, doesn't block sales |
| Abandoned-cart | Business | ⚠️ Feasibility: TikTok WebView has anon buyers + ephemeral storage — needs identity/contact. Verify before shipping |

#### Tier 3 — OPERATIONAL / BUSINESS

| Feature | Tier | Why |
|---|---|---|
| Advanced / customer / product analytics | All plans | Current product decision: analytics is core |
| Advanced dashboard | All plans | Current product decision: analytics is core |
| Bulk import / bulk edit | Business | Power feature, low cost |
| Low-stock **alerts** (notify) | Business | Uses notification infra (display is core) |
| Staff accounts / roles / multiple admins | Business (+ per-seat add-on) | Real value, meter per seat |
| Audit logs | Business | Ops/compliance |
| **Telegram notifications** (seller) | Business | ⭐ ~0 cost (free bot API) + high value in Myanmar |
| Email notifications (seller) | Business | Low SMTP cost |

#### Tier 4 — ADVANCED / SCALE

| Feature | Tier | Why |
|---|---|---|
| Webhooks | Business | Automation entry point |
| API access | Business top / dev add-on | Power/dev feature |
| **n8n integration** | Business or add-on | Automation; low cost (webhook-based) |
| Facebook/TikTok integration | Business or add-on | Channel sync; maintenance cost |
| External CRM integration | Business / add-on | Niche |
| Automation hooks | Business | Webhook family |

#### Tier 5 — ADD-ONS (metered / real marginal cost — not tied to a plan)

| Add-on | Why add-on | Pricing |
|---|---|---|
| **SMS integration** | ⭐ Real per-message telco cost — bundling destroys margin | Metered pass-through (per-message + margin) |
| Custom domain | DNS/cert/ops cost | Per-domain/mo (~15,000–20,000 MMK) |
| Extra staff seats | Marginal per-seat | Per-seat/mo |
| Premium theme pack | Discrete asset | One-time or subscription |
| Extra domains, heavy API/CRM | Niche/heavy | Metered |

**Priority/onboarding support:** Business + paid add-on (support is real opex; SLA-based upsell).
**Backup/export:** basic export = core; scheduled/automated backup = Business.

---

## 6. Non-expiring prepaid credit — risk audit

| Risk | Mitigation |
|---|---|
| **Stockpiling / price-hike arbitrage** ⚠️ (buy 1,000 orders before 500→700) | Per-purchase cap (~≤100) + max-balance cap (~≤3 months typical usage) |
| **Accounting liability** (indefinite deferred revenue; breakage unrecognizable) | Balance cap; 12–24 month dormancy expiry in ToS; report subscription MRR separately from credit sales |
| **Sub-gated consumption disputes** ⚠️ ("I paid, can't use it" → chargeback on manual rail) | Clear ToS + purchase-time consent; 30-day grace window after subscription lapse |
| **Duplicate payment / manual-verify fraud** | Idempotent crediting keyed to verified transfer ref; owner approval |
| **Account sharing / resale of balance** | D49 one-shop-per-owner + unique owner_id (partial) |
| **Refund complications** | Credits non-refundable (ToS); handled via downgrade persistence |
| **Downgrade** | Quantity-based → persist |
| **Free-tier abuse** (many emails → many free shops) | Owner verification; phone/light-KYC post-pilot |

**Repricing (500 → 700):** honouring **quantity** is correct — sellers buy order *units*, not money;
customer-friendly and clear. Real cost per credit (server/storage) is negligible, so honouring 100 orders
at any future price is not a real loss (only opportunity cost). The genuine leakage is **pre-hike bulk
buying**, which per-purchase and max-balance caps solve. So: honour quantity ✅ + caps ✅ + dormancy-expiry
ToS ✅ + soften sub-gated consumption with a grace window.

---

## 7. Mid-cycle plan changes — fairest model

### Upgrade (Starter → Business, mid-cycle): reset-on-upgrade with proration credit

| Item | Handling |
|---|---|
| Starter fee already paid | Prorate unused days → **credit to Business invoice** (not cash refund) |
| Billing cycle | **Reset** on upgrade date; new Business cycle begins |
| Starter monthly quota (unused) | **Forfeit** — monthly quota is use-it-or-lose-it (never rolls) |
| Already-consumed orders | Done; do not count against new Business quota |
| **Purchased extra credits** | **Unchanged — carry over (never expire)** ✅ |
| Business quota | Full Business allotment from upgrade date |
| Monetary credit | Unused Starter days applied to Business invoice |

Neither party is disadvantaged: no double-pay on unused Starter days; no monthly-rollover liability.

### Downgrade (Business → Starter)

- Takes effect **next billing cycle** (never immediate) — the seller is still using the Business
  quota/features they paid for.
- **Purchased extra credits always preserved** ✅ (quantity-based).
- Business-only data (promo schedule, staff, theme) preserved per D52 — reappears on re-upgrade.

---

## 8. Business plan — derived from scratch

Derive from seller behaviour + the Starter+extras crossover, not from a clean-looking number.

Starter cost (N orders/mo, N>60): `C = 30,000 + (N − 60) × 500`

| Monthly orders | Starter + extras |
|---|---|
| 60 | 30,000 |
| 100 | 50,000 |
| 120 | 60,000 ← crossover |
| 150 | 75,000 |
| 200 | 100,000 |

At Business = 60,000 MMK, Starter+extras equals 60,000 at 120 orders/mo — so Business must include **>120**
orders to be attractive at the crossover.

**Recommended Business (Balanced)**
- **60,000 MMK/mo, 150 included orders → 400 MMK/order effective** (below Starter's 500 marginal = built-in
  volume discount).
- Business extra orders: **400 MMK/order**.
- Crossover ~120 orders/mo makes upgrade rational without forcing it.
- **Non-capacity value that justifies Business:** staff seats, 2 staff seats,
  Telegram/email notifications, promo scheduling, bulk import/edit, webhooks/n8n, 1 custom domain, priority
  support. This lets a low-volume but feature-hungry seller choose Business on capability, not volume.

**Volume discount:** yes — the 400/order effective rate is the discount. A mild extra-order pack discount
(50-pack @ 22,500 = 450/order) can reinforce it.

**Keep Starter + extras available indefinitely?** ✅ Yes — no forced upgrade. Economics make the choice
self-evident (volume → Business; feature need → Business; low/variable usage → Starter + extras).

---

## 9. Unit economics model

> **Assumptions (no actual MiniShop cost data — model, not forecast):** 1 USD = 4,500 MMK; mix 75% Starter /
> 25% Business; blended ARPU ≈ 43,000 MMK (37,500 base + ~15% extras/add-ons); infra = Supabase Pro (~$25) +
> Vercel Pro (~$20) + image bandwidth, stepwise; support ≈ 1 staff (~600k MMK/mo) per 150–200 shops
> (~3,500 MMK/shop); maintenance/dev = fixed overhead.

| Shops | MRR (MMK) | ARR (MMK) | Infra | Support | Maint | Gross profit | Margin |
|---|---|---|---|---|---|---|---|
| 10 | 430,000 | 5.16M | 200k | 40k | 800k | **−610,000** | negative |
| 30 | 1,290,000 | 15.5M | 250k | 120k | 800k | +120,000 | ~9% |
| 50 | 2,150,000 | 25.8M | 300k | 200k | 800k | +850,000 | ~40% |
| 100 | 4,300,000 | 51.6M | 500k | 400k | 800k | +2,600,000 | ~60% |
| 300 | 12,900,000 | 154.8M | 1,200k | 1,200k | 1,200k | +9,300,000 | ~72% |
| 500 | 21,500,000 | 258M | 2,000k | 2,000k | 1,500k | +16,000,000 | ~74% |
| 1,000 | 43,000,000 | 516M | 4,000k | 3,600k | 2,000k | +33,400,000 | ~78% |

**Readings**
- **Break-even ≈ 28–30 paying shops** (at ~800k/mo fixed dev) — quantifies the pilot goal: the first ~30
  paying sellers are the existential milestone.
- **Heavy users:** high extra-order revenue but higher infra/support and, at high AOV, under-priced —
  attractive Business economics pull them into a better bucket.
- **Many low-usage sellers:** consume storage/bandwidth with little revenue — dormant-shop cleanup and a
  free-tier cap protect margin.
- **Non-expiring credit liability:** credit sales are cash-now/service-later — do **not** blend credit sales
  into MRR, or MRR will look inflated while liability persists through churn.

---

## 10. Three pricing architectures

> All prices MMK/month; credits are quantity-based, non-refundable, with a purchase cap.

### A. Conservative (margin-protect)

| | |
|---|---|
| Free | 20 orders lifetime; branding forced; 1 admin; catalog cap ~50; no integrations |
| Starter | **35,000 / 80 orders**; all Core; extra **500**/order (min 10, max balance 400); consume-monthly-first; usable only while subscribed (+30-day grace) |
| Business | **80,000 / 250 orders** (320/order); + remove branding, advanced analytics, 3 staff, webhooks/n8n, promo scheduling, bulk tools, Telegram, priority support; extra **400** |
| Add-ons | SMS metered; custom domain 20,000; extra seat 10,000 |
| Upgrade | Proration credit, cycle reset |
| Downgrade | Next cycle; credits preserved |
| Cancellation | Credits frozen (30-day grace), reactivate allowed |
| Renewal | Manual monthly prepay + dunning reminder |

*Best margin, slowest growth, high-value positioning.*

### B. Balanced ✅ (recommended default)

| | |
|---|---|
| Free | 30 orders lifetime **or** 15/mo forever (branding forced); high catalog cap |
| Starter | **30,000 / 60 orders**; all Core; extra **500** (50-pack @ 22,500; max balance 3-month) |
| Business | **60,000 / 150 orders** (400/order); + remove branding, advanced analytics, 2 staff, Telegram/email notif, promo scheduling, bulk import/edit, webhooks/n8n, 1 custom domain, priority support; extra **400** |
| Add-ons | SMS metered; extra staff seat; premium themes; extra domains; API/CRM |
| Upgrade | Proration credit, cycle reset, credits carry |
| Downgrade | Next cycle; credits + data preserved |
| Cancellation | Credits frozen + 30-day grace |
| Renewal | Manual monthly prepay; annual prepay discount 15–20% (fits Myanmar payment reality, cuts churn) |

*Balanced margin + growth + operational simplicity.*

### C. Aggressive growth (land-grab)

| | |
|---|---|
| Free | **60 orders/month forever** (EasySell-style); branding forced; Core features |
| Starter | **20,000 / 60 orders** (or pure PAYG: 0 base, 600/order); low barrier |
| Business | **50,000 / 200 orders** (250/order); all features + discounted add-ons; extra **350** |
| Extras | Bigger volume discounts; credits transfer freely; looser balance cap |
| Upgrade/Downgrade | Same fairness rules |
| Renewal | Manual + heavy annual-prepay push |

*Fastest adoption, thinnest margin, highest liability/abuse + free-rider exposure.*

### Feature placement across paid plans

| Bucket | Features |
|---|---|
| **All paid (Core)** | Storefront, unlimited products, cart/checkout, orders, KBZPay/Wave/COD + payment verification, township shipping, store branding, basic promos/coupons, buyer notifications, basic inventory, basic reports/analytics, CSV export |
| **Business-only** | Remove branding ⭐, advanced/customer/product analytics, staff+roles, promo scheduling, bulk import/edit, low-stock alerts, Telegram/email notif, webhooks/n8n, audit logs, priority support, 1 custom domain, premium themes |
| **Add-ons (metered)** | SMS ⭐ (pass-through), extra domains, extra staff seats, heavy API/CRM, FB/TikTok sync, onboarding support |

### Trade-off comparison

| Dimension | A Conservative | B Balanced | C Aggressive |
|---|---|---|---|
| Margin | highest | mid | lowest |
| Growth speed | slow | mid | fast |
| Free→paid conversion | weak | mid | strong |
| Ops complexity | low | mid | mid–high |
| Credit liability risk | low | mid | high |
| Abuse exposure | low | mid | high |
| Low-AOV seller fit | poor | mid | good |

**No single winner** (by request). Directionally: start with **B (Balanced)**, but pull the free tier
toward C's "15/mo forever" — subject to pilot data (D8).

---

## 11. Risks / questions not yet considered (novel)

1. **Billable-order definition** ⚠️⚠️ — `created` vs `checked` vs `completed`? Billing per created order
   against 30–50% RTO invites revolt. Bill only confirmed (`checked`) orders; exclude cancelled. The single
   most important decision.
2. **Subscription collection mechanics** ⚠️ — no auto-billing in Myanmar. Reconciling hundreds of manual
   transfers monthly is an operational bottleneck. Push annual prepay + prepaid credits to cut
   churn-by-neglect.
3. **Currency risk** ⚠️ — costs in USD, revenue in MMK. Kyat depreciation squeezes margin instantly. A
   per-order unit re-prices more easily than annual plans; consider USD-pegged internal accounting.
4. **Metering transparency/trust** — sellers need a real-time meter ("X monthly left, Y purchased left") and
   a consumption log, or disputes follow.
5. **Seasonality** — Thingyan/Thadingyut spikes blow through monthly quotas (extra-order revenue up, but
   support up and "gouging" perception up). Consider seasonal packs or limited rollover.
6. **Abandoned-cart feasibility** — TikTok WebView anon buyers + ephemeral storage need identity/contact to
   recover carts. Verify technical feasibility before listing it — avoid a fake capability.
7. **Value vs "free Facebook selling"** — the seller's alternative costs 0 MMK. Justify the per-order fee by
   making reduced DM workload, fewer checkout errors, and a professional storefront visible (ties directly
   to the pilot metrics in PROJECT.md).
8. **Stored-value regulatory** — non-expiring credit can be a regulated stored-value instrument in some
   jurisdictions. Low enforcement in Myanmar, but cover with ToS + dormancy expiry.
9. **Free-tier identity fraud** — owner_id uniqueness (D49) caps shops per owner, but one person with many
   emails = many free shops. Add phone/light-KYC post-pilot.
10. **Dispute recourse asymmetry** — manual rails have no chargeback protection (good) but also no recourse
    (bad). Keep an evidence trail (verified transfer ref, consumption log).

---

## 12. Recommendation framing (decision scaffold, not a verdict)

1. **Before tiers:** lock the billable-order definition and the subscription collection mechanic — both
   define the whole model more than tier prices do.
2. **Fix the codebase mismatch:** move township shipping + payment verification from Business-gated to Core.
3. **Adopt Hybrid (C): capacity primary, features secondary.** Gate only staff / integrations / support /
   staff / integrations / support (value + cost); never essential commerce.
4. **Default to Balanced (B)**; tune the free tier toward "15/mo forever"; Business = 60,000 / 150 orders
   (crossover-derived).
5. **Keep 500 MMK/order** as the target-segment anchor; Business's 400 effective is the volume discount;
   explicitly ignore the low-AOV segment.
6. **Non-expiring credit:** honour quantity ✅ + purchase/balance caps + dormancy-expiry ToS + grace-window
   softening of sub-gated consumption.
7. **Pilot metrics:** first ~30 paying shops = break-even; track extra-order attach rate, Starter→Business
   conversion, and billable-order dispute rate.
