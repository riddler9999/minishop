# Mini Shop

A mobile-first, multi-tenant storefront and seller admin console for Myanmar online sellers, built with React, TypeScript, Vite, Tailwind CSS, and Supabase.

## Features

- Burmese-first white/blush-pink fashion storefront with tenant branding, product search, real categories, promotions, and product details
- Cart, checkout, order confirmation, and order lookup
- Seller authentication, onboarding, dashboard, product management, orders, shipping, and settings
- Tenant storefront URLs at `/s/:slug`
- Demo storefront at the root URL
- Supabase-backed data access with row-level security expected at the database layer
- Starter and Business feature plans

## Project documentation

| File | What it is |
| --- | --- |
| [`CLAUDE.md`](CLAUDE.md) | Architecture, layering rules, conventions. Read before changing structure. |
| [`PROJECT.md`](PROJECT.md) | Project memory: product context, decision log (D1–D51), open tasks, status. |
| [`supabase/README.md`](supabase/README.md) | Schema, security model, how migrations are applied. |
| [`design/design.md`](design/design.md) | Design system and screen inventory. |

## Tech stack

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- React Router
- Supabase
- Zod

## Local development

Requirements:

- Node.js 22
- npm
- A Supabase project for live backend features

Install dependencies:

```bash
npm ci
```

Copy the environment template:

```bash
cp .env.example .env.local
```

Set the public Supabase URL and anonymous key in `.env.local`. Never expose a Supabase `service_role` key in this frontend.

Start the development server:

```bash
npm run dev
```

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run lint` | Run TypeScript and ESLint checks |
| `npm test` | Run unit tests with Node's test runner |
| `npm run build` | Create a production build |
| `npm run preview` | Preview the production build locally |
| `npm run check` | Run lint, tests, and production build |

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Demo storefront |
| `/s/:slug` | Tenant storefront |
| `/admin/login` | Seller sign-in |
| `/admin/onboarding` | Shop setup |
| `/admin` | Protected seller console |

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | For live data | Public Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | For live data | Public anonymous key; access must be protected by RLS |
| `VITE_DEFAULT_PLAN` | No | `starter` or `business`. Fallback only — `shops.plan` in the database is the source of truth. Resolution fails closed to `starter` when unset or invalid. |

See [`.env.example`](.env.example) for details.

## Repository structure

```text
src/
  app/       Composition root and routes
  core/      Supabase and storage infrastructure
  data/      Demo/live backend adapters
  domain/    Pure types and business rules
  features/  Catalog, cart, checkout, orders, admin, auth, billing, shop, shipping, tenancy
  shared/    Cross-feature UI and utilities
supabase/    Migrations and backend documentation
tests/       Node test-runner regression tests
design/      Current design system and proposed themes
```

Repository-specific agent guidance lives in `AGENTS.md` and `CLAUDE.md`. Only the project-specific Supabase migration procedure is committed under `.claude/skills/`; third-party skills and personal plugin settings are intentionally kept out of the repository.

## Continuous integration

Pull requests and pushes to `main` run install, lint, unit tests, and production build through GitHub Actions.

## Security

- Keep secrets and service-role credentials out of client code and committed environment files.
- Treat Supabase RLS policies as the authorization boundary.
- Use `.env.local` for local public configuration; it is ignored by Git.
