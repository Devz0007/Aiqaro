// src/app/components/study/skeleton.tsx
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function StudyDetailsSkeleton(): React.JSX.Element {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="space-y-6">
        {/* Back Button Skeleton */}
        <Skeleton className="h-10 w-24" />

        <Card>
          <CardHeader>
            <div className="space-y-2">
              {/* Title Skeleton */}
              <Skeleton className="h-8 w-3/4" />
              {/* NCT ID Skeleton */}
              <Skeleton className="h-4 w-1/3" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status Grid Skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </div>

            {/* Brief Summary Section Skeleton */}
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-24 w-full" />
            </div>

            {/* Detailed Description Section Skeleton */}
            <div className="space-y-4">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-32 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
