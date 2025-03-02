// src/hooks/bookmarks/use-bookmarks.tsx
import { bookmarks } from '@prisma/client';
import {
  useMutation,
  UseMutationResult,
  useQuery,
  UseQueryResult,
} from '@tanstack/react-query';

import {
  createBookmarkByNctId,
  deleteBookmarkByNctId,
  fetchAllBookmarksByUserId,
  isBookmarkedByUserNctId,
} from '@/utils/data/study/bookmark';

export const useCreateBookmarkStudy = (): UseMutationResult<
  bookmarks,
  Error,
  { nctId: string; userId: string; title: string; url: string }
> => {
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
  });
};

export const useDeleteBookmarkStudy = (): UseMutationResult<
  bookmarks,
  Error,
  { nctId: string; userId: string }
> => {
  return useMutation({
    mutationFn: async ({ nctId, userId }) => {
      const bookmark = deleteBookmarkByNctId({ nctId, userId });
      return bookmark;
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
      return bookmarks;
    },
    enabled,
  });
};
