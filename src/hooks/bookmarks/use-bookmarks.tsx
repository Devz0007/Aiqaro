// src/hooks/bookmarks/use-bookmarks.tsx
'use client';

import { bookmarks } from '@prisma/client';
import {
  useMutation,
  UseMutationResult,
  useQuery,
  useQueryClient,
  UseQueryResult,
} from '@tanstack/react-query';

import {
  createBookmarkByNctId,
  deleteBookmarkByNctId,
  fetchAllBookmarksByUserId,
  isBookmarkedByUserNctId,
} from '@/utils/data/study/bookmark';

// Utility to update local storage bookmarks cache
const updateLocalBookmarksCache = (userId: string, 
  updateFn: (bookmarks: bookmarks[]) => bookmarks[]
) => {
  if (typeof window === 'undefined' || !userId) return;
  
  try {
    const cached = localStorage.getItem(`bookmarks_${userId}`);
    const existingBookmarks = cached ? JSON.parse(cached) : [];
    const updatedBookmarks = updateFn(existingBookmarks);
    localStorage.setItem(`bookmarks_${userId}`, JSON.stringify(updatedBookmarks));
    console.log('[BOOKMARKS] Local cache updated successfully');
  } catch (e) {
    console.error('[BOOKMARKS] Error updating local bookmarks cache:', e);
  }
};

export const useCreateBookmarkStudy = (): UseMutationResult<
  bookmarks,
  Error,
  { nctId: string; userId: string; title: string; url: string }
> => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ nctId, userId, title, url }) => {
      const bookmark = createBookmarkByNctId({
        nctId,
        userId,
        title,
        url,
      });
      return bookmark;
    },
    onSuccess: (newBookmark, { userId, nctId }) => {
      // Update React Query cache
      queryClient.invalidateQueries({ queryKey: ['bookmarks', userId] });
      queryClient.setQueryData(['bookmark', nctId, userId], true);
      
      // Update local storage cache
      updateLocalBookmarksCache(userId, (existingBookmarks) => {
        // Check if bookmark already exists
        const exists = existingBookmarks.some(b => b.nct_id === nctId);
        
        if (!exists) {
          return [...existingBookmarks, newBookmark];
        }
        
        // Update existing bookmark to be active
        return existingBookmarks.map(b => 
          b.nct_id === nctId ? { ...b, is_bookmarked: true } : b
        );
      });
    },
  });
};

export const useDeleteBookmarkStudy = (): UseMutationResult<
  bookmarks,
  Error,
  { nctId: string; userId: string }
> => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ nctId, userId }) => {
      const bookmark = deleteBookmarkByNctId({ nctId, userId });
      return bookmark;
    },
    onSuccess: (deletedBookmark, { userId, nctId }) => {
      // Update React Query cache
      queryClient.invalidateQueries({ queryKey: ['bookmarks', userId] });
      queryClient.setQueryData(['bookmark', nctId, userId], false);
      
      // Update local storage cache
      updateLocalBookmarksCache(userId, (existingBookmarks) => {
        // Remove the bookmark with matching nctId
        return existingBookmarks.filter(b => b.nct_id !== nctId);
      });
    },
  });
};

export const useIsBookmarkedByNctId = ({
  nctId,
  userId,
}: {
  nctId: string;
  userId: string;
}): UseQueryResult<boolean, Error> => {
  return useQuery({
    queryKey: ['bookmark', nctId, userId],
    queryFn: async () => {
      const isBookmarked = await isBookmarkedByUserNctId({
        nctId,
        userId,
      });
      return isBookmarked;
    },
  });
};

export const useFetchAllBookmarksByUserId = ({
  userId,
  enabled = true,
}: {
  userId: string;
  enabled: boolean;
}): UseQueryResult<bookmarks[], Error> => {
  return useQuery({
    queryKey: ['bookmarks', userId],
    queryFn: async () => {
      const bookmarks = await fetchAllBookmarksByUserId({
        userId,
      });
      
      // Update local storage with fresh data
      if (bookmarks && bookmarks.length > 0) {
        try {
          localStorage.setItem(`bookmarks_${userId}`, JSON.stringify(bookmarks));
        } catch (e) {
          console.error('[BOOKMARKS] Error caching bookmarks in localStorage:', e);
        }
      }
      
      return bookmarks;
    },
    enabled,
    staleTime: 60000, // Consider data fresh for 1 minute
    gcTime: 300000, // Cache for 5 minutes
  });
};
