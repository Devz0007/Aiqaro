// src/app/layout.tsx
import BodyGTM from '@/components/body-gtm'; // <--- (1) Import the BodyGTM component
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import React from 'react';
import Script from 'next/script'; // <--- (2) Import the Script component

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
  const gtmId = 'GTM-TJDC7L6D'; // <--- (3) Define your GTM ID here
  return (
    <html lang="en">
      <head>
        <Script // <--- (4) Add the Script component
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${gtmId}');`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <BodyGTM gtmId={gtmId} /> {/* <--- (5) Add the BodyGTM component */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
