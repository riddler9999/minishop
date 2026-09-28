# MiniShop MCP V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a seller-facing MiniShop MCP V1 endpoint for ChatGPT Custom Connector that authenticates with Supabase OAuth tokens, resolves one owned shop server-side, enforces MiniShop capabilities, reuses StoreDesign lifecycle services, exposes whitelisted Shop Profile writes and bounded business reads, and preserves tenant isolation.

**Architecture:** MCP is an adapter layer inside the existing MiniShop Vercel API boundary. `api/mcp.ts` parses JSON-RPC/MCP requests and delegates to focused modules under `api/mcp/`; authentication validates the bearer token using Supabase Auth, creates a user-scoped Supabase client carrying that token so existing RLS remains active, resolves the seller-owned shop from `owner_id = auth.uid()`, then applies MiniShop capability checks before calling StoreDesign/profile/read-model services. StoreDesign mutations use the existing owner-scoped lifecycle RPCs only; no direct StoreDesign table writes and no service-role client are used by seller MCP.

**Tech Stack:** Node >=22, TypeScript, Vercel serverless API handlers, `@supabase/supabase-js`, Zod, native `node:test`.

**Spec:** `docs/superpowers/specs/2026-09-28-minishop-mcp-v1-design.md`

## Global Constraints

- Supabase OAuth 2.1 is the auth provider; MiniShop capabilities are server-side authorization vocabulary, not OAuth protocol scopes.
- Never trust request `shop_id`, `owner_id`, or `user_id` for authorization.
- One authenticated MiniShop seller account resolves to one owned shop in V1.
- Do not add or modify Superadmin MCP functionality.
- Do not expose generic SQL/RPC/table tools or arbitrary HTML/CSS/JavaScript.
- Do not use MiniShop-hosted Gemini/OpenAI inference.
- StoreDesign writes must preserve Draft/Published/Previous Published lifecycle, optimistic revision control, registry/template constraints, normalization and seller RPC boundaries.
- Draft mutations never publish; publish and rollback require `store:publish`.
- Stable safe external errors: AUTH_REQUIRED, TOKEN_EXPIRED, INSUFFICIENT_SCOPE, SHOP_NOT_FOUND, STORE_DESIGN_CONFLICT, INVALID_SECTION, UNSUPPORTED_TEMPLATE, INVALID_PRODUCT_SOURCE, PUBLISH_VALIDATION_FAILED, INVALID_DATE_RANGE, INVALID_CURSOR, RESOURCE_NOT_FOUND, RATE_LIMITED, INTERNAL_ERROR.
- Never expose/log service-role keys, access/refresh tokens, Authorization headers, raw SQL/database errors or unnecessary customer/order payloads.
- Every MCP request gets a request ID; state-changing tools write audit records with actor_user_id, shop_id, mcp_tool, action, before_revision, after_revision, timestamp and request_id.
- Collection reads are paginated and bounded; analytics are server-side aggregations.
- Stop before merge/deployment.

## Review Focus

- Bearer token failure classification: missing token must map to AUTH_REQUIRED while rejected/expired token maps to TOKEN_EXPIRED without leaking provider detail; covered in Task 2.
- Tenant spoofing: tool arguments containing `shop_id`, `owner_id`, or `user_id` must not alter SellerContext; covered in Tasks 2 and 7.
- StoreDesign mutation validation must reject unsupported templates/section types and protected-section removal before persistence; covered in Task 3.
- Business read cursors/date windows/limits must reject malformed or unbounded inputs instead of degrading to broad queries; covered in Task 5.
- Error/log redaction must preserve request_id while removing bearer tokens, Authorization values and raw DB errors; covered in Tasks 1, 2 and 6.

---

### Task 1: MCP contract primitives, safe errors, request IDs and audit interface

**Files:**
- Create: `api/mcp/contracts.ts`
- Create: `api/mcp/errors.ts`
- Create: `api/mcp/observability.ts`
- Create: `tests/mcp-contract-primitives.test.ts`

