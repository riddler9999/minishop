import {useState} from 'react';
import {useNavigate, useLocation, Link} from 'react-router-dom';
import {ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, Lock, Mail, ShieldAlert, Store} from 'lucide-react';
import {useAdminAuth, isSupabaseConfigured} from '@/features/auth/adminAuth';
import {APP_INITIAL, APP_NAME} from '@/shared/lib/brand';

type Mode = 'login' | 'signup' | 'confirm';

export default function AdminLogin() {
  const {signIn, signUp, signInWithGoogle, verifyEmailOtp, resendSignupCode} = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<Mode>(() => new URLSearchParams(location.search).get('mode') === 'signup' ? 'signup' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const queryFrom = new URLSearchParams(location.search).get('from');
  const stateFrom = (location.state as {from?: string} | null)?.from;
  const requestedFrom = queryFrom || stateFrom || '/admin';
  const from = requestedFrom.startsWith('/') && !requestedFrom.startsWith('//') ? requestedFrom : '/admin';

  const switchMode = (next: Mode) => {
    setMode(next);
    setErr('');
    setNotice('');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setNotice('');

    if (mode === 'confirm') {
      if (!code.trim()) return setErr('email ထဲက ၆ လုံးကုဒ်ကို ဖြည့်ပါ။');
      setBusy(true);
      const {error} = await verifyEmailOtp(email, code);
      setBusy(false);
      if (error) return setErr(error);
      navigate(from, {replace: true});
      return;
    }

    if (!email.trim() || !password) {
      setErr('အီးမေးလ်နှင့် စကားဝှက် ဖြည့်ပါ။');
      return;
    }

    if (mode === 'signup' && password.length < 6) {
      setErr('စကားဝှက် အနည်းဆုံး ၆ လုံး ဖြစ်ရပါမည်။');
      return;
    }

    setBusy(true);

    if (mode === 'login') {
      const {error} = await signIn(email, password);
      setBusy(false);
      if (error) return setErr(error);
      navigate(from, {replace: true});
      return;
    }

    const {error, needsEmailConfirmation} = await signUp(email, password, from);
    setBusy(false);

    if (error) return setErr(error);

    if (needsEmailConfirmation) {
      setCode('');
      setNotice('အကောင့်ဖွင့်ပြီးပါပြီ — email ထဲရောက်လာသော ၆ လုံးကုဒ်ကို အောက်တွင် ထည့်ပါ။');
      setMode('confirm');
      return;
    }

    navigate(from, {replace: true});
  };

  const googleSignIn = async () => {
    setErr('');
    setNotice('');
    setBusy(true);
    const {error} = await signInWithGoogle(from);
    if (error) {
      setBusy(false);
      setErr(error);
    }
  };

  const resend = async () => {
    setErr('');
    setNotice('');
    setBusy(true);
    const {error} = await resendSignupCode(email);
    setBusy(false);
    if (error) return setErr(error);
    setNotice('ကုဒ်အသစ် ပို့ပြီးပါပြီ။');
  };

  const isConfirm = mode === 'confirm';

  return (
    <main className="platform-shell min-h-screen bg-[var(--minishop-canvas)] text-[var(--minishop-ink)]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-5 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950">
            <ArrowLeft className="h-4 w-4" />
            Back to shop
          </Link>

          <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500 font-display text-sm font-bold text-white shadow-sm">
              {APP_INITIAL}
            </span>
            <span>{APP_NAME}</span>
          </div>
        </div>

        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
          <section className="hidden max-w-xl lg:block">
            <span className="inline-flex rounded-full border border-brand-100 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-600 shadow-sm">
              Seller admin
            </span>
            <h1 className="mt-6 max-w-lg font-display text-5xl font-bold leading-[1.04] tracking-[-0.04em] text-slate-950">
              Manage your shop from one clean workspace.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">
              Sign in to manage products, orders and your storefront without switching between tools.
            </p>

            <div className="mt-9 grid max-w-lg grid-cols-3 gap-3">
              {['Products', 'Orders', 'Store settings'].map((item) => (
                <div key={item} className="rounded-2xl border border-brand-100 bg-white p-4 shadow-[0_12px_40px_rgba(15,29,49,0.06)]">
                  <div className="mb-3 h-2 w-10 rounded-full bg-brand-100" />
                  <p className="text-sm font-semibold text-slate-800">{item}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mx-auto w-full max-w-md">
            <div className="rounded-[28px] border border-brand-100 bg-white p-5 shadow-[0_24px_70px_rgba(15,29,49,0.10)] sm:p-8">
              <div className="mb-7">
                <p className="text-sm font-semibold text-brand-600">
                  {isConfirm ? 'Verify your email' : mode === 'login' ? 'Welcome back' : 'Create seller account'}
                </p>
                <h2 className="mt-2 font-display text-3xl font-bold tracking-[-0.03em] text-slate-950">
                  {isConfirm ? 'Enter verification code' : mode === 'login' ? 'Sign in to MiniShop MM' : 'Start your MiniShop MM'}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {isConfirm
                    ? 'We sent a 6-digit code to your email.'
                    : mode === 'login'
                      ? 'Use your seller account to continue to the admin dashboard.'
                      : 'Create an account first. You can set up your shop right after.'}
                </p>
              </div>

              {!isConfirm && (
                <>
                  <button
                    type="button"
                    onClick={googleSignIn}
                    disabled={busy || !isSupabaseConfigured}
                    className="mb-4 flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-white text-xs font-bold text-[#4285F4] shadow-sm">G</span>
                    Continue with Google
                  </button>
                  <div className="mb-4 flex items-center gap-3 text-xs text-slate-400">
                    <span className="h-px flex-1 bg-slate-200" />
                    <span>or use email</span>
                    <span className="h-px flex-1 bg-slate-200" />
                  </div>
                  <div className="mb-6 grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className={
                      mode === 'login'
                        ? 'rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-sm'
                        : 'rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:text-slate-900'
                    }>
                    Sign in
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className={
                      mode === 'signup'
                        ? 'rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-sm'
                        : 'rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:text-slate-900'
                    }>
                    Create account
                  </button>
                  </div>
                </>
              )}

              <form onSubmit={submit} className="space-y-4">
                {isConfirm ? (
                  <>
                    <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
                      <p className="text-sm leading-6 text-slate-600">
                        Code sent to <span className="font-semibold text-slate-900">{email}</span>
                      </p>
                    </div>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-800">Verification code</span>
                      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 transition focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-100">
                        <KeyRound className="h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                          placeholder="123456"
                          className="w-full bg-transparent text-center text-lg font-semibold tracking-[0.35em] outline-none placeholder:text-slate-300"
                        />
                      </div>
                    </label>
                  </>
                ) : (
                  <>
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-800">Email</span>
                      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 transition focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-100">
                        <Mail className="h-4 w-4 text-slate-400" />
                        <input
                          type="email"
                          value={email}
                          autoComplete="email"
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                        />
                      </div>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-800">Password</span>
                      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 transition focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-100">
                        <Lock className="h-4 w-4 text-slate-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((value) => !value)}
                          className="rounded-md p-1 text-slate-400 transition hover:text-slate-700"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}>
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </label>
                  </>
                )}

                {err && (
                  <p className="flex items-start gap-2 rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                    {err}
                  </p>
                )}

                {notice && (
                  <p className="flex items-start gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    {notice}
                  </p>
                )}

                {!isSupabaseConfigured && (
                  <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-800">
                    Supabase env မချိတ်ရသေးပါ — login/signup အလုပ်မလုပ်နိုင်သေးပါ။
                  </p>
                )}

                <button
                  disabled={busy}
                  className="mt-2 w-full rounded-2xl bg-brand-500 px-4 py-3.5 text-sm font-bold text-white shadow-[0_12px_30px_rgba(236,31,98,0.20)] transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50">
                  {busy
                    ? 'Please wait…'
                    : mode === 'login'
                      ? 'Sign in'
                      : isConfirm
                        ? 'Verify email'
                        : 'Create account'}
                </button>

                {isConfirm && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={resend}
                    className="w-full rounded-2xl px-4 py-2 text-center text-sm font-semibold text-brand-600 transition hover:bg-brand-50 disabled:opacity-50">
                    Send a new code
                  </button>
                )}
              </form>
            </div>

            <div className="mt-5 flex items-center justify-center">
              <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900">
                <Store className="h-4 w-4" />
                View storefront
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
