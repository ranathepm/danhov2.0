'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart, formatUsd } from '@/components/CartProvider';

export default function CartDrawer() {
  const { drawerOpen, closeDrawer, items, count, subtotal, removeItem, setQty } = useCart();

  // Lock body scroll while open
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  // Close on Escape
  useEffect(() => {
    if (!drawerOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeDrawer();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen, closeDrawer]);

  return (
    <>
      <div
        className={`cart-scrim${drawerOpen ? ' is-open' : ''}`}
        onClick={closeDrawer}
        aria-hidden="true"
      />
      <aside
        className={`cart-drawer${drawerOpen ? ' is-open' : ''}`}
        aria-hidden={!drawerOpen}
        aria-label="Your cart"
      >
        <header className="cart-drawer-head">
          <div>
            <div className="cart-drawer-eyebrow">— Your Cart</div>
            <h2 className="cart-drawer-title">
              {count === 0 ? 'Empty' : `${count} ${count === 1 ? 'piece' : 'pieces'}`}
            </h2>
          </div>
          <button
            type="button"
            className="cart-drawer-close"
            onClick={closeDrawer}
            aria-label="Close cart"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        {items.length === 0 ? (
          <div className="cart-drawer-empty">
            <p>Your cart is empty.</p>
            <p className="cart-drawer-empty-sub">
              Each DANHOV piece is handcrafted to order in Los Angeles.
            </p>
            <Link href="/engagement-rings" className="btn-primary" onClick={closeDrawer}>
              Browse Engagement
            </Link>
          </div>
        ) : (
          <>
            <ul className="cart-drawer-list">
              {items.map((it) => {
                const isGiftCard = it.sku === 'GIFT-CARD';
                const itemHref = isGiftCard ? '/gift-cards' : `/product/${it.slug}`;
                return (
                <li key={it.id} className="cart-line">
                  <Link
                    href={itemHref}
                    className="cart-line-media"
                    onClick={closeDrawer}
                  >
                    {it.image ? (
                      <Image
                        src={it.image}
                        alt={it.name}
                        width={120}
                        height={120}
                        sizes="120px"
                      />
                    ) : (
                      <div className="cart-line-media-fallback">
                        {isGiftCard ? (
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <rect x="2" y="8" width="20" height="13" rx="1" stroke="currentColor" strokeWidth="1.4"/>
                            <path d="M2 11h20" stroke="currentColor" strokeWidth="1.4"/>
                            <path d="M12 8V3M9 5.5C9 4.12 10.12 3 11.5 3s2.5 1.12 2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                          </svg>
                        ) : (
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M6 9l6-6 6 6-6 12L6 9z" stroke="currentColor" strokeWidth="1" />
                          </svg>
                        )}
                      </div>
                    )}
                  </Link>
                  <div className="cart-line-body">
                    <div className="cart-line-top">
                      <div>
                        {it.collection && (
                          <div className="cart-line-coll">{it.collection}</div>
                        )}
                        <Link
                          href={itemHref}
                          className="cart-line-name"
                          onClick={closeDrawer}
                        >
                          {it.name}
                        </Link>
                        {it.metal && (
                          <div className="cart-line-meta">{it.metal}</div>
                        )}
                        {isGiftCard && it.giftCard && (
                          <div className="cart-line-meta" style={{ fontSize: 11 }}>
                            To: {it.giftCard.recipientName}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        className="cart-line-remove"
                        onClick={() => removeItem(it.id)}
                        aria-label={`Remove ${it.name}`}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                    <div className="cart-line-bottom">
                      <div className="cart-line-qty">
                        <button
                          type="button"
                          onClick={() => setQty(it.id, it.qty - 1)}
                          aria-label="Decrease quantity"
                        >−</button>
                        <span aria-live="polite">{it.qty}</span>
                        <button
                          type="button"
                          onClick={() => setQty(it.id, it.qty + 1)}
                          aria-label="Increase quantity"
                        >+</button>
                      </div>
                      <div className="cart-line-price">
                        {it.price_num > 0 ? formatUsd(it.price_num * it.qty) : 'Inquire'}
                      </div>
                    </div>
                  </div>
                </li>
                );
              })}
            </ul>

            <footer className="cart-drawer-foot">
              <div className="cart-drawer-totals">
                <span>Subtotal</span>
                <span>{subtotal > 0 ? formatUsd(subtotal) : 'Price on inquiry'}</span>
              </div>
              <p className="cart-drawer-note">
                Each piece is handcrafted to order — your specialist confirms
                final pricing and timeline within 24 hours.
              </p>
              <div className="cart-drawer-actions">
                <Link href="/cart" className="btn-primary" onClick={closeDrawer}>
                  Review Cart
                </Link>
                <button
                  type="button"
                  className="btn-solid"
                  onClick={closeDrawer}
                >
                  Continue Browsing
                </button>
              </div>
            </footer>
          </>
        )}
      </aside>
    </>
  );
}
