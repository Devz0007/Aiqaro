"use client"; // Mark this file as a Client Component

import { SignedIn, SignedOut } from '@clerk/nextjs';
import { ArrowRightIcon } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { BrandLogo } from '@/components/common/brand-logo';
import { Button } from '@/components/ui/button';

import FooterLinkGroup from './_components/footer-link-group';
import { ClerkIcon } from './_icons/clerk';
import { NeonIcon } from './_icons/neon';

export default function HomePage(): React.JSX.Element {
  return (
    <>
      <section className="min-h-screen bg-[radial-gradient(hsl(210,72%,65%,40%),hsl(240,62%,73%,40%),hsl(var(--background))_60%)] flex items-center justify-center text-center text-balance flex-col gap-8 px-4">
        <h1 className="text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight m-4">
          Discover Clinical Trials Efficiently
        </h1>
        <p className="text-lg lg:text-3xl max-w-screen-xl">
          Empower your research with access to real-time RFPs tailored to your
          therapeutic areas. Connect with leading sponsors and streamline your
          clinical trial journey.
        </p>
        <SignedIn>
          <Link href="/dashboard/studies">
            <Button className="text-lg p-6 rounded-xl flex gap-2">
              Check it out <ArrowRightIcon className="size-5" />
            </Button>
          </Link>
        </SignedIn>
        <SignedOut>
          <Button
            onClick={() => redirect('/sign-in')} // Now it redirects correctly
            className="text-lg p-6 rounded-xl flex gap-2"
          >
            Get started now <ArrowRightIcon className="size-5" />
          </Button>
        </SignedOut>
      </section>
      <section className="bg-primary text-primary-foreground">
        <div className="container py-16 flex flex-col gap-16 px-8 md:px-16">
          <h2 className="text-3xl text-center text-balance">
            Trusted by Leading Organizations
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-16">
            <Link href="https://neon.tech">
              <NeonIcon />
            </Link>
            <Link href="https://clerk.com">
              <ClerkIcon />
            </Link>
          </div>
        </div>
      </section>
      <section id="features" className="bg-accent/5 py-16">
        <div className="container max-w-screen-xl mx-auto px-8">
          <h2 className="text-4xl text-center font-semibold mb-12">
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold">Smart Matching</h3>
              <p>Automatically match RFPs to your areas of expertise.</p>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold">Real-time Alerts</h3>
              <p>
                Receive instant updates when new relevant RFPs are available.
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold">Secure Platform</h3>
              <p>Ensure enterprise-grade security for your sensitive data.</p>
            </div>
          </div>
        </div>
      </section>
      {/* <Pricing /> */}
      <footer className="container pt-16 pb-8 flex flex-col sm:flex-row gap-8 sm:gap-4 justify-between items-start">
        <Link href="/">
          <BrandLogo />
        </Link>
        <div className="flex flex-col sm:flex-row gap-8">
          <FooterLinkGroup
            title="Resources"
            links={[
              { label: 'Help Center', href: '#' },
              { label: 'API Documentation', href: '#' },
            ]}
          />
          <FooterLinkGroup
            title="Company"
            links={[
              { label: 'About Us', href: '#' },
              { label: 'Contact', href: '#' },
            ]}
          />
        </div>
      </footer>
    </>
  );
}
