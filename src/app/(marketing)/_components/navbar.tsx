"use client";

import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignOutButton,
} from '@clerk/nextjs';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { BrandLogo } from '@/components/common/brand-logo';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';

export function NavBar(): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  
  const handleLinkClick = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  return (
    <div className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-sm shadow-md">
      <nav className="flex items-center justify-between py-6 px-4 md:px-8 container">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <BrandLogo />
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6 font-semibold">
          <Link className="text-lg" href="/#features">
            Features
          </Link>
          <Link className="text-lg" href="/#pricing">
            Pricing
          </Link>
          <Link className="text-lg" href="/about-us">
            About
          </Link>
          <SignedIn>
            <Link className="text-lg" href="/dashboard/studies">
              Dashboard
            </Link>
            {/* Sign Out Button for desktop */}
            <SignOutButton>
              <Button variant="ghost" className="text-lg h-auto py-0">
                Log Out
              </Button>
            </SignOutButton>
          </SignedIn>
          <SignedOut>
            <SignInButton>
              <Button variant="ghost" className="text-lg h-auto py-0">
                Login
              </Button>
            </SignInButton>
          </SignedOut>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <Drawer open={isOpen} onOpenChange={setIsOpen}>
            <DrawerTrigger asChild>
              <button
                type="button"
                className="p-2 text-lg rounded-md hover:bg-gray-200"
                aria-label="Open Menu"
              >
                ☰
              </button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                {/* Accessible DrawerTitle */}
                <DrawerTitle>
                  <VisuallyHidden>Navigation Menu</VisuallyHidden>
                </DrawerTitle>
                <DrawerClose asChild>
                  <button
                    type="button"
                    className="absolute top-4 right-4 p-2 rounded-md hover:bg-gray-200"
                    aria-label="Close Menu"
                  >
                    ✕
                  </button>
                </DrawerClose>
              </DrawerHeader>
              <div className="mt-6 flex flex-col gap-4 px-4 py-4 font-semibold">
                <button 
                  className="text-lg text-left" 
                  onClick={() => handleLinkClick('/#features')}
                >
                  Features
                </button>
                <button 
                  className="text-lg text-left" 
                  onClick={() => handleLinkClick('/#pricing')}
                >
                  Pricing
                </button>
                <button 
                  className="text-lg text-left" 
                  onClick={() => handleLinkClick('/about-us')}
                >
                  About
                </button>
                <SignedIn>
                  <button 
                    className="text-lg text-left" 
                    onClick={() => handleLinkClick('/dashboard/studies')}
                  >
                    Dashboard
                  </button>
                  {/* Sign Out Button for mobile */}
                  <SignOutButton>
                    <Button variant="ghost" className="text-lg">
                      Log Out
                    </Button>
                  </SignOutButton>
                </SignedIn>
                <SignedOut>
                  <SignInButton>
                    <Button variant="ghost" className="text-lg">
                      Login
                    </Button>
                  </SignInButton>
                </SignedOut>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </nav>
    </div>
  );
}
