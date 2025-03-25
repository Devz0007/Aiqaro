'use client';

import {
  useMutation,
  UseMutationResult,
  useQuery,
  useQueryClient,
  UseQueryResult,
} from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import {
  SearchFiltersSchema,
  SearchFilters,
} from '@/types/clinical-trials/filters';

import React from 'react';

// Define the base URL for preferences
const PREFERENCES_API_URL = '/api/preferences';
const PREF_STORAGE_KEY = 'user_preferences_';
const LAST_LOADED_KEY = 'preferences_last_loaded_';

// Helper to get cached preferences from localStorage
const getCachedPreferences = (userId: string): { 
  data: Partial<SearchFilters> | null, 
  timestamp: number | null 
} => {
  if (typeof window === 'undefined' || !userId) return { data: null, timestamp: null };
  
  try {
    const cached = localStorage.getItem(`${PREF_STORAGE_KEY}${userId}`);
    const timestampStr = localStorage.getItem(`${LAST_LOADED_KEY}${userId}`);
    
    return { 
      data: cached ? JSON.parse(cached) : null,
      timestamp: timestampStr ? parseInt(timestampStr, 10) : null
    };
  } catch (e) {
    console.error('[PREFERENCES HOOK] Error reading cached preferences:', e);
    return { data: null, timestamp: null };
  }
};

// Helper to save preferences to localStorage
const cachePreferences = (userId: string, preferences: Partial<SearchFilters>): void => {
  if (typeof window === 'undefined' || !userId) return;
  
  try {
    localStorage.setItem(`${PREF_STORAGE_KEY}${userId}`, JSON.stringify(preferences));
    localStorage.setItem(`${LAST_LOADED_KEY}${userId}`, Date.now().toString());
    console.log('[PREFERENCES HOOK] Preferences cached to localStorage');
  } catch (e) {
    console.error('[PREFERENCES HOOK] Error caching preferences:', e);
  }
};

// Helper to check if we should force a refresh based on URL params
const shouldForceRefresh = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const url = new URL(window.location.href);
  return url.searchParams.get('refresh') === 'true';
};

// Helper to clean up URL params after processing
const cleanupUrlParams = (): void => {
  if (typeof window === 'undefined') return;
  
  const url = new URL(window.location.href);
  if (url.searchParams.has('refresh') || url.searchParams.has('t')) {
    url.searchParams.delete('refresh');
    url.searchParams.delete('t');
    window.history.replaceState({}, '', url.toString());
    console.log('[PREFERENCES HOOK] Cleaned up URL params');
  }
};

// Parse response using Zod
const parseSearchFilters = (data: unknown): Partial<SearchFilters> => {
  console.log("[PREFERENCES HOOK] Parsing raw data from API:", data);
  
  if (!data || typeof data !== 'object') {
    console.error("[PREFERENCES HOOK] Invalid data format, expected object:", data);
    return {};
  }
  
  try {
    // Handle the specific response format from the database
    const dbData = data as Record<string, unknown>;
    
    // Extract the relevant fields from the database response
    const preferenceData = {
      phase: dbData.phase,
      status: dbData.status,
      therapeuticArea: dbData.therapeuticArea
    };
    
    console.log("[PREFERENCES HOOK] Extracted preference data:", preferenceData);
    
    const parsed = SearchFiltersSchema.parse(preferenceData);
    console.log("[PREFERENCES HOOK] Successfully parsed data:", parsed);
    return parsed;
  } catch (error) {
    console.error("[PREFERENCES HOOK] Error parsing data:", error);
    
    // Try to extract some data even if validation fails
    if (data && typeof data === 'object') {
      const dbData = data as Record<string, unknown>;
      const fallbackData: Partial<SearchFilters> = {};
      
      if (Array.isArray(dbData.phase)) {
        fallbackData.phase = dbData.phase as string[];
      }
      
      if (Array.isArray(dbData.status)) {
        fallbackData.status = dbData.status as string[];
      }
      
      if (Array.isArray(dbData.therapeuticArea)) {
        fallbackData.therapeuticArea = dbData.therapeuticArea as string[];
      }
      
      console.log("[PREFERENCES HOOK] Using fallback data:", fallbackData);
      return fallbackData;
    }
    
    // Return an empty object as fallback
    return {};
  }
};

