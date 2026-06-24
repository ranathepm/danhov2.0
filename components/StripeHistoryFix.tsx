'use client';

import { useEffect } from 'react';

/**
 * After Stripe redirects to the success page, push a duplicate history entry
 * so pressing back once stays on this page rather than jumping to Stripe.
 * A second back press navigates naturally in the browser history.
 */
export default function StripeHistoryFix() {
  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
  }, []);
  return null;
}
