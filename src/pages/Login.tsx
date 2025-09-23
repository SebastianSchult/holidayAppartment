import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../app/providers/AuthProvider';
import { auth } from '../lib/firebase';
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
      setMsg(err instanceof Error ? err.message : 'Login fehlgeschlagen.');
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
      setMsg('Konto angelegt. Du bist jetzt angemeldet.');
      nav(from, { replace: true });
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : 'Registrierung fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  }

  async function doReset() {
    if (!email) { setMsg('Bitte E-Mail eingeben, um einen Reset-Link zu erhalten.'); return; }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setMsg('Passwort-Reset gesendet. Bitte Posteingang prüfen.');
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : 'Reset fehlgeschlagen.');
    }
  }

  async function doLogout() {
    await signOut(auth);
  }

  if (user) {
    return (
      <section className="space-y-4">
        <h1 className="text-xl font-semibold">Admin</h1>
        <p>Angemeldet als <strong>{user.email}</strong></p>
        <button onClick={doLogout} className="rounded bg-gray-800 px-3 py-2 text-white">Logout</button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-md space-y-6">
      <h1 className="text-xl font-semibold">{mode === 'login' ? 'Anmelden' : 'Registrieren'}</h1>

      <form onSubmit={mode === 'login' ? doLogin : doRegister} className="space-y-3">
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">E-Mail</span>
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
          <span className="mb-1 block text-slate-600">Passwort</span>
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
            {mode === 'login' ? 'Anmelden' : 'Registrieren'}
          </button>
          {mode === 'login' && (
            <button type="button" className="text-sm underline" onClick={doReset}>
              Passwort vergessen?
            </button>
          )}
        </div>

        {msg && <p className="text-sm text-slate-600">{msg}</p>}
      </form>

      <div className="text-sm text-slate-600">
        {mode === 'login' ? (
          <>
            Kein Konto?{' '}
            <button type="button" className="underline" onClick={() => setMode('register')}>
              Jetzt registrieren
            </button>
          </>
        ) : (
          <>
            Schon ein Konto?{' '}
            <button type="button" className="underline" onClick={() => setMode('login')}>
              Zum Login
            </button>
          </>
        )}
      </div>

    </section>
  );
}