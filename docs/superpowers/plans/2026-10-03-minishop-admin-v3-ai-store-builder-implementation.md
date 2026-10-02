# MiniShop Admin V3 + AI Store Builder Implementation Plan

**Status:** Proposed implementation plan
**Date:** 2026-10-03
**Repository baseline:** main @ `24c4ae0242d475780432e00a3ce1c2e527d2f49b`
**Scope:** Seller Admin Dashboard design-system consolidation + AI-first Store Builder
**Admin language:** English only

## 1. Product decision

MiniShop will move from a control-heavy Store Builder toward an **AI-first, visual-assisted Store Builder**.

The seller can:
- describe a desired storefront in chat,
- upload an image to the AI conversation and ask MiniShop to place/use it,
- ask for section/layout/theme changes in natural language,
- preview every AI change as Draft,
- manually fine-tune critical visual controls,
- explicitly Publish only after review.

The AI never writes arbitrary React/HTML/CSS into production and never writes directly to database tables. It produces typed, schema-valid editor commands that execute through the existing Store Design domain and lifecycle.

The normal Admin Dashboard remains an operational commerce workspace. It does not use Burmese copy.

## 2. Non-negotiable constraints

- Admin Dashboard and admin chrome use **English only**.
- One design system only. No page-specific visual language, duplicate token family, second component library, or one-off visual system.
- Preserve current Supabase auth, RLS, tenant isolation, checkout/order semantics, inventory, billing, financial idempotency, Store Design Draft/Published lifecycle, and shared catalog renderer.
- AI is a command/orchestration layer over the Store Design domain, not a replacement renderer.
- AI changes Draft only. AI cannot Publish automatically.
- AI cannot change protected commerce invariants such as Product Detail Buy Now visibility.
- Uploaded media must be tenant-owned and server-authorized.
- BYOK provider secrets are server-side only and never returned after save.
- No arbitrary custom provider URL in V1.
- No arbitrary HTML/JS generation.
- No production deployment, migration, or merge as part of this planning document.

## 3. Canonical design system

Use one admin/editor system based on the already-approved Admin V2 amendment.

### Core tokens

- Sidebar / Ink: `#1F1633`
- Primary Plum: `#6D28D9`
- Primary Hover: `#5B21B6`
- Lavender: `#C4B5FD`
- Selected Surface: `#EDE9FE`
- App Canvas: `#FAF7FF`
- Surface: `#FFFFFF`
- Secondary Text: `#756B86`
- Border: `#E7DFF2`

Semantic success/warning/error/info remain independent roles and must not reuse Plum as meaning.

### Typography

- Page title: 24/32, 700
- KPI: 24/32, 700
- Section heading: 18/28, 600
- Body/navigation: 14/22, 400–500
- Secondary: 13/20
- Metadata: 12/18 minimum

Admin UI copy is English. Buyer storefront localization remains independent.

### Spacing and interaction

- Mobile page padding: 16px
- Desktop page padding: 24px
- Section gap: 24px
- Card gap: 12–16px
- Card padding: 16px mobile / 20px desktop
- Form gap: 16px
- Minimum interactive target: 44px
- Radius family: 8–12px for admin/editor chrome
- Motion: restrained 150–220ms, reduced-motion respected

## 4. Admin Dashboard V3

Dashboard remains action-first, not chart-first.

### Required information architecture

Primary navigation:
1. Dashboard
2. Orders
3. Products
4. Customers
5. Store
   - AI Store Builder
   - Themes
   - Navigation
   - Domains
   - Policies
6. Marketing
7. Analytics
8. Settings
9. Billing

### Dashboard composition

1. Page header + compact global actions
2. KPI row: Sales, Orders, Pending Orders, Customers
3. Action Required
4. Recent Orders
5. Low Stock
6. Sales Overview
7. Orders by Status
8. Store Setup only when incomplete

Rules:
- no fake trends,
- no fake comparison percentages,
- no decorative charts without authoritative data,
- error/loading/empty states use shared primitives,
- mobile uses drawer navigation, never bottom tabs.

