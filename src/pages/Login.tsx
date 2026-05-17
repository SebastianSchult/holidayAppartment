import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../app/providers/AuthProvider';
import { auth } from '../lib/firebaseAuth';
import { useT } from '../i18n/useLanguage';
import { Seo } from '../components/Seo';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';

/**
 * Admin Login (Email/Passwort)
 * - Login / Registrierung / Passwort-Reset
 * - Weiterleitung auf die Seite, die den Nutzer hierher geschickt hat (state.from)
 */
export default function Login() {
  const t = useT();
  const { user } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  type NavState = { from?: { pathname: string } };
  const from = (loc.state as NavState | null)?.from?.pathname ?? '/admin';

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function doLogin(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pw);
      nav(from, { replace: true });
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : t("login.errorLogin"));
    } finally {
      setLoading(false);
    }
  }

  async function doRegister(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), pw);
      setMsg(t("login.successRegister"));
      nav(from, { replace: true });
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : t("login.errorRegister"));
    } finally {
      setLoading(false);
    }
  }

  async function doReset() {
    if (!email) { setMsg(t("login.resetNeedEmail")); return; }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setMsg(t("login.resetSent"));
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : t("login.resetError"));
    }
  }

  async function doLogout() {
    await signOut(auth);
  }

  if (user) {
    return (
      <section className="space-y-4">
        <Seo
          title={t("login.adminTitle")}
          description={t("seo.loginDescription")}
          image="/hero/cuxhaven-hero-1280.jpg"
          imageAlt={t("home.heroAlt")}
          noIndex
        />
        <h1 className="text-xl font-semibold">{t("login.adminTitle")}</h1>
        <p>{t("login.loggedInAs", { email: user.email ?? "" })}</p>
        <button onClick={doLogout} className="rounded bg-gray-800 px-3 py-2 text-white">{t("login.logout")}</button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-md space-y-6">
      <Seo
        title={mode === 'login' ? t("seo.loginTitle") : t("login.titleRegister")}
        description={t("seo.loginDescription")}
        image="/hero/cuxhaven-hero-1280.jpg"
        imageAlt={t("home.heroAlt")}
        noIndex
      />
      <h1 className="text-xl font-semibold">{mode === 'login' ? t("login.titleLogin") : t("login.titleRegister")}</h1>

      <form onSubmit={mode === 'login' ? doLogin : doRegister} className="space-y-3">
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">{t("login.email")}</span>
          <input
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            required
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">{t("login.password")}</span>
          <input
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="●●●●●●●●"
            required
            minLength={6}
          />
        </label>

        <div className="flex items-center justify-between">
          <button disabled={loading} className="rounded-xl bg-[color:var(--ocean,#0e7490)] px-4 py-2 font-semibold text-white hover:opacity-90">
            {mode === 'login' ? t("login.titleLogin") : t("login.titleRegister")}
          </button>
          {mode === 'login' && (
            <button type="button" className="text-sm underline" onClick={doReset}>
              {t("login.forgot")}
            </button>
          )}
        </div>

        {msg && <p className="text-sm text-slate-600">{msg}</p>}
      </form>

      <div className="text-sm text-slate-600">
        {mode === 'login' ? (
          <>
            {t("login.noAccount")}{" "}
            <button type="button" className="underline" onClick={() => setMode('register')}>
              {t("login.registerNow")}
            </button>
          </>
        ) : (
          <>
            {t("login.hasAccount")}{" "}
            <button type="button" className="underline" onClick={() => setMode('login')}>
              {t("login.toLogin")}
            </button>
          </>
        )}
      </div>

    </section>
  );
}
