"use client"; // Mark this file as a Client Component

import { SignedIn, SignedOut } from '@clerk/nextjs';
import { ArrowRightIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { BrandLogo } from '@/components/common/brand-logo';
import { Button } from '@/components/ui/button';

import FooterLinkGroup from './_components/footer-link-group';

export default function HomePage(): React.JSX.Element {
  return (
    <>
      <section className="min-h-screen pt-24 bg-[radial-gradient(hsl(210,72%,65%,40%),hsl(240,62%,73%,40%),hsl(var(--background))_60%)] flex items-center justify-center text-center text-balance flex-col gap-8 px-4">
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
            Sign up for Free <ArrowRightIcon className="size-5" />
          </Button>
            <p className="text-xs text-black -mt-6">No Credit Card Required</p>
        </SignedOut>
      </section>
      <section className="py-8">
        <div className="container max-w-screen-xl mx-auto px-8">
          <h2 className="text-4xl text-center font-semibold mb-12">
            Your AIqaro Dashboard at a Glance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="text-center h-[450px]">
              <Image
                src="/DashboardScreen.png"
                alt="AIqaro Dashboard Screenshot 1"
                className="rounded-lg shadow-lg object-cover w-full h-full"
                width={500}
                height={450}
              />
            </div>
            <div className="text-center h-[450px]">
              <Image
                src="/SavePrefScreen.png"
                alt="AIqaro Dashboard Screenshot 2"
                className="rounded-lg shadow-lg object-cover w-full h-full"
                width={500}
                height={450}
              />
            </div>
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
      <footer className="container pt-16 pb-8 flex flex-col sm:flex-row gap-8 sm:gap-4 justify-between items-start">
        <Link href="/">
          <BrandLogo />
        </Link>
        <div className="flex flex-col sm:flex-row gap-8">
          <FooterLinkGroup
            title="Resources"
            links={[
              { label: 'Help Center', href: '/about-us' },
              //{ label: 'API Documentation', href: '#' },
            ]}
          />
          <FooterLinkGroup
            title="Company"
            links={[
              { label: 'About Us', href: '/about-us' },
              { label: 'Contact', href: '#' },
            ]}
          />
        </div>
      </footer>
    </>
  );
}
