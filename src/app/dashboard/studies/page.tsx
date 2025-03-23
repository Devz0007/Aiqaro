// src/app/dashboard/studies/page.tsx
'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation'; // For redirecting
import React, { useEffect, useState } from 'react';

import Loader from '@/components/common/loader';
import PreferenceModal from '@/components/common/preference-modal';
import { Button } from '@/components/ui/button';
import { useStudiesInfiniteQuery } from '@/hooks/studies/use-studies-infinite-query';
import {
  useFetchUserPreferences,
  useSaveUserPreferences,
} from '@/hooks/studies/use-user-preferences';
import { Sex, SortDirection, SortField } from '@/types/clinical-trials/filters';
import { Study } from '@/types/clinical-trials/study';
import { SearchForm } from '@/types/common/form';
import { useFetchAllBookmarksByUserId } from '@/hooks/bookmarks/use-bookmarks';

import { exportStudiesToCSV } from '../../../lib/utils/export-studies-to-csv';

import StudiesForm from './components/studies-form';
import StudiesGrid from './components/studies-grid';

const DEFAULT_FORM_VALUES: SearchForm = {
  searchTerm: '',
  phase: [],
  status: [],
  location: 'United States',
  therapeuticArea: [],
  sortField: SortField.LAST_UPDATE_POST_DATE,
  sortDirection: SortDirection.DESC,
  minAge: '1',
  maxAge: '100',
  gender: Sex.ALL,
  healthyVolunteers: false,
  showBookmarksOnly: false,
};

