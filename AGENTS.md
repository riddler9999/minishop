# AGENTS.md

Instructions for coding agents working in this repository (Codex, Cursor, and any
other tool that reads `AGENTS.md`). **Claude Code reads `CLAUDE.md`, which is the
single source of truth — this file points at it rather than duplicating it, so the
two can never drift apart.**

## Read these first, in this order

1. **[`CLAUDE.md`](CLAUDE.md)** — architecture, the enforced layering rules, data-layer
   hazards, conventions. Read it before changing any structure. It is not optional
   background: the layering it describes is a build gate (see "Enforcement" below).
2. **[`PROJECT.md`](PROJECT.md)** — the project's memory, not a README: product
   context, the decision log (D1–D51), open tasks, current status. Read it before
   making architectural changes, and add a decision entry when you make one.
3. **[`supabase/README.md`](supabase/README.md)** — schema, the security model, and
   how migrations are applied.

## What this project is

A multi-tenant SaaS storefront for Myanmar TikTok sellers. A seller drops a
`/s/<slug>` link in their TikTok bio; buyers order through a self-serve storefront
that must work inside TikTok's in-app WebView. No native app, no bot/messaging API —
this is **not** a sales agent.

## Commands

| Command | Purpose |
| --- | --- |
| `npm ci` | Install dependencies (Node.js 22 — see `.nvmrc`) |
| `npm run dev` | Vite dev server |
| `npm run lint` | `tsc --noEmit` then ESLint |
| `npm test` | Unit tests (`node --test`, no framework) |
| `npm run check` | lint + test + build — **run this before every commit**; it is exactly what CI runs |

## Hard rules

- **Layering is enforced by lint, not convention.** Import direction runs one way:
  `domain/ ← core/, shared/ ← features/* ← data/ ← app/`. `eslint.config.js` encodes
  it with `no-restricted-imports`, so a wrong-direction import fails `npm run lint`.
  Do not weaken those rules to make an import work — restructure the code instead.
- **Storefront pages import the backend only from `@/data/dataSource`**, never
  `@/data/liveApi` or `@/data/demo/*`. Never put `api.<method>` in a React dependency
  array, and never cache a method off `api` — dispatch happens at property-access
  time. See the hazard note in `CLAUDE.md`.
- **A feature never imports another feature's `api/`.** Only `src/data/liveApi.ts`
  composes across features.
- **Never apply a database migration to production without the owner's explicit
  go-ahead.** Procedure: `.claude/skills/supabase-migration/SKILL.md`.
- **Only the Supabase public anon key belongs in frontend code.** Never the
  `service_role` key. RLS is the enforcement boundary, not the frontend.
- **Use the `@/*` alias** (→ `src/*`) for every cross-module import; plain `./` only
  for siblings in the same folder.
- **UI copy defaults to Burmese** for buyer-facing text and seller-facing screens unless a screen-specific product decision records an English exception. **D50 makes the Admin analytics dashboard English-only.** Code comments and identifiers are English.
- **Keep comments truthful.** If you move a file, update every comment that names a
  path — stale paths are what agents navigate by, so a wrong one is a real defect.

## Before you finish

Run `npm run check` and make sure it is clean. If you changed structure or made an
architectural decision, update `CLAUDE.md` and add a `PROJECT.md` decision entry in
the same change.
