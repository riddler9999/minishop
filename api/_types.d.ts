declare global {
  namespace NodeJS {
    interface ProcessEnv {
      SUPABASE_URL?: string;
      SUPABASE_ANON_KEY?: string;
      SUPABASE_SERVICE_ROLE_KEY?: string;
      SUPERADMIN_EMAILS?: string;
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