**Interfaces:**
- Produces `MiniShopCapability`, `SellerContext`, tool name unions and JSON-RPC/MCP result shapes.
- Produces `McpError(code, status, message, requestId?)`, `toSafeMcpError(error, requestId)`, `createRequestId()`, `AuditSink.record(entry)`.
- No Supabase/database dependency.

- [ ] **Step 1: Write failing tests** for the exact capability vocabulary, absence of any Superadmin capability/tool name, stable error-code mapping/redaction, and request-id generation.
- [ ] **Step 2: Run RED:** `node --import ./tests/register-source-resolver.mjs --experimental-strip-types --test tests/mcp-contract-primitives.test.ts`; expect module-not-found/failing contract assertions.
- [ ] **Step 3: Implement minimum primitives** in the three files, with no logging of request bodies/prompts/tokens.
- [ ] **Step 4: Run GREEN** with the same command; expect PASS.
- [ ] **Step 5: Commit:** `feat: add MiniShop MCP contract primitives`.

### Task 2: Supabase seller authentication, user-scoped client, shop resolution and capability enforcement

**Files:**
- Create: `api/mcp/auth.ts`
- Create: `api/mcp/capabilities.ts`
- Create: `tests/mcp-auth-security.test.ts`
- Modify: `api/_env.ts` only if a shared public Supabase env helper is required; do not touch `api/_superadmin.ts`.

**Interfaces:**
- Consumes Task 1 `SellerContext`, `MiniShopCapability`, `McpError`.
- Produces `authenticateSeller(req, deps?): Promise<{context: SellerContext; supabase: SupabaseClient}>`.
- Produces `requireCapability(context, capability): void`.
- Capability source is trusted server data/claims only. V1 default implementation may map authenticated seller accounts to the fixed seller-capability set defined by config until a grants table exists, but callers can never supply capabilities.

- [ ] **Step 1: Write failing tests**: unauthenticated denied AUTH_REQUIRED; invalid/expired denied TOKEN_EXPIRED; own seller resolves own shop; Seller A cannot resolve Seller B; fake `shop_id` input has no effect; missing capability denied INSUFFICIENT_SCOPE; `store:write` cannot publish; `products:read` cannot mutate StoreDesign; no Superadmin capability exists; Authorization header/token never appears in error/log capture.
- [ ] **Step 2: Run RED:** focused auth test command; expect missing implementation.
- [ ] **Step 3: Implement authentication** using Supabase anon/public key + `auth.getUser(token)`, then create a second Supabase client with `global.headers.Authorization = Bearer <token>` so all subsequent data/RPC calls execute as that seller under RLS. Resolve shop by `shops.owner_id = validated user.id`. Do not instantiate service-role client.
- [ ] **Step 4: Run GREEN** focused auth/security suite.
- [ ] **Step 5: Commit:** `feat: add MCP seller authentication and capabilities`.

### Task 3: StoreDesign MCP application commands

**Files:**
- Create: `api/mcp/store-design.ts`
- Create: `tests/mcp-store-design.test.ts`
- Reuse without bypassing: `src/features/shop/api/storeDesignAdapter.ts`, `src/domain/storeDesign/*`.

**Interfaces:**
- Consumes Task 2 authenticated user-scoped Supabase client and capability enforcement.
- Produces handlers: `getStoreDesign`, `updateStoreTheme`, `addStoreSection`, `updateStoreSection`, `moveStoreSection`, `removeStoreSection`, `publishStore`, `rollbackStoreDesign`.
- Every mutation loads current lifecycle, derives `expectedRevision` server-side, applies one bounded command to a copy of Draft, validates via registry/domain normalization, then calls existing lifecycle adapter `saveDraft`. Publish loads lifecycle and calls `publishDraft({expectedDraftRevision})`; rollback calls `rollbackPublished()`.
- Tool inputs do not accept caller revision as authority and do not accept complete unrestricted StoreDesign documents.