## 5. AI Store Builder UX

### Desktop

Use a focused full-screen editor:

- Left rail: AI conversation + media attachments
- Center: live storefront preview using the real shared renderer
- Right rail: selected section quick controls / change summary
- Top toolbar: Back, Page, Desktop/Mobile, Undo/Redo, Draft state, Preview, Publish

The old three-pane section-tree-first interaction becomes secondary. Section tree remains available under an explicit "Sections" view, but the default entry is AI conversation + preview.

### Mobile

Preview-first:
- preview is the main surface,
- AI chat opens in a bottom sheet/full-height sheet,
- tap a section to select it,
- quick edit sheet exposes Replace Image, Crop/Position, Text, Layout,
- Sections is a separate drawer,
- Publish and save state stay reachable.

## 6. AI interaction model

Examples:

- "Create a clean women fashion store using soft lavender and off-white."
- "Use this image as the hero image and keep the model visible on mobile."
- "Move Best Selling above New Arrivals."
- "Make the hero shorter and align the text left."
- "Use these 6 products in Featured Products."

The AI returns **typed editor commands**, never raw UI code.

Conceptual commands:

```ts
type AiStoreCommand =
  | {type: 'update_section'; template: StoreTemplateName; sectionId: string; patch: SectionPatch}
  | {type: 'add_section'; template: StoreTemplateName; sectionType: StoreSectionType; afterSectionId?: string}
  | {type: 'remove_section'; template: StoreTemplateName; sectionId: string}
  | {type: 'move_section'; template: StoreTemplateName; sectionId: string; afterSectionId?: string}
  | {type: 'set_section_enabled'; template: StoreTemplateName; sectionId: string; enabled: boolean}
  | {type: 'set_theme'; themeId: ThemePresetId}
  | {type: 'set_global_settings'; patch: GlobalThemeSettingsPatch}
  | {type: 'attach_media'; template: StoreTemplateName; sectionId: string; field: 'imageUrl'; mediaId: string};
```

All commands:
1. validate against the current schema,
2. enforce registry capabilities,
3. enforce protected commerce invariants,
4. apply only to local Draft state,
5. enter the existing autosave lifecycle,
6. are reversible by editor history before Publish.

## 7. Image upload and media flow

User should be able to upload a picture directly in AI chat and say "Use this as the hero image."

Flow:

1. Browser requests an authorized media upload.
2. File uploads to tenant-scoped storage.
3. Backend creates a media record with owner/shop, MIME type, dimensions, size, checksum, storage path.
4. AI receives a safe media descriptor / media ID, not a storage secret.
5. If the model supports vision and analysis is needed, backend sends a signed/controlled image input to the provider.
6. AI emits `attach_media` or a section update command.
7. Store Design resolves media ID to a safe public/delivery URL.
8. Draft preview updates immediately.
9. User can Replace, Remove, Crop/Position, or Undo.
10. Publish stays explicit.

V1 media rules:
- JPEG, PNG, WebP
- validate MIME from bytes, not filename only
- size limit defined centrally
- strip unneeded metadata where processing pipeline supports it
- tenant-scoped ownership
- orphan cleanup job
- no SVG upload in V1
- no remote URL import in V1

## 8. Vision vs non-vision models

Vision is optional per request.

If user says:
- "Put this image in Hero" -> vision is not required; attach the media.
- "Use the image colors for the whole store" -> vision-capable model required.
- "Keep the person visible on mobile crop" -> vision or image metadata/subject-detection capability is useful.

Provider capability metadata must distinguish:
- text
- structured output
- tool/function calling
- vision
- max input constraints

The UI disables or explains requests that require unavailable model capability.

## 9. BYOK AI settings

Add `Settings → AI`.

Supported V1 provider strategy:
- curated providers only,
- provider + model + encrypted API key,
- Test Connection,
- Replace Key,
- Remove Key,
- capability detection/allowlist.

Do not expose the stored key after save.

Conceptual server interface:

