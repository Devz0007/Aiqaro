// src/hooks/studies/use-user-preferences.ts
'use client';

import {
  useMutation,
  useQuery,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';
// Remove the unused import for z
// import { z } from 'zod';

import {
  SearchFiltersSchema,
  SearchFilters,
} from '@/types/clinical-trials/filters';

// Define the base URL for preferences
const PREFERENCES_API_URL = '/api/preferences';

// Fetch user preferences API function
const fetchUserPreferences = async (userId: string): Promise<Partial<SearchFilters>> => {
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  const response = await fetch(`${PREFERENCES_API_URL}/${userId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch preferences: ${response.statusText}`);
  }
  
  // Type explicitly as unknown first, then parse with Zod
  const responseData: unknown = await response.json();
  return SearchFiltersSchema.parse(responseData);
};

// React Query hook to fetch preferences
export const useFetchUserPreferences = ({ userId }: { userId: string }): UseQueryResult<Partial<SearchFilters>, Error> => {
  return useQuery<Partial<SearchFilters>, Error>({
    queryKey: ['userPreferences', userId],
    queryFn: () => fetchUserPreferences(userId),
    enabled: !!userId, // Prevent running if userId is undefined
  });
};

// Save user preferences API function
const saveUserPreferences = async ({ userId, preferences }: { userId: string; preferences: Partial<SearchFilters> }): Promise<Partial<SearchFilters>> => {
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  const response = await fetch(`${PREFERENCES_API_URL}/${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(preferences),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to save preferences: ${response.statusText}`);
  }
  
  // Type explicitly as unknown first, then parse with Zod
  const responseData: unknown = await response.json();
  return SearchFiltersSchema.parse(responseData);
};

// React Query hook to save preferences
export const useSaveUserPreferences = (): UseMutationResult<Partial<SearchFilters>, Error, { userId: string; preferences: Partial<SearchFilters> }> => {
  return useMutation<Partial<SearchFilters>, Error, { userId: string; preferences: Partial<SearchFilters> }>({
    mutationFn: saveUserPreferences,
  });
};