"use client"; // Mark this file as a Client Component

import { SignedIn, SignedOut } from '@clerk/nextjs';
import { ArrowRightIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

import { BrandLogo } from '@/components/common/brand-logo';
import { Button } from '@/components/ui/button';

import FooterLinkGroup from './_components/footer-link-group';

// Custom hook for parallax effect
function useParallax() {
  const [scrollY, setScrollY] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return scrollY;
}

export default function HomePage(): React.JSX.Element {
  const scrollY = useParallax();
  const dashboardRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  
  return (
    <>
      <section 
        className="min-h-screen pt-36 pb-0 bg-[radial-gradient(hsl(210,72%,65%,40%),hsl(240,62%,73%,40%),hsl(var(--background))_60%)] flex items-center justify-center text-center text-balance flex-col gap-10 px-4 relative overflow-hidden"
        style={{
          backgroundPosition: `50% ${scrollY * 0.05}px`
        }}
      >
        <div 
          className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-background to-transparent pointer-events-none"
          style={{
            opacity: Math.min(1, scrollY / 200)
          }}
        />
        
        <div className="relative flex flex-col items-center gap-6 max-w-screen-xl mx-auto">
          <h1 
            className="text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight"
            style={{
              transform: `translateY(${Math.min(70, Math.max(0, scrollY * 0.3))}px)`,
              opacity: Math.max(0, 1 - scrollY / 500),
            }}
          >
            Discover Clinical Trials Efficiently
          </h1>
          <p 
            className="text-lg lg:text-3xl max-w-screen-xl"
            style={{
              transform: `translateY(${Math.min(70, Math.max(0, scrollY * 0.3))}px)`,
              opacity: Math.max(0, 1 - scrollY / 500),
            }}
          >
            Empower your research with access to real-time RFPs tailored to your
            therapeutic areas. Connect with leading sponsors and streamline your
            clinical trial journey.
          </p>
          <div 
            className="mt-4"
            style={{
              transform: `translateY(${Math.min(70, Math.max(0, scrollY * 0.3))}px)`,
              opacity: scrollY < 100 ? 1 : Math.max(0.75, 1 - (scrollY - 100) / 700),
            }}
          >
            <SignedIn>
              <Link href="/dashboard/studies">
                <Button className="text-lg p-6 rounded-xl flex gap-2">
                  Check it out <ArrowRightIcon className="size-5" />
                </Button>
              </Link>
            </SignedIn>
            <SignedOut>
              <div className="flex flex-col items-center">
                <Button
                  onClick={() => redirect('/sign-in')}
                  className="text-lg p-6 rounded-xl flex gap-2"
                >
                  Sign up for Free <ArrowRightIcon className="size-5" />
                </Button>
                <p className="text-xs text-black mt-2">No Credit Card Required</p>
              </div>
            </SignedOut>
          </div>
        </div>
      </section>
      <section className="pt-0 pb-4 relative">
        <div 
          className="container max-w-screen-xl mx-auto px-8"
          ref={dashboardRef}
        >
          <h2 
            className="text-4xl text-center font-semibold mb-8"
            style={{
              transform: `translateY(${Math.max(0, scrollY * 0.05 - 50)}px)`,
              opacity: Math.min(1, Math.max(0, (scrollY - 300) / 300))
            }}
          >
            Your Aiqaro Dashboard at a Glance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div 
              className="text-center h-[450px]"
              style={{
                transform: `translateX(${Math.min(0, (scrollY - 400) * 0.2)}px)`,
                opacity: Math.min(1, Math.max(0, (scrollY - 350) / 250))
              }}
            >
              <Image
                src="/DashboardScreen.png"
                alt="Aiqaro Dashboard Screenshot 1"
                className="rounded-lg shadow-lg object-cover w-full h-full"
                width={500}
                height={450}
              />
            </div>
            <div 
              className="text-center h-[450px]"
              style={{
                transform: `translateX(${Math.max(0, (scrollY - 400) * -0.2)}px)`,
                opacity: Math.min(1, Math.max(0, (scrollY - 350) / 250))
              }}
            >
              <Image
                src="/SavePrefScreen.png"
                alt="Aiqaro Dashboard Screenshot 2"
                className="rounded-lg shadow-lg object-cover w-full h-full"
                width={500}
                height={450}
              />
            </div>
          </div>
        </div>
      </section>
      <section 
        id="features" 
        className="bg-accent/5 py-16 relative"
        style={{
          backgroundPosition: `50% ${scrollY * 0.03}px`
        }}
        ref={featuresRef}
      >
        <div className="container max-w-screen-xl mx-auto px-8">
          <h2 
            className="text-4xl text-center font-semibold mb-12"
          >
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
            <div className="text-center">
              <h3 className="text-2xl font-bold">Contact Instantly</h3>
              <p>Easily connect with trial sponsors—click to email or call directly.</p>
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
