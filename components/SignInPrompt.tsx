'use client';

import { useEffect } from 'react';
import AuthForm from '@/components/AuthForm';

type Props = {
  open: boolean;
  onClose: () => void;
  /** Fires once the user is fully signed in (session present). The parent
   *  should complete the pending add-to-cart and close the modal. */
  onSignedIn: () => void;
  pieceName: string;
};

export default function SignInPrompt({ open, onClose, onSignedIn, pieceName }: Props) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="sip-scrim" onClick={onClose} aria-hidden="true" />
      <div
        className="sip-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sip-title"
      >
        <button
          type="button"
          className="sip-close"
          onClick={onClose}
          aria-label="Close sign-in"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>

        <div className="sip-scroll">
          <AuthForm
            initialMode="signup"
            eyebrow="Sign up to add to cart"
            subtitle={`Create your DANHOV account to add the ${pieceName} to your cart. Your cart, saved pieces, and commission stay with your account.`}
            onSuccess={onSignedIn}
            compact
          />
        </div>
      </div>
    </>
  );
}
