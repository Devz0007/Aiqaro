// src/app/dashboard/layout.tsx
'use client';

import { useUser } from '@clerk/nextjs';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import Loader from '@/components/common/loader';
import AppHeader from '@/components/sidebar/app-header';
import { AppSidebar } from '@/components/sidebar/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

const DashboardLayout = ({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element => {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  // Use client-side only state to avoid hydration mismatch
  const [isMounted, setIsMounted] = useState(false);

  // Add debug logging for user authentication
  useEffect(() => {
    if (isLoaded) {
      console.log("[DASHBOARD LAYOUT] User loaded:", {
        isSignedIn,
        userId: user?.id,
        userLoaded: isLoaded
      });
    }
  }, [isLoaded, isSignedIn, user]);

  // Set mounted state after hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Wait for user to be loaded and redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      console.log("[DASHBOARD LAYOUT] User not signed in, redirecting to home");
      router.push('/');
    }
  }, [isLoaded, isSignedIn, router]);

  // Show a consistent initial UI for both server and client render
  // Only reveal conditional UI after client-side hydration is complete
  if (!isMounted) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader />
      </div>
    );
  }

  // Show loader while user is loading
  if (!isLoaded || !isSignedIn) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader />
      </div>
    );
  }

  // Only render dashboard when we have a user ID
  if (!user?.id) {
    console.log("[DASHBOARD LAYOUT] User ID not available yet");
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
};

export default DashboardLayout;
