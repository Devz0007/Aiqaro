// src/app/studies/components/studies-grid.tsx
'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import React from 'react';

import { useFetchAllBookmarksByUserId } from '@/hooks/bookmarks/use-bookmarks';
import { Study } from '@/types/clinical-trials/study';

import StudyCard from './study-card';

const StudiesGrid = ({ studies }: { studies: Study[] }): React.JSX.Element => {
  const { user } = useUser();
  const router = useRouter();
  const { data: bookmarks, isLoading: isBookmarksLoading } =
    useFetchAllBookmarksByUserId({
      userId: user?.id ?? '',
      enabled: !!user,
    });
  const handleViewDetails = (nctId: string): void => {
    router.push(`/dashboard/study/${nctId}`);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
      {studies.length > 0 ? (
        studies.map((study) => {
          const nctId =
            study.protocolSection?.identificationModule?.nctId ?? '';
          return (
            <StudyCard
              _isBookmarksLoading={isBookmarksLoading}
              _isBookmarked={bookmarks?.some(
                (bookmark) =>
                  bookmark.nct_id === nctId && bookmark.is_bookmarked
              )}
              key={nctId ?? ''}
              study={study}
              onViewDetails={handleViewDetails}
              userId={user?.id ?? ''}
            />
          );
        })
      ) : (
        <p className="text-center text-muted-foreground col-span-full">
          No studies found. Try adjusting your search criteria.
        </p>
      )}
    </div>
  );
};

export default StudiesGrid;