```ts
saveAiCredential(input: {
  provider: AiProviderId;
  apiKey: string;
}): Promise<{provider: AiProviderId; connected: true}>

testAiCredential(input: {
  provider: AiProviderId;
  apiKey?: string;
}): Promise<AiConnectionTestResult>

generateStoreEdit(input: {
  conversationId: string;
  message: string;
  mediaIds: string[];
  expectedDraftRevision: number;
}): Promise<AiStoreEditProposal>
```

The provider key is decrypted only in the server-side AI gateway for the request.

V1 does not permit arbitrary base URLs/endpoints.

## 10. AI Gateway

Create a deep module with narrow interfaces.

Responsibilities:
- provider abstraction,
- BYOK credential lookup/decryption,
- model capability registry,
- request timeouts,
- structured-output validation,
- tool/command schema,
- token/request usage telemetry,
- provider error normalization,
- retry only where safe,
- prompt injection resistance at tool boundary.

The AI gateway does **not** own:
- Store Design persistence,
- tenant authorization,
- Publish,
- product pricing,
- inventory,
- order state.

## 11. AI proposal model

Do not silently execute multi-action changes.

For each AI turn:
- user message,
- AI summary,
- proposed command batch,
- visual preview applied to local Draft,
- concise "Changes" panel.

Small edits may auto-apply to local Draft preview.
Risky/destructive operations such as removing multiple sections require explicit Apply confirmation.

No AI action can auto-Publish.

## 12. Security

### BYOK
- envelope encryption or equivalent server-side secret encryption,
- key never reaches browser after initial submission,
- key never logged,
- secrets redacted from errors,
- per-tenant access checks,
- rotate/replace/delete support.

### AI tools
- server validates every command,
- never trust model-generated IDs without ownership/existence validation,
- command allowlist only,
- no raw SQL,
- no arbitrary HTTP fetch,
- no arbitrary filesystem/code execution,
- no direct Publish tool,
- no protected commerce mutation.

### Media
- owner-scoped storage path,
- RLS / server authorization,
- MIME/size validation,
- safe delivery URL,
- no cross-tenant media references.

## 13. Data model changes

Prefer additive tables:

```text
ai_provider_credentials
- id
- owner_id / shop_id
- provider
- encrypted_secret
- key_version
- created_at
- updated_at

ai_store_conversations
- id
- shop_id
- template
- created_at
- updated_at

ai_store_messages
- id
- conversation_id
- role
- content
- metadata
- created_at

store_media
- id
- shop_id
- storage_path
- mime_type
- width
- height
- byte_size
- checksum
- created_at
```

Whether credentials bind to owner or shop should follow existing account/shop invariant; prefer the narrowest ownership model already enforced by current admin architecture.

AI conversation history can be pruned/retained independently from Store Design history.

## 14. Delivery phases

### Phase 0 — Audit and contract reconciliation
- Audit main @ `24c4ae0`.
- Reconcile current `DESIGN.md` conflict: it still states Burmese-default seller/admin copy, while the approved Admin V2 spec is English-first.
- Document one canonical admin/editor design system.
- Identify all hard-coded admin/editor colors bypassing semantic tokens.
- Confirm existing Store Design APIs and renderer boundaries.

**Gate:** docs and architecture agree before implementation.

### Phase 1 — Design system consolidation
- Move Admin + Store Builder chrome to semantic `--admin-*` / editor tokens.
- Remove hard-coded hex values from reusable admin/editor components where practical.
- Keep storefront theme tokens isolated.
- Enforce English-only admin/editor chrome copy.
- Add token-scope and copy regression tests.

**Gate:** Dashboard + current builder visually use one system; storefront remains unchanged.

### Phase 2 — Media foundation
- Add tenant-safe media domain and upload path.
- Add storage policy/RLS/server authorization.
- Add media picker/attachment component.
- Add Hero and Image+Text typed media controls.
- Fix current missing Hero/Image+Text image editing gap.

**Gate:** user can upload, attach, replace, remove image manually before AI is involved.

### Phase 3 — AI provider/BYOK foundation
- AI Settings page.
- encrypted credential storage.
- provider/model capability registry.
- Test Connection.
- AI gateway with normalized errors.
- no arbitrary endpoint V1.

