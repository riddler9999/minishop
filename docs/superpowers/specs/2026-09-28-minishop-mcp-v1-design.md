# MiniShop MCP V1 Design

Date: 2026-09-28
Status: Approved design

## 1. Purpose

MiniShop will expose a seller-facing MCP server that can be connected to ChatGPT as a custom connector, similar to connecting an n8n instance. The connector is an agent-facing interface over MiniShop; it is not a second implementation of MiniShop business logic.

V1 is production-shaped from the start: seller authentication, tenant isolation, capability authorization, auditability, and concurrency protection are required even while initial end-to-end testing uses a single seller account.

## 2. Product Decisions

- Custom Connector first; no public connector-directory launch is required for V1.
- One MiniShop account maps to one shop in V1.
- Seller-facing MCP only. Superadmin tools are explicitly excluded.
- ChatGPT may edit Store Design, publish it, roll back the last published design, and edit approved storefront-facing Shop Profile fields.
- Products, Orders, Inventory, and Sales/Analytics are read-only in V1.
- Historical business data may be queried across the seller's available history. Server-side pagination, aggregation, and response-size limits remain mandatory.
- Seller commands may perform write and publish operations without a second MiniShop-specific confirmation when the seller explicitly requested the action.
- Preview is not a mandatory gate. Store Design still uses Draft/Published lifecycle internally.
- No Gemini or other MiniShop-hosted LLM is required. ChatGPT supplies the reasoning layer; MiniShop supplies MCP capabilities.
- Authentication uses Supabase OAuth 2.1 to avoid adding a separate MiniShop authorization server and its associated infrastructure/maintenance cost.

## 3. Architecture

Selected approach: MCP -> MiniShop application/domain services -> Supabase.

```text
ChatGPT Custom Connector
        |
        v
MiniShop MCP Endpoint
        |
        +-- Supabase OAuth token validation
        +-- MiniShop capability enforcement
        +-- seller-context resolution
        |
        v
MiniShop Application Services
   |             |                |
   v             v                v
StoreDesign   Shop Profile    Business Read Models
   |             |                |
   +-------------+----------------+
                 |
                 v
          Existing Supabase
```

MCP is an adapter/interface layer. Business rules must not be implemented independently inside MCP handlers. Existing domain/application behavior remains the source of truth and remains usable by the normal MiniShop Admin UI without MCP.

Do not expose generic database escape hatches such as `execute_sql`, `call_rpc`, `read_table`, `update_row`, or `delete_row`.

## 4. Existing StoreDesign Boundary

The existing StoreDesign model remains authoritative:

- versioned `StoreDesignDocument`
- `home`, `collection`, and `product` templates
- typed section settings
- `SECTION_REGISTRY` template/removable/hideable/product-source constraints
- Draft/Published/Previous Published lifecycle
- optimistic revision control
- owner-scoped seller RPCs

The MCP StoreDesign application service must reuse the lifecycle equivalent of:

- `loadOwnStoreDesign()`
- `saveDraft({ expectedRevision, document })`
- `publishDraft({ expectedDraftRevision })`
- `rollbackPublished()`

MCP must not directly mutate Store Design persistence tables.

## 5. Authentication and Authorization

### 5.1 User experience

ChatGPT Custom Connector -> Supabase OAuth authorization -> seller login -> authorize connection -> connector receives authorized access and refresh capability.

The desired UX is connection-based; sellers are not expected to copy/paste personal API keys.

### 5.2 Identity

Every MCP request derives identity from a validated Supabase access token. Request-supplied `user_id`, `owner_id`, or `shop_id` is never an authorization source.

V1 resolves:

```text
SellerContext {
  userId
  shopId
  capabilities
}
```

Because V1 is one account -> one shop, tools do not require a caller-selected shop ID. The server resolves the owned shop.

### 5.3 Token policy

Use Supabase OAuth 2.1 short-lived access tokens plus refresh-token rotation/revocation. Do not expose Supabase service-role credentials to ChatGPT. Secrets and authorization headers must not be logged.

### 5.4 MiniShop capabilities

Supabase OAuth custom protocol scopes are not required for V1. MiniShop enforces its own tool capabilities server-side after validating the Supabase identity. These capability names remain the stable MiniShop authorization vocabulary:

```text
store:read
store:write
store:publish
profile:read
profile:write
products:read
orders:read
inventory:read
analytics:read
```

Capabilities may be derived from a MiniShop grants table and/or trusted custom JWT claims. They are not treated as arbitrary caller-supplied fields. RLS remains a defense-in-depth tenant boundary.