- [ ] **Step 1: Write failing tests** covering current design read; theme update; registered section add; invalid section; unsupported template; typed section settings validation; move; reject non-removable removal; stale revision maps STORE_DESIGN_CONFLICT; publish current Draft; rollback Previous Published; Draft mutation does not publish; invalid product source maps INVALID_PRODUCT_SOURCE; publish validation maps PUBLISH_VALIDATION_FAILED.
- [ ] **Step 2: Run RED** focused StoreDesign MCP test.
- [ ] **Step 3: Implement bounded commands** using `SECTION_REGISTRY`, `defaultSectionSettings`, `supportsTemplate`, `createThemeDraft`, `normalizeStoreDesign`, `validatePublishableStoreDesign` and `createStoreDesignLifecycleAdapter`.
- [ ] **Step 4: Run GREEN** focused StoreDesign MCP test plus existing `tests/storeDesignDomain.test.ts tests/storeDesignApi.test.ts`.
- [ ] **Step 5: Commit:** `feat: expose StoreDesign MCP commands`.

### Task 4: Shop Profile read/write service

**Files:**
- Create: `api/mcp/shop-profile.ts`
- Create: `tests/mcp-shop-profile.test.ts`

**Interfaces:**
- Consumes authenticated `SellerContext.shopId` and user-scoped Supabase client.
- Produces `getShopProfile()` and `updateShopProfile(input)`.
- Writable allowlist: `name`, `phone`, `logoUrl`, `defaultDeliveryFee`, `originRegion`, `originTownship`, `deliveryService` only.
- Never write owner_id, slug, plan, is_active, subscription/payment/security/admin fields.

- [ ] **Step 1: Write failing tests** for own-profile read, allowed-field update, and rejection of owner/account/payment/subscription/plan/admin/slug/is_active fields.
- [ ] **Step 2: Run RED** focused profile test.
- [ ] **Step 3: Implement read/write allowlist** with explicit DB column mapping and `.eq('id', context.shopId)`.
- [ ] **Step 4: Run GREEN** focused profile test.
- [ ] **Step 5: Commit:** `feat: add MCP shop profile tools`.

### Task 5: Bounded products, orders, inventory and analytics read models

**Files:**
- Create: `api/mcp/read-models.ts`
- Create: `api/mcp/pagination.ts`
- Create: `tests/mcp-business-reads.test.ts`

**Interfaces:**
- Produces `listProducts`, `getProduct`, `listOrders`, `getOrder`, `getInventorySummary`, `listLowStockProducts`, `getSalesSummary`, `getBestSellingProducts`.
- Every DB query includes `shop_id = context.shopId` even though RLS also applies.
- Cursor is opaque base64url JSON containing stable sort key + id and is validated before use; page size default 25, max 100.
- Order detail returns the minimum fields needed for seller operations; do not return payment proof internals or unrelated customer/account data.
- Date range accepts ISO dates/timestamps, start <= end, with an explicit maximum span of 366 days per request; historical access is achieved by repeated bounded queries, not an unbounded payload.
- Aggregation uses orders/order_items server-side queries and excludes `is_test = true` and `is_duplicate = true`; results include `asOf`.

- [ ] **Step 1: Write failing tests** for products/orders tenant filters, pagination/cursors, empty pages, bounded page sizes, get-not-found RESOURCE_NOT_FOUND, inventory summary, low stock threshold, valid historical ranges, invalid/reversed/>366-day ranges, sales totals/order counts/AOV by defined statuses, best-selling aggregation, and bounded result size.
- [ ] **Step 2: Run RED** focused business-read test.
- [ ] **Step 3: Implement query services** with explicit selects, stable ordering and safe mapped DTOs; no generic table/RPC escape hatch.
- [ ] **Step 4: Run GREEN** focused business-read test.
- [ ] **Step 5: Commit:** `feat: add MCP business read models`.

### Task 6: Audit persistence and seller-aware rate limiting

**Files:**
- Create: `supabase/migrations/0025_minishop_mcp_audit.sql`
- Create: `api/mcp/audit.ts`
- Create: `api/mcp/rate-limit.ts`
- Create: `tests/mcp-audit-security.test.ts`
- Modify: `src/core/supabase/database.types.ts` only to reflect the new audit table if required by checked-in types.

**Interfaces:**
- Audit table is insert-only from authenticated server request path, stores actor_user_id, shop_id, mcp_tool, action, before_revision, after_revision, request_id, created_at; no prompt/token/body columns.
- `createAuditSink(supabase, context)` writes audit records without service role.
- `checkRateLimit(context, toolName)` uses bounded in-process/serverless-safe policy for V1 or a DB-backed function if needed; failure maps RATE_LIMITED.

