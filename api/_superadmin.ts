import {createClient} from '@supabase/supabase-js';

function ownerEmails() {
  return new Set((process.env.SUPERADMIN_EMAILS || '').split(',').map((v) => v.trim().toLowerCase()).filter(Boolean));
}

export async function requireSuperadmin(req: any) {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon || !service) return {error: 'Superadmin backend is not configured', status: 503} as const;

  const token = String(req.headers?.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return {error: 'Unauthorized', status: 401} as const;

  const auth = createClient(url, anon, {auth: {persistSession: false, autoRefreshToken: false}});
  const {data, error} = await auth.auth.getUser(token);
  const email = data.user?.email?.toLowerCase();
  if (error || !data.user || !email) return {error: 'Unauthorized', status: 401} as const;
  if (!ownerEmails().has(email)) return {error: 'Forbidden', status: 403} as const;

  const admin = createClient(url, service, {auth: {persistSession: false, autoRefreshToken: false}});
  return {admin, user: data.user} as const;
}