export default function ClinicalTrialsSearch(): React.JSX.Element {
  const { user, isLoaded } = useUser();
  const router = useRouter(); // Use router for navigation
  const [formData, setFormData] = useState<SearchForm>(DEFAULT_FORM_VALUES);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch user preferences
  const { data: userPreferences, isLoading: isLoadingPreferences } =
    useFetchUserPreferences({ userId: user?.id ?? '' });

  // Save user preferences mutation
  const { mutate: savePreferences } = useSaveUserPreferences();

  // Fetch clinical trials based on form data
  const {
    data,
    error,
    isLoading: isLoadingStudies,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useStudiesInfiniteQuery(formData);

  // Fetch user bookmarks to filter studies
  const { data: userBookmarks, isLoading: isLoadingBookmarks, refetch: refetchBookmarks } = useFetchAllBookmarksByUserId({
    userId: user?.id ?? '',
    enabled: !!user, // Always fetch bookmarks when user is logged in
  });

  // Log the bookmarks for debugging
  useEffect(() => {
    if (formData.showBookmarksOnly && userBookmarks) {
      console.log("Total bookmarks fetched:", userBookmarks.length);
      console.log("Bookmark data sample:", userBookmarks.slice(0, 2));
    }
  }, [formData.showBookmarksOnly, userBookmarks]);

  // Refetch bookmarks when toggle changes
  useEffect(() => {
    if (user && formData.showBookmarksOnly) {
      refetchBookmarks();
    }
  }, [formData.showBookmarksOnly, refetchBookmarks, user]);

  // Filter studies based on bookmarks if showBookmarksOnly is true
  const studies: Study[] = React.useMemo(() => {
    const allStudies = data?.pages.flatMap((page) => page.studies) ?? [];
    
    if (!formData.showBookmarksOnly || !userBookmarks) {
      return allStudies;
    }
    
    // Make sure we have bookmarks
    if (userBookmarks.length === 0) {
      console.log("No bookmarks found for filtering");
      return [];
    }
    
    console.log(`Filtering ${allStudies.length} studies with ${userBookmarks.length} bookmarks`);
    
    // Create a Set of bookmarked NCT IDs for faster lookup
    const bookmarkedNctIds = new Set(
      userBookmarks.map(bookmark => bookmark.nct_id)
    );
    
    console.log("First few bookmarked NCT IDs:", Array.from(bookmarkedNctIds).slice(0, 3));
    
    // Filter studies to only show bookmarked ones
    const filteredStudies = allStudies.filter(study => {
      const nctId = study.protocolSection?.identificationModule?.nctId ?? '';
      const isIncluded = bookmarkedNctIds.has(nctId);
      return isIncluded;
    });
    
    console.log(`Found ${filteredStudies.length} matching studies after filtering`);
    return filteredStudies;
  }, [data?.pages, formData.showBookmarksOnly, userBookmarks]);

  const totalCount = data?.pages[0]?.totalCount ?? 0;

  // Initialize form data with preferences
  useEffect(() => {
    if (isLoadingPreferences) {
      return;
    }

    if (userPreferences) {
      setIsModalOpen(false);
      setFormData({
        searchTerm: '',
        phase: userPreferences.phase ?? [],
        status: userPreferences.status ?? [],
        location: 'United States',
        therapeuticArea: userPreferences.therapeuticArea ?? [],
        sortField: SortField.LAST_UPDATE_POST_DATE,
        sortDirection: SortDirection.DESC,
        minAge: '1',
        maxAge: '100',
        gender: Sex.ALL,
        healthyVolunteers: false,
        showBookmarksOnly: false,
      });
    } else {
      setIsModalOpen(true); // Show modal only when preferences are absent
    }
  }, [userPreferences, isLoadingPreferences]);

  const handleSavePreferences = (newPreferences: Partial<SearchForm>): void => {
    savePreferences({ userId: user?.id ?? '', preferences: newPreferences });
    setFormData({
      ...formData,
      ...newPreferences,
    });
    setIsModalOpen(false);
  };

  // Redirect if user is not authenticated
  useEffect(() => {
    if (!user && isLoaded) {
      router.push('/'); // Redirect to the login page
    }
  }, [user, isLoaded, router]);

  // Combined loading state for studies and bookmarks
  const isLoading = isLoadingStudies || (isLoadingBookmarks && formData.showBookmarksOnly);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 md:px-6 py-4 max-w-7xl">
      <PreferenceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePreferences}
      />
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col space-y-2">
          <p className="text-sm md:text-base text-muted-foreground">
            Search through thousands of clinical trials to find relevant studies
          </p>
        </div>

        <StudiesForm formData={formData} setFormData={setFormData} />
        <div className="flex flex-col md:flex-row gap-2 justify-between items-start md:items-center">
          <Button
            onClick={() => {
              exportStudiesToCSV(studies);
            }}
            className="w-full md:w-auto"
          >
            Download CSV
          </Button>
        </div>
        {error && <p className="text-red-500">An error occurred</p>}

        {!isLoading && !error && (
          <>
            <StudiesGrid studies={studies} />
            {studies.length > 0 ? (
              <p className="text-center text-sm text-muted-foreground">
                Showing {studies.length} {formData.showBookmarksOnly ? 'bookmarked ' : ''}
                out of {formData.showBookmarksOnly ? (userBookmarks?.length || 0) : totalCount} studies
              </p>
            ) : (
              <div className="text-center mt-8">
                {formData.showBookmarksOnly ? (
                  <div className="flex flex-col items-center">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="48" 
                      height="48" 
                      viewBox="0 0 24 24" 
                      fill="none"
                      stroke="currentColor" 
                      strokeWidth="1" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      className="text-muted-foreground mb-4"
                    >
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <p className="text-muted-foreground mb-2">No bookmarked studies found</p>
                    <p className="text-muted-foreground text-sm mb-4">Bookmark some studies to see them here</p>
                    <Button 
                      variant="outline" 
                      onClick={() => setFormData({...formData, showBookmarksOnly: false})}
                    >
                      Show all studies
                    </Button>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No studies found. Try adjusting your search criteria.</p>
                )}
              </div>
            )}
          </>
        )}

        {hasNextPage && (
          <div className="flex justify-center items-center mt-4">
            <Button
              variant={'default'}
              onClick={() => void fetchNextPage()}
              disabled={isFetchingNextPage}
              className="w-full md:w-auto"
            >
              {isFetchingNextPage ? (
                <div className="flex items-center gap-2">
                  <Loader className="size-4" />
                  <span>Loading...</span>
                </div>
              ) : (
                'Load More'
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
