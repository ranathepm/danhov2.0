'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/**
 * Top-nav account control. Two states:
 *  • signed out → renders as a link to /account with the silhouette icon
 *  • signed in  → renders as a button showing the email's first initial.
 *    Clicking opens a small dropdown with the email and a Sign Out action.
 */
export default function AccountMenu() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Track auth state — fires on sign-in (from anywhere) and on sign-out
  useEffect(() => {
    const supabase = createClient();
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setEmail(data.user?.email ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      setOpen(false);
      router.refresh();
      router.push('/');
    } finally {
      setSigningOut(false);
    }
  }

  if (!email) {
    return (
      <Link
        href="/account"
        className="nav-icon-btn nav-glow-frame"
        aria-label="Account"
      >
        <UserIcon />
      </Link>
    );
  }

  const initial = email.trim().charAt(0).toUpperCase() || 'U';

  return (
    <div className="nav-acct-wrap" ref={wrapRef}>
      <button
        type="button"
        className="nav-icon-btn nav-glow-frame nav-acct-btn"
        aria-label={`Signed in as ${email}. Open account menu.`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="nav-acct-initial" aria-hidden="true">{initial}</span>
      </button>

      {open && (
        <div className="nav-acct-menu" role="menu" ref={menuRef}>
          <div className="nav-acct-menu-head">
            <div className="nav-acct-menu-avatar" aria-hidden="true">{initial}</div>
            <div className="nav-acct-menu-id">
              <div className="nav-acct-menu-label">Signed in as</div>
              <div className="nav-acct-menu-email" title={email}>{email}</div>
            </div>
          </div>

          <Link
            href="/account"
            className="nav-acct-menu-item"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            My Account
          </Link>
          <Link
            href="/cart"
            className="nav-acct-menu-item"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            View Cart
          </Link>

          <div className="nav-acct-menu-rule" aria-hidden="true" />

          <button
            type="button"
            className="nav-acct-menu-item nav-acct-menu-item--danger"
            role="menuitem"
            onClick={handleSignOut}
            disabled={signingOut}
          >
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      )}
    </div>
  );
}

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8.5" r="3.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4.5 20c1.6-4 4.5-6 7.5-6s5.9 2 7.5 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