- [ ] **Step 1: Write failing tests** proving mutation audit shape, omission of tokens/prompts/Authorization/raw payloads, request ID presence, and RATE_LIMITED mapping.
- [ ] **Step 2: Run RED** focused audit/security test.
- [ ] **Step 3: Implement migration + audit/rate-limit adapters** with RLS/ownership rules and no Superadmin changes.
- [ ] **Step 4: Run GREEN** focused test plus any migration contract test added here.
- [ ] **Step 5: Commit:** `feat: add MCP audit and rate limiting`.

### Task 7: MCP JSON-RPC endpoint and tool registry

**Files:**
- Create: `api/mcp.ts`
- Create: `api/mcp/tool-registry.ts`
- Create: `tests/mcp-endpoint-contract.test.ts`

**Interfaces:**
- HTTP endpoint supports MCP/JSON-RPC initialize, tools/list and tools/call sufficient for ChatGPT Custom Connector.
- Tool registry exposes exactly the 18 approved seller tools and their JSON schemas/capabilities; no Superadmin or generic SQL/RPC/table tools.
- Each request: create request ID -> authenticate -> parse MCP method -> for tools/call enforce tool capability -> rate-limit -> execute service -> audit state change -> return safe result/error.
- Unknown tool/method returns safe protocol error without database/provider detail.

- [ ] **Step 1: Write failing contract tests** for initialize/tools/list/tools/call; exact 18 names; unauthenticated request; capability failure; fake tenant identifiers ignored/rejected as tool args; `store:write` cannot publish; `products:read` cannot mutate; safe errors include request_id.
- [ ] **Step 2: Run RED** focused endpoint test.
- [ ] **Step 3: Implement endpoint and registry** using existing `sendJson` security headers and Zod schemas.
- [ ] **Step 4: Run GREEN** focused endpoint + auth + tool-service tests.
- [ ] **Step 5: Commit:** `feat: add seller MCP endpoint`.

### Task 8: End-to-end MCP lifecycle contract

**Files:**
- Create: `tests/mcp-e2e.test.ts`
- Modify only test fakes/helpers required by the test; no production redesign.

**Interfaces:**
- Exercises registry/dispatcher with an authenticated Seller A fixture and buyer Published-state fixture.

- [ ] **Step 1: Write failing E2E test:** authenticate -> get_shop_profile -> get_store_design -> update_store_theme -> add_store_section -> publish_store -> buyer Published state reflects change -> rollback_store_design -> buyer Published state returns to Previous Published.
- [ ] **Step 2: Run RED** and verify expected first unsupported/missing behavior.
- [ ] **Step 3: Make only the minimum integration fixes** required across existing Task 1-7 code; every behavior fix gets its own failing assertion first.
- [ ] **Step 4: Run GREEN** E2E plus all MCP tests.
- [ ] **Step 5: Commit:** `test: add MiniShop MCP end-to-end contract`.

### Task 9: Full verification and whole-branch review

**Files:**
- Modify only files required by findings; every Critical/Important fix must start with a failing regression test.

**Interfaces:**
- No new product scope.

- [ ] **Step 1: Run repository gates:** `npm run lint`, `npm test`, `npm run build`. Also run explicit MCP/auth/StoreDesign focused tests if the full test glob does not include any newly split helper.
- [ ] **Step 2: Verify security invariants from tests:** Seller A own-only, Seller B inaccessible, fake tenant ids ineffective, no service-role use in seller MCP, no Superadmin tool, no raw DB/token leakage.
- [ ] **Step 3: Whole-branch review** against current main + approved spec. Classify findings Critical/Important/Minor.
- [ ] **Step 4: Fix all Critical/Important findings using RED -> GREEN**, then rerun full `npm run check`.
- [ ] **Step 5: Report branch/head SHA, completed tasks, exact changed files, test/check results, tenant-isolation evidence, remaining/deferred findings, and merge readiness. Do not merge or deploy.**
