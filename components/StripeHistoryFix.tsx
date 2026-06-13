'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * After Stripe redirects to the success page, the browser history contains
 * the Stripe-hosted checkout page. Clicking "back" would return the customer
 * to Stripe (or wherever they were before Stripe — possibly the old site).
 *
 * This component intercepts the popstate (back/forward) event and redirects
 * to the home page instead, so the back button always takes the customer
 * somewhere sensible on our site.
 */
export default function StripeHistoryFix() {
  const router = useRouter();
  useEffect(() => {
    // Push a duplicate entry so the first "back" just stays on this page,
    // then redirect home on the second press.
    window.history.pushState(null, '', window.location.href);
    const handlePop = () => {
      router.replace('/');
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [router]);
  return null;
}
