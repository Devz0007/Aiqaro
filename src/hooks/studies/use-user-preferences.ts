'use client';

import {
  useMutation,
  UseMutationResult,
  useQuery,
  useQueryClient,
  UseQueryResult,
} from '@tanstack/react-query';

import {
  SearchFiltersSchema,
  SearchFilters,
} from '@/types/clinical-trials/filters';

// Define the base URL for preferences
const PREFERENCES_API_URL = '/api/preferences';

// Parse response using Zod
const parseSearchFilters = (data: unknown): Partial<SearchFilters> => {
  return SearchFiltersSchema.parse(data);
};

// Fetch user preferences API function
const fetchUserPreferences = async (
  userId: string
): Promise<Partial<SearchFilters>> => {
  try {
    if (userId.length === 0) {
      return {};
    }
    const response = await fetch(`${PREFERENCES_API_URL}/${userId}`);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('404: Preferences not found'); // Handle 404 as a specific error
      }
      throw new Error(`Failed to fetch preferences: ${response.statusText}`);
    }
    const preferences = parseSearchFilters(await response.json());
    return preferences;
  } catch (error) {
    throw error;
  }
};

// React Query hook to fetch preferences
export const useFetchUserPreferences = ({
  userId,
}: {
  userId: string;
}): UseQueryResult<Partial<SearchFilters>, Error> => {
  return useQuery<Partial<SearchFilters>, Error>({
    queryKey: ['userPreferences', userId],
    queryFn: () => fetchUserPreferences(userId),
    enabled: !!userId && userId.length > 0, // Prevent running if userId is undefined
    retry: (failureCount, error) => {
      // Do not retry on 404 errors
      if (error.message.includes('404')) {
        return false;
      }
      return failureCount < 3; // Default retry behavior: retry up to 3 times for other errors
    },
  });
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
    const response = await fetch(`${PREFERENCES_API_URL}/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preferences),
    });
    if (!response.ok) {
      throw new Error(`Failed to save preferences: ${response.statusText}`);
    }
    return parseSearchFilters(await response.json());
  } catch (error) {
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
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['userPreferences', variables.userId],
      });
    },
    onError: (error) => {
      console.error('Error saving preferences:', error.message);
    },
  });
};
