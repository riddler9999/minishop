// ---- SELLER ADMIN AUTH (Supabase Auth) -------------------------------------
import {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import type {Session, User} from '@supabase/supabase-js';
import {getSupabase, isSupabaseConfigured} from '@/core/supabase/client';

interface AuthResult {
  error: string | null;
  needsEmailConfirmation?: boolean;
}
interface AdminAuthValue {
  loading: boolean;
  session: Session | null;
  user: User | null;
  signUp: (email: string, password: string, redirectPath?: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: (redirectPath?: string) => Promise<AuthResult>;
  signInAsDemo: () => Promise<AuthResult>;
  verifyEmailOtp: (email: string, token: string) => Promise<AuthResult>;
  resendSignupCode: (email: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}
const AdminAuthContext = createContext<AdminAuthValue | null>(null);

const DEMO_USER: User = {
  id: 'demo-seller-id',
  email: 'demo@minishop.mm',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
} as User;

const DEMO_SESSION: Session = {
  access_token: 'demo-token',
  token_type: 'bearer',
  expires_in: 3600,
  refresh_token: 'demo-refresh',
  user: DEMO_USER,
} as Session;

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
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    const isDemo = localStorage.getItem('minishop_demo_admin') === 'true';
    if (isDemo) {
      setSession(DEMO_SESSION);
      setLoading(false);
      return;
    }
    const sb = getSupabase();
    if (!sb) {
      setLoading(false);
      return;
    }
    sb.auth.getSession().then(({data}) => {
      if (data.session) setSession(data.session);
      setLoading(false);
    });
    const {
      data: {subscription},
    } = sb.auth.onAuthStateChange((_event, next) => {
      if (next) setSession(next);
    });
    return () => subscription.unsubscribe();
  }, []);
  const signInAsDemo = useCallback(async (): Promise<AuthResult> => {
    localStorage.setItem('minishop_demo_admin', 'true');
    setSession(DEMO_SESSION);
    return {error: null};
  }, []);
  const signUp = useCallback(async (email: string, password: string, redirectPath?: string): Promise<AuthResult> => {
    const sb = getSupabase();
    if (!sb) return signInAsDemo();
    const {data, error} = await sb.auth.signUp({
      email: email.trim(),
      password,
      options: {emailRedirectTo: `${window.location.origin}${safeRedirectPath(redirectPath)}`},
    });
    if (error) return {error: mapAuthError(error.message)};
    return {error: null, needsEmailConfirmation: !data.session};
  }, [signInAsDemo]);
  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const sb = getSupabase();
    if (!sb) return signInAsDemo();
    const {error} = await sb.auth.signInWithPassword({email: email.trim(), password});
    return {error: error ? mapAuthError(error.message) : null};
  }, [signInAsDemo]);
  const signInWithGoogle = useCallback(async (redirectPath?: string): Promise<AuthResult> => {
    const sb = getSupabase();
    if (!sb) return signInAsDemo();
    const {error} = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: {redirectTo: `${window.location.origin}${safeRedirectPath(redirectPath)}`},
    });
    return {error: error ? mapAuthError(error.message) : null};
  }, [signInAsDemo]);
  const verifyEmailOtp = useCallback(async (email: string, token: string): Promise<AuthResult> => {
    const sb = getSupabase();
    if (!sb) return signInAsDemo();
    const {error} = await sb.auth.verifyOtp({email: email.trim(), token: token.trim(), type: 'signup'});
    return {error: error ? mapAuthError(error.message) : null};
  }, [signInAsDemo]);
  const resendSignupCode = useCallback(async (email: string): Promise<AuthResult> => {
    const sb = getSupabase();
    if (!sb) return {error: null};
    const {error} = await sb.auth.resend({type: 'signup', email: email.trim()});
    return {error: error ? mapAuthError(error.message) : null};
  }, []);
  const signOut = useCallback(async () => {
    localStorage.removeItem('minishop_demo_admin');
    const sb = getSupabase();
    if (sb) await sb.auth.signOut();
    setSession(null);
  }, []);
  const value = useMemo<AdminAuthValue>(
    () => ({
      loading,
      session,
      user: session?.user ?? null,
      signUp,
      signIn,
      signInWithGoogle,
      signInAsDemo,
      verifyEmailOtp,
      resendSignupCode,
      signOut,
    }),
    [loading, session, signUp, signIn, signInWithGoogle, signInAsDemo, verifyEmailOtp, resendSignupCode, signOut],
  );
  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}
export function useAdminAuth(): AdminAuthValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used inside <AdminAuthProvider>');
  return ctx;
}
export {isSupabaseConfigured};
