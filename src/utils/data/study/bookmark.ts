// src/utils/data/study/bookmark.ts
'use server';

import { bookmarks } from '@prisma/client';

import { prisma } from '../client/prima';

export const fetchAllBookmarksByUserId = async ({
  userId,
}: {
  userId: string;
}): Promise<bookmarks[]> => {
  try {
    if (userId.length === 0) {
      throw new Error('User ID is required');
    }
    const bookmarks = await prisma.bookmarks.findMany({
      where: {
        user_id: userId,
      },
    });
    return bookmarks;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Failed to get bookmarks');
  }
};

export const createBookmarkByNctId = async ({
  nctId,
  userId,
  title,
  url,
}: {
  nctId: string;
  userId: string;
  title: string;
  url: string;
}): Promise<bookmarks> => {
  try {
    const bookmark = await prisma.bookmarks.upsert({
      where: {
        nct_id: nctId,
      },
      update: {
        is_bookmarked: true,
        updated_by: userId,
      },
      create: {
        nct_id: nctId,
        is_bookmarked: true,
        updated_by: userId,
        user_id: userId,
        title: title,
        url: url,
      },
    });
    return bookmark;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Failed to create bookmark');
  }
};

export const deleteBookmarkByNctId = async ({
  nctId,
  userId,
}: {
  nctId: string;
  userId: string;
}): Promise<bookmarks> => {
  try {
    return await prisma.bookmarks.update({
      where: {
        nct_id: nctId,
        user_id: userId,
      },
      data: {
        is_bookmarked: false,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Failed to delete bookmark');
  }
};

export const isBookmarkedByUserNctId = async ({
  nctId,
  userId,
}: {
  nctId: string;
  userId: string;
}): Promise<boolean> => {
  try {
    const bookmark = await prisma.bookmarks.findFirst({
      where: {
        nct_id: nctId,
        user_id: userId,
      },
    });
    if (bookmark) {
      return bookmark.is_bookmarked;
    }
    return false;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Failed to get bookmark');
  }
};
