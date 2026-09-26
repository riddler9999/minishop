/// <reference types="vite/client" />

// Explicit typing for the public env vars this app reads, so `import.meta.env`
// is typed even though tsconfig restricts `types` to ["node"].
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  // Deploy-wide fallback only: free_trial | starter | business; DB shop.plan is authoritative.
  readonly VITE_DEFAULT_PLAN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