Rollback requires `store:publish`, because it changes live storefront state. Future commerce mutations can add `products:write`, `orders:write`, and `inventory:write` without redesigning the MiniShop authorization vocabulary.

## 6. MCP V1 Tools

### 6.1 Store Design

- `get_store_design` — `store:read`
- `update_store_theme` — `store:write`
- `add_store_section` — `store:write`
- `update_store_section` — `store:write`
- `move_store_section` — `store:write`
- `remove_store_section` — `store:write`
- `publish_store` — `store:publish`
- `rollback_store_design` — `store:publish`

The LLM must not submit an arbitrary complete StoreDesign document as the normal mutation interface. Tools express bounded domain commands.

`add_store_section` accepts only registered section types supported by the target template. Defaults come from the existing StoreDesign registry. `update_store_section` accepts section-type-specific validated settings, not an unrestricted JSON patch.

`update_store_theme` is limited to StoreDesign-supported theme/global settings. Arbitrary CSS, JavaScript, or HTML is excluded.

`publish_store` remains a separate capability from Draft mutations even though ChatGPT may call mutation tools followed immediately by publish in response to one seller instruction.

`rollback_store_design` restores the existing Previous Published state. Full multi-version history is outside V1.

### 6.2 Shop Profile

- `get_shop_profile` — `profile:read`
- `update_shop_profile` — `profile:write`

Allowed writes are explicitly whitelisted storefront-facing profile fields such as shop name, logo, and supported basic public profile settings.

Explicitly excluded from profile writes:

- owner identity
- authentication/security settings
- owner email/account controls
- subscriptions/plans
- payment configuration
- privileged/admin flags

Logo belongs to Shop Profile, not StoreDesign, unless the core domain is intentionally changed in a later design.

### 6.3 Business reads

- `list_products` — `products:read`
- `get_product` — `products:read`
- `list_orders` — `orders:read`
- `get_order` — `orders:read`
- `get_inventory_summary` — `inventory:read`
- `list_low_stock_products` — `inventory:read`
- `get_sales_summary` — `analytics:read`
- `get_best_selling_products` — `analytics:read`

These are domain/query tools, not table readers. Large collections require pagination. Analytics should be aggregated server-side instead of sending raw order history to the model for calculation.

Historical queries may span the seller's available history, subject to query safety, pagination, aggregation, timeouts, and bounded response size.

## 7. Tool Results

Read results should provide useful result data plus an `asOf` timestamp and safe shop identity/label where useful.

Write results must explicitly report whether state changed and the resulting revisions where relevant, for example:

```text
changed
draftRevision
publishedRevision
storefrontUrl
```

The agent must not need to guess whether a mutation succeeded.

## 8. StoreDesign Write and Publish Semantics

Each mutation is atomic and optimistic-concurrency-aware.

Example sequence:

```text
load Draft revision 12
 -> update_store_theme / save expected revision 12
 -> Draft revision 13
 -> add_store_section / save expected revision 13
 -> Draft revision 14
 -> publish_store expected Draft revision 14
 -> Published updated
```

The MCP server/application service obtains and propagates revisions; the model must not invent revision values.

If another client changes the Draft concurrently, stale mutation/publish attempts fail with `STORE_DESIGN_CONFLICT`. Do not blind-overwrite or blind-retry. Reload the current lifecycle before reapplying user intent.

Validation layers are:

1. MCP input schema validation
2. StoreDesign domain/registry rules
3. StoreDesign publish validation

Draft mutation tools never secretly publish as a side effect. Publishing is always the explicit `publish_store` capability, even when the agent calls it immediately after a mutation.

If a multi-tool seller request partially fails before publish, successful Draft changes remain Draft; do not automatically invent compensating rollback behavior. Published buyer state remains unchanged until `publish_store` succeeds.

## 9. Business Read Semantics

All business reads are tenant-scoped from authenticated SellerContext.

Collection tools use bounded page sizes/cursors. Historical access does not mean unbounded response payloads.

Analytics calculations such as gross sales, order counts, average order value, paid/cancelled counts, and best-selling products should be computed server-side using MiniShop-defined business semantics. Results include `asOf` so the agent can communicate data freshness accurately.

## 10. Error Contract

Expose stable safe codes rather than raw database/provider errors:

```text
AUTH_REQUIRED
TOKEN_EXPIRED
INSUFFICIENT_SCOPE
SHOP_NOT_FOUND
STORE_DESIGN_CONFLICT
INVALID_SECTION
UNSUPPORTED_TEMPLATE
INVALID_PRODUCT_SOURCE
PUBLISH_VALIDATION_FAILED
INVALID_DATE_RANGE
INVALID_CURSOR
RESOURCE_NOT_FOUND
RATE_LIMITED
INTERNAL_ERROR
```

