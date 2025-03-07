// src/lib/providers/index.tsx
'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import React from 'react';

const queryClient = new QueryClient();

export function Providers({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <ClerkProvider>
        {children}
        {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
      </ClerkProvider>
    </QueryClientProvider>
  );
}
