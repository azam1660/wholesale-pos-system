import type { Metadata } from 'next';
import './globals.css';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: 'Wholesale POS App',
    template: '%s | Wholesale POS App',
  },
  description: 'Wholesale POS system for efficient inventory and sales management – created by nexifive.in',
  applicationName: 'Wholesale POS App',
  generator: 'Next.js 15',
  referrer: 'origin-when-cross-origin',
  keywords: ['wholesale POS', 'point of sale', 'inventory management', 'retail POS', 'nexifive.in'],
  authors: [{ name: 'Nexifive', url: 'https://nexifive.in' }],
  creator: 'Nexifive',
  publisher: 'Nexifive',
  metadataBase: new URL('https://nexifive.in'),
  openGraph: {
    title: 'Wholesale POS App',
    description: 'Wholesale POS system for efficient inventory and sales management – created by nexifive.in',
    url: 'https://nexifive.in',
    siteName: 'Wholesale POS App',
    images: [
      {
        url: 'https://nexifive.in/og-image.png', // Add your OG image
        width: 1200,
        height: 630,
        alt: 'Wholesale POS App',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wholesale POS App',
    description: 'Efficient wholesale POS system – Created by nexifive.in',
    creator: '@your_twitter_handle',
    images: ['https://nexifive.in/twitter-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
    },
  },
  category: 'Business',
  alternates: {
    canonical: 'https://nexifive.in',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
