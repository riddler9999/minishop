import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {ignores: ['dist']},
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
