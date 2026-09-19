import {useState} from 'react';
import {useNavigate, useLocation, Link} from 'react-router-dom';
import {Lock, Mail, ShieldAlert, Store, CheckCircle2, KeyRound} from 'lucide-react';
import {useAdminAuth, isSupabaseConfigured} from '@/features/auth/adminAuth';
import {APP_INITIAL, APP_NAME} from '@/shared/lib/brand';
import {cx} from '@/shared/lib/format';

type Mode = 'login' | 'signup' | 'confirm';

export default function AdminLogin() {
  const {signIn, signUp, verifyEmailOtp, resendSignupCode} = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  // Where to go after login (defaults to the admin console — RequireAdmin
  // sends first-time sellers on to onboarding automatically).
  const from = (location.state as {from?: string} | null)?.from || '/admin';

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
    } else {
      const {error, needsEmailConfirmation} = await signUp(email, password);
      setBusy(false);
      if (error) return setErr(error);
      if (needsEmailConfirmation) {
        setCode('');
        setNotice('အကောင့်ဖွင့်ပြီးပါပြီ — email ထဲရောက်လာသော ၆ လုံးကုဒ်ကို အောက်တွင် ထည့်ပါ။');
        setMode('confirm');
        return;
      }
      navigate(from, {replace: true});
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

  return (
    <div className="grid min-h-screen place-items-center bg-ink px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-gold-500 font-display text-2xl font-bold text-white shadow-lg">
            {APP_INITIAL}
          </span>
          <h1 className="my mt-4 font-display text-2xl font-bold text-white">Seller Console</h1>
          <p className="my mt-1 text-sm text-cream-200/70">{APP_NAME} · ဆိုင်ရှင် အကောင့်</p>
        </div>

        {mode !== 'confirm' && (
          <div className="mb-4 flex rounded-xl bg-white/10 p-1">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={cx(
                'my flex-1 rounded-lg py-2 text-sm font-semibold transition',
                mode === 'login' ? 'bg-white text-ink' : 'text-cream-200',
              )}>
              ဝင်ရန်
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={cx(
                'my flex-1 rounded-lg py-2 text-sm font-semibold transition',
                mode === 'signup' ? 'bg-white text-ink' : 'text-cream-200',
              )}>
              အကောင့်ဖွင့်ရန်
            </button>
          </div>
        )}

        <form onSubmit={submit} className="space-y-3 rounded-2xl bg-white p-6 shadow-xl">
          {mode === 'confirm' ? (
            <>
              <p className="my text-sm text-ink-soft">
                <span className="font-semibold text-ink">{email}</span> သို့ ပို့ထားသော ၆ လုံးကုဒ်ကို ထည့်ပါ — link
                ကို နှိပ်စရာမလိုပါ။
              </p>
              <label className="block">
                <span className="my mb-1.5 block text-sm font-semibold text-ink">အတည်ပြုကုဒ်</span>
                <div className="flex items-center gap-2 rounded-xl border border-cream-200 bg-cream-50 px-3.5 py-2.5 focus-within:border-brand-400">
                  <KeyRound className="h-4 w-4 text-ink-soft" />
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="123456"
                    className="my w-full bg-transparent text-center text-lg tracking-[0.3em] outline-none placeholder:text-ink-soft"
                  />
                </div>
              </label>
            </>
          ) : (
            <>
              <label className="block">
                <span className="my mb-1.5 block text-sm font-semibold text-ink">အီးမေးလ်</span>
                <div className="flex items-center gap-2 rounded-xl border border-cream-200 bg-cream-50 px-3.5 py-2.5 focus-within:border-brand-400">
                  <Mail className="h-4 w-4 text-ink-soft" />
                  <input
                    type="email"
                    value={email}
                    autoComplete="email"
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="my w-full bg-transparent text-sm outline-none placeholder:text-ink-soft"
                  />
                </div>
              </label>

              <label className="block">
                <span className="my mb-1.5 block text-sm font-semibold text-ink">စကားဝှက်</span>
                <div className="flex items-center gap-2 rounded-xl border border-cream-200 bg-cream-50 px-3.5 py-2.5 focus-within:border-brand-400">
                  <Lock className="h-4 w-4 text-ink-soft" />
                  <input
                    type="password"
                    value={password}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="········"
                    className="my w-full bg-transparent text-sm outline-none placeholder:text-ink-soft"
                  />
                </div>
              </label>
            </>
          )}

          {err && (
            <p className="my flex items-center gap-1.5 text-sm text-brand-600">
              <ShieldAlert className="h-4 w-4 shrink-0" /> {err}
            </p>
          )}
          {notice && (
            <p className="my flex items-center gap-1.5 text-sm text-emerald-600">
              <CheckCircle2 className="h-4 w-4 shrink-0" /> {notice}
            </p>
          )}
          {!isSupabaseConfigured && (
            <p className="my rounded-xl bg-cream-100 p-3 text-xs text-ink-soft">
              ⚠️ Supabase env မချိတ်ရသေးပါ — login/signup အလုပ်မလုပ်နိုင်သေးပါ။
            </p>
          )}

          <button
            disabled={busy}
            className="my mt-2 w-full rounded-xl bg-brand-500 py-3 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-50">
            {busy
              ? 'စောင့်ဆိုင်းနေသည်…'
              : mode === 'login'
                ? 'ဝင်ရန်'
                : mode === 'confirm'
                  ? 'အတည်ပြုရန်'
                  : 'အကောင့်ဖွင့်ရန်'}
          </button>

          {mode === 'confirm' && (
            <button
              type="button"
              disabled={busy}
              onClick={resend}
              className="my w-full text-center text-sm font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-50">
              ကုဒ်အသစ် ပို့ရန်
            </button>
          )}
        </form>

        <div className="mt-5 text-center">
          <Link
            to="/"
            className="my inline-flex items-center gap-1.5 text-sm font-semibold text-cream-200/80 hover:text-white">
            <Store className="h-4 w-4" /> ဆိုင်သို့ ပြန်သွားရန်
          </Link>
        </div>
      </div>
    </div>
  );
}
