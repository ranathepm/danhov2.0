'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import AuthForm from '@/components/AuthForm';

export default function AccountSignIn() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // If we arrived here from a redirect that wants us to come back to a
  // specific path after auth, honour it; otherwise default to home.
  const next = searchParams?.get('next') || '/';

  function handleSuccess() {
    // refresh first so the server-rendered /account branch flips to
    // the signed-in dashboard, then navigate to the intended landing page.
    router.refresh();
    router.push(next);
  }

  return (
    <main className="account-page">
      <div className="account-card sacred-glow">
        <AuthForm
          initialMode="signup"
          eyebrow="Sign in or sign up to DANHOV"
          subtitle="Create your account in seconds — track your orders, save pieces, and your cart follows you across devices."
          onSuccess={handleSuccess}
        />
      </div>
    </main>
  );
}
