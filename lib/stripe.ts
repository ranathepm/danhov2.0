/**
 * Lazy Stripe client — only instantiates if STRIPE_SECRET_KEY is set,
 * so the rest of the app keeps building when Stripe isn't wired up.
 */

import Stripe from 'stripe';

let cached: Stripe | null = null;

export function getStripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured');
  cached = new Stripe(key, {
    typescript: true,
  });
  return cached;
}

export const DEPOSIT_PERCENT = 1; // Full payment charged at checkout
