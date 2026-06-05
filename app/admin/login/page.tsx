'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp?.get('next') || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: authErr } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (authErr) throw new Error(authErr.message);

      // Refresh server components before navigating
      router.push(next);
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Sign-in failed');
      setLoading(false);
    }
  }

  return (
    <div className="adm-login">
      <div className="adm-login-card">
        <div className="adm-login-mark">DANHOV</div>
        <div className="adm-login-sub">Admin Atelier · Sign in</div>

        <form onSubmit={submit} className="adm-login-form">
          <label className="adm-field">
            <span className="adm-field-label">Email</span>
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="adm-input"
            />
          </label>
          <label className="adm-field">
            <span className="adm-field-label">Password</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="adm-input"
            />
          </label>

          {error && <div className="adm-form-err">{error}</div>}

          <button type="submit" className="adm-btn adm-btn-primary" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="adm-login-foot">
          Private staff portal. Public visitors should use the{' '}
          <a href="/" style={{ color: 'var(--logo-red)' }}>main site</a>.
        </p>
      </div>
    </div>
  );
}
