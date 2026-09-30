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
4. For numbered Production Readiness work, read
   **[`docs/superpowers/plans/2026-09-28-minishop-production-readiness-task-prompts.md`](docs/superpowers/plans/2026-09-28-minishop-production-readiness-task-prompts.md)**
   and select exactly the requested task. Do not infer a task from memory or ask the
   owner to paste a prompt that is already in the repository.

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

## Task 12+ execution contract

For **Task 12 and every later numbered Production Readiness task**, a request such
as `@GitHub minishop task 12 start` is authorization to execute that task through
the complete engineering gate below. Do not stop after implementation or after
opening a PR, and do not start the next numbered task automatically.

1. **Source of truth** — read the exact numbered task prompt, this file, `CLAUDE.md`,
   `PROJECT.md`, relevant ADR/spec/schema/API contracts, and current GitHub state.
2. **Fresh current state** — re-fetch `main`, related branches/PRs, review threads,
   and CI. Never trust a stale SHA, previous-chat status, or an assessment finding
   without confirming it against current code.
3. **Reproduce / prove the problem** — for a behavioral defect, reproduce it before
   changing implementation. Distinguish a confirmed current defect from an already
   fixed, superseded, or unproven assessment finding.
4. **Acceptance criteria** — derive explicit, testable completion criteria from the
   task prompt and current contracts before implementation. Do not invent product
   policy when the source of truth is silent.
5. **Isolated branch / focused PR** — never implement directly on `main`. Reuse an
   existing task branch/PR when it is the authoritative continuation; otherwise
   create one scoped branch and one reviewable PR for the selected task only.
6. **Test first where behavior changes** — use RED → GREEN → REFACTOR. Add/run a
   failing regression test that proves the defect when feasible, then make the
   smallest correct implementation. For non-behavioral work, define an equivalent
   verifiable precondition instead of manufacturing a meaningless RED test.
7. **Targeted verification** — run the smallest relevant tests/checks first and fix
   root causes, not symptoms. Database/security/API/browser tasks require their
   task-specific runtime evidence; frontend unit tests alone are not sufficient.
8. **Full repository gates** — before merge, run the repository-supported full
   lint/typecheck, test suite, and production build (`npm run check`) plus every
   additional gate named by the selected task.
9. **PR + CI** — push the focused changes, open/update the task PR, and require fresh
   CI on the final head SHA. A locally passing checkout is not merge evidence.
10. **Independent code review** — inspect the final diff for correctness, security,
    data integrity, architecture/layering, edge cases, test gaps, and scope creep.
    Treat confirmed Critical/Important findings as merge blockers.
11. **Fix-and-rerun loop** — for every confirmed finding or failed check: determine
    root cause → fix only the scoped defect → rerun affected tests → rerun required
    full gates/CI → re-review the new final diff. Continue until clean.
12. **Merge only all-green** — merge only when the final head SHA is mergeable,
    required CI/checks pass, required runtime evidence passes, and there are no
    unresolved Critical/Important review findings. Report the merge SHA/evidence.
13. **Release boundary** — merge authorization is **not** Production authorization.
    Do not deploy Production, mutate Production data, apply a Production database
    migration, rotate credentials, or change live infrastructure unless the selected
    task explicitly requires it **and** the owner separately gives explicit approval.

Completion means the whole contract is satisfied, not merely “code written.” If a
real human-only decision, credential, external approval, unavailable required check,
or Production approval blocks completion, finish every independent step and report
the exact blocker without claiming the task complete.

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
