'use client';

import { useEffect, useRef } from 'react';
import { useCart } from '@/components/CartProvider';

/**
 * Mounts inside /order/success when the order has been confirmed paid.
 * Clears the customer's localStorage cart so the next page they visit
 * doesn't still show the pieces they just paid the deposit on.
 *
 * Runs at most once per mount via the `done` ref so a re-render
 * doesn't repeatedly call clear().
 */
export default function CartClearOnSuccess() {
  const { clear } = useCart();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    clear();
  }, [clear]);

  return null;
}
