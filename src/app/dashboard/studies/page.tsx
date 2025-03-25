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
    
    console.log("[DEBUG] Loading preferences from localStorage for", user.id);
    preferencesCheckedRef.current = true;
    
    // Check localStorage for preferences
    const localPrefKey = `user_preferences_${user.id}`;
    
    try {
      const cachedPrefs = localStorage.getItem(localPrefKey);
      if (cachedPrefs) {
        const parsedPrefs = JSON.parse(cachedPrefs);
        console.log("[DEBUG] Found cached preferences in localStorage:", parsedPrefs);
        
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
      console.error("[DEBUG] Error reading cached preferences:", e);
    }
    
    return false;
  }, [user?.id]);
  
  // Check for immediate force reload flag on component mount
  useEffect(() => {
    // Run this code only once on component mount
    const checkForceReload = () => {
      if (typeof window !== 'undefined' && localStorage.getItem('force_preferences_reload') === 'true') {
        console.log("[DEBUG] Found force_preferences_reload flag on mount");
        localStorage.removeItem('force_preferences_reload');
        
        if (user?.id) {
          // Try to apply preferences immediately from localStorage
          const localPrefKey = `user_preferences_${user.id}`;
          try {
            const cachedPrefs = localStorage.getItem(localPrefKey);
            if (cachedPrefs) {
              const parsedPrefs = JSON.parse(cachedPrefs);
              console.log("[DEBUG] Applying cached preferences on mount:", parsedPrefs);
              
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
            console.error("[DEBUG] Error processing cached preferences on mount:", e);
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
      console.log("[DEBUG] Detected refresh trigger, forcing preferences refresh");
      
      // Clear the force reload flag if it exists
      if (localStorage.getItem('force_preferences_reload') === 'true') {
        localStorage.removeItem('force_preferences_reload');
        console.log("[DEBUG] Cleared force_preferences_reload flag");
      }
      
      // Reset the check flag so we can load again
      preferencesCheckedRef.current = false;
      
      // Try to load from localStorage
      const loaded = loadPreferencesFromLocalStorage();
      
      // Force a refresh of the query if localStorage was found
      if (loaded && user.id) {
        console.log("[DEBUG] Force refreshing user preferences query");
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

  // Add debug logging for initial state
  useEffect(() => {
    console.log("[DEBUG] Initial state:", {
      isLoadingPreferences,
      hasUserPreferences: !!userPreferences,
      userHasLoaded: !!user,
      currentFormData: formData
    });
  }, [isLoadingPreferences, userPreferences, user, formData]);
  
  // Initialize form data from API preferences
  useEffect(() => {
    console.log("[DEBUG] Loading preferences state:", {
      isLoadingPreferences,
      userPreferences,
      userId: user?.id
    });
    
    if (isLoadingPreferences) {
      return;
    }

    if (userPreferences) {
      console.log("[DEBUG] Found user preferences, updating form data:", userPreferences);
      setIsModalOpen(false);
      setFormData({
        searchTerm: '',
        phase: userPreferences.phase ? 
          userPreferences.phase.map(p => typeof p === 'string' ? p as StudyPhase : p) : 
          [],
        status: userPreferences.status ? 
          userPreferences.status.map(s => typeof s === 'string' ? s as StudyStatus : s) : 
          [],
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
    } else if (!preferencesLoaded) {
      console.log("[DEBUG] No user preferences found, showing modal");
      // Always trigger a search with default values even if showing the modal
      // This ensures studies are visible in the background
      setFormData({...DEFAULT_FORM_VALUES});
      setIsModalOpen(true); // Show modal only when preferences are absent
    }
  }, [userPreferences, isLoadingPreferences, user?.id, preferencesLoaded]);

  // Fetch clinical trials based on form data
  const {
    data,
    error,
    isLoading: isLoadingStudies,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useStudiesInfiniteQuery(formData);

  // Add debug logging for data fetching
  useEffect(() => {
    console.log("[DEBUG] Studies query state:", {
      isLoadingStudies,
      hasData: !!data,
      studiesCount: data?.pages?.[0]?.studies?.length || 0,
      error: error?.message
    });
  }, [data, isLoadingStudies, error]);

  // Filter studies based on bookmarks if showBookmarksOnly is true
  const studies: Study[] = React.useMemo(() => {
    const allStudies = data?.pages.flatMap((page) => page.studies) ?? [];
    
    if (!formData.showBookmarksOnly) {
      return allStudies;
    }
    
    // Use local bookmarks for filtering
    if (localBookmarks.length === 0) {
      console.log("[BOOKMARKS] No bookmarks found for filtering");
      return [];
    }
    
    console.log(`[BOOKMARKS] Filtering ${allStudies.length} studies with ${localBookmarks.length} bookmarks`);
    
    // Create a Set of bookmarked NCT IDs for faster lookup
    const bookmarkedNctIds = new Set(
      localBookmarks.map(bookmark => bookmark.nct_id)
    );
    
    // Filter studies to only show bookmarked ones
    const filteredStudies = allStudies.filter(study => {
      const nctId = study.protocolSection?.identificationModule?.nctId ?? '';
      return bookmarkedNctIds.has(nctId);
    });
    
    console.log(`[BOOKMARKS] Found ${filteredStudies.length} matching studies after filtering`);
    return filteredStudies;
  }, [data?.pages, formData.showBookmarksOnly, localBookmarks]);

  const totalCount = data?.pages[0]?.totalCount ?? 0;

  // Redirect if user is not authenticated
  useEffect(() => {
    if (!user && isLoaded) {
      router.push('/'); // Redirect to the login page
    }
  }, [user, isLoaded, router]);

  // Force show modal for new users
  useEffect(() => {
    if (user && isLoaded && !isLoadingPreferences) {
      console.log("[DEBUG] User login check for modal:", {
        userId: user.id,
        hasUserPreferences: !!userPreferences,
        isModalOpen
      });
      
      // If we have a user, they're loaded, and preferences aren't loading,
      // but we don't have preferences - they're a new user
      if (!userPreferences) {
        console.log("[DEBUG] New user detected, forcing modal open");
        setIsNewUser(true);
        setIsModalOpen(true);
      }
    }
  }, [user, isLoaded, userPreferences, isLoadingPreferences, isModalOpen]);

  const handleSavePreferences = (newPreferences: Partial<SearchForm>): void => {
    console.log('[DEBUG] Saving preferences for user:', user?.id);
    savePreferences({ userId: user?.id ?? '', preferences: newPreferences });
    
    setFormData({
      ...formData,
      ...newPreferences,
    });
    
    // Reset new user flag after preferences are saved
    if (isNewUser) {
      console.log('[DEBUG] Resetting new user flag after saving preferences');
      setIsNewUser(false);
    }
    
    setIsModalOpen(false);
  };

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
      console.log("[BOOKMARKS] No bookmarks found when trying to filter");
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
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePreferences}
        forceOpen={isNewUser}
      />
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col space-y-2">
          <p className="text-sm md:text-base text-muted-foreground">
            Search through thousands of clinical trials to find relevant studies
          </p>
          
          {/* Debug section */}
          <div className="bg-gray-100 p-4 rounded-md mt-2 text-xs">
            <h3 className="font-bold">Debug Info:</h3>
            <p>User ID: {user?.id || 'Not logged in'}</p>
            <p>Has preferences: {userPreferences ? 'Yes' : 'No'}</p>
            <p>Loading preferences: {isLoadingPreferences ? 'Yes' : 'No'}</p>
            <p>Is new user: {isNewUser ? 'Yes' : 'No'}</p>
            <p>Modal open: {isModalOpen ? 'Yes' : 'No'}</p>
            <p>Has studies: {studies.length > 0 ? 'Yes' : 'No'}</p>
            <p>Has bookmarks: {hasBookmarks ? 'Yes' : 'No'}</p>
            <Button 
              onClick={() => setIsModalOpen(true)}
              size="sm"
              className="mt-2"
            >
              Open Preferences Modal
            </Button>
          </div>
        </div>

        <StudiesForm 
          formData={formData} 
          setFormData={setFormData}
          onToggleBookmarks={toggleBookmarksFilter}
          hasBookmarks={hasBookmarks}
        />
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