// Fetch user preferences API function with force refresh option
const fetchUserPreferences = async (
  userId: string,
  forceRefresh = false
): Promise<Partial<SearchFilters>> => {
  try {
    if (!userId || userId.length === 0) {
      console.log("[PREFERENCES HOOK] Empty user ID, returning empty preferences");
      return {};
    }
    
    // Check if we have a cached version and it's not a forced refresh
    if (!forceRefresh) {
      const { data: cachedPrefs, timestamp } = getCachedPreferences(userId);
      const isFresh = timestamp && (Date.now() - timestamp < 300000); // 5 minutes
      
      if (cachedPrefs && isFresh) {
        console.log("[PREFERENCES HOOK] Using fresh cached preferences:", cachedPrefs);
        return cachedPrefs;
      }
    }
    
    console.log(`[PREFERENCES HOOK] Fetching preferences for user: ${userId}`);
    const response = await fetch(`${PREFERENCES_API_URL}/${userId}`);
    console.log(`[PREFERENCES HOOK] API response status: ${response.status}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        // If not found, check if we have a cached version as fallback
        const { data: cachedPrefs } = getCachedPreferences(userId);
        if (cachedPrefs) {
          console.log("[PREFERENCES HOOK] API returned 404, using cached preferences as fallback");
          return cachedPrefs;
        }
        
        console.log("[PREFERENCES HOOK] Preferences not found (404), using default preferences");
        return {};
      }
      throw new Error(`Failed to fetch preferences: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("[PREFERENCES HOOK] Raw data from API:", data);
    const preferences = parseSearchFilters(data);
    console.log("[PREFERENCES HOOK] Parsed preferences:", preferences);
    
    // Cache the preferences
    cachePreferences(userId, preferences);
    
    return preferences;
  } catch (error) {
    console.error("[PREFERENCES HOOK] Error in fetchUserPreferences:", error);
    
    // Try to get from localStorage as fallback if API fails
    const { data: cachedPrefs } = getCachedPreferences(userId);
    if (cachedPrefs) {
      console.log("[PREFERENCES HOOK] API failed, using cached preferences:", cachedPrefs);
      return cachedPrefs;
    }
    
    // Return empty preferences if all else fails
    return {};
  }
};

// React Query hook to fetch preferences
export const useFetchUserPreferences = ({
  userId,
}: {
  userId: string;
}): UseQueryResult<Partial<SearchFilters>, Error> => {
  console.log("[PREFERENCES HOOK] Hook called with userId:", userId);
  
  const queryClient = useQueryClient();
  const forceRefresh = shouldForceRefresh();
  const previousUserIdRef = useRef<string | null>(null);
  
  // Clean up URL params once
  useEffect(() => {
    if (forceRefresh) {
      console.log("[PREFERENCES HOOK] Force refresh detected in URL");
      cleanupUrlParams();
    }
  }, [forceRefresh]);
  
  // Force query refresh when userId becomes available or changes
  useEffect(() => {
    // If user ID is available and either it's new or it changed
    if (userId && userId.length > 0 && previousUserIdRef.current !== userId) {
      console.log("[PREFERENCES HOOK] User ID changed/available:", userId, "Previous:", previousUserIdRef.current);
      previousUserIdRef.current = userId;
      
      // Immediately populate from localStorage if we have it
      const { data: cachedData } = getCachedPreferences(userId);
      if (cachedData) {
        console.log("[PREFERENCES HOOK] Applying cached data on user ID change");
        queryClient.setQueryData(['userPreferences', userId], cachedData);
      }
      
      // Always invalidate the query when user ID changes to ensure fresh data
      void queryClient.invalidateQueries({
        queryKey: ['userPreferences', userId],
      });
    }
  }, [userId, queryClient]);
  
  // Special handling for when the hook is initially called with empty userId
  // but later userId becomes available
  const result = useQuery<Partial<SearchFilters>, Error>({
    queryKey: ['userPreferences', userId],
    queryFn: () => fetchUserPreferences(userId, forceRefresh),
    enabled: !!userId && userId.length > 0, // Only run if userId is defined and non-empty
    retry: (failureCount, error) => {
      console.log("[PREFERENCES HOOK] Query failed, attempt:", failureCount, "Error:", error.message);
      if (error.message.includes('404')) {
        console.log("[PREFERENCES HOOK] Not retrying 404 error");
        return false;
      }
      return failureCount < 3;
    },
    staleTime: 300000, // Consider data stale after 5 minutes
    gcTime: 3600000, // Keep in cache for 1 hour
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    refetchOnMount: true, // Always refetch when component using this hook mounts
  });
  
  return result;
};

// Save user preferences API function
const saveUserPreferences = async ({
  userId,
  preferences,
}: {
  userId: string;
  preferences: Partial<SearchFilters>;
}): Promise<Partial<SearchFilters>> => {
  try {
    if (userId.length === 0) {
      throw new Error('User ID is required');
    }
    console.log(`[PREFERENCES HOOK] Saving preferences for user: ${userId}`, preferences);
    
    // Update cache immediately for faster UI response
    cachePreferences(userId, preferences);
    
    const response = await fetch(`${PREFERENCES_API_URL}/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preferences),
    });
    console.log(`[PREFERENCES HOOK] Save response status: ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`Failed to save preferences: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("[PREFERENCES HOOK] Save response data:", data);
    const parsedPrefs = parseSearchFilters(data);
    
    // Update cache with latest from server
    cachePreferences(userId, parsedPrefs);
    
    return parsedPrefs;
  } catch (error) {
    console.error("[PREFERENCES HOOK] Error saving preferences:", error);
    throw error;
  }
};

// React Query hook to save preferences
export const useSaveUserPreferences = (): UseMutationResult<
  Partial<SearchFilters>,
  Error,
  {
    userId: string;
    preferences: Partial<SearchFilters>;
  },
  unknown
> => {
  const queryClient = useQueryClient();
  return useMutation<
    Partial<SearchFilters>,
    Error,
    { userId: string; preferences: Partial<SearchFilters> }
  >({
    mutationFn: saveUserPreferences,
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['userPreferences', variables.userId],
      });
      
      // Update the cache immediately
      queryClient.setQueryData(['userPreferences', variables.userId], data);
    },
    onError: (error) => {
      console.error('Error saving preferences:', error.message);
    },
  });
};
