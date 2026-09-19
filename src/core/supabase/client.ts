// ---- Supabase client (SaaS backend) ----------------------------------------
// The real multi-tenant backend. The client-side demo (@/data/demo/, backed by
// localStorage) survives only for the slug-less root route. This module exposes
// a single browser client built from public env vars.
//
// Config comes from Vite env vars (see .env.example). Only the PUBLIC anon key
// belongs here — it is safe in the browser because Row Level Security (see
// supabase/migrations/0001_init_saas.sql) is what actually enforces access.
// Never put the service_role key in frontend code.
//
// The client is created lazily and returns null when env is absent, so the
// existing demo surface keeps building/running on static hosting with no
// secrets until the frontend is wired over to Supabase.

import {createClient, type SupabaseClient} from '@supabase/supabase-js';
import type {Database} from './database.types';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

let client: SupabaseClient<Database> | null = null;

/** Returns the shared browser client, or null when env is not configured. */
export function getSupabase(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured) return null;
  if (!client) {
    client = createClient<Database>(url as string, anonKey as string, {
      auth: {persistSession: true, autoRefreshToken: true},
    });
  }
  return client;
}

/** Like getSupabase() but throws when unconfigured — for code paths that
 *  legitimately require the backend (seller dashboard, order placement). */
export function requireSupabase(): SupabaseClient<Database> {
  const c = getSupabase();
  if (!c) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    );
  }
  return c;
}
