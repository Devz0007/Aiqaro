'use client';

import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';

import { Button } from '@/components/ui/button';

export function BackButton(): React.JSX.Element {
  const router = useRouter();

  return (
    <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
      <ChevronLeft className="w-4 h-4 mr-2" />
      Back to Search
    </Button>
  );
}
