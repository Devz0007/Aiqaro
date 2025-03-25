// src/app/layout.tsx
import './globals.css';

import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import Script from 'next/script';
import React from 'react';

import { APP_DESCRIPTION, APP_NAME } from '@/lib/constants/common';
import { Providers } from '@/lib/providers';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          id="gtm"
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtm.js?id=GTM-TJDC7L6D"
        />
        <Script
          id="gtm-config"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'GTM-TJDC7L6D');
            `,
          }}
        />
        <SpeedInsights />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-TJDC7L6D"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}