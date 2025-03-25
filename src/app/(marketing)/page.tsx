"use client"; // Mark this file as a Client Component

import { SignedIn, SignedOut, useUser } from '@clerk/nextjs';
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
  const { user } = useUser();
  
  // Function to pre-cache preferences
  const preCacheUserPreferences = () => {
    if (user?.id) {
      console.log('[Homepage] Pre-caching preferences for user:', user.id);
      
      // Use fetch directly to get fresh data
      return fetch(`/api/preferences/${user.id}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            // Cache data with current timestamp
            localStorage.setItem(`user_preferences_${user.id}`, JSON.stringify(data));
            localStorage.setItem(`preferences_last_loaded_${user.id}`, Date.now().toString());
            console.log('[Homepage] Preferences pre-cached for navigation');
            
            // Set a flag to force reload on dashboard
            localStorage.setItem('force_preferences_reload', 'true');
            return true;
          }
          return false;
        })
        .catch(err => {
          console.error("Error pre-caching preferences:", err);
          return false;
        });
    }
    return Promise.resolve(false);
  };
  
  return (
    <>
      <section 
        className="min-h-[85vh] pt-24 pb-0 bg-[radial-gradient(hsl(210,72%,65%,40%),hsl(240,62%,73%,40%),hsl(var(--background))_60%)] flex items-center justify-center text-center text-balance flex-col gap-6 px-4 relative overflow-hidden"
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
        
        <div className="relative flex flex-col items-center gap-4 max-w-screen-xl mx-auto">
          <h1 
            className="text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight"
            style={{
              transform: `translateY(${Math.min(70, Math.max(0, scrollY * 0.3))}px)`,
              opacity: Math.max(0, 1 - scrollY / 500),
            }}
          >
            Discover Clinical Trials Efficiently
          </h1>
          <p 
            className="text-base lg:text-2xl max-w-screen-xl"
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
              <Link 
                href={`/dashboard/studies?refresh=true&t=${Date.now()}`}
                onClick={(e) => {
                  e.preventDefault(); // Prevent default navigation
                  preCacheUserPreferences().then(() => {
                    // Navigate after preferences are cached
                    window.location.href = `/dashboard/studies?refresh=true&t=${Date.now()}`;
                  });
                }}
              >
                <Button className="text-lg p-5 rounded-xl flex gap-2">
                  Check it out <ArrowRightIcon className="size-5" />
                </Button>
              </Link>
            </SignedIn>
            <SignedOut>
              <div className="flex flex-col items-center">
                <div className="bg-background/30 backdrop-blur-md px-4 py-1 rounded-full mb-3 border border-primary/20">
                  <p className="text-sm font-semibold text-primary">Exclusive Introductory Offer: Lock in Free Access Today!</p>
                </div>
                <Button
                  onClick={() => redirect('/sign-in')}
                  className="text-lg p-5 rounded-xl flex gap-2 shadow-lg hover:shadow-xl transition-all"
                >
                  Sign up for Free <ArrowRightIcon className="size-5" />
                </Button>
                <p className="text-xs text-black mt-2">No Credit Card Required</p>
              </div>
            </SignedOut>
          </div>
        </div>

        {/* Social Proof - Moved inside hero section */}
        <div 
          className="container max-w-screen-xl mx-auto mt-16"
          style={{
            transform: `translateY(${Math.min(70, Math.max(0, scrollY * 0.3))}px)`,
            opacity: scrollY < 100 ? 1 : Math.max(0.75, 1 - (scrollY - 100) / 700),
          }}
        >
          <div className="flex justify-center mb-6">
            <div className="bg-background/40 backdrop-blur-sm px-6 py-3 rounded-full border border-primary/20 flex items-center">
              <div className="flex items-center mr-3">
                <div className="p-1.5 rounded-full bg-primary/10">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-sm font-medium">Already Trusted by <span className="font-bold">30+ Research Sites</span> & Growing Daily!</p>
            </div>
          </div>
          
          {/* Benefits Cards - Moved inside hero section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-background/30 backdrop-blur-sm p-4 rounded-xl border border-accent/20 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center mb-2">
                <div className="p-2 rounded-full bg-primary/10 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold">Save 10+ Hours Per Week</h3>
              </div>
              <p className="text-sm">Instantly connect with sponsors and eliminate manual RFP searches</p>
            </div>
            
            <div className="bg-background/30 backdrop-blur-sm p-4 rounded-xl border border-accent/20 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center mb-2">
                <div className="p-2 rounded-full bg-primary/10 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="font-semibold">Cut Response Time in Half</h3>
              </div>
              <p className="text-sm">Connect directly with trial sponsors and save your preferences for faster matching</p>
            </div>
            
            <div className="bg-background/30 backdrop-blur-sm p-4 rounded-xl border border-accent/20 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center mb-2">
                <div className="p-2 rounded-full bg-primary/10 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="font-semibold">No Risk to Try</h3>
              </div>
              <p className="text-sm">No credit card needed. No commitment. Just smarter RFP matching.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="pt-12 pb-12">
        <div 
          className="container max-w-screen-xl mx-auto px-8"
          ref={dashboardRef}
        >
          <h2 className="text-4xl text-center font-semibold mb-8">
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