**Gate:** selected provider can complete a structured-output test without exposing key.

### Phase 4 — Store command engine
- Define versioned AI command schema.
- Add validator and command executor over existing `sectionOperations` + Store Design domain.
- Add protected-commerce guard.
- Add batch atomicity at local Draft-command level.
- Add undo history.

**Gate:** deterministic command tests pass without any model call.

### Phase 5 — AI chat + proposal UX
- AI chat panel.
- attach media in message composer.
- conversation persistence.
- request -> proposal -> command validation -> local Draft preview.
- Change Summary.
- retry/provider error UX.
- destructive confirmation.

**Gate:** text-only and image-attachment edit flows work in Preview.

### Phase 6 — AI-first editor redesign
- Default builder entry becomes AI Chat + Preview.
- Section tree becomes secondary navigation.
- Right-side quick inspector remains for precision edits.
- Mobile becomes preview-first with chat/edit sheets.
- preserve shared renderer and save/publish lifecycle.

**Gate:** desktop + 375/390/414 responsive acceptance.

### Phase 7 — Dashboard V3 polish
- Ensure all admin pages use canonical primitives and English copy.
- Action Required and operational Dashboard composition.
- Store navigation points to AI Store Builder.
- AI configuration status surfaced where useful.

**Gate:** one coherent admin system, no duplicate navigation language or component styling.

### Phase 8 — Security, QA, and preview release
- cross-tenant credential/media tests,
- prompt/tool abuse tests,
- provider failure tests,
- stale Draft concurrency tests,
- AI cannot Publish tests,
- AI cannot disable Buy Now tests,
- responsive/accessibility checks,
- full `npm run check`,
- Vercel Preview QA,
- final diff review.

No Production deploy/migration/merge until separate release approval.

## 15. Suggested implementation tasks

1. **Reconcile design contract and English-only admin rule**
2. **Create semantic admin/editor token layer**
3. **Refactor reusable admin/editor primitives to tokens**
4. **Create Store Media domain + upload contract**
5. **Add tenant-safe media persistence/storage**
6. **Add manual media controls to Hero and Image+Text**
7. **Create AI provider capability registry**
8. **Create encrypted BYOK credential persistence**
9. **Build AI Settings UI + connection test**
10. **Define versioned AI Store Command schema**
11. **Build deterministic command validator/executor**
12. **Add undo/history for AI/local edits**
13. **Build AI gateway/provider adapter**
14. **Build AI conversation/message API**
15. **Build AI chat composer with media attachment**
16. **Build proposal/change-summary UX**
17. **Integrate AI commands with Draft preview/autosave**
18. **Redesign desktop builder to AI-first workspace**
19. **Redesign mobile builder to preview-first AI workflow**
20. **Polish Dashboard V3 with canonical system**
21. **Security and cross-tenant regression pass**
22. **Responsive/a11y/performance pass**
23. **Full CI + Preview QA + final scope review**

## 16. Acceptance criteria

The initiative is complete only when:

- Admin Dashboard/admin chrome contains no Burmese UI copy.
- Admin and Store Builder chrome use one canonical design system.
- Storefront theme styles remain isolated from admin/editor styles.
- User can manually upload an image and attach it to Hero/Image+Text.
- User can send an image in AI chat and ask AI to use it in a section.
- Image placement requests do not require vision unless semantic image understanding is actually needed.
- Vision-only requests are capability-gated.
- BYOK key is encrypted, tenant-scoped, never re-exposed, and never logged.
- AI returns typed commands only.
- Invalid or unauthorized AI commands are rejected server-side.
- AI never directly publishes.
- AI cannot remove/disable protected Buy Now commerce.
- AI edits feed the existing Draft/autosave/conflict lifecycle.
- Preview uses the same catalog renderer as Published storefront.
- Undo works for AI-applied Draft edits.
- Desktop and mobile builder flows are usable at required viewport widths.
- Core accessibility requirements pass.
- Cross-tenant media/credential access fails under tests.
- Full repository checks are green before release review.
