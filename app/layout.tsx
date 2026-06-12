import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { headers } from 'next/headers';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import Cursor from '@/components/Cursor';
import ChatWidget from '@/components/ChatWidget';
import { CartProvider } from '@/components/CartProvider';
import WishlistProvider from '@/components/WishlistProvider';
import CartDrawer from '@/components/CartDrawer';
import ScrollTopOnRoute from '@/components/ScrollTopOnRoute';
import { buildOrganization, jsonLdScript, SITE_URL } from '@/lib/seo';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'DANHOV — Handcrafted Luxury Jewelry · Los Angeles · Est. 1984',
    template: '%s — DANHOV',
  },
  description:
    'DANHOV is a luxury handcrafted jewelry house founded in Los Angeles in 1984 by Jack Hovsepian. Every engagement ring, wedding band, and fine-jewelry piece is made to order in 14k or 18k gold — with a lifetime craftsmanship warranty.',
  keywords: [
    'DANHOV',
    'luxury jewelry',
    'engagement rings',
    'wedding bands',
    'handcrafted jewelry',
    'Los Angeles jewelry',
    '14k gold',
    '18k gold',
    'Jack Hovsepian',
    'custom engagement rings',
    'spiral engagement rings',
    'Abbraccio',
    'Voltaggio',
    'sacred geometry rings',
  ],
  authors: [{ name: 'DANHOV', url: SITE_URL }],
  creator: 'DANHOV',
  publisher: 'DANHOV',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: 'DANHOV',
    title: 'DANHOV — Handcrafted Luxury Jewelry · Est. 1984',
    description:
      'Luxury handcrafted jewelry. Made to order in Los Angeles. 14k or 18k gold. Lifetime craftsmanship warranty.',
    images: [
      {
        url: '/danhov-logo-transparent.png',
        width: 1200,
        height: 630,
        alt: 'DANHOV — Luxury Handcrafted Jewelry',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DANHOV — Handcrafted Luxury Jewelry · Est. 1984',
    description:
      'Luxury handcrafted jewelry. Made to order in Los Angeles. 14k or 18k gold.',
    images: ['/danhov-logo-transparent.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: '/favicon.svg',
  },
  formatDetection: {
    telephone: true,
    address: true,
    email: true,
  },
  category: 'Jewelry',
};

export const viewport: Viewport = {
  themeColor: '#AC3438',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // The middleware sets `x-pathname` on every request. /admin/* routes are
  // a self-contained app — they shouldn't be wrapped in the public site
  // chrome (nav, footer, custom cursor, floating chat widget).
  const path = headers().get('x-pathname') ?? '';
  const isAdmin = path.startsWith('/admin');

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&display=swap"
          rel="stylesheet"
        />
        {!isAdmin && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={jsonLdScript(buildOrganization())}
          />
        )}
      </head>
      <body>
        {isAdmin ? (
          children
        ) : (
          <CartProvider>
            <WishlistProvider>
            <Suspense fallback={null}>
              <ScrollTopOnRoute />
            </Suspense>
            <Cursor />
            <Nav />
            <div className="route-content">{children}</div>
            <Footer />
            <CartDrawer />
            <Suspense fallback={null}>
              <ChatWidget />
            </Suspense>
            </WishlistProvider>
          </CartProvider>
        )}
      </body>
    </html>
  );
}