`INSUFFICIENT_SCOPE` is retained as a stable external MiniShop error code for compatibility/readability even though V1 permissions are MiniShop capabilities rather than Supabase custom OAuth scopes.

Suggested HTTP semantics where applicable:

- 401 invalid/expired authentication
- 403 insufficient capability
- 404 seller resource/shop missing
- 409 StoreDesign revision conflict
- 422 domain validation failure

Internal errors receive a request/correlation ID. Do not return raw SQL, service-role information, OAuth secrets, or sensitive internals.

## 11. Audit and Observability

Every MCP request receives a request ID. Operational metrics should include tool name, latency, success/failure, and safe error code.

Do not log:

- access or refresh tokens
- authorization headers
- Supabase service credentials
- full ChatGPT prompts by default
- unnecessary customer/order payloads

State-changing MCP operations create an audit record containing at least:

```text
actor_user_id
shop_id
mcp_tool
action
before_revision (where applicable)
after_revision (where applicable)
timestamp
request_id
```

This applies to Store Design mutations, publish, rollback, and Shop Profile changes.

Rate limits are seller/user-aware. Historical analytics may query broad date ranges, but execution cost, pagination, aggregation, and response-size limits are enforced server-side.

## 12. Testing Strategy

### 12.1 Domain tests

Test StoreDesign commands independently of MCP:

- theme update
- add/update/move/remove section
- invalid section type
- unsupported template
- non-removable section
- duplicate section IDs
- invalid product source
- normalization/publish validation

Existing StoreDesign registry remains the rules source.

### 12.2 Auth and tenant security tests

Merge-blocking cases:

- Seller A token can access Seller A shop
- Seller A cannot access Seller B resources
- unauthenticated requests are denied
- expired/revoked tokens are denied
- missing MiniShop capabilities are denied
- `products:read` cannot mutate Store Design
- `store:write` cannot publish/rollback
- fake request `shop_id` cannot switch tenant
- Superadmin capabilities do not exist in seller MCP
- secrets/tokens do not leak through errors/logs

### 12.3 MCP contract and end-to-end tests

Storefront flow:

```text
connect/authenticate
 -> get_shop_profile
 -> get_store_design
 -> update theme
 -> add section
 -> publish
 -> buyer storefront reflects Published state
 -> rollback
 -> buyer storefront reflects previous Published state
```

Read flow covers Products, Orders, Inventory, historical Sales/Analytics, pagination, empty states, date filters, and large-dataset response limits.

Existing StoreDesign API, RLS contract, and database-runtime tests remain in place.

### 12.4 CI gates

Before merge:

```text
typecheck
 -> unit/domain tests
 -> MCP contract tests
 -> auth/security tests
 -> existing StoreDesign tests
 -> production build
```

All gates must pass.

## 13. Deployment and Rollout

V1 remains within the MiniShop deployment boundary rather than creating a separate MCP repository/service. MCP transport, authorization, application adapters, and domain/query services must nevertheless be isolated modules with clear interfaces so the MCP service can be extracted later without changing domain contracts.

Rollout order:

1. local/test environment
2. Preview deployment
3. ChatGPT Custom Connector E2E with the initial MiniShop seller account
4. dedicated second seller tenant-isolation verification
5. Production deployment

Production smoke verification covers MCP endpoint/discovery, authorization flow, authenticated read, Draft mutation, publish, and buyer storefront read. Use dedicated test seller data for state-changing production verification.

## 14. Explicit V1 Non-Goals

- MiniShop-hosted Gemini/LLM inference
- custom MiniShop OAuth Authorization Server
- public ChatGPT connector-directory launch
- Superadmin MCP tools
- product/order/inventory writes
- generic SQL/RPC/table tools
- arbitrary HTML/CSS/JavaScript generation
- mandatory Preview gate
- full StoreDesign version history
- multi-shop account selection
- separate MCP microservice/repository

## 15. Success Criteria

V1 is successful when a seller can connect MiniShop to ChatGPT as a custom connector, authenticate securely through Supabase OAuth, and have ChatGPT:

1. read the seller's Store Design and public Shop Profile;
2. change supported theme/section/profile settings without escaping domain rules;
3. publish those Store Design changes to the live buyer storefront;
4. roll back to the previous Published Store Design;
5. read the seller's Products, Orders, Inventory, and historical Sales/Analytics;
6. never cross tenant boundaries or gain Superadmin/commerce-write capabilities;
7. preserve existing MiniShop Admin and StoreDesign behavior outside MCP.
