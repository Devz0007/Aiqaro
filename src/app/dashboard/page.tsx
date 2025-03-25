// src/app/dashboard/page.tsx
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

const DashboardPage = (): React.JSX.Element => {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  
  useEffect(() => {
    console.log('[DASHBOARD] Main dashboard loaded, redirecting to studies');
    // Redirect to studies page after a short delay
    const redirectTimer = setTimeout(() => {
      if (user && isLoaded) {
        router.push('/dashboard/studies');
      }
    }, 300);
    
    return () => clearTimeout(redirectTimer);
  }, [router, user, isLoaded]);
  
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p>Loading studies dashboard...</p>
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="aspect-video rounded-xl bg-muted/50 flex items-center justify-center">
          <span>Loading...</span>
        </div>
        <div className="aspect-video rounded-xl bg-muted/50 flex items-center justify-center">
          <span>Loading...</span>
        </div>
        <div className="aspect-video rounded-xl bg-muted/50 flex items-center justify-center">
          <span>Loading...</span>
        </div>
      </div>
      <div className="min-h-[50vh] flex-1 rounded-xl bg-muted/50 md:min-h-min flex items-center justify-center">
        <span>Redirecting to studies...</span>
      </div>
    </div>
  );
};

export default DashboardPage;
