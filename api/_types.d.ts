declare global {
  namespace NodeJS {
    interface ProcessEnv {
      SUPABASE_URL?: string;
      SUPABASE_ANON_KEY?: string;
      VITE_SUPABASE_URL?: string;
      VITE_SUPABASE_ANON_KEY?: string;
      VERCEL_GIT_COMMIT_SHA?: string;
      VERCEL_GIT_COMMIT_REF?: string;
      VERCEL_ENV?: string;
      VERCEL_TARGET_ENV?: string;
      VERCEL_DEPLOYMENT_ID?: string;
      GITHUB_SHA?: string;
    }
  }
}
export {};
