// src/app/dashboard/studies/components/studies-grid.tsx
'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import React from 'react';

import { Study } from '@/types/clinical-trials/study';
import StudyCard from './study-card';

interface StudiesGridProps {
  studies: Study[];
  onBookmarkToggle: (nctId: string, title: string, url: string) => void;
  isBookmarked: (nctId: string) => boolean;
}

export default function StudiesGrid({ 
  studies,
  onBookmarkToggle,
  isBookmarked
}: StudiesGridProps): React.JSX.Element {
  const { user } = useUser();
  const router = useRouter();

  const handleViewDetails = (nctId: string): void => {
    router.push(`/dashboard/study/${nctId}`);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
      {studies.map((study) => {
        const nctId = study.protocolSection?.identificationModule?.nctId ?? '';
        return (
          <StudyCard
            key={nctId}
            study={study}
            onViewDetails={handleViewDetails}
            userId={user?.id ?? ''}
            _isBookmarksLoading={false}
            _isBookmarked={isBookmarked(nctId)}
            onBookmarkToggle={onBookmarkToggle}
          />
        );
      })}
    </div>
  );
}
