/// <reference types="vite/client" />

// Explicit typing for the public env vars this app reads, so `import.meta.env`
// is typed even though tsconfig restricts `types` to ["node"].
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  // Deploy-wide default plan (starter | business) until per-shop plans exist.
  readonly VITE_DEFAULT_PLAN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
