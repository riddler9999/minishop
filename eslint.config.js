import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // `.claude/skills/` holds vendored third-party skill bundles (see CLAUDE.md, PROJECT.md D51/D53)
  // with their own Node/Python tooling — not part of this app's source, and not meant to satisfy
  // this project's TS/React lint rules.
  {ignores: ['dist', '.claude']},
  js.configs.recommended,
  ...tseslint.configs.recommended,
  jsxA11y.flatConfigs.recommended,
  {
    // Only the two classic hooks-correctness rules the lint gap was about. Not
    // `reactHooks.configs.flat.recommended` — that preset also enables ~12 React Compiler
    // rules (immutability, purity, refs, use-memo, etc.), a much larger, undiscussed lint
    // surface this pass isn't scoped to introduce.
    plugins: {'react-hooks': reactHooks},
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      globals: globals.browser,
    },
  },

  // ---- Architecture boundaries ----------------------------------------------
  // The layering below is the structure, not a convention: import direction is
  // enforced here so a refactor can't silently re-create the god-module the
  // feature split removed. Layer order (leaf first):
  //
  //   domain/  <-  core/ , shared/  <-  features/*  <-  data/  <-  app/
  //
  // `domain/` is pure (types + rules, no React, no I/O). `core/` and `shared/`
  // know nothing about features. A feature owns its own data access; only
  // `data/liveApi.ts` may compose across features, and pages reach the backend
  // through `data/dataSource.ts` alone.
  {
    files: ['src/domain/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {patterns: [{
        group: ['@/core/*', '@/data/*', '@/features/*', '@/shared/*', '@/app/*', 'react', 'react-dom', 'react-router-dom', '@supabase/*'],
        message: 'domain/ is the leaf layer: pure types and rules only — no I/O, no React, no other layer.',
      }]}],
    },
  },
  {
    files: ['src/core/**/*.{ts,tsx}', 'src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {patterns: [{
        group: ['@/features/*', '@/data/*', '@/app/*'],
        message: 'core/ and shared/ are feature-agnostic: they may only import domain/ (and each other).',
      }]}],
    },
  },
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {patterns: [
        {
          group: ['@/features/*/api', '@/features/*/api/*'],
          message: "A feature owns its own data access. Reach another feature's backend through @/data/dataSource instead.",
        },
        {
          group: ['@/data/liveApi', '@/data/demo/*', '@/app/*'],
          message: 'Import the backend through @/data/dataSource — it decides live vs demo per access (see CLAUDE.md).',
        },
      ]}],
    },
  },
  {
    // The one place allowed to see every feature's data module at once.
    files: ['src/data/dataSource.ts', 'src/app/**/*.{ts,tsx}', 'src/features/**/*.{ts,tsx}', 'src/core/**/*.{ts,tsx}', 'src/shared/**/*.{ts,tsx}'],
    ignores: ['src/data/liveApi.ts'],
    rules: {
      'no-restricted-imports': ['error', {patterns: [{
        group: ['@/features/*/api', '@/features/*/api/*'],
        message: 'Only src/data/liveApi.ts composes feature data modules.',
      }]}],
    },
  },
  {
    files: ['vite.config.ts'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    rules: {
      // Deliberately-unused params (e.g. uploadSlip's no-op signature, kept to match the
      // live backend's shape — see CLAUDE.md) are named with a leading underscore.
      '@typescript-eslint/no-unused-vars': ['error', {argsIgnorePattern: '^_', varsIgnorePattern: '^_'}],
      // Pre-existing `catch (e: any)` blocks across the codebase are debt this pass doesn't
      // fix — surfaced as warnings so `npm run lint` stays actionable without a mass rewrite.
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
);
