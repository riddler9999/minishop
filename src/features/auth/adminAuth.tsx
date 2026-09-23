// ---- SELLER ADMIN AUTH (Supabase Auth) -------------------------------------
import {createContext, useContext, useEffect, useMemo, useState} from 'react';
import type {Session, User} from '@supabase/supabase-js';
import {getSupabase, isSupabaseConfigured} from '@/core/supabase/client';

interface AuthResult { error: string | null; needsEmailConfirmation?: boolean; }
interface AdminAuthValue {
  loading: boolean; session: Session | null; user: User | null;
  signUp: (email: string, password: string, redirectPath?: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: (redirectPath?: string) => Promise<AuthResult>;
  verifyEmailOtp: (email: string, token: string) => Promise<AuthResult>;
  resendSignupCode: (email: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}
const AdminAuthContext = createContext<AdminAuthValue | null>(null);

function mapAuthError(message: string): string {
  if (message.includes('Invalid login credentials')) return 'အီးမေးလ် သို့မဟုတ် စကားဝှက် မှားနေပါသည်။';
  if (message.includes('User already registered')) return 'ဤအီးမေးလ်ဖြင့် အကောင့်ရှိပြီးသားဖြစ်ပါသည် — ဝင်ရောက်ပါ။';
  if (message.includes('Password should be at least')) return 'စကားဝှက် အနည်းဆုံး ၆ လုံး ဖြစ်ရပါမည်။';
  if (message.includes('Unable to validate email address')) return 'အီးမေးလ် format မှားနေပါသည်။';
  if (message.includes('rate limit')) return 'ကြိုးစားမှု များနေပါသည် — နည်းနည်းစောင့်ပြီး ပြန်ကြိုးစားပါ။';
  if (message.includes('Token has expired') || message.includes('otp_expired')) return 'ကုဒ် သက်တမ်းကုန်သွားပါပြီ — "ကုဒ်အသစ် ပို့ရန်" ကို နှိပ်ပါ။';
  if (message.includes('Invalid token') || message.includes('Token has invalid')) return 'ကုဒ် မှားနေပါသည် — ပြန်စစ်ပြီး ထပ်ကြိုးစားပါ။';
  return message;
}

function safeRedirectPath(path?: string): string {
  if (!path) return '/admin';
  try {
    const url = new URL(path, 'https://minishop.local');
    if (url.origin !== 'https://minishop.local') return '/admin';
    const allowed = ['/admin', '/admin/subscribe', '/admin/onboarding'];
    if (!allowed.includes(url.pathname)) return '/admin';
    return `${url.pathname}${url.search}`;
  } catch { return '/admin'; }
}

export function AdminAuthProvider({children}: {children: React.ReactNode}) {
  const [loading, setLoading] = useState(true); const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    const sb = getSupabase(); if (!sb) { setLoading(false); return; }
    sb.auth.getSession().then(({data}) => { setSession(data.session); setLoading(false); });
    const {data: {subscription}} = sb.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => subscription.unsubscribe();
  }, []);
  const signUp = async (email: string, password: string, redirectPath?: string): Promise<AuthResult> => {
    const sb = getSupabase(); if (!sb) return {error: 'Supabase configure မလုပ်ရသေးပါ။'};
    const {data, error} = await sb.auth.signUp({email: email.trim(), password, options: {emailRedirectTo: `${window.location.origin}${safeRedirectPath(redirectPath)}`}});
    if (error) return {error: mapAuthError(error.message)};
    return {error: null, needsEmailConfirmation: !data.session};
  };
  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    const sb = getSupabase(); if (!sb) return {error: 'Supabase configure မလုပ်ရသေးပါ။'};
    const {error} = await sb.auth.signInWithPassword({email: email.trim(), password}); return {error: error ? mapAuthError(error.message) : null};
  };
  const signInWithGoogle = async (redirectPath?: string): Promise<AuthResult> => {
    const sb = getSupabase(); if (!sb) return {error: 'Supabase configure မလုပ်ရသေးပါ။'};
    const {error} = await sb.auth.signInWithOAuth({provider: 'google', options: {redirectTo: `${window.location.origin}${safeRedirectPath(redirectPath)}`}});
    return {error: error ? mapAuthError(error.message) : null};
  };
  const verifyEmailOtp = async (email: string, token: string): Promise<AuthResult> => {
    const sb = getSupabase(); if (!sb) return {error: 'Supabase configure မလုပ်ရသေးပါ။'};
    const {error} = await sb.auth.verifyOtp({email: email.trim(), token: token.trim(), type: 'signup'}); return {error: error ? mapAuthError(error.message) : null};
  };
  const resendSignupCode = async (email: string): Promise<AuthResult> => {
    const sb = getSupabase(); if (!sb) return {error: 'Supabase configure မလုပ်ရသေးပါ။'};
    const {error} = await sb.auth.resend({type: 'signup', email: email.trim()}); return {error: error ? mapAuthError(error.message) : null};
  };
  const signOut = async () => { const sb = getSupabase(); if (sb) await sb.auth.signOut(); };
  const value = useMemo<AdminAuthValue>(() => ({loading, session, user: session?.user ?? null, signUp, signIn, signInWithGoogle, verifyEmailOtp, resendSignupCode, signOut}), [loading, session]);
  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}
export function useAdminAuth(): AdminAuthValue { const ctx = useContext(AdminAuthContext); if (!ctx) throw new Error('useAdminAuth must be used inside <AdminAuthProvider>'); return ctx; }
export {isSupabaseConfigured};
