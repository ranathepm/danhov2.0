'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Mode = 'signin' | 'signup';

export type AuthFormProps = {
  /** Initial form mode (signin or signup) */
  initialMode?: Mode;
  /** Fires after a successful sign-in OR completed signup with session */
  onSuccess?: () => void;
  /** Optional eyebrow rendered above the title */
  eyebrow?: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Compact variant for inside a modal */
  compact?: boolean;
};

// Translate Supabase error messages into user-facing copy. Supabase error
// strings change between SDK versions, so we match on stable substrings.
function humaniseError(message: string | null | undefined): string {
  if (!message) return 'Something went wrong. Please try again.';
  const m = message.toLowerCase();
  if (m.includes('already registered') || m.includes('already exists') || m.includes('user already')) {
    return 'An account with this email already exists. Sign in instead.';
  }
  if (m.includes('invalid login') || m.includes('invalid credentials')) {
    return 'Email or password is incorrect. Please try again.';
  }
  if (m.includes('email not confirmed')) {
    return 'Please confirm your email before signing in. Check your inbox.';
  }
  if (m.includes('password should be at least') || m.includes('password is too short')) {
    return 'Password is too short. Please use at least 8 characters.';
  }
  if (m.includes('rate limit') || m.includes('too many requests')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  if (m.includes('network') || m.includes('failed to fetch')) {
    return "We couldn't reach the server. Please check your connection.";
  }
  return message;
}

function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return 'Email is required.';
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!re.test(trimmed)) return 'Please enter a valid email address.';
  return null;
}

function validatePassword(pwd: string): string | null {
  if (!pwd) return 'Password is required.';
  if (pwd.length < 8) return 'Password must be at least 8 characters.';
  return null;
}

export default function AuthForm({
  initialMode = 'signup',
  onSuccess,
  eyebrow,
  subtitle,
  compact = false,
}: AuthFormProps) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirm?: string; form?: string }>({});

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Client-side validation up front so the user sees the same field-level
    // feedback whether or not the network is reachable.
    const nextErrors: typeof errors = {};
    const emailErr = validateEmail(email);
    if (emailErr) nextErrors.email = emailErr;
    const pwdErr = validatePassword(password);
    if (pwdErr) nextErrors.password = pwdErr;
    if (mode === 'signup' && confirm !== password) {
      nextErrors.confirm = 'Passwords do not match.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setPending(true);
    setErrors({});

    try {
      const supabase = createClient();
      if (mode === 'signup') {
        // Server route creates the user with email_confirm:true (no
        // verification email). On success we immediately sign in
        // with the same credentials to establish a browser session.
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password }),
        });
        const payload = (await res.json().catch(() => ({}))) as {
          error?: string;
          code?: string;
        };
        if (!res.ok) {
          const message = payload.error || 'We couldn’t create your account.';
          if (payload.code === 'EMAIL_TAKEN') {
            setMode('signin');
            setErrors({ form: message });
          } else {
            setErrors({ form: humaniseError(message) });
          }
          return;
        }
        // Immediately establish a client session with the new credentials.
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error || !data.session) {
          setErrors({
            form: humaniseError(error?.message)
              || 'Account created, but we couldn’t sign you in automatically. Please sign in below.',
          });
          setMode('signin');
          return;
        }
        onSuccess?.();
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) {
          setErrors({ form: humaniseError(error.message) });
          return;
        }
        if (data.session) {
          onSuccess?.();
        } else {
          setErrors({ form: 'Sign-in failed. Please try again.' });
        }
      }
    } catch (err) {
      setErrors({ form: humaniseError(err instanceof Error ? err.message : null) });
    } finally {
      setPending(false);
    }
  }

  const isSignup = mode === 'signup';

  return (
    <form onSubmit={onSubmit} className={`auth-form${compact ? ' auth-form--compact' : ''}`} noValidate>
      {eyebrow && <div className="auth-eyebrow">— {eyebrow}</div>}
      <h2 className="auth-title">
        {isSignup ? 'Create your DANHOV account.' : 'Welcome back.'}
      </h2>
      {subtitle && <p className="auth-subtitle">{subtitle}</p>}

      <label htmlFor="auth-email" className="auth-label">Email</label>
      <input
        id="auth-email"
        type="email"
        autoComplete="email"
        required
        placeholder="you@example.com"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (errors.email) setErrors({ ...errors, email: undefined });
        }}
        disabled={pending}
        className={`auth-input${errors.email ? ' has-error' : ''}`}
        aria-invalid={!!errors.email}
        aria-describedby={errors.email ? 'auth-email-err' : undefined}
      />
      {errors.email && (
        <p id="auth-email-err" className="auth-field-err" role="alert">{errors.email}</p>
      )}

      <label htmlFor="auth-password" className="auth-label">Password</label>
      <input
        id="auth-password"
        type="password"
        autoComplete={isSignup ? 'new-password' : 'current-password'}
        required
        placeholder={isSignup ? 'At least 8 characters' : 'Your password'}
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          if (errors.password) setErrors({ ...errors, password: undefined });
        }}
        disabled={pending}
        className={`auth-input${errors.password ? ' has-error' : ''}`}
        aria-invalid={!!errors.password}
        aria-describedby={errors.password ? 'auth-password-err' : undefined}
      />
      {errors.password && (
        <p id="auth-password-err" className="auth-field-err" role="alert">{errors.password}</p>
      )}

      {isSignup && (
        <>
          <label htmlFor="auth-confirm" className="auth-label">Confirm password</label>
          <input
            id="auth-confirm"
            type="password"
            autoComplete="new-password"
            required
            placeholder="Re-enter your password"
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              if (errors.confirm) setErrors({ ...errors, confirm: undefined });
            }}
            disabled={pending}
            className={`auth-input${errors.confirm ? ' has-error' : ''}`}
            aria-invalid={!!errors.confirm}
            aria-describedby={errors.confirm ? 'auth-confirm-err' : undefined}
          />
          {errors.confirm && (
            <p id="auth-confirm-err" className="auth-field-err" role="alert">{errors.confirm}</p>
          )}
        </>
      )}

      {errors.form && (
        <p className="auth-form-err" role="alert">{errors.form}</p>
      )}

      <button
        type="submit"
        className="auth-submit"
        disabled={pending}
      >
        {pending
          ? (isSignup ? 'Creating account…' : 'Signing in…')
          : (isSignup ? 'Create account' : 'Sign in')}
      </button>

      <p className="auth-toggle">
        {isSignup ? (
          <>
            Already have an account?{' '}
            <button
              type="button"
              className="auth-toggle-btn"
              onClick={() => {
                setMode('signin');
                setErrors({});
                setConfirm('');
              }}
            >
              Sign in
            </button>
          </>
        ) : (
          <>
            New to DANHOV?{' '}
            <button
              type="button"
              className="auth-toggle-btn"
              onClick={() => {
                setMode('signup');
                setErrors({});
              }}
            >
              Create an account
            </button>
          </>
        )}
      </p>
    </form>
  );
}
