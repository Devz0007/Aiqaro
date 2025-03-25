// src/app/dashboard/studies/page.tsx
'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation'; // For redirecting and getting query parameters
import React, { useEffect, useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import Loader from '@/components/common/loader';
import PreferenceModal from '@/components/common/preference-modal';
import { Button } from '@/components/ui/button';
import { useStudiesInfiniteQuery } from '@/hooks/studies/use-studies-infinite-query';
import {
  useFetchUserPreferences,
  useSaveUserPreferences,
} from '@/hooks/studies/use-user-preferences';
import { 
  Sex, 
  SortDirection, 
  SortField,
  StudyPhase,
  StudyStatus
} from '@/types/clinical-trials/filters';
import { Study } from '@/types/clinical-trials/study';
import { SearchForm } from '@/types/common/form';
import { useLocalBookmarks } from '@/hooks/bookmarks/use-local-bookmarks';
import { createUser } from '@/lib/api/users';

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
  const searchParams = useSearchParams();
  const isRefresh = searchParams.get('refresh') === 'true';
  const [formData, setFormData] = useState<SearchForm>(DEFAULT_FORM_VALUES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Track if preferences have been loaded to handle refresh from homepage
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  // Track if this is a new user session
  const [isNewUser, setIsNewUser] = useState<boolean>(false);
  
  // Reference to track if we've already loaded preferences from localStorage
  const preferencesCheckedRef = React.useRef<boolean>(false);

  // Fetch user preferences
  const { data: userPreferences, isLoading: isLoadingPreferences } =
    useFetchUserPreferences({ userId: user?.id ?? '' });

  // Save user preferences mutation
  const { mutate: savePreferences } = useSaveUserPreferences();

  const queryClient = useQueryClient();
  
  // Use local bookmarks hook
  const { 
    bookmarks: localBookmarks, 
    isLoading: isLoadingBookmarks,
    isBookmarked,
    toggleBookmark
  } = useLocalBookmarks(user?.id ?? '');

  // Function to load preferences from localStorage
  const loadPreferencesFromLocalStorage = React.useCallback(() => {
    if (!user?.id || preferencesCheckedRef.current) return false;
    
    preferencesCheckedRef.current = true;
    
    // Check localStorage for preferences
    const localPrefKey = `user_preferences_${user.id}`;
    
    try {
      const cachedPrefs = localStorage.getItem(localPrefKey);
      if (cachedPrefs) {
        const parsedPrefs = JSON.parse(cachedPrefs);
        
        // Apply cached preferences immediately
        setFormData({
          ...DEFAULT_FORM_VALUES,
          phase: parsedPrefs.phase ? 
            parsedPrefs.phase.map((p: string | StudyPhase) => typeof p === 'string' ? p as StudyPhase : p) : 
            [],
          status: parsedPrefs.status ? 
            parsedPrefs.status.map((s: string | StudyStatus) => typeof s === 'string' ? s as StudyStatus : s) : 
            [],
          therapeuticArea: parsedPrefs.therapeuticArea || [],
        });
        
        setPreferencesLoaded(true);
        return true;
      }
    } catch (e) {
      // Silently handle error and return false
      return false;
    }
    
    return false;
  }, [user?.id]);
  
  // Check for immediate force reload flag on component mount
  useEffect(() => {
    // Run this code only once on component mount
    const checkForceReload = () => {
      if (typeof window !== 'undefined' && localStorage.getItem('force_preferences_reload') === 'true') {
        localStorage.removeItem('force_preferences_reload');
        
        if (user?.id) {
          // Try to apply preferences immediately from localStorage
          const localPrefKey = `user_preferences_${user.id}`;
          try {
            const cachedPrefs = localStorage.getItem(localPrefKey);
            if (cachedPrefs) {
              const parsedPrefs = JSON.parse(cachedPrefs);
              
              // Apply cached preferences immediately and force a refresh
              setTimeout(() => {
                // Update in a timeout to ensure React has time to process
                setFormData({
                  ...DEFAULT_FORM_VALUES,
                  phase: parsedPrefs.phase ? 
                    parsedPrefs.phase.map((p: string | StudyPhase) => typeof p === 'string' ? p as StudyPhase : p) : 
                    [],
                  status: parsedPrefs.status ? 
                    parsedPrefs.status.map((s: string | StudyStatus) => typeof s === 'string' ? s as StudyStatus : s) : 
                    [],
                  therapeuticArea: parsedPrefs.therapeuticArea || [],
                });
                setPreferencesLoaded(true);
              }, 0);
            }
          } catch (e) {
            console.error("Error processing cached preferences on mount:", e);
          }
        }
      }
    };
    
    checkForceReload();
  }, [user?.id]); // Run only when user ID is available
  
  // Always call this on first render and when user changes
  useEffect(() => {
    if (user?.id) {
      loadPreferencesFromLocalStorage();
    }
  }, [user?.id, loadPreferencesFromLocalStorage]);
  
  // Force load from localStorage if we detect a refresh parameter
  useEffect(() => {
    if ((isRefresh || localStorage.getItem('force_preferences_reload') === 'true') && user?.id) {
      // Clear the force reload flag if it exists
      if (localStorage.getItem('force_preferences_reload') === 'true') {
        localStorage.removeItem('force_preferences_reload');
      }
      
      // Reset the check flag so we can load again
      preferencesCheckedRef.current = false;
      
      // Try to load from localStorage
      const loaded = loadPreferencesFromLocalStorage();
      
      // Force a refresh of the query if localStorage was found
      if (loaded && user.id) {
        void queryClient.invalidateQueries({
          queryKey: ['userPreferences', user.id],
        });
      }
      
      // Remove the refresh param to avoid infinite loops
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('refresh');
        url.searchParams.delete('t');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [isRefresh, user?.id, loadPreferencesFromLocalStorage, queryClient]);

  // Handle user preferences
  useEffect(() => {
    if (!isLoaded || !user) return;

    // Check if we have valid preferences with actual selections
    const hasValidPreferences = Boolean(
      userPreferences?.phase?.length ||
      userPreferences?.status?.length ||
      userPreferences?.therapeuticArea?.length
    );

    if (hasValidPreferences) {
      setFormData({
        ...DEFAULT_FORM_VALUES,
        phase: userPreferences?.phase?.map((p: string | StudyPhase) => typeof p === 'string' ? p as StudyPhase : p) ?? [],
        status: userPreferences?.status?.map((s: string | StudyStatus) => typeof s === 'string' ? s as StudyStatus : s) ?? [],
        therapeuticArea: userPreferences?.therapeuticArea ?? [],
      });
      setPreferencesLoaded(true);
      setIsNewUser(false);
      setIsModalOpen(false);
    } else if (!isLoadingPreferences) {
      // No valid preferences found and done loading - show modal
      setIsNewUser(true);
      setIsModalOpen(true);
      setPreferencesLoaded(false);
    }
  }, [isLoaded, user, userPreferences, isLoadingPreferences]);

  // Handle saving preferences
  const handleSavePreferences = (preferences: Partial<SearchForm>) => {
    if (!user?.id) return;

    // Save preferences
    savePreferences(
      {
        userId: user.id,
        preferences: {
          phase: preferences.phase,
          status: preferences.status,
          therapeuticArea: preferences.therapeuticArea,
        },
      },
      {
        onSuccess: () => {
          setIsNewUser(false);
        },
      }
    );

    // Update form data with defaults for missing fields
    setFormData({
      ...DEFAULT_FORM_VALUES,
      ...preferences
    });
    setIsModalOpen(false);
  };

  // Fetch clinical trials based on form data
  const {
    data,
    error,
    isLoading: isLoadingStudies,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useStudiesInfiniteQuery(formData);

  // Filter studies based on bookmarks if showBookmarksOnly is true
  const studies: Study[] = React.useMemo(() => {
    const allStudies = data?.pages.flatMap((page) => page.studies) ?? [];
    
    if (!formData.showBookmarksOnly) {
      return allStudies;
    }
    
    // Use local bookmarks for filtering
    if (localBookmarks.length === 0) {
      return [];
    }
    
    // Create a Set of bookmarked NCT IDs for faster lookup
    const bookmarkedNctIds = new Set(
      localBookmarks.map(bookmark => bookmark.nct_id)
    );
    
    // Filter studies to only show bookmarked ones
    const filteredStudies = allStudies.filter(study => {
      const nctId = study.protocolSection?.identificationModule?.nctId ?? '';
      return bookmarkedNctIds.has(nctId);
    });
    
    return filteredStudies;
  }, [data?.pages, formData.showBookmarksOnly, localBookmarks]);

  const totalCount = data?.pages[0]?.totalCount ?? 0;

  // Redirect if user is not authenticated
  useEffect(() => {
    if (!user && isLoaded) {
      router.push('/'); // Redirect to the login page
    }
  }, [user, isLoaded, router]);

  // Combined loading state for studies and bookmarks
  // Fix: Don't keep loading if we have localBookmarks or if bookmarks API returned empty
  const isLoading = isLoadingStudies || 
    (isLoadingBookmarks && formData.showBookmarksOnly && 
     !isLoadingBookmarks && localBookmarks.length === 0);

  // Don't show loader for new users waiting for preferences, just show default studies
  const shouldShowLoader = isLoading && !(isLoadingPreferences && !userPreferences);

  // Add a function to handle toggling the bookmarks filter
  const toggleBookmarksFilter = (showBookmarks: boolean) => {
    // If turning on bookmarks filter, check if we have bookmarks first
    if (showBookmarks && localBookmarks.length === 0) {
      alert("You don't have any bookmarks yet. Bookmark some studies first to use this filter.");
      return;
    }
    
    // Otherwise, set the filter as requested
    setFormData({
      ...formData,
      showBookmarksOnly: showBookmarks
    });
  };

  // Check if user has any bookmarks
  const hasBookmarks = localBookmarks.length > 0;

  if (shouldShowLoader) {
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
        onClose={() => {
          if (!isNewUser) {
            setIsModalOpen(false);
          }
        }}
        onSave={(preferences) => {
          handleSavePreferences(preferences);
          if (preferences.phase?.length || preferences.status?.length || preferences.therapeuticArea?.length) {
            setIsModalOpen(false);
            setIsNewUser(false);
          }
        }}
        forceOpen={isNewUser}
      />

      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col space-y-2">
          <p className="text-sm md:text-base text-muted-foreground">
            Search through thousands of clinical trials to find relevant studies
          </p>

          <StudiesForm 
            formData={formData} 
            setFormData={setFormData}
            onToggleBookmarks={toggleBookmarksFilter}
            hasBookmarks={hasBookmarks}
          />
        </div>

        <div className="flex flex-col md:flex-row gap-2 justify-between items-start md:items-center mt-2">
          <Button
            onClick={() => {
              exportStudiesToCSV(studies);
            }}
            className="w-full md:w-auto bg-accent hover:bg-accent/90 text-accent-foreground transition-all duration-200 hover:shadow-md group"
            variant="outline"
            size="sm"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="mr-1.5 transition-transform duration-200 group-hover:translate-y-[1px]"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download CSV
          </Button>
        </div>
        {error && <p className="text-red-500">An error occurred</p>}

        {!isLoading && !error && (
          <>
            <StudiesGrid 
              studies={studies} 
              onBookmarkToggle={(nctId: string, title: string, url: string) => {
                toggleBookmark(nctId, title, url, () => {
                  // If we're removing a bookmark and it's the last one while showing bookmarks only,
                  // turn off the bookmarks filter
                  if (formData.showBookmarksOnly && localBookmarks.length <= 1) {
                    setFormData(prev => ({
                      ...prev,
                      showBookmarksOnly: false
                    }));
                  }
                });
              }}
              isBookmarked={isBookmarked}
            />
            {studies.length > 0 ? (
              <p className="text-center text-sm text-muted-foreground">
                Showing {studies.length} {formData.showBookmarksOnly ? 'bookmarked ' : ''}
                out of {formData.showBookmarksOnly ? (localBookmarks.length) : totalCount} studies
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
