import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type SignupBody = {
  email?: unknown;
  password?: unknown;
};

function isStr(v: unknown): v is string {
  return typeof v === 'string';
}

function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return 'Email is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) return 'Please enter a valid email address.';
  return null;
}

function validatePassword(pwd: string): string | null {
  if (!pwd) return 'Password is required.';
  if (pwd.length < 8) return 'Password must be at least 8 characters.';
  return null;
}

/**
 * POST /api/auth/signup
 *
 * Server-side signup using the Supabase admin client to mark the
 * email as already-confirmed (`email_confirm: true`). This bypasses
 * the "verify your email" flow entirely — when the client receives
 * a 200 it can immediately sign the user in with `signInWithPassword`.
 *
 * We do NOT return the session here. The client establishes its own
 * session via password sign-in, which keeps the auth cookie scoped to
 * the user's browser.
 */
export async function POST(req: Request) {
  let body: SignupBody;
  try {
    body = (await req.json()) as SignupBody;
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!isStr(body.email) || !isStr(body.password)) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  const emailErr = validateEmail(body.email);
  if (emailErr) return NextResponse.json({ error: emailErr }, { status: 400 });

  const pwdErr = validatePassword(body.password);
  if (pwdErr) return NextResponse.json({ error: pwdErr }, { status: 400 });

  // Service-role admin client — bypasses RLS and can mark emails
  // confirmed at create time.
  let admin: ReturnType<typeof createServiceClient>;
  try {
    admin = createServiceClient();
  } catch (err) {
    console.error('[signup] service-role client init failed:', err);
    return NextResponse.json(
      {
        error:
          'Authentication service is not configured on the server. The service-role Supabase key is missing.',
      },
      { status: 500 }
    );
  }

  let data, error;
  try {
    const res = await admin.auth.admin.createUser({
      email: body.email.trim(),
      password: body.password,
      email_confirm: true,
    });
    data = res.data;
    error = res.error;
  } catch (e) {
    console.error('[signup] admin.createUser threw:', e);
    return NextResponse.json(
      {
        error:
          e instanceof Error && e.message
            ? `Signup failed: ${e.message}`
            : 'Signup failed. Please try again.',
      },
      { status: 500 }
    );
  }

  if (error) {
    console.error('[signup] supabase error:', error);
    const m = (error.message || '').toLowerCase();
    if (
      m.includes('already registered') ||
      m.includes('already exists') ||
      m.includes('user already') ||
      m.includes('duplicate')
    ) {
      return NextResponse.json(
        {
          error: 'An account with this email already exists. Sign in instead.',
          code: 'EMAIL_TAKEN',
        },
        { status: 409 }
      );
    }
    if (m.includes('password')) {
      return NextResponse.json(
        { error: 'Password does not meet the security requirements.' },
        { status: 400 }
      );
    }
    if (m.includes('rate limit') || m.includes('too many')) {
      return NextResponse.json(
        { error: 'Too many attempts. Please wait a moment and try again.' },
        { status: 429 }
      );
    }
    // Bubble the real Supabase message up so the user sees a useful hint
    // (we already logged it server-side for debugging).
    return NextResponse.json(
      { error: `Signup failed: ${error.message || 'unknown error'}` },
      { status: 500 }
    );
  }

  if (!data?.user) {
    console.error('[signup] admin.createUser returned no user');
    return NextResponse.json(
      { error: 'Signup failed: no user returned from the server.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, user_id: data.user.id });
}
