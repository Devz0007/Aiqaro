'use client';

import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const Fallback = ({ error }: { error: Error }): React.JSX.Element => {
  const router = useRouter();

  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-center text-muted-foreground">
          {error.message ?? 'An error occurred'}
        </p>
        <Button variant="ghost" className="mt-4" onClick={() => router.back()}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Search
        </Button>
      </CardContent>
    </Card>
  );
};

export default Fallback;
